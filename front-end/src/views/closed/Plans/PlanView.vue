<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <Loading :visible="loading" message="Loading Plans..." />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <div>
        <h1 class="text-lg font-bold text-gray-800">Pricing Plans</h1>
        <p class="text-xs text-gray-500 mt-0.5">Manage SaaS subscription tiers</p>
      </div>
      <button @click="openAddModal"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center space-x-1 text-sm">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Plan</span>
      </button>
    </div>

    <!-- Desktop Table -->
    <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200">
          <thead class="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-3 text-left">#</th>
              <th class="px-6 py-3 text-left">Plan</th>
              <th class="px-6 py-3 text-left">Billing</th>
              <th class="px-6 py-3 text-right">Price</th>
              <th class="px-6 py-3 text-center">Limits</th>
              <th class="px-6 py-3 text-center">Features</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="(item, index) in items" :key="item.id">
              <tr class="hover:bg-green-50 transition duration-150">
                <td class="px-6 py-4 text-gray-400">{{ index + 1 }}</td>
                <td class="px-6 py-4">
                  <p class="font-semibold text-gray-800">{{ item.name }}</p>
                  <p class="text-xs text-gray-400 font-mono">{{ item.slug }}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                    {{ item.billing_cycle }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-semibold">
                  <span v-if="item.price_cents === 0" class="text-green-600">Free</span>
                  <span v-else class="text-gray-800">
                    {{ item.currency }} {{ (item.price_cents / 100).toFixed(2) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button @click="toggleLimits(item.id)"
                    class="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition">
                    <i class="fas fa-sliders-h mr-1"></i>
                    {{ expandedPlan === item.id ? 'Hide' : 'View' }}
                  </button>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1 justify-center">
                    <span v-if="item.has_analytics"        class="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700">Analytics</span>
                    <span v-if="item.has_api_access"       class="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700">API</span>
                    <span v-if="item.has_custom_branding"  class="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700">Branding</span>
                    <span v-if="item.has_export"           class="px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700">Export</span>
                    <span v-if="item.has_priority_support" class="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-700">Priority</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span :class="item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    class="px-2 py-0.5 rounded text-[10px] font-medium">
                    {{ item.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center space-x-3">
                  <button @click="editItem(item)" title="Edit" class="text-blue-500 hover:text-blue-700">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="openDeleteModal(item.id)" title="Deactivate" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-ban"></i>
                  </button>
                </td>
              </tr>

              <!-- Limits expanded row — same template scope as the item above -->
              <tr v-if="expandedPlan === item.id" :key="'limits-' + item.id" class="bg-indigo-50/40">
                <td colspan="8" class="px-6 py-3">
                  <div class="flex flex-wrap gap-6 text-xs text-gray-600">
                    <span><b class="text-gray-700">Max Users:</b> {{ item.max_users === -1 ? '∞ Unlimited' : item.max_users }}</span>
                    <span><b class="text-gray-700">Max Tests:</b> {{ item.max_tests === -1 ? '∞ Unlimited' : item.max_tests }}</span>
                    <span><b class="text-gray-700">Max Groups:</b> {{ item.max_groups === -1 ? '∞ Unlimited' : item.max_groups }}</span>
                    <span><b class="text-gray-700">Max Assignments:</b> {{ item.max_test_assignments === -1 ? '∞ Unlimited' : item.max_test_assignments }}</span>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="items.length === 0">
              <td colspan="8" class="text-center py-6 text-gray-400 italic">No plans found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="(item, index) in items" :key="item.id" class="bg-white border border-gray-200 rounded-xl shadow p-4">
        <div class="flex justify-between mb-2">
          <div>
            <p class="font-bold text-gray-800">{{ item.name }}</p>
            <p class="text-xs text-gray-400 font-mono">{{ item.slug }}</p>
          </div>
          <div class="flex gap-2 text-sm">
            <button @click="editItem(item)" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
            <button @click="openDeleteModal(item.id)" class="text-red-500 hover:text-red-700"><i class="fas fa-ban"></i></button>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-gray-500">
          <span class="font-semibold text-gray-800">
            {{ item.price_cents === 0 ? 'Free' : item.currency + ' ' + (item.price_cents / 100).toFixed(2) }}
          </span>
          <span>·</span>
          <span>{{ item.billing_cycle }}</span>
          <span :class="item.is_active ? 'text-green-600' : 'text-gray-400'">
            {{ item.is_active ? '● Active' : '○ Inactive' }}
          </span>
        </div>
      </div>
      <p v-if="items.length === 0" class="text-center text-gray-400 py-6 italic">No plans found.</p>
    </div>

    <!-- Add/Edit Modals -->
    <add-plan v-if="showModal && !editMode" @close="showModal = false" @saved="fetchItems" />
    <edit-plan v-if="showModal && editMode" :data="selectedItem" @close="showModal = false" @saved="fetchItems" />

    <!-- Delete Confirmation -->
    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Deactivate Plan"
      message="This will deactivate the plan. Existing subscriptions are not affected."
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script>
import AddPlan from "./AddPlan.vue";
import EditPlan from "./EditPlan.vue";
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

export default {
  components: { AddPlan, EditPlan, Loading, DeleteConfirmModal },
  data() {
    return {
      items: [],
      selectedItem: null,
      loading: false,
      showModal: false,
      editMode: false,
      deleteModalVisible: false,
      deleteId: null,
      expandedPlan: null,
    };
  },
  methods: {
    async fetchItems() {
     // alert("hii")
      this.loading = true;
      const params={
        show_inactive: true
      }
      try {
        const res = await this.$apiGet('/plans', params);
        this.items = res.data || [];
      } catch (e) { console.error(e); }
      finally { this.loading = false; }
    },
    openAddModal()  { this.editMode = false; this.selectedItem = null; this.showModal = true; },
    editItem(item)  { this.editMode = true;  this.selectedItem = item; this.showModal = true; },
    toggleLimits(id) { this.expandedPlan = this.expandedPlan === id ? null : id; },
    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },
    async confirmDelete() {
      await this.$apiDelete('/plans', this.deleteId);
      this.$root.$refs.toast.showToast('Plan deactivated', 'success');
      this.deleteModalVisible = false;
      this.fetchItems();
    },
  },
  mounted() { this.fetchItems(); },
};
</script>
