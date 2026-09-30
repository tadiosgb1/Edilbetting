<template>
  <div>
    <aside class="w-64 flex flex-col fixed md:relative z-15 h-full bg-white border-r border-gray-200 shadow-sm">
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

        <!-- Bets — admin only -->
        <div v-if="isAdmin" class="px-3 mb-2">
          <router-link
            :to="{ name: 'bets' }"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.name === 'bets' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            <i class="fas fa-ticket-alt w-4 text-center"
              :class="$route.name === 'bets' ? 'text-green-600' : 'text-gray-400'"></i>
            Bets
          </router-link>
        </div>

        <!-- Payment Proofs — admin only -->
        <div v-if="isAdmin" class="px-3 mb-2">
          <router-link
            :to="{ name: 'payment-proofs' }"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.name === 'payment-proofs' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            <i class="fas fa-file-invoice-dollar w-4 text-center"
              :class="$route.name === 'payment-proofs' ? 'text-green-600' : 'text-gray-400'"></i>
            Payment Proofs
          </router-link>
        </div>

        <!-- Sports — admin only -->
        <div v-if="isAdmin" class="px-3 mb-2">
          <router-link
            :to="{ name: 'sports' }"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.name === 'sports' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            <i class="fas fa-trophy w-4 text-center"
              :class="$route.name === 'sports' ? 'text-green-600' : 'text-gray-400'"></i>
            Sports
          </router-link>
        </div>

        <!-- Users — admin only -->
        <div v-if="isAdmin" class="px-3 mb-2">
          <router-link
            :to="{ name: 'users' }"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.name === 'users' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            <i class="fas fa-users w-4 text-center"
              :class="$route.name === 'users' ? 'text-green-600' : 'text-gray-400'"></i>
            Users
          </router-link>
        </div>
      </nav>
    </aside>
  </div>
</template>
<script>
export default {
  name: 'LeftSidebar',
  computed: {
    isAdmin() {
      return true
      //return localStorage.getItem('role') === 'admin';
    },
  },
};
</script>
<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
</style>
