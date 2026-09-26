import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/opened/landing/Home.vue'

import SendSMS from  '../views/opened/landing/apidocs/SendSMS.vue'
import BulkSend from "../views/opened/landing/apidocs/BulkSend.vue";
import Otp from  '../views/opened/landing/apidocs/OTP.vue'
import Verify from  '../views/opened/landing/apidocs/Verify.vue'
import Balance from  '../views/opened/landing/apidocs/Balance.vue'
import Status from  '../views/opened/landing/apidocs/Status.vue'
import About from  '../views/opened/landing/about.vue'
import Products from  '../views/opened/landing/products.vue'
import Pricing from  '../views/opened/landing/plans.vue'
import NewsEvents from '../views/opened/landing/NewsEvents.vue'
import ContactPage from '../views/opened/landing/ContactPage.vue'

import Login from '../views/opened/auth/login.vue'

import ResetPassword from '../views/opened/auth/ResetPassword.vue'
import ForgotPasssword from '../views/opened/auth/forgotPassword.vue'
import ActivateEmailMessage from '../views/opened/landing/activateEmailMessage.vue'
import Registration from '../views/opened/auth/registration.vue'
import ForgotPassword from '../views/opened/auth/forgotPassword.vue';
import Reset from '../views/opened/auth/reset.vue';
import AccessDenied from "../views/opened/auth/accessDenied.vue";
import first_dash from '../views/closed/first_dash.vue'
import dashboard from '../views/closed/dashboard.vue'


import RoleView from '../views/closed/Roles/RoleView.vue'
import PermissionView from '../views/closed/Permissions/PermissionView.vue'




const routes = [
  {
    path: "/", name: "/",
    component: Home,
    meta:
      { requiresGuest: true }
  },
  // {
  //   path: "/login", name: "login",
  //   component: Login,
  //   meta:
  //     { requiresGuest: true }
  // },

  {
    path: "/register", name: "register",
    component: Registration,
    meta:
      { requiresGuest: true }
  },

  {
    path: "/send-sms", name: "/send-sms",
    component: SendSMS,
    meta:
      { requiresGuest: true }
  },


    {
    path: "/bulk-sms", name: "/bulk-sms",
    component: BulkSend,
    meta:
      { requiresGuest: true }
  },

    {
    path: "/otp", name: "/otp",
    component: Otp,
    meta:
      { requiresGuest: true }
  },

    {
    path: "/verify", name: "/verify",
    component: Verify,
    meta:
      { requiresGuest: true }
  },

    {
    path: "/balance", name: "/balance",
    component: Balance,
    meta:
      { requiresGuest: true }
  },


   {
    path: "/status", name: "/status",
    component: Status,
    meta:
      { requiresGuest: true }
  },


  {
    path: "/about", name: "/about",
    component: About,
    meta: { requiresGuest: true }
  },


    {
    path: "/products", name: "/products",
    component: Products,
    meta:
      { requiresGuest: true }
  },

  {
    path: "/pricing", name: "/pricing",
    component: Pricing,
    meta:
      { requiresGuest: true }
  },

  {
    path: "/news-events", name: "/news-events",
    component: NewsEvents,
    meta: { requiresGuest: true }
  },

  {
    path: "/contact", name: "/contact",
    component: ContactPage,
    meta: { requiresGuest: true }
  },

  {
    path: "/email-activate-message", name: "email-activate-message",
    component: ActivateEmailMessage,
    meta:
      { requiresGuest: true }
  },
  // router/index.js
   {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasssword,
    props: true
  },
    {
      path: "/:lang/reset-password",
      name: "ResetPassword",
      component: ResetPassword,
      props: true, // passes route params as props
    },
  ,
  {
    path: "/dashboard", name: "dashboard",
    component: dashboard,
    meta:
      { requiresGuest: true },
      children: [
      {
        path: "permissions",
        name: "Permission-view",
        component: () => import('../views/closed/Permissions/PermissionView.vue'),
      },
      {
        path: "permissions/add",
        name: "Permission-add",
        component: () => import('../views/closed/Permissions/AddPermission.vue'),
      },
      {
        path: "permissions/edit/:id",
        name: "Permission-edit",
        component: () => import('../views/closed/Permissions/EditPermission.vue'),
        props: true,
      },
      {
        path: "permissions/detail/:id",
        name: "Permission-detail",
        component: () => import('../views/closed/Permissions/PermissionDetail.vue'),
        props: true,
      },

      {
        path: "groups",
        name: "Group-view",
        component: () => import('../views/closed/Groups/GroupView.vue'),
      },
      {
        path: "groups/add",
        name: "Group-add",
        component: () => import('../views/closed/Groups/AddGroup.vue'),
      },
      {
        path: "groups/edit/:id",
        name: "Group-edit",
        component: () => import('../views/closed/Groups/EditGroup.vue'),
        props: true,
      },
      {
        path: "groups/detail/:id",
        name: "Group-detail",
        component: () => import('../views/closed/Groups/GroupDetail.vue'),
        props: true,
      },

      {
        path: "triats",
        name: "Triat-view",
        component: () => import('../views/closed/Triats/TriatView.vue'),
      },
      {
        path: "triats/add",
        name: "Triat-add",
        component: () => import('../views/closed/Triats/AddTriat.vue'),
      },
      {
        path: "triats/edit/:id",
        name: "Triat-edit",
        component: () => import('../views/closed/Triats/EditTriat.vue'),
        props: true,
      },
      {
        path: "triats/detail/:id",
        name: "Triat-detail",
        component: () => import('../views/closed/Triats/TriatDetail.vue'),
        props: true,
      },

      {
        path: "options",
        name: "Option-view",
        component: () => import('../views/closed/Options/OptionView.vue'),
      },
      {
        path: "options/add",
        name: "Option-add",
        component: () => import('../views/closed/Options/AddOption.vue'),
      },
      {
        path: "options/edit/:id",
        name: "Option-edit",
        component: () => import('../views/closed/Options/EditOption.vue'),
        props: true,
      },
      {
        path: "options/detail/:id",
        name: "Option-detail",
        component: () => import('../views/closed/Options/OptionDetail.vue'),
        props: true,
      },

      {
        path: "categories",
        name: "Category-view",
        component: () => import('../views/closed/Categories/CategoryView.vue'),
      },
      {
        path: "categories/add",
        name: "Category-add",
        component: () => import('../views/closed/Categories/AddCategory.vue'),
      },
      {
        path: "categories/edit/:id",
        name: "Category-edit",
        component: () => import('../views/closed/Categories/EditCategory.vue'),
        props: true,
      },
      {
        path: "categories/detail/:id",
        name: "Category-detail",
        component: () => import('../views/closed/Categories/CategoryDetail.vue'),
        props: true,
      },

      {
        path: "score",
        name: "Progress-view",
        component: () => import('../closed/Progresses/score/ProgressView.vue'),
      },
      {
        path: "score/add",
        name: "Progress-add",
        component: () => import('../closed/Progresses/score/AddProgress.vue'),
      },
      {
        path: "score/edit/:id",
        name: "Progress-edit",
        component: () => import('../closed/Progresses/score/EditProgress.vue'),
        props: true,
      },
      {
        path: "score/detail/:id",
        name: "Progress-detail",
        component: () => import('../closed/Progresses/score/ProgressDetail.vue'),
        props: true,
      },

      {
        path: "result-view",
        name: "Result-view",
        component: () => import('../closed/Results/score/ResultView.vue'),
      },
      {
        path: "result-add",
        name: "Result-add",
        component: () => import('../closed/Results/score/AddResult.vue'),
      },
      {
        path: "score/edit/:id",
        name: "Result-edit",
        component: () => import('../closed/Results/score/EditResult.vue'),
        props: true,
      },
      {
        path: "score/detail/:id",
        name: "Result-detail",
        component: () => import('../closed/Results/score/ResultDetail.vue'),
        props: true,
      },

      {
        path: "answer_view",
        name: "Answer-view",
        component: () => import('../closed/Answers/answer_text/AnswerView.vue'),
      },
      {
        path: "answer_text/add",
        name: "Answer-add",
        component: () => import('../closed/Answers/answer_text/AddAnswer.vue'),
      },
      {
        path: "answer_text/edit/:id",
        name: "Answer-edit",
        component: () => import('../closed/Answers/answer_text/EditAnswer.vue'),
        props: true,
      },
      {
        path: "answer_text/detail/:id",
        name: "Answer-detail",
        component: () => import('../closed/Answers/answer_text/AnswerDetail.vue'),
        props: true,
      },

      {
        path: "question-view",
        name: "Question-view",
        component: () => import('../closed/Questions/question_text/QuestionView.vue'),
      },
      {
        path: "question_text/add",
        name: "Question-add",
        component: () => import('../closed/Questions/question_text/AddQuestion.vue'),
      },
      {
        path: "question_text/edit/:id",
        name: "Question-edit",
        component: () => import('../closed/Questions/question_text/EditQuestion.vue'),
        props: true,
      },
      {
        path: "question_text/detail/:id",
        name: "Question-detail",
        component: () => import('../closed/Questions/question_text/QuestionDetail.vue'),
        props: true,
      },

      {
        path: "title-view",
        name: "Test-view",
        component: () => import('../closed/Tests/title/TestView.vue'),
      },
      {
        path: "title/add",
        name: "Test-add",
        component: () => import('../closed/Tests/title/AddTest.vue'),
      },
      {
        path: "title/edit/:id",
        name: "Test-edit",
        component: () => import('../closed/Tests/title/EditTest.vue'),
        props: true,
      },
      {
        path: "title/detail/:id",
        name: "Test-detail",
        component: () => import('../closed/Tests/title/TestDetail.vue'),
        props: true,
      },
      {
        path: "title/take/:id",
        name: "Test-take",
        component: () => import('../closed/Tests/title/TakeTest.vue'),
        props: true,
      },

      {
        path: "name",
        name: "Organization-view",
        component: () => import('../closed/Organizations/name/OrganizationView.vue'),
      },
      {
        path: "name/add",
        name: "Organization-add",
        component: () => import('../closed/Organizations/name/AddOrganization.vue'),
      },
      {
        path: "name/edit/:id",
        name: "Organization-edit",
        component: () => import('../closed/Organizations/name/EditOrganization.vue'),
        props: true,
      },
      {
        path: "name/detail/:id",
        name: "Organization-detail",
        component: () => import('../closed/Organizations/name/OrganizationDetail.vue'),
        props: true,
      },

    

     
   

      {
        path: "users",
        name: "Users-view",
        component: () => import('../views/closed/users/UsersView.vue'),
      },
      {
        path: "users/add",
        name: "Users-add",
        component: () => import('../views/closed/users/AddUsers.vue'),
      },
      {
        path: "users/edit/:id",
        name: "Users-edit",
        component: () => import('../views/closed/users/EditUsers.vue'),
        props: true,
      },
      {
        path: "users/detail/:id",
        name: "Users-detail",
        component: () => import('../views/closed/users/UsersDetail.vue'),
        props: true,
      },

      {
        path: "first-dash", name: "first-dash",
        component: first_dash,
      },

      {
        path: "profile", name: "Profile",
        component: () => import('../views/closed/Profile.vue'),
      },

      {
        path: "role-view", name: "Role-view",
        component: RoleView,
      },

      {
        path: "permission-view", name: "Permission-view",
        component: PermissionView,
      },

      // ── Billing ──────────────────────────────────────────────────────────
      {
        path: "plans",
        name: "Plan-view",
        component: () => import('../views/closed/Plans/PlanView.vue'),
      },
      {
        path: "subscriptions",
        name: "Subscription-view",
        component: () => import('../views/closed/Subscriptions/SubscriptionView.vue'),
      },
      {
        path: "invoices",
        name: "Invoice-view",
        component: () => import('../views/closed/Invoices/InvoiceView.vue'),
      },
       

         
    ]
  },
  { path: "/forgot-password", name: "forgotPassword", component: ForgotPassword },
  { path: "/reset/:token", name: "reset", component: Reset, meta: { requiresGuest: true } },
  { path: "/test-login/:token", name: "test-login", component: () => import('../views/opened/auth/TestLogin.vue'), meta: { requiresGuest: true } },
  { path: "/:pathMatch(.*)*", name: "accessDenied", component: AccessDenied, meta: { requiresGuest: true } },
];

const router = createRouter({
  // mode: 'hash',
  history: createWebHistory(),
  routes, // ✅ no spread needed
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const requiredRole = to.meta.role;

  if (requiresAuth) {
    if (!isAuthenticated) {
      next("/login");
    } else if (requiredRole && userRole !== requiredRole) {
      localStorage.clear();
      next("/login");
    } else {
      next();
    }
  } else if (requiresGuest) {
    next();
  } else {
    next();
  }
});

export default router;
