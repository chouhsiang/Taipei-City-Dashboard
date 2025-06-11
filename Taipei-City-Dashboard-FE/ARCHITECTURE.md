# 前端架構文件：台北城市儀表板

本文件概述了台北城市儀表板應用程式的前端架構。

## 1. 核心技術與框架

*   **Vue.js (v3):** 主要的 JavaScript 框架。它利用組合式 API (`<script setup>`) 進行元件邏輯處理，從而實現更有組織和可重複使用的程式碼庫。
*   **Vite:** 作為建置工具和開發伺服器。它專為 Vue.js 設定，提供快速的熱模組更換 (HMR) 以實現高效的開發體驗和最佳化的生產版本。
*   **Pinia:** 狀態管理函式庫。它採用模組化方法，將不同的應用程式關注點（例如身份驗證、內容顯示、地圖互動、對話框管理、管理功能和主題設定）分配給獨立的儲存庫 (store)。
*   **Vue Router (v4):** 管理客戶端路由和導覽。導覽守衛被廣泛用於身份驗證檢查、基於路由的資料預先擷取以及根據目前路由更新全域狀態等任務。
*   **Axios:** 負責與後端 API 和 GeoServer 通訊的 HTTP 客戶端。
*   **SCSS/CSS:** 樣式設計是透過全域 CSS 檔案和個別 Vue 元件內的限定範圍 SCSS 相結合的方式實現的，從而同時允許全域樣式規則和元件特定樣式。

## 2. 專案結構與主要目錄

前端程式碼庫組織在 `Taipei-City-Dashboard-FE/` 目錄中。

*   **`public/`**: 包含由 Web 伺服器直接提供的靜態資產。這包括主要的 `index.html` 檔案、應用程式標誌以及一些用於地圖資料的 GeoJSON 檔案。
*   **`src/`**: 包含主要的應用程式原始碼。
    *   **`assets/`**: 儲存全域靜態資產，例如 CSS 樣式表 (`globalStyles.css`, `chartStyles.css`)、圖片和共用公用程式函式。
    *   **`components/`**: 包含構成 UI 建置組塊的通用、可重複使用的 Vue 元件。
        *   `charts/`: 包含用於顯示歷史資料的元件，例如 `HistoryChart.vue`。
        *   `dialogs/`: 用於各種使用者和管理互動（例如登入、設定、警告、管理 CRUD 操作）的強制回應對話框元件的完整集合。
        *   `map/`: 包含與地圖相關的元件，例如 `MapContainer.vue`（用於初始化地圖）和 `MapPopup.vue`（用於地圖彈出視窗中的自訂內容）。
        *   `utilities/`: 包含較小的 UI 元素，例如導覽列、表單輸入和雜項輔助元件。
    *   **`dashboardComponent/`**: 一個專門的模組，專注於構成儀表板的核心資料視覺化小工具。此模組似乎有些獨立，擁有自己的 `LICENSE` 檔案。
        *   `DashboardComponent.vue`: 一個關鍵元件，可根據設定動態呈現各種類型的圖表和視覺化效果。
        *   `components/`: 包含個別圖表元件（例如 `BarChart.vue`、`ColumnChart.vue`、`DonutChart.vue`、`MapLegend.vue`）。
        *   `assets/`: 包含代表不同圖表類型和地圖特定圖示的 SVG 圖示。
        *   `styles/`: 包含儀表板元件特定的樣式表。
        *   `utilities/`: 提供對儀表板元件至關重要的 TypeScript 型輔助函式和設定（例如 `cityManager.ts`、`chartTypes.ts`）。
    *   **`main.js`**: 應用程式的進入點。它會初始化 Vue 應用程式、Pinia 狀態管理、Vue Router、全域樣式表和任何其他必要的擴充功能。
    *   **`App.vue`**: 根 Vue 元件。它定義了主要的應用程式版面配置結構（包括導覽列和側邊欄）、管理全域 UI 元素，並處理應用程式層級的生命週期邏輯，例如資料重新整理計時器。
    *   **`router/`**:
        *   `index.js`: 定義所有客戶端路由及其相關的導覽守衛。
        *   `axios.js`: 設定用於 API 通訊的全域 Axios 執行個體。
    *   **`store/`**: 包含 Pinia 儲存庫模組，每個模組管理應用程式狀態的特定部分（例如 `authStore.js`、`contentStore.js`、`mapStore.js`）。
    *   **`views/`**: 對應於特定路由的頁面層級 Vue 元件。它們協調應用程式不同部分的資料和元件顯示（例如 `DashboardView.vue`、`MapView.vue`、`admin/AdminDashboard.vue`）。
*   **`vite.config.js`**: Vite 的設定檔，定義建置設定、開發伺服器選項（包括代理伺服器）和擴充功能。

## 3. 狀態管理策略 (Pinia)

狀態管理由 Pinia 處理，遵循模組化模式：

*   **`authStore`**: 管理使用者身份驗證狀態、使用者設定檔資訊和客戶端環境詳細資料（例如行動裝置偵測）。
*   **`contentStore`**: 負責儀表板定義、元件資料、使用者特定的個人儀表板、最愛的元件和貢獻者資訊。
*   **`mapStore`**: 控制 Mapbox 地圖執行個體，包括圖層管理、彈出視窗、使用者儲存的視點/標記和地圖互動。
*   **`dialogStore`**: 管理整個應用程式中所有強制回應對話框和通知的可見度狀態和內容。
*   **`adminStore`**: 處理儀表板管理區段的狀態和 CRUD（建立、讀取、更新、刪除）操作。
*   **`themeStore`**: 管理應用程式的視覺主題（例如深色模式、淺色模式）。

元件和導覽守衛與這些儲存庫互動以存取狀態和分派動作。API 呼叫和複雜的狀態變動都封裝在儲存庫動作中。自訂 Pinia 擴充功能用於為儲存庫動作新增防抖動功能，從而最佳化頻繁觸發動作的效能。

## 4. 路由和導覽流程 (Vue Router)

客戶端路由由 Vue Router 管理：

*   一組完整的路由會將 URL 對應到特定檢視，用於使用者面向的儀表板、地圖介面、元件瀏覽、嵌入式內容和管理功能。
*   **導覽守衛 (`beforeEach`)**: 在以下方面扮演關鍵角色：
    *   **身份驗證與授權**: 保護路由並根據使用者的登入狀態和權限重新導向使用者。
    *   **資料擷取**: 在呈現路由之前，觸發 Pinia 儲存庫中與目標路由相關的資料載入動作。
    *   **狀態管理**: 根據目前路由更新全域應用程式狀態（例如 `authStore.currentPath`）。
    *   **行動裝置特定導覽**: 調整行動裝置的導覽行為。
*   **延遲載入**: 管理檢視元件會延遲載入，以改善應用程式的初始載入時間。

## 5. 元件組織和階層

*   **`App.vue`**: 最上層元件，提供整體頁面結構（導覽列、側邊欄）並託管 `<RouterView />` 以顯示路由特定的檢視。
*   **檢視 (Views)**: 由路由器載入，檢視構成每個頁面的主要內容。它們利用 `src/components/` 中的元件來處理一般 UI 元素和對話框，並利用 `src/dashboardComponent/` 中的元件來進行資料視覺化。
*   **`DashboardComponent.vue`**: `src/dashboardComponent/` 中的一個多功能元件，可根據輸入設定動態呈現各種類型的圖表。這允許彈性且資料驅動的儀表板版面配置。
*   **`MapContainer.vue`**: 封裝 Mapbox 地圖初始化，主要用於 `MapView.vue` 中。

## 6. 建置流程 (Vite)

Vite 用於開發和生產建置：

*   **擴充功能 (Plugins)**:
    *   `@vitejs/plugin-vue`: 啟用對 Vue 3 單一檔案元件 (SFC) 的支援，並在開發期間提供熱模듈更換 (HMR)。
    *   `vite-plugin-compression`: 壓縮建置資產（例如使用 Gzip 或 Brotli）以減少套件大小並改善應用程式載入時間。
*   **開發伺服器**:
    *   設定了後端 API (`/api`) 和 GeoServer (`/geo_server`) 的代理伺服器。可以使用 `DOCKER_COMPOSE` 環境變數切換這些代理伺服器的目標 URL，為不同的本機開發設定提供彈性。
*   **建置最佳化**:
    *   **區塊分割 (Chunk Splitting)**: Rollup 設定中的 `manualChunks` 用於將供應商程式碼（來自 `node_modules`）分割成獨立的區塊。這可以改善瀏覽器快取並可能減少初始載入時間。
    *   **`chunkSizeWarningLimit`**: 此限制已增加，表示專案團隊已意識到並正在管理可能較大的 JavaScript 區塊，這在具有大量用於對應和圖表繪製函式庫的應用程式中很常見。

## 7. 主要架構模式與設計選擇

*   **模組化設計**: 該應用程式透過使用 Vue 元件、不同的 Pinia 儲存庫模組和定義明確的檢視，展現了明確的關注點分離。
*   **儲存庫驅動的資料流程**: 元件主要從 Pinia 儲存庫接收資料，並透過向這些儲存庫分派動作來觸發變更。這集中了資料邏輯並使狀態變更可預測。
*   **設定驅動的 UI**: `dashboardComponent` 系統設計為高度可設定，允許儀表板及其視覺化效果由資料結構定義。`cityManager.ts` 公用程式也建議對城市特定功能採用基於設定的方法。
*   **集中式對話框管理**: `dialogStore` 提供一致且集中的機制來控制所有強制回應對話框和通知。
*   **響應式設計**: 該應用程式採用響應式設計原則。`authStore` 會追蹤裝置特性（`isMobileDevice`、`isNarrowDevice`），而 `App.vue` 和路由器守衛會相應地進行版面配置和導覽調整。CSS 媒體查詢也用於樣式調整。
*   **進階地圖整合**: 與 Mapbox GL JS 和 Deck.gl 進行了深度整合，主要由 `mapStore` 管理。自訂地圖圖層（弧形、Voronoi、等值線）的實作展示了複雜的地理空間視覺化功能。
*   **專用管理區段**: 應用程式的一個獨立部分專用於內容管理，具有自己的一組檢視和用於管理工作的儲存庫邏輯。
*   **自動資料重新整理**: `App.vue` 包含計時器，可定期重新載入儀表板和地圖檢視的資料，確保使用者看到最新的資訊。

此架構支援功能豐富、互動式的儀表板應用程式，並特別強調模組化、狀態管理和進階的基於地圖的資料視覺化。

## 8. 自定义 GeoJSON 格式 (Custom GeoJSON Formats)

### 弧线 (`bulge-arc`)

- **用途 (Purpose):** 用于在 Mapbox GL JS 中直接绘制圆弧线段，而不依赖 Deck.gl。通过定义起始点、结束点以及一个“凸度”参数来控制弧线的形状和方向。
- **GeoJSON 结构 (Structure):**
  - 每个弧线表示为一个 GeoJSON `Feature` 对象。
  - `geometry`: 类型为 `LineString`，包含两个坐标点，分别代表弧线的起始点和结束点。
    ```json
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [<起始经度>, <起始纬度>],
        [<结束经度>, <结束纬度>]
      ]
    }
    ```
  - `properties`: 一个对象，包含以下关键属性：
    - `arc_bulge`: 数值类型。定义了弧线的凸度和方向。
      - `0`: 表示绘制一条直线。
      - 正值: 使弧线向一侧弯曲（例如，从起点到终点逆时针方向）。
      - 负值: 使弧线向另一侧弯曲（例如，从起点到终点顺时针方向）。
      - 其绝对值大小影响弧线的弯曲程度（弧高）。
    - 其他可选属性，用于样式定义或标识（例如 `id`, `color`）。
- **示例 (Example Feature):**
  ```json
  {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [121.5, 25.0],
        [121.6, 25.05]
      ]
    },
    "properties": {
      "arc_bulge": 0.3,
      "id": "myArc1",
      "color": "#FF0000" // 可选，用于样式
    }
  }
  ```
- **处理方式 (Processing):**
  - 此类型的 GeoJSON 数据由 `mapStore.js` 处理。
  - `mapStore.js` 中的图层配置需指定 `type: 'bulge-arc'`。
  - `mapStore.js` 会使用 `src/assets/utilityFunctions/arcCalculator.js` 中的 `calculateArcFromBulge` 函数将每个 `bulge-arc` Feature 转换为包含多个细分点以逼近弧线的标准 `LineString` Feature。
  - 最终，这些处理后的弧线将作为标准的 Mapbox GL JS `line` 图层渲染到地图上。其样式（如颜色、线宽）可以通过原始 `bulge-arc` 图层配置中的 `paint` 属性来定义，就像定义普通线图层一样。
