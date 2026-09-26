<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-sm">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold text-gray-800">Assign Plan to Organization</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Organization</label>
          <select v-model="form.organization_id" required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500">
            <option disabled value="">Select Organization</option>
            <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
          </select>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Plan</label>
          <select v-model="form.plan_id" required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500">
            <option disabled value="">Select Plan</option>
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ plan.name }} — {{ plan.price_cents === 0 ? 'Free' : plan.currency + ' ' + (plan.price_cents / 100).toFixed(2) + '/' + plan.billing_cycle }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
            <input v-model="form.started_at" type="date"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Expiry Date <span class="text-gray-400 font-normal">(optional)</span></label>
            <input v-model="form.expires_at" type="date"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea v-model="form.notes" rows="2"
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" :disabled="loading" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
            <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
            {{ loading ? 'Saving...' : 'Assign' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      organizations: [],
      plans: [],
      form: {
        organization_id: '', plan_id: '',
        started_at: new Date().toISOString().split('T')[0],
        expires_at: '', notes: '',
        activated_by: parseInt(localStorage.getItem('userId')),
      },
    };
  },
  methods: {
    async fetchData() {
      const [orgs, plans] = await Promise.all([
        this.$apiGet('/organization', { page_size: 100 }),
        this.$apiGet('/plans'),
      ]);
      this.organizations = orgs.data || [];
      this.plans = plans.data || [];
    },
    async submitForm() {
      this.loading = true;
      try {
        await this.$apiPost('/subscriptions', this.form);
        this.$root.$refs.toast.showToast('Plan assigned successfully', 'success');
        this.$emit('saved'); this.$emit('close');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast.showToast('Failed to assign plan', 'error');
      } finally { this.loading = false; }
    },
  },
  mounted() { this.fetchData(); },
};
</script>
