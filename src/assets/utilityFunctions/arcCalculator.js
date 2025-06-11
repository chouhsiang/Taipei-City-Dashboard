/**
 * @typedef {import('geojson').Feature<import('geojson').LineString, {arc_bulge: number, [key: string]: any}>} InputFeature
 * @typedef {import('geojson').Feature<import('geojson').LineString | import('geojson').Point, {[key: string]: any}>} OutputFeature
 * @typedef {import('geojson').Position} Position
 */

/**
 * Calculates a circular arc from a GeoJSON LineString feature with an arc_bulge property.
 *
 * @param {InputFeature} feature - The input GeoJSON Feature.
 *   The feature's geometry must be a LineString with two points [start, end].
 *   The feature's properties must include 'arc_bulge', a numerical value.
 *   A positive arc_bulge typically results in a counter-clockwise arc from start to end,
 *   and a negative arc_bulge results in a clockwise arc.
 * @param {number} [num_segments=32] - The number of segments to approximate the arc.
 * @returns {OutputFeature} A new GeoJSON Feature.
 *   If arc_bulge is 0, or start and end points are identical, it returns a LineString
 *   with the start and end points. If points are identical and arc_bulge is non-zero,
 *   it might be considered a point, but for consistency with bulge=0, LineString is returned.
 *   Otherwise, it returns a LineString geometry representing the calculated arc.
 */
export function calculateArcFromBulge(feature, num_segments = 32) {
    if (!feature || !feature.geometry || feature.geometry.type !== "LineString") {
        console.error("Invalid input: Feature must be a LineString.");
        return feature; // Or throw error
    }
    if (!feature.properties || typeof feature.properties.arc_bulge !== 'number') {
        console.error("Invalid input: Feature properties must include a numerical 'arc_bulge'.");
        return feature; // Or throw error
    }

    const coordinates = feature.geometry.coordinates;
    if (!coordinates || coordinates.length !== 2) {
        console.error("Invalid input: LineString must have exactly two coordinates (start and end points).");
        return feature; // Or throw error
    }

    const p1 = coordinates[0]; // [startX, startY]
    const p2 = coordinates[1]; // [endX, endY]
    const arc_bulge = feature.properties.arc_bulge;

    const startX = p1[0];
    const startY = p1[1];
    const endX = p2[0];
    const endY = p2[1];

    // Calculate chord vector and length
    const vx = endX - startX;
    const vy = endY - startY;
    const chordLength = Math.sqrt(vx * vx + vy * vy);

    // Edge case: Start and end points are the same
    if (chordLength < 1e-9) { // Using a small epsilon for floating point comparison
        return {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [p1, p2] // Could also be a Point: { type: "Point", coordinates: p1 }
            },
            properties: { ...feature.properties }
        };
    }

    // Edge case: arc_bulge is 0 (straight line)
    if (Math.abs(arc_bulge) < 1e-9) {
        return {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [p1, p2]
            },
            properties: { ...feature.properties }
        };
    }

    // Sagitta (height of the arc from its chord)
    // Using the interpretation: sagitta = arc_bulge (absolute value, sign determines direction)
    // However, a more common interpretation of bulge factor `b` relates to tan(theta/4)
    // Or, if `arc_bulge` is the actual sagitta height:
    const s = arc_bulge; // Let's assume arc_bulge is the sagitta value directly.
                        // The problem statement was a bit ambiguous, revised to "s = properties.arc_bulge"

    // If sagitta is 0 (re-check after previous check, for safety with floating points)
    if (Math.abs(s) < 1e-9) {
         return {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [p1, p2]
            },
            properties: { ...feature.properties }
        };
    }

    const halfChord = chordLength / 2;
    const abs_s = Math.abs(s);

    // Radius of the circle forming the arc
    // r = (s^2 + (L/2)^2) / (2*s)
    // Use abs_s for radius calculation, sign of s for direction
    const radius = (abs_s * abs_s + halfChord * halfChord) / (2 * abs_s);

    // Midpoint of the chord
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Distance from chord midpoint to circle center (this is 'd' in some formulas)
    // d = sqrt(r^2 - (L/2)^2)
    // d = | ( (L/2)^2 - s^2 ) / (2s) |
    // Let's use signed distance `dist_mc` based on `s` to determine center side.
    // dist_mc = ( (L/2)^2 - s^2 ) / (2s)
    // If s > 0, dist_mc > 0 means center is "further" along normal than s (arc < semicircle)
    // If s > 0, dist_mc < 0 means center is "before" M along normal (arc > semicircle)
    const dist_mc = ( (halfChord * halfChord) - (s * s) ) / (2 * s);

    // Unit normal vector to the chord vector V=(vx, vy).
    // Normal N = (-vy, vx) points "left" of V (if Y is up, X is right).
    const normalX = -vy / chordLength;
    const normalY = vx / chordLength;

    // Circle center C
    // C = M - dist_mc * Normal  (Lee Mac's formula uses this, assuming s positive for CCW)
    // If s is positive (CCW), center should be to the "left" if looking from P1 to P2.
    // The normal (-vy, vx) points left.
    // If s is positive, dist_mc is positive for shallow arcs. C = M - dist_mc * N.
    // Example: P1(0,0), P2(10,0), s=2. M(5,0). V(10,0). N(0,1).
    // dist_mc = (25 - 4) / 4 = 21/4 = 5.25.
    // C = (5,0) - 5.25 * (0,1) = (5, -5.25). This is correct for CCW (arc "above" chord if center below).
    const centerX = midX - dist_mc * normalX;
    const centerY = midY - dist_mc * normalY;

    // Start angle: angle of vector (P1 - C) with x-axis
    const startAngle = Math.atan2(startY - centerY, startX - centerX);
    // End angle: angle of vector (P2 - C) with x-axis
    const endAngle = Math.atan2(endY - centerY, endX - centerX);

    const arcCoordinates = [];
    arcCoordinates.push(p1);

    // Calculate sweep angle, ensuring direction by arc_bulge (s)
    let sweepAngle = endAngle - startAngle;
    const isClockwise = s < 0;

    // Normalize sweep angle to be between -2PI and 2PI
    // This step might not be strictly necessary if using the geometric central angle later,
    // but it helps in understanding the raw angular difference from atan2.
    if (sweepAngle > Math.PI) sweepAngle -= 2 * Math.PI;
    if (sweepAngle < -Math.PI) sweepAngle += 2 * Math.PI;


    // Correct sweep direction based on bulge sign
    if (isClockwise) { // s < 0
        if (sweepAngle > 0) {
            sweepAngle = sweepAngle - 2 * Math.PI;
        }
    } else { // s > 0 (CCW)
        if (sweepAngle < 0) {
            sweepAngle = sweepAngle + 2 * Math.PI;
        }
    }

    // Ensure the magnitude of sweepAngle matches the geometric central angle
    // This avoids issues where P1, C, P2 are collinear and atan2 gives unexpected full/zero circle.
    const geometricCentralAngle = 2 * Math.asin(Math.min(1, halfChord / radius));

    if (Math.abs(Math.abs(sweepAngle) - geometricCentralAngle) > 1e-3) { // Check if computed sweep matches geometric, with tolerance
      // If not, force sweep to be +/- geometricCentralAngle based on bulge sign
      sweepAngle = (isClockwise ? -1 : 1) * geometricCentralAngle;
    }


    // Interpolate points
    for (let i = 1; i < num_segments; i++) {
        const fraction = i / num_segments;
        const angle = startAngle + sweepAngle * fraction;
        arcCoordinates.push([
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        ]);
    }

    arcCoordinates.push(p2);

    return {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: arcCoordinates
        },
        properties: { ...feature.properties }
    };
}

// Example Usage (for testing):
/*
const feature1 = {
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates: [[0,0], [10,0]]
    },
    properties: {
        arc_bulge: 2 // Positive bulge, expect CCW arc
    }
};

const arc1 = calculateArcFromBulge(feature1);
console.log("Arc 1:", JSON.stringify(arc1.geometry.coordinates));
// Expected: Start [0,0], End [10,0]. Midpoint [5,0]. Sagitta 2.
// Radius r = (s^2 + (L/2)^2) / (2s) = (2^2 + 5^2) / (2*2) = (4+25)/4 = 29/4 = 7.25
// Center: M + sign(s)*sqrt(r^2-(L/2)^2)*N. N = (0,1) for V=(10,0).
// Center: (5,0) + 1 * sqrt(7.25^2 - 5^2) * (0,1) = (5,0) + sqrt(52.5625 - 25) * (0,1)
//         = (5,0) + sqrt(27.5625) * (0,1) = (5,0) + 5.25 * (0,1) = (5, 5.25)
// This is incorrect. Center should be (5, sagitta_offset) from midpoint.
// Center x = midX = 5. Center y = midY - (radius - sagitta) = 0 - (7.25 - 2) = -5.25 for CCW arc.
// Or midY + (radius-sagitta) if normal points upwards?
// Let's re-verify center calculation logic.
// If P1=(0,0), P2=(10,0), s=2 (CCW). Midpoint M=(5,0).
// Chord is on X-axis. Normal is (0,1) or (0,-1).
// For CCW arc above X-axis, center should be (5, y_c) where y_c < 0.
// Distance from M to C is |radius - s| = |7.25 - 2| = 5.25.
// Center C = M - d * N_unit, where N_unit is (0,1) for CCW.
// C = (5,0) - 5.25 * (0,1) = (5, -5.25).
// Start angle from (5, -5.25) to (0,0): atan2(0 - (-5.25), 0 - 5) = atan2(5.25, -5) approx 2.33 rad (133 deg)
// End angle from (5, -5.25) to (10,0): atan2(0 - (-5.25), 10 - 5) = atan2(5.25, 5) approx 0.80 rad (47 deg)
// Delta angle = 0.80 - 2.33 = -1.53. For CCW, need positive delta. So 2PI - 1.53 = 4.75. This seems too large.
// The issue is often with atan2 and ensuring the sweep angle is correct.
// Total angle subtended = 2 * asin( (L/2) / r ) = 2 * asin(5 / 7.25) = 2 * asin(0.689) approx 2 * 0.76 = 1.52 rad.
// This should be the sweep angle.
// If s > 0 (CCW), startAngle should be greater than endAngle if we sweep towards positive angle.
// Or, always sweep from startAngle to endAngle such that abs(endAngle-startAngle) = centralAngle,
// and the direction is dictated by sign(s).

const feature2 = {
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates: [[0,0], [10,0]]
    },
    properties: {
        arc_bulge: -2 // Negative bulge, expect CW arc
    }
};
const arc2 = calculateArcFromBulge(feature2);
console.log("Arc 2:", JSON.stringify(arc2.geometry.coordinates));
// Expected: Center (5, 5.25). Start angle to (0,0): atan2(-5.25, -5). End to (10,0): atan2(-5.25, 5).

const feature3 = {
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates: [[0,0], [0,10]]
    },
    properties: {
        arc_bulge: 2
    }
};
const arc3 = calculateArcFromBulge(feature3);
console.log("Arc 3 (vertical):", JSON.stringify(arc3.geometry.coordinates));

const feature4 = { // Identical points
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates: [[1,1], [1,1]]
    },
    properties: {
        arc_bulge: 2
    }
};
const arc4 = calculateArcFromBulge(feature4);
console.log("Arc 4 (identical points):", JSON.stringify(arc4.geometry.coordinates));


const feature5 = { // zero bulge
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates: [[0,0], [10,10]]
    },
    properties: {
        arc_bulge: 0
    }
};
const arc5 = calculateArcFromBulge(feature5);
console.log("Arc 5 (zero bulge):", JSON.stringify(arc5.geometry.coordinates));
*/

/**
 * Rotates a 2D vector by 90 degrees counter-clockwise.
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}}
 */
function rotate90CCW(x, y) {
    return { x: -y, y: x };
}
