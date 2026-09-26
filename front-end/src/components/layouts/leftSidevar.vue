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
      </nav>
    </aside>
  </div>
</template>
<script>
export default {
  name: 'LeftSidebar',
};
</script>
<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
</style>
