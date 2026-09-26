<template>
  <div>
    <SuperDashboard v-if="role === 'admin' || role === 'super_admin'" />
    <AdminDashboard v-else-if="role === 'organization'" />
    <UserDashboard  v-else />
  </div>
</template>

<script>
import SuperDashboard from "./dashboards/superdashboard.vue";
import AdminDashboard from "./dashboards/admindashboard.vue";
import UserDashboard  from "./dashboards/userdashboard.vue";

export default {
  name: "FirstDash",
  components: { SuperDashboard, AdminDashboard, UserDashboard },

  computed: {
    role() {
      try {
        const roles = JSON.parse(localStorage.getItem("roles") || "[]");
        const names = roles.map(r => (r.name || r).toLowerCase());
        if (names.includes("admin"))        return "admin";
        if (names.includes("super_admin"))        return "super_admin";
        if (names.includes("organization")) return "organization";
        if (names.includes("tester"))       return "tester";
      } catch (_) {}

      // fallback to single role string
      const role = (localStorage.getItem("role") || "").toLowerCase();
      if (role === "admin")        return "admin";
      if (role === "organization") return "organization";
      return "tester";
    },
  },
};
</script>
