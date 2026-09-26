<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <Loading :visible="loading" message="Loading Organizations..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Organizations</h1>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center space-x-1 text-sm">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Organization</span>
      </button>
    </div>

    <!-- Search + Page Size -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <input v-model="searchQuery" @input="fetchItems(1)" type="text" placeholder="Search organizations..."
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150" />
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <label>Show</label>
        <select v-model="pageSize" @change="fetchItems(1)" class="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-green-500 focus:border-green-500">
          <option v-for="size in [5, 10, 20, 50, 100]" :key="size" :value="size">{{ size }}</option>
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
              <th class="px-6 py-3 text-left">Name</th>
              <th class="px-6 py-3 text-left">Address</th>
              <th class="px-6 py-3 text-left">Email</th>
              <th class="px-6 py-3 text-left">Phone</th>
              <th class="px-6 py-3 text-center">Groups</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="(item, index) in items" :key="item.id">

              <!-- Organization Row -->
              <tr class="hover:bg-green-50 transition duration-150">
                <td class="px-6 py-4">{{ index + 1 }}</td>
                <td class="px-6 py-4 font-medium">{{ item.name }}</td>
                <td class="px-6 py-4 text-gray-500">{{ item.address || '—' }}</td>
                <td class="px-6 py-4 text-gray-500">{{ item.official_email || '—' }}</td>
                <td class="px-6 py-4 text-gray-500">{{ item.official_phone || '—' }}</td>
                <td class="px-6 py-4 text-center">
                  <button
                    @click="toggleGroups(item)"
                    class="text-xs px-3 py-1 rounded-full border transition"
                    :class="expandedOrg === item.id
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600'"
                  >
                    <i class="fas fa-users mr-1"></i>
                    Groups
                    <span v-if="groupCounts[item.id] !== undefined" class="ml-1 font-semibold">
                      ({{ groupCounts[item.id] }})
                    </span>
                  </button>
                </td>
                <td class="px-6 py-4 text-center space-x-3">
                  <button @click="editItem(item)" title="Edit" class="text-blue-500 hover:text-blue-700">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="openDeleteModal(item.id)" title="Delete" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>

              <!-- Groups Expanded Row -->
              <tr v-if="expandedOrg === item.id" :key="'groups-' + item.id">
                <td colspan="7" class="px-6 py-4 bg-blue-50/40">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Groups in "{{ item.name }}"
                    </h3>
                    <button
                      @click="openAddGroupModal(item)"
                      class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <i class="fas fa-plus text-[10px]"></i> Add Group
                    </button>
                  </div>

                  <div v-if="loadingGroups" class="py-4 text-center text-gray-400">
                    <i class="fas fa-spinner animate-spin"></i>
                  </div>

                  <div v-else-if="orgGroups.length === 0" class="text-xs text-gray-400 italic py-2">
                    No groups defined for this organization yet.
                  </div>

                  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div
                      v-for="group in orgGroups"
                      :key="group.id"
                      class="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p class="text-xs font-medium text-gray-700">{{ group.name }}</p>
                        <p class="text-[10px] text-gray-400">{{ group.description || '—' }}</p>
                      </div>
                      <div class="flex gap-2 ml-3">
                        <button @click="openAssignTestModal(group)" title="Assign Test" class="text-purple-400 hover:text-purple-600">
                          <i class="fas fa-clipboard-check text-xs"></i>
                        </button>
                        <button @click="openViewTestsModal(group)" title="View Assigned Tests" class="text-indigo-400 hover:text-indigo-600">
                          <i class="fas fa-list-alt text-xs"></i>
                        </button>
                        <button @click="editGroup(group)" class="text-blue-400 hover:text-blue-600">
                          <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button @click="deleteGroup(group.id)" class="text-red-400 hover:text-red-600">
                          <i class="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

            </template>

            <tr v-if="items.length === 0">
              <td colspan="7" class="text-center py-6 text-gray-400 italic">No data found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="(item, index) in items" :key="item.id" class="bg-white border border-gray-200 rounded-xl shadow p-4">
        <div class="flex justify-between mb-2">
          <h2 class="font-bold text-gray-800">{{ item.name }}</h2>
          <div class="flex gap-3 text-sm">
            <button @click="editItem(item)" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
            <button @click="openDeleteModal(item.id)" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="text-xs text-gray-500 space-y-0.5 mb-3">
          <p>{{ item.address || '—' }}</p>
          <p>{{ item.official_email || '—' }}</p>
        </div>
        <button @click="toggleGroups(item)" class="text-xs text-blue-600 underline">
          {{ expandedOrg === item.id ? 'Hide Groups' : 'Show Groups' }}
        </button>
        <div v-if="expandedOrg === item.id" class="mt-3 space-y-2">
          <div v-if="loadingGroups" class="text-center text-gray-400"><i class="fas fa-spinner animate-spin"></i></div>
          <div v-for="group in orgGroups" :key="group.id" class="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2">
            <div>
              <p class="text-xs font-medium">{{ group.name }}</p>
              <p class="text-[10px] text-gray-400">{{ group.description || '—' }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="editGroup(group)" class="text-blue-400"><i class="fas fa-edit text-xs"></i></button>
              <button @click="deleteGroup(group.id)" class="text-red-400"><i class="fas fa-trash text-xs"></i></button>
            </div>
          </div>
          <button @click="openAddGroupModal(item)" class="text-xs text-blue-600 underline">+ Add Group</button>
        </div>
      </div>
      <p v-if="items.length === 0" class="text-center text-gray-400 py-6 italic">No data found.</p>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-6 text-sm text-gray-600">
      <span>
        Showing {{ (currentPage - 1) * pageSize + 1 }}
        to {{ Math.min(currentPage * pageSize, count) }}
        of {{ count }} total entries
      </span>
      <div class="flex items-center gap-2">
        <button @click="fetchItems(currentPage - 1)" :disabled="currentPage <= 1"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150">← Previous</button>
        <span class="px-3 py-1 bg-green-600 text-white rounded-lg font-medium">{{ currentPage }}</span>
        <button @click="fetchItems(currentPage + 1)" :disabled="currentPage * pageSize >= count"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150">Next →</button>
      </div>
    </div>

    <!-- Organization Add/Edit Modals -->
    <add-organization v-if="showModal && !editMode" @close="showModal = false" @saved="fetchItems" />
    <edit-organization v-if="showModal && editMode" :data="selectedItem" @close="showModal = false" @saved="fetchItems" />

    <!-- Group Add/Edit Modals -->
    <add-group-modal
      v-if="showGroupModal && !groupEditMode"
      :organization="selectedOrg"
      @close="showGroupModal = false"
      @saved="onGroupSaved"
    />
    <edit-group-modal
      v-if="showGroupModal && groupEditMode"
      :data="selectedGroup"
      @close="showGroupModal = false"
      @saved="onGroupSaved"
    />

    <!-- Assign Test to Group Modal -->
    <assign-test-modal
      v-if="showAssignTestModal && selectedGroup"
      target-type="group"
      :target-id="selectedGroup.id"
      :target-name="selectedGroup.name"
      @close="showAssignTestModal = false"
      @assigned="showAssignTestModal = false"
    />

    <!-- View Tests Assigned to Group Modal -->
    <view-assigned-tests-modal
      v-if="showViewTestsModal && selectedGroup"
      target-type="group"
      :target-id="selectedGroup.id"
      :target-name="selectedGroup.name"
      @close="showViewTestsModal = false"
    />

    <!-- Delete Confirmation Modal -->
    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Delete Organization"
      message="Are you sure you want to delete this organization?"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script>
import AddOrganization from "./AddOrganization.vue";
import EditOrganization from "./EditOrganization.vue";
import AddGroupModal from "../../../views/closed/Groups/AddGroup.vue";
import EditGroupModal from "../../../views/closed/Groups/EditGroup.vue";
import AssignTestModal from "@/components/AssignTestModal.vue";
import ViewAssignedTestsModal from "@/components/ViewAssignedTestsModal.vue";
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

export default {
  components: { AddOrganization, EditOrganization, AddGroupModal, EditGroupModal, AssignTestModal, ViewAssignedTestsModal, Loading, DeleteConfirmModal },

  data() {
    return {
      items: [],
      count: 0,
      currentPage: 1,
      pageSize: 10,
      searchQuery: "",
      selectedItem: null,
      loading: false,
      showModal: false,
      editMode: false,
      deleteModalVisible: false,
      deleteId: null,

      // groups
      expandedOrg: null,
      selectedOrg: null,
      orgGroups: [],
      groupCounts: {},
      loadingGroups: false,
      showGroupModal: false,
      groupEditMode: false,
      selectedGroup: null,

      // test assignment
      showAssignTestModal: false,
      showViewTestsModal: false,
    };
  },

  methods: {
    async fetchItems(page = 1) {
      this.loading = true;
      this.currentPage = page;
      try {
        const res = await this.$apiGet('/organization', {
          page: this.currentPage,
          page_size: this.pageSize,
          search: this.searchQuery,
        });
        this.items = res.data || [];
        this.count = res.count || 0;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    openAddModal()  { this.editMode = false; this.selectedItem = null; this.showModal = true; },
    editItem(item)  { this.editMode = true;  this.selectedItem = item; this.showModal = true; },

    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },

    async confirmDelete() {
      const res = await this.$apiDelete('/organization', this.deleteId);
      if (res) this.$root.$refs.toast.showToast('Organization deleted successfully', 'success');
      this.deleteModalVisible = false;
      this.fetchItems(this.currentPage);
    },

    async toggleGroups(org) {
      if (this.expandedOrg === org.id) {
        this.expandedOrg = null;
        return;
      }
      this.expandedOrg = org.id;
      this.selectedOrg = org;
      await this.fetchGroupsForOrg(org.id);
    },

    async fetchGroupsForOrg(orgId) {
      this.loadingGroups = true;
      try {
        const res = await this.$apiGet('/group', { page_size: 100, organization_id: orgId });
        // filter client-side as fallback
        this.orgGroups = (res.data || []).filter(g => g._id === orgId);
        this.groupCounts[orgId] = this.orgGroups.length;
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingGroups = false;
      }
    },

    openAddGroupModal(org) {
      this.selectedOrg = org;
      this.groupEditMode = false;
      this.selectedGroup = null;
      this.showGroupModal = true;
    },

    editGroup(group) {
      this.selectedGroup = group;
      this.groupEditMode = true;
      this.showGroupModal = true;
    },

    openAssignTestModal(group) {
      this.selectedGroup = group;
      this.showAssignTestModal = true;
    },

    openViewTestsModal(group) {
      this.selectedGroup = group;
      this.showViewTestsModal = true;
    },

    async deleteGroup(id) {
      const res = await this.$apiDelete('/group', id);
      if (res) this.$root.$refs.toast.showToast('Group deleted', 'success');
      await this.fetchGroupsForOrg(this.expandedOrg);
    },

    async onGroupSaved() {
      this.showGroupModal = false;
      if (this.expandedOrg) {
        await this.fetchGroupsForOrg(this.expandedOrg);
      }
    },
  },

  mounted() {
    this.fetchItems();
  },
};
</script>
