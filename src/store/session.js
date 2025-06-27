import { userInfo } from '@/api'; // 引入獲取使用者資訊的 API
import { reactive } from 'vue';

// 1. 使用 reactive() 建立一個全局的、響應式的狀態物件
export const sessionState = reactive({
    id: null,
    name: '',
    roles: [],
    isLoggedIn: false,
    isInitialized: false // 用來追蹤是否已從後端初始化過
});

/**
 * 2. 建立一個 Action，用於在登入成功後設定使用者資料
 * @param {object} userData - 從登入 API 回傳的使用者 DTO
 */
export function setSession(userData) {
    sessionState.id = userData.id;
    sessionState.name = userData.name;
    sessionState.roles = userData.roles || [];
    sessionState.isLoggedIn = true;
    sessionState.isInitialized = true;
}

/**
 * 3. 建立一個 Action，用於登出或清除資料
 */
export function clearSession() {
    sessionState.id = null;
    sessionState.name = '';
    sessionState.roles = [];
    sessionState.isLoggedIn = false;
    sessionState.isInitialized = true;
}

/**
 * 4. 建立一個初始化函式，在應用程式啟動時呼叫
 * 用於處理「使用者已經登入，但重新整理了頁面」的情況
 */
export async function initializeSession() {
    if (sessionState.isInitialized) return; // 避免重複初始化

    try {
        const res = await userInfo(); // 呼叫後端 /api/user
        if (res.success) {
            setSession(res.body); // 如果後端 session 有效，就用回傳的資料設定狀態
        } else {
            clearSession(); // 如果後端 session 無效，就清空狀態
        }
    } catch (error) {
        console.error('Session 初始化失敗', error);
        clearSession(); // 發生錯誤也清空狀態
    }
}
