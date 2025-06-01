<!-- Developed by Taipei Urban Intelligence Center 2023-2024-->

<!-- This component is mounted programmically by the mapstore. "mapConfig" and "popupContent" are passed in in the mapStore -->
<script setup>
import { useMapStore } from '../../store/mapStore'

const mapStore = useMapStore()
</script>

<template>
  <div class="mappopup">
    
    <div class="mappopup-tab">
      <div
        v-for="(mapConfig, index) in mapConfigs"
        :key="mapConfig.id"
        :class="{ 'mappopup-tab-active': activeTab === index }"
      >
        <button
          @click="
            () => {
              activeTab = index;
            }
          "
        >
          {{
            activeTab === index
              ? mapConfig.title
              : mapConfig.title.length > 5
                ? mapConfig.title.slice(0, 4) + "..."
                : mapConfig.title
          }}
        </button>
      </div>
      <!-- Range Buttons - 移到 v-for 迴圈外部 -->
      <div 
        class="mappopup-range-buttons"
        @mouseleave="handleRangeLeave"
        >
        <button
          v-for="(radius, index) in [500, 2000, 5000]"
          :key="radius"
          :class="['range-button', `range-button-${index}`]"
          @mouseenter="handleRangeHover(radius)"
          @touchstart.prevent="handleRangeHover(radius)"
          @touchend.prevent="handleRangeLeave"
        >
          {{ `${radius / 1000}km` }}
        </button>
      </div>
    </div>
    <div class="mappopup-content">
      <div
        v-for="item in mapConfigs[activeTab].property"
        :key="item.key"
        :style="{
          display: 'flex',
          flexDirection: 'column',
        }"
      >
        <div
          v-if="item.mode === 'video'"
          class="mappopup-video"
        >
          <!-- <h3>{{ item.name }}</h3> -->
          <!-- <p>{{ popupContent[activeTab]?.properties[item.key] }}</p>
          <p>影像載入中...</p>
          <img
            :src="popupContent[activeTab]?.properties[item.key]"
            width="100%"
            height="100%"
          > -->
          <template v-if="popupContent[activeTab]?.properties[item.key].includes('freeway.gov.tw')">
            <img
              width="100%"
              height="100%"
              :src="popupContent[activeTab]?.properties[item.key]"
            >
          </template>
          <template v-else>
            <iframe
              width="300"
              height="200"
              :src="popupContent[activeTab]?.properties[item.key]"
            />
          </template>
        </div>
        <div v-else>
          <h3>{{ item.name }}</h3>
          <p>{{ popupContent[activeTab]?.properties[item.key] }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@keyframes easein {
	0% {
		opacity: 0;
	}

	100% {
		opacity: 1;
	}
}

.mapboxgl-popup {
	width: fit-content;
	min-width: 310px !important;
	animation: easein 0.2s linear;
}

.mapboxgl-popup-content {
	padding: 0 !important;
	border: solid 1px var(--color-border);
	box-shadow: 0px 0px 10px rgb(35, 35, 35) !important;
	border-radius: 5px !important;
	background-color: var(--color-component-background) !important;
	transition: opacity 0.3s ease !important;
}

.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip,
.mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip,
.mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip {
	border-top-color: var(--color-border) !important;
	transition: opacity 0.3s ease !important;
}

.mapboxgl-popup-anchor-top .mapboxgl-popup-tip,
.mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip,
.mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip {
	border-bottom-color: var(--color-border) !important;
	transition: opacity 0.3s ease !important;
}

.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
	border-right-color: var(--color-border) !important;
	transition: opacity 0.3s ease !important;
}

.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
	border-left-color: var(--color-border) !important;
	transition: opacity 0.3s ease !important;
}

.mapboxgl-popup-close-button {
	right: 15px !important;
	top: 10px !important;
	color: var(--color-complement-text);
	font-size: 1.2rem;
	line-height: var(--font-ms);
}

.mappopup {
	max-height: 200px;
	padding: 10px;
	overflow-y: scroll;

	button {
		margin-bottom: 0.5rem;
		color: var(--color-complement-text);
	}

	.mappopup-tab-active {
		display: flex;
	}

	&-range-buttons {
		margin-left: 12px;
		display: flex;
		gap: 2px;
		justify-content: center;

		.range-button {
			padding: 6px 12px;
			border-radius: 15px;
			background-color: var(--color-highlight);
			color: white;
			font-size: var(--font-s);
			font-weight: 500;
			border: none;
			cursor: auto;
			transition: all 0.2s ease;
			user-select: none;
			position: relative;
			
			&:hover {
				transform: translateY(-1px);
				box-shadow: 0 4px 8px rgba(0, 124, 191, 0.3);
				z-index: 10;
			}

			&:active {
				opacity: 0.6;
				transform: translateY(0);
			}

			margin-bottom: 0;

			// 500m button
			&.range-button-0 {
				background-color: #5A9BF8;
				
				&:hover {
					background-color: #4A8AE7;
					box-shadow: 0 4px 8px rgba(90, 155, 248, 0.3);
				}
			}

			// 2km button  
			&.range-button-1 {
				background-color: #287DF6;
				
				&:hover {
					background-color: #1A6CE5;
					box-shadow: 0 4px 8px rgba(40, 125, 246, 0.3);
				}
			}

			// 5km button
			&.range-button-2 {
				background-color: #0960DC;
				
				&:hover {
					background-color: #084FCB;
					box-shadow: 0 4px 8px rgba(9, 96, 220, 0.3);
				}
			}
		}
	}

	&-tab {
		display: flex;
		margin-bottom: 0.5rem;
		transition: opacity 0.3s ease;

		button {
			margin: 0 4px 0 0;
			padding: 4px 4px;
			border-radius: 5px;
			background-color: rgb(77, 77, 77);
			opacity: 0.6;
			color: var(--color-complement-text);
			font-size: var(--font-s);
			text-align: center;
			transition: color 0.2s, opacity 0.2s;
			user-select: none;

			&:hover {
				opacity: 0.8;
				color: white;
			}
		}

		&-active button {
			opacity: 1;
			color: white;
		}
	}

	&-content {
		width: 100%;
		transition: opacity 0.3s ease;

		div {
			display: flex;
		}

		h3 {
			min-width: 100px;
		}

		p {
			text-align: justify;
		}
	}

	&-video {
		position: relative;
		width: min(256px, 100%);
		min-height: 100px;
		aspect-ratio: 16 / 9;
		flex-direction: column;
		align-items: center;
		align-self: center;
		justify-content: center;
		margin: 0 auto;
		margin-top: 5px;
		border-radius: 5px;
		background-color: var(--color-border);

		img {
			width: 100%;
			height: 100%;
			// position: absolute;
			// left: 0;
			// top: 0;
		}
	}
}
</style>
