<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <Loading :visible="loading" message="Loading Invoices..." />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <div>
        <h1 class="text-lg font-bold text-gray-800">Invoices</h1>
        <p class="text-xs text-gray-500 mt-0.5">Billing history across all organizations</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div class="flex gap-2">
        <select v-model="filterStatus" @change="fetchItems(1)"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
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
              <th class="px-6 py-3 text-left">Invoice #</th>
              <th class="px-6 py-3 text-left">Organization</th>
              <th class="px-6 py-3 text-left">Plan</th>
              <th class="px-6 py-3 text-right">Amount</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-left">Period</th>
              <th class="px-6 py-3 text-left">Due</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in items" :key="item.id" class="hover:bg-green-50 transition duration-150">
              <td class="px-6 py-4 font-mono text-xs text-gray-600">{{ item.invoice_number }}</td>
              <td class="px-6 py-4 font-medium">{{ item.organization?.name || '—' }}</td>
              <td class="px-6 py-4 text-gray-500">{{ item.subscription?.plan?.name || '—' }}</td>
              <td class="px-6 py-4 text-right font-semibold text-gray-800">
                {{ item.currency }} {{ (item.amount_cents / 100).toFixed(2) }}
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="statusBadge(item.status)">{{ item.status }}</span>
              </td>
              <td class="px-6 py-4 text-xs text-gray-500">
                {{ formatDate(item.period_start) }} – {{ formatDate(item.period_end) }}
              </td>
              <td class="px-6 py-4 text-gray-500">{{ item.due_date ? formatDate(item.due_date) : '—' }}</td>
              <td class="px-6 py-4 text-center space-x-2">
                <button
                  v-if="item.status === 'issued' || item.status === 'overdue'"
                  @click="markPaid(item.id)"
                  title="Mark as Paid"
                  class="text-green-500 hover:text-green-700"
                >
                  <i class="fas fa-check-circle"></i>
                </button>
                <button
                  v-if="item.status !== 'paid' && item.status !== 'cancelled'"
                  @click="cancelInvoice(item.id)"
                  title="Cancel"
                  class="text-red-500 hover:text-red-700"
                >
                  <i class="fas fa-times-circle"></i>
                </button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="8" class="text-center py-6 text-gray-400 italic">No invoices found.</td>
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
            <p class="font-mono text-xs text-gray-500">{{ item.invoice_number }}</p>
            <p class="font-bold text-gray-800">{{ item.organization?.name || '—' }}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-800">{{ item.currency }} {{ (item.amount_cents / 100).toFixed(2) }}</p>
            <span :class="statusBadge(item.status)">{{ item.status }}</span>
          </div>
        </div>
        <div class="flex gap-3 mt-2">
          <button v-if="item.status === 'issued' || item.status === 'overdue'" @click="markPaid(item.id)"
            class="text-xs text-green-600 underline">Mark Paid</button>
          <button v-if="item.status !== 'paid' && item.status !== 'cancelled'" @click="cancelInvoice(item.id)"
            class="text-xs text-red-500 underline">Cancel</button>
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
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";

export default {
  components: { Loading },
  data() {
    return {
      items: [], count: 0, currentPage: 1, pageSize: 10,
      filterStatus: '',
      loading: false,
    };
  },
  methods: {
    async fetchItems(page = 1) {
      this.loading = true;
      this.currentPage = page;
      try {
        const params = { page: this.currentPage, page_size: this.pageSize };
        if (this.filterStatus) params.status = this.filterStatus;
        const res = await this.$apiGet('/invoices', params);
        this.items = res.data || [];
        this.count = res.count || 0;
      } catch (e) { console.error(e); }
      finally { this.loading = false; }
    },
    async markPaid(id) {
      try {
        await this.$apiPatch(`/invoices/${id}/pay`, null, {});
        this.$root.$refs.toast.showToast('Invoice marked as paid', 'success');
        this.fetchItems(this.currentPage);
      } catch (e) { console.error(e); }
    },
    async cancelInvoice(id) {
      try {
        await this.$apiPatch(`/invoices/${id}/cancel`, null, {});
        this.$root.$refs.toast.showToast('Invoice cancelled', 'success');
        this.fetchItems(this.currentPage);
      } catch (e) { console.error(e); }
    },
    statusBadge(s) {
      const map = {
        draft:     'px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500',
        issued:    'px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700',
        paid:      'px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700',
        overdue:   'px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600',
        cancelled: 'px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400',
        refunded:  'px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700',
      };
      return map[s] || map.issued;
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },
  },
  mounted() { this.fetchItems(); },
};
</script>
