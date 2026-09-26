<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Change Status</h2>
          <p class="text-xs text-gray-500 mt-0.5">{{ subscription.organization?.name }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <div class="space-y-3 mb-6">
        <label v-for="s in statuses" :key="s.value"
          class="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition"
          :class="selectedStatus === s.value ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'"
        >
          <input type="radio" :value="s.value" v-model="selectedStatus" class="w-4 h-4 accent-green-500" />
          <div>
            <p class="font-medium text-gray-700">{{ s.label }}</p>
            <p class="text-xs text-gray-400">{{ s.desc }}</p>
          </div>
        </label>
      </div>

      <div class="flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
        <button @click="save" :disabled="loading || !selectedStatus"
          class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
          <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
          {{ loading ? 'Saving...' : 'Update' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: { subscription: { type: Object, required: true } },
  data() {
    return {
      loading: false,
      selectedStatus: this.subscription.status,
      statuses: [
        { value: 'active',    label: 'Active',    desc: 'Subscription is active and in good standing' },
        { value: 'trialing',  label: 'Trialing',  desc: 'Organization is on a free trial' },
        { value: 'past_due',  label: 'Past Due',  desc: 'Payment is overdue' },
        { value: 'cancelled', label: 'Cancelled', desc: 'Subscription has been cancelled' },
        { value: 'expired',   label: 'Expired',   desc: 'Subscription period has ended' },
      ],
    };
  },
  methods: {
    async save() {
      this.loading = true;
      try {
        await this.$apiPatch(`/subscriptions/${this.subscription.id}/status`, null, { status: this.selectedStatus });
        this.$root.$refs.toast.showToast('Status updated', 'success');
        this.$emit('saved'); this.$emit('close');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast.showToast('Failed to update status', 'error');
      } finally { this.loading = false; }
    },
  },
};
</script>
