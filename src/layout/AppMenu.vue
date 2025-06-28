<script setup>
import router from '@/router'; // ✅ 2. 引入 router 實例，來讀取所有路由設定
import { sessionState } from '@/store/session'; // ✅ 1. 引入我們建立的全局 session 狀態
import { computed } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

/**
 * ✅ 3. 使用 computed 屬性來動態產生選單模型
 * 當 sessionState.roles 變化時，這個 model 會自動重新計算
 */
const model = computed(() => {
    // 從 router 設定中，找到屬於 AppLayout 的那些子路由
    // 這通常是您在 routes 陣列中 path 為 '/' 的那個物件的 children
    const mainLayoutRoutes = router.options.routes.find((r) => r.path === '/')?.children || [];

    // 過濾出目前登入者有權限看到的路由
    const accessibleRoutes = mainLayoutRoutes.filter((route) => {
        // 如果路由沒有 meta 或 meta.roles，代表是公開頁面，所有人都看得到
        if (!route.meta || !route.meta.roles || route.meta.roles.length === 0) {
            return true;
        }

        // 如果路由需要權限，但使用者尚未登入，則不顯示
        if (!sessionState.isLoggedIn) {
            return false;
        }

        // 檢查使用者的角色，是否至少有一個存在於路由設定的 roles 陣列中
        return sessionState.roles.some((userRole) => route.meta.roles.includes(userRole));
    });

    // 將過濾後的路由，轉換為 AppMenu 需要的格式
    // 這裡我參考了您原本的結構，您可以自訂
    const pagesItems = accessibleRoutes.map((route) => {
        // 從路由設定中提取我們需要的資訊
        return {
            label: route.name, // 您可以自訂成中文標籤
            icon: 'pi pi-fw pi-circle', // 您可以根據路由設定不同的 icon
            to: route.path
        };
    });

    // 組裝成最終的選單結構
    return [
        {
            label: 'Login',
            items: [{ label: '登入', icon: 'pi pi-fw pi-sign-in', to: '/auth/login' }]
        },
        {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            items: pagesItems // ✅ 這裡放的就是我們動態產生出來的選單項目
        }
        // ... 您可以加入其他固定的選單項目 ...
    ];
});
// const model = ref([
//     {
//         label: 'Home',
//         items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
//     },
//     {
//         label: 'Pages',
//         icon: 'pi pi-fw pi-briefcase',
//         to: '/pages',
//         items: [
//             {
//                 label: 'Auth',
//                 icon: 'pi pi-fw pi-user',
//                 items: [
//                     {
//                         label: 'Error',
//                         icon: 'pi pi-fw pi-times-circle',
//                         to: '/auth/error'
//                     },
//                     {
//                         label: 'Access Denied',
//                         icon: 'pi pi-fw pi-lock',
//                         to: '/auth/access'
//                     }
//                 ]
//             },
//             {
//                 label: '員工列表',
//                 icon: 'pi pi-fw pi-pencil',
//                 to: '/pages/employeemanagement'
//             },
//             {
//                 label: '請假申請/查詢',
//                 icon: 'pi pi-fw pi-pencil',
//                 to: '/pages/leaverequest'
//             },
//             {
//                 label: '請假審核',
//                 icon: 'pi pi-fw pi-pencil',
//                 to: '/pages/leaveapproval'
//             }
//         ]
//     },
//     {
//         label: 'Get Started',
//         items: [
//             {
//                 label: 'Documentation',
//                 icon: 'pi pi-fw pi-book',
//                 to: '/documentation'
//             },
//             {
//                 label: 'View Source',
//                 icon: 'pi pi-fw pi-github',
//                 url: 'https://github.com/primefaces/sakai-vue',
//                 target: '_blank'
//             }
//         ]
//     }
// ]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
