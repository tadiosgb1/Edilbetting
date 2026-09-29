import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/opened/landing/Home.vue';
import ForgotPassword from '../views/opened/auth/forgotPassword.vue';
import ResetPassword from '../views/opened/auth/ResetPassword.vue';
import Reset from '../views/opened/auth/reset.vue';
import AccessDenied from "../views/opened/auth/accessDenied.vue";
import Registration from '../views/opened/auth/registration.vue';
import first_dash from '../views/closed/first_dash.vue';
import dashboard from '../views/closed/dashboard.vue';
import UsersView from '../views/closed/Users/UsersView.vue';
import BetsView from '../views/closed/Bets/BetsView.vue';
import SportsView from '../views/closed/Sports/SportsView.vue';
import EventsView from '../views/closed/Events/EventsView.vue';

const routes = [
  // ── Public / Landing ──────────────────────────────────────────────────
  {
    path: "/",
    name: "/",
    component: Home,
    meta: { requiresGuest: true },
  },
  {
    path: "/register",
    name: "register",
    component: Registration,
    meta: { requiresGuest: true },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: ForgotPassword,
    props: true,
  },
  {
    path: "/:lang/reset-password",
    name: "ResetPassword",
    component: ResetPassword,
    props: true,
  },
  {
    path: "/reset/:token",
    name: "reset",
    component: Reset,
    meta: { requiresGuest: true },
  },
  {
    path: "/test-login/:token",
    name: "test-login",
    component: () => import('../views/opened/auth/TestLogin.vue'),
    meta: { requiresGuest: true },
  },

  // ── Protected Dashboard Shell ─────────────────────────────────────────
  {
    path: "/dashboard",
    name: "dashboard",
    component: dashboard,
    children: [
      {
        path: "first-dash",
        name: "first-dash",
        component: first_dash,
      },
      {
        path: "users",
        name: "users",
        component: UsersView,
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "bets",
        name: "bets",
        component: BetsView,
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "sports",
        name: "sports",
        component: SportsView,
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "events/:sportKey",
        name: "events",
        component: EventsView,
        meta: { requiresAuth: true, role: "admin" },
      },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────────────────
  {
    path: "/:pathMatch(.*)*",
    name: "accessDenied",
    component: AccessDenied,
    meta: { requiresGuest: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRole = to.meta.role;

  if (requiresAuth) {
    if (!isAuthenticated) {
      next("/");
    } else if (requiredRole && userRole !== requiredRole) {
      localStorage.clear();
      next("/");
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
