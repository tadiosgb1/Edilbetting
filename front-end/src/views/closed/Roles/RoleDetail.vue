<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">
    <!-- Loading -->
    <Loading :visible="loading" message="Loading Role..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Role Detail</h1>
      <button @click="$router.back()" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        <i class="fas fa-arrow-left text-xs"></i> Back
      </button>
    </div>

    <!-- Detail Card -->
    <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">ID</p>
          <p class="text-gray-800 font-medium">{{ item.id || '—' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</p>
          <p class="text-gray-800 font-medium">{{ item.name || '—' }}</p>
        </div>
        <div class="sm:col-span-2">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
          <p class="text-gray-800">{{ item.description || '—' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";

export default {
  components: { Loading },
  data() {
    return {
      item: {},
      loading: false,
    };
  },
  async mounted() {
    this.loading = true;
    const id = this.$route.params.id;
    try {
      const response = await this.$apiGetById('/role', id);
      this.item = response || {};
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  },
};
</script>
