import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },
  {
    // 粉丝端模拟页(公开,无需登录,不套后台布局)
    path: '/fan-demo',
    name: 'fan-demo',
    component: () => import('@/views/FanDemo.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据统计' },
      },
      {
        path: 'miniapp',
        name: 'miniapp',
        component: () => import('@/views/Miniapp.vue'),
        meta: { title: '小程序' },
      },
      {
        path: 'cs',
        name: 'cs',
        component: () => import('@/views/Cs.vue'),
        meta: { title: '客服' },
      },
      {
        path: 'workspace',
        name: 'workspace',
        component: () => import('@/views/Workspace.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 登录态守卫
router.beforeEach((to) => {
  const user = useUserStore();
  if (!to.meta.public && !user.token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.path === '/login' && user.token) {
    return { path: '/dashboard' };
  }
  return true;
});

export default router;
