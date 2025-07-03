# 企業級員工差勤管理系統 (前端)

這是一個使用 Vue 3 (Composition API) 和 PrimeVue 元件庫打造的現代化單頁應用程式 (SPA)。它為後端 API 提供了一個功能豐富、使用者體驗流暢的操作介面。
本專案採用了混合雲的部署架構，將應用程式與資料庫分離，以提升安全性與管理彈性。

```
graph TD
    subgraph "使用者端 (Client)"
        A[👨‍💻 使用者瀏覽器]
    end

    subgraph "前端託管 (GitHub)"
        B(🌐 GitHub Pages<br/>Vue.js 前端)
    end
    
    subgraph "後端應用託管 (Railway)"
        C(🚀 Railway<br/>Docker 化的 Spring Boot 應用)
    end

    subgraph "資料庫託管 (AWS)"
        D[(🗄️ AWS RDS<br/>MySQL 資料庫)]
    end

    A -->|瀏覽網站| B
    B -->|發送 API 請求 (HTTPS)| C
    C -->|透過公網連線 (SSL)| D
```

## 專案亮點與設計決策

本專案不僅是功能的實現，更著重於前端工程化的最佳實踐，展現了獨立解決複雜前端問題的能力。

#### 1. **分層式服務架構**
* **挑戰**：如何讓 Vue 元件保持乾淨，避免混雜大量的 API 呼叫邏輯？
* **解決方案**：採用了 **Component -> Service -> API Index** 的三層式架構。
    * **Vue Component**：只負責畫面渲染和使用者事件的觸發。
    * **Service 層 (`/service`)**：負責封裝業務相關的 API 呼叫，並處理後端回應的解析（例如，從 `BaseApiResponse` 中取出 `body` 或 `throw Error`）。
    * **API 層 (`/api`)**：負責管理所有 API 的路徑和 Axios 的請求設定。
* **優勢**：此架構使得程式碼職責分明、可重用性高，且極易維護。

#### 2. **動態權限 UI 與路由守衛**
* **挑戰**：如何根據不同使用者角色，動態顯示對應的選單和按鈕？
* **解決方案**：
    * 在 **Vue Router** 中，為路由設定 `meta: { roles: [...] }` 元資料來定義權限。
    * 在 **Sidebar (`AppMenu.vue`)** 中，使用 `computed` 屬性讀取全局狀態中的使用者角色，並動態過濾路由設定，只渲染使用者有權限看到的選單項。
    * 同時，設定 `router.beforeEach` **全局導航守衛**，作為最後一道防線，防止使用者透過手動輸入網址的方式訪問未授權頁面。

#### 3. **複雜表單與連動邏輯**
* **挑戰**：在「新增/編輯員工」時，「主管」下拉選單的人選應根據所選的「部門」而動態改變。
* **解決方案**：在 Vue 元件中，使用 `watch` 來監聽表單內「部門」欄位的變化。一旦部門改變，立刻觸發一個帶有 `departmentId` 參數的 API 請求，從後端獲取**經過篩選的**、合適的主管列表，並動態更新「主管」下拉選單的選項。這實現了高效的**級聯下拉選單 (Cascading Dropdowns)**，並提供了極佳的防呆效果。

#### 4. **健壯的非同步處理與使用者回饋**
* **挑戰**：如何處理網路延遲和 API 錯誤，提供良好的使用者體驗？
* **解決方案**：在所有 API 呼叫中，都採用了 `async/await` 搭配 `try...catch...finally` 的完整結構。
    * 在 `try` 區塊中發送請求。
    * 在 `catch` 區塊中，利用 `primevue/usetoast` 彈出清晰、友善的錯誤提示。
    * 在 `finally` 區塊中，將 `loading` 狀態設為 `false`，確保載入動畫能被正確關閉。
* **成果**：整個應用程式在處理非同步操作時表現得非常穩定和可靠。

## 🔐 測試帳號資訊

| 使用者類型 | 帳號 | 密碼 |
|------------|------|------|
| 員工帳號   | 0002 | 1234 |
| 員工帳號   | 0003 | 1234 |
| 員工帳號   | 0004 | 1234 |


## 部署與 CI/CD (Deployment & CI/CD)

本前端專案透過 **GitHub Actions** 實現了完整的 CI/CD (持續整合/持續部署) 流程。

1.  **網站託管 (Hosting)**
    * 本專案作為一個靜態網站，被部署在 **GitHub Pages** 上。

2.  **自動化工作流程 (Automation Workflow)**
    * 倉庫中的 `.github/workflows/deploy.yml` 檔案定義了自動化部署的每一個步驟。
    * 當有任何程式碼被 push 到 `main` 分支時，這個工作流程就會被自動觸發。

3.  **建置過程 (Build Process)**
    * 工作流程首先會設定 Node.js 環境，並安裝所有專案依賴 (`npm install`)。
    * 接著執行 `npm run build` 指令，Vite 會將 Vue.js 專案打包成優化過的靜態 HTML, CSS, JavaScript 檔案，並輸出到 `dist` 資料夾。
    * 為了適應 GitHub Pages 的子目錄部署，`vite.config.js` 中的 `base` 和 `router/index.js` 中的路由模式 (`Hash` 模式) 都已進行了相應的配置，以解決資源路徑和重新整理時 404 的問題。

4.  **環境變數 (Environment Variables)**
    * 生產環境的後端 API URL 並未寫死在程式碼中。
    * 它被安全地儲存在 GitHub 倉庫的 **Secrets** (`VITE_API_BASE_URL`) 中。
    * 在建置過程中，GitHub Actions 會將這個 Secret 注入為環境變數，Vite 在打包時會將其寫入最終的靜態檔案中，確保前端能正確地連接到部署在 Railway 上的後端服務。

## 技術棧 (Technology Stack)
* **框架**: Vue 3 (Composition API)
* **路由**: Vue Router
* **UI 元件庫**: PrimeVue, PrimeFlex
* **HTTP 客戶端**: Axios
* **建置工具**: Vite

## 本機環境啟動指南
1.  確保已安裝 Node.js (LTS 版本)。
2.  在專案根目錄執行 `npm install` 來安裝所有依賴。
3.  確保後端伺服器已在 `http://localhost:5000` 啟動。
4.  執行 `npm run dev`。
5.  前端開發伺服器將會運行在 `http://localhost:5173`。
