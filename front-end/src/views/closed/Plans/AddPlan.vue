<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 text-sm overflow-y-auto max-h-screen">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold text-gray-800">Add Plan</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Slug</label>
            <input v-model="form.slug" type="text" required placeholder="e.g. starter"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Name</label>
            <input v-model="form.name" type="text" required placeholder="e.g. Starter"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Description</label>
          <textarea v-model="form.description" rows="2"
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Price (cents)</label>
            <input v-model.number="form.price_cents" type="number" min="0" required
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Currency</label>
            <input v-model="form.currency" type="text" maxlength="3" placeholder="USD"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Billing Cycle</label>
            <select v-model="form.billing_cycle"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One Time</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Max Users (-1 = ∞)</label>
            <input v-model.number="form.max_users" type="number"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Max Tests</label>
            <input v-model.number="form.max_tests" type="number"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Max Groups</label>
            <input v-model.number="form.max_groups" type="number"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Max Assignments</label>
            <input v-model.number="form.max_test_assignments" type="number"
              class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <!-- Feature flags -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">Features</label>
          <div class="grid grid-cols-2 gap-2">
            <label v-for="feat in features" :key="feat.key" class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" v-model="form[feat.key]" class="w-4 h-4 accent-green-500" />
              {{ feat.label }}
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" :disabled="loading" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
            <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
            {{ loading ? 'Saving...' : 'Add' }}
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
      features: [
        { key: 'has_analytics',        label: 'Analytics' },
        { key: 'has_api_access',       label: 'API Access' },
        { key: 'has_custom_branding',  label: 'Custom Branding' },
        { key: 'has_export',           label: 'Export' },
        { key: 'has_priority_support', label: 'Priority Support' },
      ],
      form: {
        slug: '', name: '', description: '',
        billing_cycle: 'monthly', price_cents: 0, currency: 'USD',
        max_users: 5, max_tests: 3, max_groups: 1, max_test_assignments: 10,
        has_analytics: false, has_api_access: false, has_custom_branding: false,
        has_export: false, has_priority_support: false, is_active: true, sort_order: 0,
      },
    };
  },
  methods: {
    async submitForm() {
      this.loading = true;
      try {
        await this.$apiPost('/plans', this.form);
        this.$root.$refs.toast.showToast('Plan created successfully', 'success');
        this.$emit('saved'); this.$emit('close');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast.showToast('Failed to create plan', 'error');
      } finally { this.loading = false; }
    },
  },
};
</script>
