<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <Loading :visible="loading" message="Loading Subscriptions..." />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <div>
        <h1 class="text-lg font-bold text-gray-800">Subscriptions</h1>
        <p class="text-xs text-gray-500 mt-0.5">Organization plan assignments and billing status</p>
      </div>
      <button @click="openAddModal"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center space-x-1 text-sm">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Assign Plan</span>
      </button>
    </div>

    <!-- Search + Page Size -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div class="flex gap-2">
        <select v-model="filterStatus" @change="fetchItems(1)"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <label>Show</label>
        <select v-model="pageSize" @change="fetchItems(1)"
          class="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-green-500 focus:border-green-500">
          <option v-for="size in [5, 10, 20, 50]" :key="size" :value="size">{{ size }}</option>
        </select>
        <span>entries</span>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200">
          <thead class="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-3 text-left">#</th>
              <th class="px-6 py-3 text-left">Organization</th>
              <th class="px-6 py-3 text-left">Plan</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-left">Started</th>
              <th class="px-6 py-3 text-left">Expires</th>
              <th class="px-6 py-3 text-center">Usage</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in items" :key="item.id" class="hover:bg-green-50 transition duration-150">
              <td class="px-6 py-4 text-gray-400">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="px-6 py-4">
                <p class="font-medium text-gray-800">{{ item.organization?.name || '—' }}</p>
                <p class="text-xs text-gray-400">{{ item.organization?.official_email || '' }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-gray-700">{{ item.plan?.name || '—' }}</p>
                <p class="text-xs text-gray-400">
                  {{ item.plan?.price_cents === 0 ? 'Free' : item.plan?.currency + ' ' + (item.plan?.price_cents / 100).toFixed(2) }}
                  / {{ item.plan?.billing_cycle }}
                </p>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="statusBadge(item.status)">{{ item.status }}</span>
              </td>
              <td class="px-6 py-4 text-gray-500">{{ formatDate(item.started_at) }}</td>
              <td class="px-6 py-4 text-gray-500">{{ item.expires_at ? formatDate(item.expires_at) : '—' }}</td>
              <td class="px-6 py-4 text-center">
                <div class="text-xs text-gray-500 space-y-0.5">
                  <div>Users: {{ item.used_users }} / {{ item.plan?.max_users === -1 ? '∞' : item.plan?.max_users }}</div>
                  <div>Tests: {{ item.used_tests }} / {{ item.plan?.max_tests === -1 ? '∞' : item.plan?.max_tests }}</div>
                </div>
              </td>
              <td class="px-6 py-4 text-center space-x-2">
                <button @click="openStatusModal(item)" title="Change Status" class="text-amber-500 hover:text-amber-700">
                  <i class="fas fa-exchange-alt"></i>
                </button>
                <button @click="openDeleteModal(item.id)" title="Cancel" class="text-red-500 hover:text-red-700">
                  <i class="fas fa-times-circle"></i>
                </button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="8" class="text-center py-6 text-gray-400 italic">No subscriptions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="item in items" :key="item.id" class="bg-white border border-gray-200 rounded-xl shadow p-4">
        <div class="flex justify-between mb-2">
          <div>
            <p class="font-bold text-gray-800">{{ item.organization?.name || '—' }}</p>
            <p class="text-xs text-gray-500">{{ item.plan?.name }}</p>
          </div>
          <span :class="statusBadge(item.status)">{{ item.status }}</span>
        </div>
        <div class="text-xs text-gray-500 space-y-0.5">
          <p>Started: {{ formatDate(item.started_at) }}</p>
          <p>Expires: {{ item.expires_at ? formatDate(item.expires_at) : '—' }}</p>
        </div>
      </div>
      <p v-if="items.length === 0" class="text-center text-gray-400 py-6 italic">No data found.</p>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-6 text-sm text-gray-600">
      <span>Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, count) }} of {{ count }}</span>
      <div class="flex items-center gap-2">
        <button @click="fetchItems(currentPage - 1)" :disabled="currentPage <= 1"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">← Previous</button>
        <span class="px-3 py-1 bg-green-600 text-white rounded-lg font-medium">{{ currentPage }}</span>
        <button @click="fetchItems(currentPage + 1)" :disabled="currentPage * pageSize >= count"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Next →</button>
      </div>
    </div>

    <!-- Assign Plan Modal -->
    <add-subscription v-if="showModal" @close="showModal = false" @saved="fetchItems" />

    <!-- Change Status Modal -->
    <change-status-modal
      v-if="showStatusModal && selectedItem"
      :subscription="selectedItem"
      @close="showStatusModal = false"
      @saved="fetchItems"
    />

    <!-- Delete Confirmation -->
    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Cancel Subscription"
      message="This will cancel the subscription. The organization will lose access at the end of the billing period."
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script>
import AddSubscription from "./AddSubscription.vue";
import ChangeStatusModal from "./ChangeStatusModal.vue";
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

export default {
  components: { AddSubscription, ChangeStatusModal, Loading, DeleteConfirmModal },
  data() {
    return {
      items: [], count: 0, currentPage: 1, pageSize: 10,
      filterStatus: '',
      loading: false,
      showModal: false,
      showStatusModal: false,
      selectedItem: null,
      deleteModalVisible: false,
      deleteId: null,
    };
  },
  methods: {
    async fetchItems(page = 1) {
      this.loading = true;
      this.currentPage = page;
      try {
        const params = { page: this.currentPage, page_size: this.pageSize };
        if (this.filterStatus) params.status = this.filterStatus;
        const res = await this.$apiGet('/subscriptions', params);
        this.items = res.data || [];
        this.count = res.count || 0;
      } catch (e) { console.error(e); }
      finally { this.loading = false; }
    },
    openAddModal() { this.showModal = true; },
    openStatusModal(item) { this.selectedItem = item; this.showStatusModal = true; },
    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },
    async confirmDelete() {
      await this.$apiPatch(`/subscriptions/${this.deleteId}/status`, null, { status: 'cancelled' });
      this.$root.$refs.toast.showToast('Subscription cancelled', 'success');
      this.deleteModalVisible = false;
      this.fetchItems(this.currentPage);
    },
    statusBadge(s) {
      const map = {
        active:    'px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700',
        trialing:  'px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700',
        past_due:  'px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700',
        cancelled: 'px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500',
        expired:   'px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600',
      };
      return map[s] || map.active;
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },
  },
  mounted() { this.fetchItems(); },
};
</script>
