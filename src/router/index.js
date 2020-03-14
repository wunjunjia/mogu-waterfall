import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/views/home/index.vue';

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/imgTrim', component: () => import('@/views/imgTrim/index.vue') },
  ],
  mode: 'history',
});

export default router;