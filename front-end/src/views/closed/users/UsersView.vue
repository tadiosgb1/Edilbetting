<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <Loading :visible="loading" message="Loading Users..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">User Management</h1>

      <!-- Add button — hidden on org-users tab (read-only) -->
      <button
        v-if="activeTab !== 'org-users'"
        @click="openAddModal"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center gap-1.5 text-sm transition">
        <i class="fas fa-plus text-xs"></i>
        <span>Add {{ activeTab === 'admins' ? 'Admin' : 'Tester' }}</span>
      </button>
      <!-- Read-only label for org-users tab -->
      <span v-else class="text-xs text-gray-400 italic flex items-center gap-1">
        <i class="fas fa-info-circle"></i> Managed via Organization page
      </span>
    </div>

    <!-- ── Tabs ── -->
    <div class="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">

      <!-- Admins — super_admin only -->
      <button v-if="isSuperAdmin"
        @click="switchTab('admins')"
        class="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition"
        :class="activeTab === 'admins' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        <i class="fas fa-user-shield mr-1.5"></i>Admins
        <span v-if="counts.admins" class="ml-1 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
          {{ counts.admins }}
        </span>
      </button>

      <!-- Org Users — super_admin or admin, read-only -->
      <button v-if="isSuperAdmin || isAdmin"
        @click="switchTab('org-users')"
        class="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition"
        :class="activeTab === 'org-users' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        <i class="fas fa-building mr-1.5"></i>Org Users
        <span v-if="counts['org-users']" class="ml-1 bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
          {{ counts['org-users'] }}
        </span>
      </button>

      <!-- Testers — all privileged roles -->
      <button
        @click="switchTab('testers')"
        class="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition"
        :class="activeTab === 'testers' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        <i class="fas fa-user-check mr-1.5"></i>Testers
        <span v-if="counts.testers" class="ml-1 bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
          {{ counts.testers }}
        </span>
      </button>
    </div>

    <!-- Search + Page Size -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-4">
      <input v-model="searchQuery" @input="fetchItems(1)" type="text"
        :placeholder="`Search ${tabLabel}...`"
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition" />
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <label>Show</label>
        <select v-model="pageSize" @change="fetchItems(1)"
          class="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-green-500">
          <option v-for="s in [5,10,20,50,100]" :key="s" :value="s">{{ s }}</option>
        </select>
        <span>entries</span>
      </div>
    </div>

    <!-- ═══════════ ADMINS TABLE ═══════════ -->
    <template v-if="activeTab === 'admins'">
      <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm divide-y divide-gray-200">
            <thead class="bg-indigo-50 text-indigo-700 uppercase text-xs font-semibold">
              <tr>
                <th class="px-5 py-3 text-left">#</th>
                <th class="px-5 py-3 text-left">Name</th>
                <th class="px-5 py-3 text-left">Email</th>
                <th class="px-5 py-3 text-left">Phone</th>
                <th class="px-5 py-3 text-left">Gender</th>
                <th class="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, i) in items" :key="item.id" class="hover:bg-indigo-50/40 transition">
                <td class="px-5 py-3">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                <td class="px-5 py-3 font-medium whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {{ (item.first_name || '?')[0].toUpperCase() }}
                    </div>
                    {{ item.first_name }} {{ item.last_name }}
                  </div>
                </td>
                <td class="px-5 py-3 text-gray-600">{{ item.email }}</td>
                <td class="px-5 py-3 text-gray-500">{{ item.phone_number || item.phone || '—' }}</td>
                <td class="px-5 py-3">
                  <span v-if="item.gender" class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    :class="item.gender === 'male' ? 'bg-blue-50 text-blue-600' : item.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-gray-100 text-gray-500'">
                    {{ item.gender }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-5 py-3 text-center space-x-3">
                  <button @click="editItem(item)" title="Edit" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
                  <button @click="openDeleteModal(item.id)" title="Delete" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
              <tr v-if="!items.length && !loading">
                <td colspan="6" class="text-center py-8 text-gray-400 italic">No admins found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Admin mobile cards -->
      <div class="md:hidden space-y-3">
        <div v-for="item in items" :key="item.id" class="bg-white border border-indigo-100 rounded-xl shadow-sm p-4">
          <div class="flex justify-between mb-1">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {{ (item.first_name || '?')[0].toUpperCase() }}
              </div>
              <span class="font-semibold text-gray-800 text-sm">{{ item.first_name }} {{ item.last_name }}</span>
            </div>
            <div class="flex gap-3">
              <button @click="editItem(item)" class="text-blue-500"><i class="fas fa-edit text-sm"></i></button>
              <button @click="openDeleteModal(item.id)" class="text-red-500"><i class="fas fa-trash text-sm"></i></button>
            </div>
          </div>
          <p class="text-xs text-gray-500">{{ item.email }}</p>
          <p class="text-xs text-gray-400">{{ item.phone_number || '—' }} · {{ item.gender || '—' }}</p>
        </div>
        <p v-if="!items.length && !loading" class="text-center text-gray-400 py-6 italic">No admins found.</p>
      </div>
    </template>

    <!-- ═══════════ ORG USERS TABLE (read-only) ═══════════ -->
    <template v-if="activeTab === 'org-users'">
      <div class="bg-amber-50/40 border border-amber-200 rounded-xl px-4 py-2 mb-4 flex items-center gap-2 text-xs text-amber-700">
        <i class="fas fa-info-circle"></i>
        Organisation users are created and managed on the <strong>Organisation Management</strong> page. This view is read-only.
      </div>
      <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm divide-y divide-gray-200">
            <thead class="bg-amber-50 text-amber-700 uppercase text-xs font-semibold">
              <tr>
                <th class="px-5 py-3 text-left">#</th>
                <th class="px-5 py-3 text-left">Name</th>
                <th class="px-5 py-3 text-left">Email</th>
                <th class="px-5 py-3 text-left">Phone</th>
                <th class="px-5 py-3 text-left">Organisation</th>
                <th class="px-5 py-3 text-left">Gender</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, i) in items" :key="item.id" class="hover:bg-amber-50/30 transition">
                <td class="px-5 py-3">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                <td class="px-5 py-3 font-medium whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {{ (item.first_name || '?')[0].toUpperCase() }}
                    </div>
                    {{ item.first_name }} {{ item.last_name }}
                  </div>
                </td>
                <td class="px-5 py-3 text-gray-600">{{ item.email }}</td>
                <td class="px-5 py-3 text-gray-500">{{ item.phone_number || item.phone || '—' }}</td>
                <td class="px-5 py-3">
                  <span v-if="item.organization" class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold border border-amber-200">
                    {{ item.organization.name }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-5 py-3">
                  <span v-if="item.gender" class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    :class="item.gender === 'male' ? 'bg-blue-50 text-blue-600' : item.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-gray-100 text-gray-500'">
                    {{ item.gender }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
              <tr v-if="!items.length && !loading">
                <td colspan="6" class="text-center py-8 text-gray-400 italic">No organisation users found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Org Users mobile cards -->
      <div class="md:hidden space-y-3">
        <div v-for="item in items" :key="item.id" class="bg-white border border-amber-100 rounded-xl shadow-sm p-4">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
              {{ (item.first_name || '?')[0].toUpperCase() }}
            </div>
            <span class="font-semibold text-gray-800 text-sm">{{ item.first_name }} {{ item.last_name }}</span>
          </div>
          <p class="text-xs text-gray-500">{{ item.email }}</p>
          <p class="text-xs text-gray-400">{{ item.organization?.name || '—' }} · {{ item.gender || '—' }}</p>
        </div>
        <p v-if="!items.length && !loading" class="text-center text-gray-400 py-6 italic">No organisation users found.</p>
      </div>
    </template>

    <!-- ═══════════ TESTERS TABLE ═══════════ -->
    <template v-if="activeTab === 'testers'">
      <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm divide-y divide-gray-200">
            <thead class="bg-green-50 text-green-700 uppercase text-xs font-semibold">
              <tr>
                <th class="px-5 py-3 text-left">#</th>
                <th class="px-5 py-3 text-left">Name</th>
                <th class="px-5 py-3 text-left">Email</th>
                <th class="px-5 py-3 text-left">Phone</th>
                <th class="px-5 py-3 text-left">Department</th>
                <th class="px-5 py-3 text-left">Organisation</th>
                <th class="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, i) in items" :key="item.id" class="hover:bg-green-50/40 transition">
                <td class="px-5 py-3">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                <td class="px-5 py-3 font-medium whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {{ (item.first_name || '?')[0].toUpperCase() }}
                    </div>
                    {{ item.first_name }} {{ item.last_name }}
                  </div>
                </td>
                <td class="px-5 py-3 text-gray-600">{{ item.email }}</td>
                <td class="px-5 py-3 text-gray-500">{{ item.phone_number || item.phone || '—' }}</td>
                <td class="px-5 py-3 text-gray-500">{{ item.department || '—' }}</td>
                <td class="px-5 py-3">
                  <span v-if="item.organization" class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-semibold border border-green-200">
                    {{ item.organization.name }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-5 py-3 text-center space-x-2">
                  <button @click="viewDetails(item.id)" title="Profile" class="text-green-500 hover:text-green-700"><i class="fas fa-eye"></i></button>
                  <button @click="openAssignTestModal(item)" title="Assign Test" class="text-purple-500 hover:text-purple-700"><i class="fas fa-clipboard-check"></i></button>
                  <button @click="openViewTestsModal(item)" title="View Tests" class="text-indigo-500 hover:text-indigo-700"><i class="fas fa-list-alt"></i></button>
                  <button @click="editItem(item)" title="Edit" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
                  <button @click="openDeleteModal(item.id)" title="Delete" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
              <tr v-if="!items.length && !loading">
                <td colspan="7" class="text-center py-8 text-gray-400 italic">No testers found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Tester mobile cards -->
      <div class="md:hidden space-y-3">
        <div v-for="item in items" :key="item.id" class="bg-white border border-green-100 rounded-xl shadow-sm p-4">
          <div class="flex justify-between mb-1">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                {{ (item.first_name || '?')[0].toUpperCase() }}
              </div>
              <span class="font-semibold text-gray-800 text-sm">{{ item.first_name }} {{ item.last_name }}</span>
            </div>
            <div class="flex gap-2">
              <button @click="openAssignTestModal(item)" class="text-purple-500"><i class="fas fa-clipboard-check text-sm"></i></button>
              <button @click="editItem(item)" class="text-blue-500"><i class="fas fa-edit text-sm"></i></button>
              <button @click="openDeleteModal(item.id)" class="text-red-500"><i class="fas fa-trash text-sm"></i></button>
            </div>
          </div>
          <p class="text-xs text-gray-500">{{ item.email }}</p>
          <p class="text-xs text-gray-400">{{ item.department || '—' }} · {{ item.organization?.name || '—' }}</p>
        </div>
        <p v-if="!items.length && !loading" class="text-center text-gray-400 py-6 italic">No testers found.</p>
      </div>
    </template>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-6 text-sm text-gray-600">
      <span>
        Showing {{ count === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}
        to {{ Math.min(currentPage * pageSize, count) }} of {{ count }}
      </span>
      <div class="flex items-center gap-2">
        <button @click="fetchItems(currentPage - 1)" :disabled="currentPage <= 1"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition">← Prev</button>
        <span class="px-3 py-1 bg-green-600 text-white rounded-lg font-medium">{{ currentPage }}</span>
        <button @click="fetchItems(currentPage + 1)" :disabled="currentPage * pageSize >= count"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition">Next →</button>
      </div>
    </div>

    <!-- ── Modals ── -->
    <add-users
      v-if="showAddUserModal"
      :initial-role="activeTab === 'admins' ? 'admin' : 'tester'"
      :can-create-admin="isSuperAdmin"
      @close="showAddUserModal = false"
      @saved="onSaved" />

    <edit-users
      v-if="showEditUserModal && selectedItem"
      :data="selectedItem"
      @close="showEditUserModal = false"
      @saved="onSaved" />

    <assign-test-modal
      v-if="showAssignTestModal && selectedItem"
      target-type="user"
      :target-id="selectedItem.id"
      :target-name="selectedItem.first_name + ' ' + selectedItem.last_name"
      @close="showAssignTestModal = false"
      @assigned="showAssignTestModal = false" />

    <view-assigned-tests-modal
      v-if="showViewTestsModal && selectedItem"
      target-type="user"
      :target-id="selectedItem.id"
      :target-name="selectedItem.first_name + ' ' + selectedItem.last_name"
      @close="showViewTestsModal = false" />

    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Delete User"
      message="Are you sure you want to delete this user? This cannot be undone."
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false" />
  </div>
</template>

<script>
import AddUsers               from "./AddUsers.vue";
import EditUsers              from "./EditUsers.vue";
import AssignTestModal        from "@/components/AssignTestModal.vue";
import ViewAssignedTestsModal from "@/components/ViewAssignedTestsModal.vue";
import Loading                from "@/components/Loading.vue";
import DeleteConfirmModal     from "@/components/DeleteConfirmModal.vue";

export default {
  components: { AddUsers, EditUsers, AssignTestModal, ViewAssignedTestsModal, Loading, DeleteConfirmModal },

  data() {
    return {
      activeTab: "testers",   // default; super_admin overridden in mounted

      items: [],
      count: 0,
      counts: { admins: 0, "org-users": 0, testers: 0 },

      currentPage: 1,
      pageSize: 10,
      searchQuery: "",
      selectedItem: null,
      loading: false,

      showAddUserModal:   false,
      showEditUserModal:  false,
      showAssignTestModal: false,
      showViewTestsModal:  false,
      deleteModalVisible:  false,
      deleteId: null,
    };
  },

  computed: {
    currentRoles() {
      try { return JSON.parse(localStorage.getItem("roles") || "[]"); }
      catch { return []; }
    },
    isSuperAdmin() { return this.currentRoles.includes("super_admin"); },
    isAdmin()      { return this.currentRoles.includes("admin"); },

    tabLabel() {
      return { admins: "admins", "org-users": "organisation users", testers: "testers" }[this.activeTab] || "";
    },

    // Map tab name → API endpoint
    endpoint() {
      return {
        admins:      "/users/admins",
        "org-users": "/users/org-users",
        testers:     "/users/testers",
      }[this.activeTab];
    },
  },

  methods: {
    switchTab(tab) {
      if (this.activeTab === tab) return;
      this.activeTab   = tab;
      this.searchQuery = "";
      this.currentPage = 1;
      this.items       = [];
      this.count       = 0;
      this.fetchItems(1);
    },

    async fetchItems(page = 1) {
      this.loading     = true;
      this.currentPage = page;
      try {
        const res = await this.$apiGet(this.endpoint, {
          page:      this.currentPage,
          page_size: this.pageSize,
          search:    this.searchQuery,
        });
        this.items = res.data  || [];
        this.count = res.count || 0;
        this.counts[this.activeTab] = res.count || 0;
      } catch (e) {
        this.$root.$refs.toast?.showToast(e?.message || "Failed to load users", "error");
      } finally {
        this.loading = false;
      }
    },

    openAddModal() { this.selectedItem = null; this.showAddUserModal = true; },
    editItem(user) { this.selectedItem = user; this.showEditUserModal = true; },
    openAssignTestModal(user) { this.selectedItem = user; this.showAssignTestModal = true; },
    openViewTestsModal(user)  { this.selectedItem = user; this.showViewTestsModal  = true; },
    viewDetails(id)           { this.$router.push({ name: "Users-detail", params: { id } }); },

    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },
    async confirmDelete() {
      try {
        await this.$apiDelete("/users", this.deleteId);
        this.$root.$refs.toast?.showToast("User deleted", "success");
      } catch (e) {
        this.$root.$refs.toast?.showToast(e?.message || "Delete failed", "error");
      } finally {
        this.deleteModalVisible = false;
        this.fetchItems(this.currentPage);
      }
    },

    onSaved() {
      this.showAddUserModal  = false;
      this.showEditUserModal = false;
      this.fetchItems(this.currentPage);
    },
  },

  mounted() {
    if (this.isSuperAdmin) this.activeTab = "admins";
    else if (this.isAdmin) this.activeTab = "org-users";
    this.fetchItems(1);
  },
};
</script>
