import AppLayout from '@/layout/AppLayout.vue';
import { initializeSession, sessionState } from '@/store/session';
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            redirect: '/auth/login',
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/pages/employeemanagement',
                    name: '員工列表',
                    component: () => import('@/views/pages/EmployeeManagement.vue'),
                    meta: { roles: ['HR', 'ADMIN'] }
                },
                {
                    path: '/pages/leaverequest',
                    name: '請假申請/紀錄',
                    component: () => import('@/views/pages/ApplyLeaveRequest.vue')
                },
                {
                    path: '/pages/leaveapproval',
                    name: '請假審核',
                    component: () => import('@/views/pages/LeaveApproval.vue'),
                    meta: { roles: ['MANAGER', 'ADMIN'] }
                }
            ]
        },
        {
            path: '/pages/empty',
            name: 'empty',
            component: () => import('@/views/pages/Empty.vue')
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

// 全局前置守衛
router.beforeEach(async (to, from, next) => {
    // 1. 確保 Session 狀態已經從後端初始化
    // 這一步解決了「重新整理頁面」後，sessionState 還沒拿到資料的問題
    if (!sessionState.isInitialized) {
        await initializeSession();
    }

    // 2. 檢查目標路由是否需要權限 (檢查路由是否有 meta.roles)
    const requiredRoles = to.meta.roles;

    // 3. 如果路由不需要權限，直接放行
    if (!requiredRoles || requiredRoles.length === 0) {
        next();
        return;
    }

    // 4. 如果路由需要權限，但使用者尚未登入，導向登入頁
    if (!sessionState.isLoggedIn) {
        // 儲存使用者想去的頁面，登入後可以導向回去
        next({ name: 'login', query: { redirect: to.fullPath } });
        return;
    }

    // 5. 檢查使用者是否擁有至少一個所需角色
    const hasPermission = sessionState.roles.some((userRole) => requiredRoles.includes(userRole));
    if (hasPermission) {
        next(); // 有權限，放行
    } else {
        // 有登入，但沒有權限，導向「權限不足」頁面
        next({ name: 'access-denied' });
    }
});

export default router;
