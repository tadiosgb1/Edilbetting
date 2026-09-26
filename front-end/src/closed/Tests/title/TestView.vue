<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <!-- Loading -->
    <Loading :visible="loading" message="Loading Tests..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <div>
        <h1 class="text-lg font-bold text-gray-800">Tests</h1>
        <p class="text-xs text-gray-400 mt-0.5">
          <span v-if="isAdmin">All tests in the system</span>
          <span v-else-if="isOrganization">Tests assigned to your organization</span>
          <span v-else>Tests assigned to you</span>
        </p>
      </div>
      <button
        v-if="isAdmin || isOrganization"
        @click="openAddModal"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center space-x-1 text-sm"
      >
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Test</span>
      </button>
    </div>

    <!-- Search + Page Size -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <input v-model="searchQuery" @input="fetchItems(1)" type="text" placeholder="Search tests..."
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150" />
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <label>Show</label>
        <select v-model="pageSize" @change="fetchItems(1)" class="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-green-500 focus:border-green-500">
          <option v-for="size in [5,10,20,50,100]" :key="size" :value="size">{{ size }}</option>
        </select>
        <span>entries</span>
      </div>
    </div>

    <!-- Status Filter (for testers) -->
    <div v-if="!isAdmin && !isOrganization" class="mb-6 flex gap-2">
      <button
        v-for="status in ['all', 'pending', 'in_progress', 'completed']"
        :key="status"
        @click="statusFilter = status; fetchItems(1)"
        class="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
        :class="statusFilter === status
          ? 'bg-green-500 text-white shadow-md'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
      >
        {{ status === 'all' ? 'All' : status.replace('_', ' ') }}
      </button>
    </div>

    <!-- Desktop Table -->
    <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200">
          <thead class="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-3 text-left">#</th>
              <th class="px-6 py-3 text-left">Title</th>
              <th class="px-6 py-3 text-left">Description</th>
              <th class="px-6 py-3 text-left">Duration</th>
              <th v-if="!isAdmin && !isOrganization" class="px-6 py-3 text-left">Status</th>
              <th v-if="!isAdmin && !isOrganization" class="px-6 py-3 text-left">Due Date</th>
              <th v-if="isAdmin || isOrganization" class="px-6 py-3 text-left">Created By</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in items" :key="item.id" class="hover:bg-green-50 transition duration-150">
              <td class="px-6 py-4">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="px-6 py-4 whitespace-nowrap font-medium">
                <div class="flex items-center gap-2">
                  <span>{{ item.title }}</span>
                  <span v-if="!isAdmin && !isOrganization && completedTestIds.includes(item.id)" 
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                    <i class="fas fa-check-circle mr-1"></i>Completed
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">{{ item.description || '—' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ item.duration || '—' }}</td>
              
              <!-- Status badge (for testers) -->
              <td v-if="!isAdmin && !isOrganization" class="px-6 py-4 whitespace-nowrap">
                <span :class="statusBadge(item.assignment_status)">
                  {{ formatStatus(item.assignment_status) }}
                </span>
              </td>
              
              <!-- Due date (for testers) -->
              <td v-if="!isAdmin && !isOrganization" class="px-6 py-4 whitespace-nowrap text-xs">
                <span v-if="item.due_date" :class="dueDateClass(item.due_date)">
                  {{ formatDate(item.due_date) }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </td>
              
              <td v-if="isAdmin || isOrganization" class="px-6 py-4 whitespace-nowrap">{{ item.created_by || '—' }}</td>
              
              <td class="px-6 py-4 text-center space-x-3">
                <button @click="takeTest(item)" title="Take Test" class="text-purple-500 hover:text-purple-700">
                  <i class="fas fa-play-circle"></i>
                </button>
                <button @click="viewDetails(item.id)" title="View" class="text-green-500 hover:text-green-700">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="openResultsDrawer(item)" title="Results" class="text-indigo-500 hover:text-indigo-700">
                  <i class="fas fa-chart-bar"></i>
                </button>
                <button @click="openProgressDrawer(item)" title="Progress" class="text-purple-500 hover:text-purple-700">
                  <i class="fas fa-tasks"></i>
                </button>
                <template v-if="isAdmin || isOrganization">
                  <button @click="openAssignModal(item)" title="Assign to User / Group" class="text-amber-500 hover:text-amber-700">
                    <i class="fas fa-user-plus"></i>
                  </button>
                  <button @click="openAddQuestionModal(item.id)" title="Add Question" class="text-green-600 hover:text-green-800">
                    <i class="fas fa-plus-circle"></i>
                  </button>
                  <button @click="editItem(item)" title="Edit" class="text-blue-500 hover:text-blue-700">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="openDeleteModal(item.id)" title="Delete" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                  </button>
                </template>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td :colspan="columnCount" class="text-center py-6 text-gray-400 italic">
                {{ emptyMessage }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="(item, index) in items" :key="item.id" class="bg-white border border-gray-200 rounded-xl shadow p-4">
        <div class="flex justify-between mb-3">
          <h2 class="font-bold text-gray-800">Test #{{ (currentPage - 1) * pageSize + index + 1 }}</h2>
          <div class="flex gap-3 text-sm">
            <button @click="takeTest(item)" title="Take Test" class="text-purple-500 hover:text-purple-700">
              <i class="fas fa-play-circle"></i>
            </button>
            <button @click="viewDetails(item.id)" class="text-green-500 hover:text-green-700">
              <i class="fas fa-eye"></i>
            </button>
            <button @click="openResultsDrawer(item)" title="Results" class="text-indigo-500 hover:text-indigo-700">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button @click="openProgressDrawer(item)" title="Progress" class="text-purple-500 hover:text-purple-700">
              <i class="fas fa-tasks"></i>
            </button>
            <template v-if="isAdmin || isOrganization">
              <button @click="openAssignModal(item)" title="Assign to User / Group" class="text-amber-500 hover:text-amber-700">
                <i class="fas fa-user-plus"></i>
              </button>
              <button @click="openAddQuestionModal(item.id)" title="Add Question" class="text-green-600 hover:text-green-800">
                <i class="fas fa-plus-circle"></i>
              </button>
              <button @click="editItem(item)" class="text-blue-500 hover:text-blue-700">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="openDeleteModal(item.id)" class="text-red-500 hover:text-red-700">
                <i class="fas fa-trash"></i>
              </button>
            </template>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-y-1 text-sm text-gray-700">
          <div class="col-span-2">
            <span class="font-medium text-gray-600">Title:</span>
            {{ item.title }}
            <span v-if="!isAdmin && !isOrganization && completedTestIds.includes(item.id)" 
              class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
              <i class="fas fa-check-circle mr-1"></i>Completed
            </span>
          </div>
          <div class="col-span-2">
            <span class="font-medium text-gray-600">Description:</span>
            {{ item.description || '—' }}
          </div>
          <div class="col-span-2">
            <span class="font-medium text-gray-600">Duration:</span>
            {{ item.duration || '—' }}
          </div>
          <div v-if="!isAdmin && !isOrganization" class="col-span-2">
            <span class="font-medium text-gray-600">Status:</span>
            <span :class="statusBadge(item.assignment_status)" class="ml-2">
              {{ formatStatus(item.assignment_status) }}
            </span>
          </div>
          <div v-if="!isAdmin && !isOrganization && item.due_date" class="col-span-2">
            <span class="font-medium text-gray-600">Due Date:</span>
            <span :class="dueDateClass(item.due_date)" class="ml-2">
              {{ formatDate(item.due_date) }}
            </span>
          </div>
          <div v-if="isAdmin || isOrganization" class="col-span-2">
            <span class="font-medium text-gray-600">Created By:</span>
            {{ item.created_by || '—' }}
          </div>
        </div>
      </div>
      <p v-if="items.length === 0" class="text-center text-gray-400 py-6 italic">{{ emptyMessage }}</p>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-6 text-sm text-gray-600">
      <span>
        Showing {{ count === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}
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
    <add-test v-if="showModal && !editMode" :data="selectedItem" @close="showModal=false" @saved="fetchItems"/>
    <edit-test v-if="showModal && editMode" :data="selectedItem" @close="showModal=false" @saved="fetchItems"/>

    <!-- Add Question directly from this test row -->
    <add-question
      v-if="showAddQuestion"
      :test-id="addQuestionTestId"
      @close="showAddQuestion = false; addQuestionTestId = null"
      @saved="showAddQuestion = false; addQuestionTestId = null"
    />

    <!-- Results Drawer -->
    <test-results-drawer
      v-if="showResultsDrawer && drawerTest"
      :test="drawerTest"
      @close="showResultsDrawer = false; drawerTest = null"
    />

    <!-- Progress Drawer -->
    <test-progress-drawer
      v-if="showProgressDrawer && drawerTest"
      :test="drawerTest"
      @close="showProgressDrawer = false; drawerTest = null"
    />

    <!-- Assign Test to User / Group (from TestView) -->
    <assign-test-modal
      v-if="showAssignModal && assignTest"
      :test="assignTest"
      @close="showAssignModal = false; assignTest = null"
      @assigned="showAssignModal = false; assignTest = null"
    />

    <!-- Delete Confirmation Modal -->
    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Delete Test"
      message="Are you sure you want to delete this Test?"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible=false"
    />
  </div>
</template>

<script>
import AddTest from "./AddTest.vue";
import EditTest from "./EditTest.vue";
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";
import AddQuestion from "@/closed/Questions/question_text/AddQuestion.vue";
import TestResultsDrawer from "./TestResultsDrawer.vue";
import TestProgressDrawer from "./TestProgressDrawer.vue";
import AssignTestModal from "@/components/AssignTestModal.vue";

export default {
  components: { AddTest, EditTest, Loading, DeleteConfirmModal, AddQuestion, TestResultsDrawer, TestProgressDrawer, AssignTestModal },

  data() {
    return {
      items: [],
      count: 0,
      nextPage: null,
      previousPage: null,
      currentPage: 1,
      pageSize: 10,
      searchQuery: "",
      statusFilter: "all",
      showModal: false,
      editMode: false,
      selectedItem: null,
      loading: false,
      deleteModalVisible: false,
      deleteId: null,
      completedTestIds: [], // Track which tests user has completed
      showAddQuestion: false,
      addQuestionTestId: null,
      // Results / Progress drawers
      showResultsDrawer: false,
      showProgressDrawer: false,
      drawerTest: null,
      // Assign modal
      showAssignModal: false,
      assignTest: null,
    };
  },

  computed: {
    userRoles() {
      try {
        const raw = localStorage.getItem('roles');
        return raw ? JSON.parse(raw).map(r => (typeof r === 'string' ? r : r.name || '').toLowerCase()) : [];
      } catch {
        return [];
      }
    },
    isAdmin() {
  return this.userRoles.includes('admin') || this.userRoles.includes('super_admin');
},
    isOrganization() {
      return this.userRoles.includes('organization');
    },
    userId() {
      return localStorage.getItem('userId');
    },
    organizationId() {
      return localStorage.getItem('organizationId');
    },
    columnCount() {
      if (this.isAdmin || this.isOrganization) return 6;
      return 7; // testers have status + due date columns
    },
    emptyMessage() {
      if (this.isAdmin) return 'No tests found.';
      if (this.isOrganization) return 'No tests assigned to your organization yet.';
      return this.statusFilter === 'all'
        ? 'No tests assigned to you yet.'
        : `No ${this.statusFilter.replace('_', ' ')} tests.`;
    },
  },

  methods: {
    async fetchCompletedTests() {
      // Fetch user's completed tests to mark them
      if (!this.isAdmin && !this.isOrganization) {
        try {
          const userId = parseInt(this.userId);
          const res = await this.$apiGet('/result', { page: 1, page_size: 1000 });
          const userResults = (res.data || []).filter(r => r.user_id === userId);
          this.completedTestIds = userResults.map(r => r.test_id);
        } catch (e) {
          console.error('Fetch completed tests error:', e);
        }
      }
    },

    async fetchItems(page = 1) {
      this.loading = true;
      this.currentPage = page;

      try {
        if (this.isAdmin) {
          // Admin: fetch all tests from /test endpoint
          await this.fetchAllTests();
        } else if (this.isOrganization) {
          // Organization: fetch tests assigned to org users/groups
          await this.fetchOrganizationTests();
        } else {
          // Tester/User: fetch tests assigned to this user
          await this.fetchUserTests();
        }
      } catch (e) {
        console.error('Fetch tests error:', e);
        this.items = [];
        this.count = 0;
      } finally {
        this.loading = false;
      }
    },

    async fetchAllTests() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchQuery,
      };
      const response = await this.$apiGet('/test', params);
      this.items        = response.data     || [];
      this.count        = response.count    || 0;
      this.nextPage     = response.next     || null;
      this.previousPage = response.previous || null;
    },

    async fetchOrganizationTests() {
      // Organization users: use the /test endpoint which has backend filtering
      // The backend TestController.getAll already filters tests based on organization assignments
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchQuery,
      };
      
      const response = await this.$apiGet('/test', params);
      this.items        = response.data     || [];
      this.count        = response.count    || 0;
      this.nextPage     = response.next     || null;
      this.previousPage = response.previous || null;
      
      // Format created_by field if User data is included
      this.items = this.items.map(item => ({
        ...item,
        created_by: item.User ? `${item.User.first_name} ${item.User.last_name}` : (item.created_by || '—'),
      }));
    },

    async fetchUserTests() {
      // Fetch test assignments for this specific user
      const response = await this.$apiGet(`/test-assignments/user/${this.userId}`);
      const assignments = response.data || [];
      
      // Map assignments to test items with assignment metadata
      this.items = assignments
        .filter(a => a.test) // Only include assignments with valid test data
        .map(assignment => ({
          id: assignment.test.id,
          title: assignment.test.title,
          description: assignment.test.description,
          duration: assignment.test.duration,
          assignment_id: assignment.id,
          assignment_status: assignment.status,
          due_date: assignment.due_date,
          notes: assignment.notes,
        }));
      
      // Apply status filter
      if (this.statusFilter !== 'all') {
        this.items = this.items.filter(item => item.assignment_status === this.statusFilter);
      }
      
      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        this.items = this.items.filter(item =>
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        );
      }
      
      this.count = this.items.length;
      this.nextPage = null;
      this.previousPage = null;
    },

    statusBadge(status) {
      const badges = {
        pending:     'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700',
        in_progress: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700',
        completed:   'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700',
        expired:     'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700',
      };
      return badges[status] || 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600';
    },

    formatStatus(status) {
      if (!status) return '—';
      return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    dueDateClass(dueDate) {
      if (!dueDate) return '';
      const now = new Date();
      const due = new Date(dueDate);
      const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return 'text-red-600 font-semibold';
      if (daysLeft <= 3) return 'text-amber-600 font-semibold';
      return 'text-gray-600';
    },

    formatDate(date) {
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    openAddModal() { this.editMode = false; this.selectedItem = null; this.showModal = true; },
    editItem(item)  { this.editMode = true;  this.selectedItem = item;  this.showModal = true; },
    openAddQuestionModal(testId) {
      this.addQuestionTestId = testId;
      this.showAddQuestion = true;
    },

    openAssignModal(item) {
      this.assignTest = { id: item.id, title: item.title, duration: item.duration };
      this.showAssignModal = true;
    },

    openResultsDrawer(item) {
      this.drawerTest = item;
      this.showProgressDrawer = false;
      this.showResultsDrawer = true;
    },

    openProgressDrawer(item) {
      this.drawerTest = item;
      this.showResultsDrawer = false;
      this.showProgressDrawer = true;
    },

    viewDetails(id) {
      this.$router.push({ name: 'Test-detail', params: { id } });
    },

    takeTest(item) {
      // Check if test is already completed
      if (!this.isAdmin && !this.isOrganization && this.completedTestIds.includes(item.id)) {
        this.$root.$refs.toast?.showToast('You have already completed this test', 'warning');
        return;
      }
      this.$router.push({ name: 'Test-take', params: { id: item.id } });
    },

    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },

    async confirmDelete() {
      const res = await this.$apiDelete('/test', this.deleteId);
      if (res) {
        this.$root.$refs.toast?.showToast('Test deleted successfully', 'success');
      }
      this.deleteModalVisible = false;
      this.fetchItems(this.currentPage);
    },
  },

  mounted() {
    this.fetchCompletedTests();
    this.fetchItems();
  },
};
</script>
