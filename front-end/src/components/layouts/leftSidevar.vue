<template>
  <div>
    <transition name="slide">
      <aside class="w-64 flex flex-col fixed md:relative z-15 h-full bg-white border-r border-gray-200 shadow-sm">

        <!-- Logo -->
        <!-- <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <div class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img src="../../assets/img/logo1.jpg" alt="Logo" class="w-full h-full object-cover" />
          </div>
          <span class="text-sm font-bold text-gray-800 tracking-tight">Alpha GYZ</span>
        </div> -->

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto py-4 custom-scrollbar">

          <!-- Dashboard — always visible -->
          <div class="px-3 mb-2">
            <router-link
              :to="{ name: 'first-dash' }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="$route.name === 'first-dash' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <i class="fas fa-chart-line w-4 text-center"
                :class="$route.name === 'first-dash' ? 'text-green-600' : 'text-gray-400'"></i>
              Dashboard
            </router-link>
          </div>

          <!-- Assessment -->
          <div v-if="hasVisibleItems(assessmentItems)" class="px-3 mb-2">
            <button
              @click="toggleGroup('assessment')"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              :class="{ 'bg-gray-50 text-gray-900': isGroupActive('assessment') }"
            >
              <div class="flex items-center gap-3">
                <i class="fas fa-clipboard-list w-4 text-center text-gray-400"></i>
                Assessment
              </div>
              <i class="fas fa-chevron-right text-xs text-gray-300 transition-transform duration-200"
                :class="{ 'rotate-90': openGroups.assessment }"></i>
            </button>
            <div v-show="openGroups.assessment" class="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-0.5">
              <template v-for="item in assessmentItems" :key="item.route">
                <router-link
                  v-if="!item.permission || $hasPermission(item.permission)"
                  :to="{ name: item.route }"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="$route.name === item.route
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'"
                >
                  <i :class="[item.icon, 'w-4 text-center text-xs',
                    $route.name === item.route ? 'text-green-600' : 'text-gray-400']"></i>
                  {{ item.name }}
                </router-link>
              </template>
            </div>
          </div>

          <!-- Results & Progress -->
          <div v-if="hasVisibleItems(resultsItems)" class="px-3 mb-2">
            <button
              @click="toggleGroup('results')"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              :class="{ 'bg-gray-50 text-gray-900': isGroupActive('results') }"
            >
              <div class="flex items-center gap-3">
                <i class="fas fa-chart-bar w-4 text-center text-gray-400"></i>
                Results 
              </div>
              <i class="fas fa-chevron-right text-xs text-gray-300 transition-transform duration-200"
                :class="{ 'rotate-90': openGroups.results }"></i>
            </button>
            <div v-show="openGroups.results" class="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-0.5">
              <template v-for="item in resultsItems" :key="item.route">
                <router-link
                  v-if="!item.permission || $hasPermission(item.permission)"
                  :to="{ name: item.route }"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="$route.name === item.route
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'"
                >
                  <i :class="[item.icon, 'w-4 text-center text-xs',
                    $route.name === item.route ? 'text-green-600' : 'text-gray-400']"></i>
                  {{ item.name }}
                </router-link>
              </template>
            </div>
          </div>

          <!-- Organization -->
          <div v-if="hasVisibleItems(organizationItems)" class="px-3 mb-2">
            <button
              @click="toggleGroup('organization')"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              :class="{ 'bg-gray-50 text-gray-900': isGroupActive('organization') }"
            >
              <div class="flex items-center gap-3">
                <i class="fas fa-building w-4 text-center text-gray-400"></i>
                Organization
              </div>
              <i class="fas fa-chevron-right text-xs text-gray-300 transition-transform duration-200"
                :class="{ 'rotate-90': openGroups.organization }"></i>
            </button>
            <div v-show="openGroups.organization" class="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-0.5">
              <template v-for="item in organizationItems" :key="item.route">
                <router-link
                  v-if="(!item.permission || $hasPermission(item.permission)) && (!item.roles || item.roles.length === 0 || item.roles.some(role => $hasRole(role)))"
                  :to="{ name: item.route }"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="$route.name === item.route
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'"
                >
                  <i :class="[item.icon, 'w-4 text-center text-xs',
                    $route.name === item.route ? 'text-green-600' : 'text-gray-400']"></i>
                  {{ item.name }}
                </router-link>
              </template>
            </div>
          </div>

          <!-- Access Control -->
          <div v-if="hasVisibleItems(accessItems)" class="px-3 mb-2">
            <button
              @click="toggleGroup('access')"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              :class="{ 'bg-gray-50 text-gray-900': isGroupActive('access') }"
            >
              <div class="flex items-center gap-3">
                <i class="fas fa-shield-alt w-4 text-center text-gray-400"></i>
                Access Control
              </div>
              <i class="fas fa-chevron-right text-xs text-gray-300 transition-transform duration-200"
                :class="{ 'rotate-90': openGroups.access }"></i>
            </button>
            <div v-show="openGroups.access" class="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-0.5">
              <template v-for="item in accessItems" :key="item.route">
                <router-link
                  v-if="(!item.permission || $hasPermission(item.permission)) && (!item.roles || item.roles.length === 0 || item.roles.some(role => $hasRole(role)))"
                  :to="{ name: item.route }"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="$route.name === item.route
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'"
                >
                  <i :class="[item.icon, 'w-4 text-center text-xs',
                    $route.name === item.route ? 'text-green-600' : 'text-gray-400']"></i>
                  {{ item.name }}
                </router-link>
              </template>
            </div>
          </div>

          <!-- Finance -->
          <div v-if="hasVisibleItems(financeItems)" class="px-3 mb-2">
            <button
              @click="toggleGroup('finance')"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              :class="{ 'bg-gray-50 text-gray-900': isGroupActive('finance') }"
            >
              <div class="flex items-center gap-3">
                <i class="fas fa-credit-card w-4 text-center text-gray-400"></i>
                Finance
              </div>
              <i class="fas fa-chevron-right text-xs text-gray-300 transition-transform duration-200"
                :class="{ 'rotate-90': openGroups.finance }"></i>
            </button>
            <div v-show="openGroups.finance" class="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-0.5">
              <template v-for="item in financeItems" :key="item.route">
                <router-link
                  v-if="(!item.permission || $hasPermission(item.permission)) && (!item.roles || item.roles.length === 0 || item.roles.some(role => $hasRole(role)))"
                  :to="{ name: item.route }"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="$route.name === item.route
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'"
                >
                  <i :class="[item.icon, 'w-4 text-center text-xs',
                    $route.name === item.route ? 'text-green-600' : 'text-gray-400']"></i>
                  {{ item.name }}
                </router-link>
              </template>
            </div>
          </div>

        </nav>
      </aside>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      openGroups: {
        assessment:   false,
        results:      false,
        organization: false,
        access:       false,
        finance:      false,
      },

      // Each item has a `permission` code that maps to the seeded permissions
      assessmentItems: [
        { name: 'Tests',      route: 'Test-view',     icon: 'fas fa-file-alt',       permission: '' },
        { name: 'Questions',  route: 'Question-view', icon: 'fas fa-question-circle', permission: 'question.view' },
        { name: 'Categories', route: 'Category-view', icon: 'fas fa-folder',          permission: 'category.view' },
      ],

      resultsItems: [
        { name: 'Results',    route: 'Result-view',   icon: 'fas fa-trophy',          permission: '' },
        //{ name: 'Progresses', route: 'Progress-view', icon: 'fas fa-chart-bar',       permission: '' },
       // { name: 'Answers',    route: 'Answer-view',   icon: 'fas fa-reply',           permission: 'answer.view' },
      ],

      organizationItems: [
        { name: 'Organizations', route: 'Organization-view', icon: 'fas fa-building', permission: 'organization.view', roles: [] },
       // { name: 'Groups',        route: 'Group-view',        icon: 'fas fa-users',    permission: '', roles: ['super_admin', 'admin', 'organization'] },
      ],

      accessItems: [
        { name: 'Users',       route: 'Users-view',      icon: 'fas fa-user',          permission: '', roles: ['super_admin', 'admin', 'org'] },
        { name: 'Roles',       route: 'Role-view',       icon: 'fas fa-id-badge',      permission: '', roles: ['super_admin'] },
        { name: 'Permissions', route: 'Permission-view', icon: 'fas fa-key',           permission: '', roles: ['super_admin'] },
      ],

      financeItems: [
        { name: 'Plans',         route: 'Plan-view',         icon: 'fas fa-tags',         permission: '', roles: ['super_admin', 'admin'] },
        { name: 'Subscriptions', route: 'Subscription-view', icon: 'fas fa-credit-card',  permission: '', roles: ['super_admin', 'admin'] },
        { name: 'Payments',      route: 'Invoice-view',      icon: 'fas fa-file-invoice', permission: '', roles: [] },
      ],
    };
  },

  computed: {
    allGroupItems() {
      return {
        assessment:   this.assessmentItems.map(i => i.route),
        results:      this.resultsItems.map(i => i.route),
        organization: this.organizationItems.map(i => i.route),
        access:       this.accessItems.map(i => i.route),
        finance:      this.financeItems.map(i => i.route),
      };
    },
  },

  watch: {
    $route(to) {
      this.openActiveGroup(to.name);
    },
  },

  methods: {
    toggleGroup(group) {
      this.openGroups[group] = !this.openGroups[group];
    },

    isGroupActive(group) {
      return this.allGroupItems[group]?.includes(this.$route.name);
    },

    openActiveGroup(routeName) {
      for (const group in this.allGroupItems) {
        if (this.allGroupItems[group].includes(routeName)) {
          this.openGroups[group] = true;
        }
      }
    },

    // Returns true if at least one item in the group is visible (has permission and role)
    hasVisibleItems(items) {
      return items.some(item => {
        const hasPermissionCheck = !item.permission || this.$hasPermission(item.permission);
        const hasRoleCheck = !item.roles || item.roles.length === 0 || item.roles.some(role => this.$hasRole(role));
        return hasPermissionCheck && hasRoleCheck;
      });
    },
  },

  mounted() {
    this.openActiveGroup(this.$route.name);
  },
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
</style>
