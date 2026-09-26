
<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <!-- Loading -->
    <Loading :visible="loading" message="Loading Group..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Group</h1>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center space-x-1 text-sm">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Group</span>
      </button>
    </div>

    <!-- Search + Page Size -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <input v-model="searchQuery" @input="fetchItems(1)" type="text" placeholder="Search..."
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150" />
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <label>Show</label>
        <select v-model="pageSize" @change="fetchItems(1)" class="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-green-500 focus:border-green-500">
          <option v-for="size in [5,10,20,50,100]" :key="size" :value="size">{{ size }}</option>
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
              <th class="px-6 py-3 text-left">Name</th><th class="px-6 py-3 text-left">Description</th><th class="px-6 py-3 text-left">Organization</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in items" :key="item.id" class="hover:bg-green-50 transition duration-150">
              <td class="px-6 py-4">{{ index + 1 }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ item.name }}</td><td class="px-6 py-4 whitespace-nowrap">{{ item.description }}</td><td class="px-6 py-4 whitespace-nowrap">{{ item.organization }}</td>
              <td class="px-6 py-4 text-center space-x-3">
                <button @click="viewDetails(item.id)" title="View Detail" class="text-green-500 hover:text-green-700"><i class="fas fa-eye"></i></button>
                <button @click="openMembersModal(item)" title="View Members" class="text-indigo-500 hover:text-indigo-700"><i class="fas fa-users"></i></button>
                <button @click="openAssignUsersModal(item)" title="Add Users to Group" class="text-amber-500 hover:text-amber-700"><i class="fas fa-user-plus"></i></button>
                <button @click="openAssignTestModal(item)" title="Assign Test" class="text-purple-500 hover:text-purple-700"><i class="fas fa-clipboard-check"></i></button>
                <button @click="openViewTestsModal(item)" title="View Assigned Tests" class="text-cyan-500 hover:text-cyan-700"><i class="fas fa-list-alt"></i></button>
                <button @click="editItem(item)" title="Edit" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
                <button @click="openDeleteModal(item.id)" title="Delete" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="5" class="text-center py-6 text-gray-400 italic">No data found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="(item, index) in items" :key="item.id" class="bg-white border border-gray-200 rounded-xl shadow p-4">
        <div class="flex justify-between mb-3">
          <h2 class="font-bold text-gray-800">Group #{{ index + 1 }}</h2>
          <div class="flex gap-3 text-sm">
            <button @click="viewDetails(item.id)" title="View Detail" class="text-green-500 hover:text-green-700"><i class="fas fa-eye"></i></button>
            <button @click="openMembersModal(item)" title="View Members" class="text-indigo-500 hover:text-indigo-700"><i class="fas fa-users"></i></button>
            <button @click="openAssignUsersModal(item)" title="Add Users" class="text-amber-500 hover:text-amber-700"><i class="fas fa-user-plus"></i></button>
            <button @click="openAssignTestModal(item)" title="Assign Test" class="text-purple-500 hover:text-purple-700"><i class="fas fa-clipboard-check"></i></button>
            <button @click="openViewTestsModal(item)" title="View Tests" class="text-cyan-500 hover:text-cyan-700"><i class="fas fa-list-alt"></i></button>
            <button @click="editItem(item)" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
            <button @click="openDeleteModal(item.id)" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-y-1 text-sm text-gray-700">
          
            <div class="col-span-2">
              <span class="font-medium text-gray-600">Name:</span>
              {{ item.name }}
            </div>
            <div class="col-span-2">
              <span class="font-medium text-gray-600">Description:</span>
              {{ item.description }}
            </div>
            <div class="col-span-2">
              <span class="font-medium text-gray-600">Organization:</span>
              {{ item.organization }}
            </div>
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
        <button @click="fetchItems(currentPage - 1)" :disabled="!previousPage"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150">← Previous</button>
        <span class="px-3 py-1 bg-green-600 text-white rounded-lg font-medium">{{ currentPage }}</span>
        <button @click="fetchItems(currentPage + 1)" :disabled="!nextPage"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150">Next →</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <add-group v-if="showModal && !editMode" :data="selectedItem" @close="showModal=false" @saved="fetchItems"/>
    <edit-group v-if="showModal && editMode" :data="selectedItem" @close="showModal=false" @saved="fetchItems"/>

    <!-- Assign Users to Group Modal -->
    <assign-users-modal
      v-if="showAssignModal && selectedItem"
      :group="selectedItem"
      @close="showAssignModal = false"
      @assigned="fetchItems"
    />

    <!-- View Group Members Modal -->
    <group-members-modal
      v-if="showMembersModal && selectedItem"
      :group="selectedItem"
      @close="showMembersModal = false"
    />

    <!-- Assign Test to Group Modal -->
    <assign-test-modal
      v-if="showAssignTestModal && selectedItem"
      target-type="group"
      :target-id="selectedItem.id"
      :target-name="selectedItem.name"
      @close="showAssignTestModal = false"
      @assigned="showAssignTestModal = false"
    />

    <!-- View Tests Assigned to Group Modal -->
    <view-assigned-tests-modal
      v-if="showViewTestsModal && selectedItem"
      target-type="group"
      :target-id="selectedItem.id"
      :target-name="selectedItem.name"
      @close="showViewTestsModal = false"
    />

    <!-- Delete Confirmation Modal -->
    <delete-confirm-modal 
      :visible="deleteModalVisible"
      title="Delete Group"
      message="Are you sure you want to delete this Group?"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible=false"
    />
    
  </div>
</template>

<script>
import AddGroup from "./AddGroup.vue";
import EditGroup from "./EditGroup.vue";
import AssignUsersModal from "./AssignUsersModal.vue";
import GroupMembersModal from "./GroupMembersModal.vue";
import AssignTestModal from "@/components/AssignTestModal.vue";
import ViewAssignedTestsModal from "@/components/ViewAssignedTestsModal.vue";
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

export default {
  components: { 
    AddGroup, 
    EditGroup, 
    AssignUsersModal, 
    GroupMembersModal, 
    AssignTestModal, 
    ViewAssignedTestsModal, 
    Loading, 
    DeleteConfirmModal 
  },

  data() {
    return {
      items: [],
      count: 0,
      nextPage: null,
      previousPage: null,
      currentPage: 1,
      pageSize: 10,
      searchQuery: "",
      showModal: false,
      editMode: false,
      selectedItem: null,
      loading: false,
      deleteModalVisible: false,
      deleteId: null,
      showAssignModal: false,
      showMembersModal: false,
      showAssignTestModal: false,
      showViewTestsModal: false,
    };
  },

  methods: {
    async fetchItems(page = 1) {
      this.loading = true;
      this.currentPage = page;
      const params = { page: this.currentPage, page_size: this.pageSize, search: this.searchQuery };
      try {
        const response = await this.$apiGet('/group', params);
        this.items = response.data;
        this.count = response.count || 0;
        this.nextPage = response.next || null;
        this.previousPage = response.previous || null;
      } catch(e) { console.error(e); }
      finally { this.loading = false; }
    },

    openAddModal() { this.editMode = false; this.selectedItem = null; this.showModal = true; },
    editItem(item) { this.editMode = true; this.selectedItem = item; this.showModal = true; },

    openAssignUsersModal(group) { this.selectedItem = group; this.showAssignModal = true; },
    openMembersModal(group)     { this.selectedItem = group; this.showMembersModal = true; },

    openAssignTestModal(group) {
      this.selectedItem = group;
      this.showAssignTestModal = true;
    },

    openViewTestsModal(group) {
      this.selectedItem = group;
      this.showViewTestsModal = true;
    },

    viewDetails(id) {
      this.$router.push({ name: 'Group-detail', params: { id } });
    },

    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },

    async confirmDelete() {
      const res = await this.$apiDelete('/group', this.deleteId);
      if(res) {
        this.$root.$refs.toast.showToast('Group deleted successfully', 'success');
      }
      this.deleteModalVisible = false;
      this.fetchItems(this.currentPage);
    },
  },

  mounted() { this.fetchItems(); }
};
</script>
