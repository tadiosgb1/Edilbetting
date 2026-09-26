<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">
    <Loading :visible="loading" message="Loading Test Details..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <div>
        <h1 class="text-lg font-bold text-gray-800">{{ item.title }}</h1>
        <p class="text-xs text-gray-500 mt-0.5">{{ item.description }}</p>
      </div>
      <button @click="$router.back()" class="text-gray-600 hover:text-gray-800 text-sm">
        <i class="fas fa-arrow-left mr-2"></i>Back
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <i class="fas fa-clock text-blue-500"></i>
        </div>
        <div><p class="text-xs text-gray-500">Duration</p><p class="text-base font-bold text-gray-800">{{ item.duration || '—' }}</p></div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
          <i class="fas fa-users text-green-500"></i>
        </div>
        <div><p class="text-xs text-gray-500">Test-Takers</p><p class="text-base font-bold text-gray-800">{{ testTakers.length }}</p></div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
          <i class="fas fa-check-circle text-purple-500"></i>
        </div>
        <div><p class="text-xs text-gray-500">Completed</p><p class="text-base font-bold text-gray-800">{{ completedCount }}</p></div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          <i class="fas fa-hourglass-half text-amber-500"></i>
        </div>
        <div><p class="text-xs text-gray-500">Pending</p><p class="text-base font-bold text-gray-800">{{ pendingCount }}</p></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- LEADERBOARD + EXPORT PANEL (Admin / Org only)                     -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <div v-if="isAdmin || isOrganization" class="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">

      <!-- Header row -->
      <div class="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div class="flex items-center gap-2">
          <i class="fas fa-trophy text-amber-500 text-base"></i>
          <h2 class="text-sm font-bold text-gray-800">Leaderboard &amp; Export</h2>
          <span class="text-xs text-gray-400">— {{ item.title }}</span>
        </div>

        <!-- Controls row -->
        <div class="flex flex-wrap items-center gap-3">

          <!-- Top-N selector -->
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <label class="font-medium">Show Top</label>
            <input
              v-model.number="topN"
              type="number" min="1" :max="rankedTesters.length || 100"
              class="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span class="text-gray-400">of {{ rankedTesters.length }} completed</span>
          </div>

          <!-- Org filter (admin only) -->
          <select
            v-if="isAdmin"
            v-model="exportOrgFilter"
            class="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">All Organizations</option>
            <option v-for="org in orgList" :key="org.id" :value="org.id">{{ org.name }}</option>
          </select>

          <!-- Group filter -->
          <select
            v-model="exportGroupFilter"
            class="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">All Groups</option>
            <option v-for="g in groupList" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>

          <!-- Export buttons -->
          <button @click="exportExcel"
            :disabled="exportingExcel || leaderboardRows.length === 0"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
            <i v-if="exportingExcel" class="fas fa-spinner animate-spin"></i>
            <i v-else class="fas fa-file-excel"></i>
            Excel
          </button>
          <button @click="exportPdf"
            :disabled="exportingPdf || leaderboardRows.length === 0"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
            <i v-if="exportingPdf" class="fas fa-spinner animate-spin"></i>
            <i v-else class="fas fa-file-pdf"></i>
            PDF
          </button>
          <button @click="exportCsv"
            :disabled="leaderboardRows.length === 0"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
            <i class="fas fa-file-csv"></i>
            CSV
          </button>
        </div>
      </div>

      <!-- Leaderboard table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200" id="leaderboard-table">
          <thead class="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th class="px-4 py-3 text-center w-12">Rank</th>
              <th class="px-4 py-3 text-left">Tester</th>
              <th class="px-4 py-3 text-left">Email</th>
              <th class="px-4 py-3 text-center">Score</th>
              <th class="px-4 py-3 text-left">Interpretation</th>
              <th class="px-4 py-3 text-left">Completed At</th>
              <th class="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="(row, idx) in leaderboardRows" :key="row.id"
              class="hover:bg-indigo-50 transition"
              :class="idx === 0 ? 'bg-amber-50' : idx === 1 ? 'bg-gray-50' : idx === 2 ? 'bg-orange-50' : ''">

              <!-- Rank medal -->
              <td class="px-4 py-3 text-center font-bold">
                <span v-if="idx === 0" class="text-amber-500 text-base">🥇</span>
                <span v-else-if="idx === 1" class="text-gray-400 text-base">🥈</span>
                <span v-else-if="idx === 2" class="text-orange-400 text-base">🥉</span>
                <span v-else class="text-gray-500 text-xs">#{{ idx + 1 }}</span>
              </td>

              <td class="px-4 py-3 font-medium text-gray-800">{{ row.userName }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ row.userEmail }}</td>

              <td class="px-4 py-3 text-center">
                <span :class="scoreBadge(row.score)" class="text-sm font-bold">{{ row.score ?? '—' }}</span>
              </td>

              <td class="px-4 py-3 max-w-xs">
                <p class="text-xs text-gray-600 truncate" :title="row.interpretation">{{ row.interpretation || '—' }}</p>
              </td>

              <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{{ formatDate(row.completedAt) }}</td>

              <td class="px-4 py-3 text-center">
                <span :class="row.resultStatus === 'confirmed'
                  ? 'px-2 py-0.5 rounded-full text-green-700 bg-green-100 text-[10px] font-semibold'
                  : 'px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 text-[10px] font-semibold'">
                  {{ row.resultStatus === 'confirmed' ? 'Confirmed' : 'Pending' }}
                </span>
              </td>
            </tr>
            <tr v-if="leaderboardRows.length === 0">
              <td colspan="7" class="text-center py-8 text-gray-400 italic text-xs">
                No completed results yet for this test.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- ══════════════════════════════════════════════════════════════════ -->

    <!-- Filters bar -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Filter:</label>
          <button v-for="filter in filters" :key="filter.value"
            @click="currentFilter = filter.value"
            class="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
            :class="currentFilter === filter.value
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'">
            {{ filter.label }} ({{ filter.count }})
          </button>
        </div>
        <div class="ml-auto">
          <input v-model="searchQuery" type="text" placeholder="Search by name or email..."
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
    </div>

    <!-- ── User Result Lookup (Admin / Org only) ─────────────────────────── -->
    <div v-if="isAdmin || isOrganization" class="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <i class="fas fa-search text-green-500"></i> Look Up a User's Result for This Test
      </h2>
      <div class="relative max-w-sm">
        <input v-model="userSearchQuery" @input="onUserSearch" type="text"
          placeholder="Search by name or email..."
          class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        <ul v-if="userSearchResults.length && !selectedLookupUser"
          class="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm">
          <li v-for="u in userSearchResults" :key="u.id"
            @click="selectLookupUser(u)"
            class="px-4 py-2 hover:bg-green-50 cursor-pointer flex items-center gap-2">
            <span class="font-medium text-gray-800">{{ u.first_name }} {{ u.last_name }}</span>
            <span class="text-xs text-gray-400">{{ u.email }}</span>
          </li>
        </ul>
      </div>
      <div v-if="selectedLookupUser" class="mt-3 flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-3 py-1.5 rounded-full">
          <i class="fas fa-user-circle"></i>
          {{ selectedLookupUser.first_name }} {{ selectedLookupUser.last_name }}
          <button @click="clearLookupUser" class="ml-1 text-green-500 hover:text-red-500"><i class="fas fa-times"></i></button>
        </span>
        <button @click="loadUserResult(null)" :disabled="lookupLoading"
          class="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition">
          <i class="fas fa-chart-bar"></i>
          {{ lookupLoading ? 'Loading...' : 'View Result' }}
        </button>
      </div>
    </div>

    <!-- ── User Result Panel ──────────────────────────────────────────────── -->
    <div v-if="userResultPanel" id="user-result-panel" class="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div>
          <h2 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <i class="fas fa-user text-green-500"></i>
            Result for {{ selectedLookupUser?.first_name }} {{ selectedLookupUser?.last_name }}
            <span class="text-xs text-gray-400 font-normal">— {{ item.title }}</span>
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">{{ selectedLookupUser?.email }}</p>
        </div>
        <button @click="userResultPanel = null" class="text-gray-400 hover:text-gray-600 text-sm"><i class="fas fa-times"></i></button>
      </div>

      <div v-if="userResultPanel.noResult" class="px-6 py-8 text-center text-gray-400 italic text-sm">
        <i class="fas fa-inbox text-3xl mb-2 block text-gray-300"></i>
        This user has not completed this test yet.
      </div>

      <template v-else>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-gray-100">
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500 mb-1">Score</p>
            <span :class="scoreBadge(userResultPanel.result?.score)" class="text-base font-bold">{{ userResultPanel.result?.score ?? '—' }}</span>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500 mb-1">Status</p>
            <span :class="statusBadge(userResultPanel.result?.status)" class="text-xs font-semibold">
              {{ userResultPanel.result?.status === 'confirmed' ? 'Confirmed' : 'Pending' }}
            </span>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500 mb-1">Questions</p>
            <p class="text-base font-bold text-gray-800">{{ userResultPanel.matrix?.total_questions ?? '—' }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500 mb-1">Completed</p>
            <p class="text-xs font-medium text-gray-700">{{ formatDate(userResultPanel.result?.completed_at) }}</p>
          </div>
        </div>

        <div v-if="userResultPanel.result?.interpretation" class="px-6 py-3 border-b border-gray-100 bg-blue-50/40">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Interpretation</p>
          <p class="text-sm text-gray-700">{{ userResultPanel.result.interpretation }}</p>
        </div>

        <div class="p-5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4 flex items-center gap-1.5">
            <i class="fas fa-list-ul text-green-500"></i> Questions &amp; Answers
          </h3>
          <div v-if="userResultPanel.matrix?.questionsArray?.length > 0" class="space-y-3">
            <div v-for="q in userResultPanel.matrix.questionsArray" :key="'lookup-q-' + q.qId"
              class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div class="flex items-start gap-3">
                <span class="shrink-0 text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">Q{{ q.idx }}</span>
                <div class="flex-1">
                  <p class="font-medium text-gray-800 text-sm">{{ q.question_text }}</p>
                  <div class="mt-2 pl-3 border-l-2 border-green-400 py-1.5 rounded-r bg-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">User's Answer:</span>
                    <p class="text-sm text-gray-700 italic mt-0.5">
                      "{{ q.selected_option_text || '—' }}"
                      <span v-if="q.indication_letter" class="ml-2 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{{ q.indication_letter }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-gray-400 italic text-sm">
            <i class="fas fa-question-circle text-2xl mb-2 block text-gray-300"></i>
            No answer records found for this user on this test.
          </div>
        </div>
      </template>
    </div>

    <!-- Test Takers Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-sm font-semibold text-gray-700">{{ currentFilterLabel }} ({{ filteredTestTakers.length }})</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200">
          <thead class="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-3 text-left">#</th>
              <th class="px-6 py-3 text-left">Tester</th>
              <th class="px-6 py-3 text-center">Assignment Status</th>
              <th class="px-6 py-3 text-center">Test Status</th>
              <th class="px-6 py-3 text-center">Score</th>
              <th class="px-6 py-3 text-left">Due Date</th>
              <th class="px-6 py-3 text-left">Completed At</th>
              <th class="px-6 py-3 text-left">Interpretation</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(taker, index) in filteredTestTakers" :key="taker.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">{{ index + 1 }}</td>
              <td class="px-6 py-4">
                <p class="font-medium text-gray-700">{{ taker.userName }}</p>
                <p class="text-xs text-gray-400">{{ taker.userEmail }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="assignmentStatusBadge(taker.assignmentStatus)">{{ formatAssignmentStatus(taker.assignmentStatus) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="testStatusBadge(taker.testStatus)">{{ formatTestStatus(taker.testStatus) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="taker.score !== null" :class="scoreBadge(taker.score)">{{ taker.score }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="px-6 py-4 text-gray-500 text-xs">
                <span v-if="taker.dueDate" :class="dueDateClass(taker.dueDate)">{{ formatDate(taker.dueDate) }}</span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-6 py-4 text-gray-500 text-xs">{{ formatDate(taker.completedAt) }}</td>
              <td class="px-6 py-4 max-w-xs">
                <p class="text-gray-600 text-xs truncate">{{ taker.interpretation || '—' }}</p>
              </td>
              <td class="px-6 py-4 text-center space-x-2">
                <button v-if="taker.resultId && taker.resultStatus === 'pending'" @click="confirmResult(taker.resultId)"
                  title="Confirm Result" class="text-green-500 hover:text-green-700"><i class="fas fa-check-circle"></i></button>
                <button v-if="taker.testStatus === 'completed'" @click="viewUserAnswers(taker)"
                  title="View Answers" class="text-indigo-500 hover:text-indigo-700"><i class="fas fa-list-ul"></i></button>
                <button v-if="taker.resultId" @click="viewResult(taker.resultId)"
                  title="View Full Result" class="text-blue-500 hover:text-blue-700"><i class="fas fa-eye"></i></button>
                <button v-if="taker.progressId" @click="viewProgress(taker.progressId)"
                  title="View Progress" class="text-purple-500 hover:text-purple-700"><i class="fas fa-chart-line"></i></button>
              </td>
            </tr>
            <tr v-if="filteredTestTakers.length === 0">
              <td colspan="9" class="text-center py-8 text-gray-400 italic">{{ emptyMessage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default {
  components: { Loading },

  data() {
    return {
      item: {},
      testTakers: [],
      loading: false,
      currentFilter: 'all',
      searchQuery: '',
      // user result lookup
      userSearchQuery: '',
      userSearchResults: [],
      userSearchTimeout: null,
      selectedLookupUser: null,
      lookupLoading: false,
      userResultPanel: null,
      // leaderboard / export
      topN: 10,
      exportOrgFilter: '',
      exportGroupFilter: '',
      exportingPdf: false,
      exportingExcel: false,
      orgList: [],
      groupList: [],
    };
  },

  computed: {
    userRoles() {
      try {
        const raw = localStorage.getItem('roles');
        return raw ? JSON.parse(raw).map(r => (typeof r === 'string' ? r : r.name || '').toLowerCase()) : [];
      } catch { return []; }
    },
    isAdmin()        { return this.userRoles.includes('admin'); },
    isOrganization() { return this.userRoles.includes('organization'); },

    // All completed testers sorted by score desc
    rankedTesters() {
      return [...this.testTakers]
        .filter(t => t.testStatus === 'completed' && t.score !== null)
        .sort((a, b) => b.score - a.score);
    },

    // Leaderboard rows after org/group filter + topN slice
    leaderboardRows() {
      let rows = this.rankedTesters;

      if (this.exportOrgFilter) {
        rows = rows.filter(t => t.organizationId === parseInt(this.exportOrgFilter));
      }
      if (this.exportGroupFilter) {
        rows = rows.filter(t => (t.groupIds || []).includes(parseInt(this.exportGroupFilter)));
      }

      const n = parseInt(this.topN) || 10;
      return rows.slice(0, n);
    },

    filters() {
      return [
        { value: 'all',       label: 'All',             count: this.testTakers.length },
        { value: 'assigned',  label: 'Assigned',        count: this.testTakers.filter(t => t.assignmentStatus === 'assigned').length },
        { value: 'completed', label: 'Completed',       count: this.testTakers.filter(t => t.testStatus === 'completed').length },
        { value: 'pending',   label: 'Pending Approval',count: this.testTakers.filter(t => t.resultStatus === 'pending').length },
        { value: 'not_taken', label: 'Not Taken',       count: this.testTakers.filter(t => t.testStatus === 'not_taken').length },
      ];
    },

    currentFilterLabel() {
      return this.filters.find(f => f.value === this.currentFilter)?.label || 'All';
    },

    filteredTestTakers() {
      let list = this.testTakers;
      if (this.currentFilter === 'assigned')  list = list.filter(t => t.assignmentStatus === 'assigned');
      if (this.currentFilter === 'completed') list = list.filter(t => t.testStatus === 'completed');
      if (this.currentFilter === 'pending')   list = list.filter(t => t.resultStatus === 'pending');
      if (this.currentFilter === 'not_taken') list = list.filter(t => t.testStatus === 'not_taken');
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(t => t.userName.toLowerCase().includes(q) || t.userEmail.toLowerCase().includes(q));
      }
      return list;
    },

    emptyMessage() {
      const msgs = {
        all: 'No one has been assigned this test yet.',
        assigned: 'No users are currently assigned to this test.',
        completed: 'No one has completed this test yet.',
        pending: 'No results are pending approval.',
        not_taken: 'All assigned users have taken this test.',
      };
      if (this.searchQuery) return 'No test-takers match your search.';
      return msgs[this.currentFilter] || 'No data available.';
    },

    completedCount() { return this.testTakers.filter(t => t.testStatus === 'completed').length; },
    pendingCount()   { return this.testTakers.filter(t => t.resultStatus === 'pending').length; },
  },

  methods: {
    // ── Data fetching ─────────────────────────────────────────────────────
    async fetchTestDetails() {
      try {
        this.item = await this.$apiGetById('/test', this.$route.params.id) || {};
      } catch (e) { console.error(e); }
    },

    async fetchOrgsAndGroups() {
      try {
        const [orgsRes, groupsRes] = await Promise.all([
          this.$apiGet('/organization', { page: 1, page_size: 500 }),
          this.$apiGet('/group',        { page: 1, page_size: 500 }),
        ]);
        this.orgList   = orgsRes.data   || [];
        this.groupList = groupsRes.data || [];
      } catch (e) { console.error('Fetch orgs/groups error:', e); }
    },

    async fetchTestTakers() {
      const testId = parseInt(this.$route.params.id);
      try {
        const [assignmentsRes, resultsRes, progressRes] = await Promise.all([
          this.$apiGet('/test-assignments', { page: 1, page_size: 1000, test_id: testId }),
          this.$apiGet('/result',           { page: 1, page_size: 1000 }),
          this.$apiGet('/progress',         { page: 1, page_size: 1000 }),
        ]);

        const allAssignments = (assignmentsRes.data || []).filter(a => a.test_id === testId);
        const testResults    = (resultsRes.data    || []).filter(r => r.test_id === testId);
        const testProgress   = (progressRes.data   || []).filter(p => p.test_id === testId);

        const map = new Map();

        for (const a of allAssignments) {
          if (a.assigned_to_type !== 'user') continue;
          const uid = a.assigned_to_id;
          if (!map.has(uid)) {
            map.set(uid, {
              id: uid,
              userName: a.assignee?.name  || `User #${uid}`,
              userEmail: a.assignee?.email || '',
              organizationId: null,
              groupIds: [],
              assignmentStatus: 'assigned',
              assignmentId: a.id,
              dueDate: a.due_date,
              testStatus: 'not_taken',
              resultStatus: null,
              score: null,
              completedAt: null,
              interpretation: null,
              resultId: null,
              progressId: null,
            });
          }
        }

        for (const r of testResults) {
          const uid  = r.user_id;
          const name = r.User ? `${r.User.first_name} ${r.User.last_name}` : `User #${uid}`;
          const orgId = r.User?.organization_id || null;
          if (map.has(uid)) {
            const t = map.get(uid);
            t.testStatus     = 'completed';
            t.resultStatus   = r.status || 'pending';
            t.score          = r.score;
            t.completedAt    = r.completed_at;
            t.interpretation = r.interpretation;
            t.resultId       = r.id;
            t.organizationId = orgId;
          } else {
            map.set(uid, {
              id: uid,
              userName: name,
              userEmail: r.User?.email || '',
              organizationId: orgId,
              groupIds: [],
              assignmentStatus: 'assigned',
              assignmentId: null,
              dueDate: null,
              testStatus: 'completed',
              resultStatus: r.status || 'pending',
              score: r.score,
              completedAt: r.completed_at,
              interpretation: r.interpretation,
              resultId: r.id,
              progressId: null,
            });
          }
        }

        for (const p of testProgress) {
          const uid = p.user_id;
          if (map.has(uid)) {
            const t = map.get(uid);
            t.progressId = p.id;
            if (t.testStatus === 'not_taken') t.testStatus = 'in_progress';
          }
        }

        this.testTakers = Array.from(map.values());
      } catch (e) { console.error('Fetch test takers error:', e); }
    },

    // ── Export helpers ────────────────────────────────────────────────────
    buildExportRows() {
      return this.leaderboardRows.map((row, idx) => ({
        Rank:           idx + 1,
        Name:           row.userName,
        Email:          row.userEmail,
        Score:          row.score ?? '',
        Interpretation: row.interpretation || '',
        'Completed At': row.completedAt ? new Date(row.completedAt).toLocaleString('en-GB') : '',
        Status:         row.resultStatus === 'confirmed' ? 'Confirmed' : 'Pending',
      }));
    },

    exportExcel() {
      this.exportingExcel = true;
      try {
        const rows = this.buildExportRows();
        const ws   = XLSX.utils.json_to_sheet(rows);
        // Column widths
        ws['!cols'] = [
          { wch: 6 }, { wch: 24 }, { wch: 30 }, { wch: 8 },
          { wch: 50 }, { wch: 20 }, { wch: 12 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');
        const filename = `${this.item.title || 'test'}_top${this.leaderboardRows.length}_results.xlsx`
          .replace(/[^a-z0-9_\-.]/gi, '_');
        XLSX.writeFile(wb, filename);
        this.$root.$refs.toast?.showToast('Excel exported successfully', 'success');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast?.showToast('Excel export failed', 'error');
      } finally {
        this.exportingExcel = false;
      }
    },

    exportCsv() {
      try {
        const rows = this.buildExportRows();
        const headers = Object.keys(rows[0] || {});
        const csvLines = [
          headers.join(','),
          ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
        ];
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${this.item.title || 'test'}_top${this.leaderboardRows.length}_results.csv`
          .replace(/[^a-z0-9_\-.]/gi, '_');
        a.click();
        URL.revokeObjectURL(url);
        this.$root.$refs.toast?.showToast('CSV exported successfully', 'success');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast?.showToast('CSV export failed', 'error');
      }
    },

    exportPdf() {
      this.exportingPdf = true;
      try {
        const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const rows = this.buildExportRows();

        // Title block
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${this.item.title || 'Test'} — Top ${this.leaderboardRows.length} Results`, 14, 16);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(`Exported: ${new Date().toLocaleString('en-GB')}`, 14, 22);
        doc.setTextColor(0);

        doc.autoTable({
          startY: 27,
          head: [['Rank', 'Name', 'Email', 'Score', 'Interpretation', 'Completed At', 'Status']],
          body: rows.map(r => [r.Rank, r.Name, r.Email, r.Score, r.Interpretation, r['Completed At'], r.Status]),
          styles:       { fontSize: 8, cellPadding: 3 },
          headStyles:   { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            3: { cellWidth: 16, halign: 'center' },
            6: { cellWidth: 22, halign: 'center' },
          },
          alternateRowStyles: { fillColor: [248, 247, 255] },
          didDrawCell: (data) => {
            // Gold/silver/bronze row tint
            if (data.section === 'body' && data.column.index === 0) {
              const rank = data.row.index;
              if (rank === 0) doc.setFillColor(255, 215, 0);
              else if (rank === 1) doc.setFillColor(192, 192, 192);
              else if (rank === 2) doc.setFillColor(205, 127, 50);
            }
          },
        });

        const filename = `${this.item.title || 'test'}_top${this.leaderboardRows.length}_results.pdf`
          .replace(/[^a-z0-9_\-.]/gi, '_');
        doc.save(filename);
        this.$root.$refs.toast?.showToast('PDF exported successfully', 'success');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast?.showToast('PDF export failed', 'error');
      } finally {
        this.exportingPdf = false;
      }
    },

    // ── Actions ───────────────────────────────────────────────────────────
    async confirmResult(resultId) {
      try {
        await this.$apiPut(`/result/${resultId}/status`, { status: 'confirmed' });
        this.$root.$refs.toast?.showToast('Result confirmed successfully', 'success');
        this.fetchTestTakers();
      } catch (e) {
        this.$root.$refs.toast?.showToast('Failed to confirm result', 'error');
      }
    },

    viewResult(resultId)     { this.$router.push({ name: 'Result-detail',   params: { id: resultId } }); },
    viewProgress(progressId) { this.$router.push({ name: 'Progress-detail', params: { id: progressId } }); },

    async viewUserAnswers(taker) {
      this.selectedLookupUser = {
        id:         taker.id,
        first_name: taker.userName.split(' ')[0] || taker.userName,
        last_name:  taker.userName.split(' ').slice(1).join(' ') || '',
        email:      taker.userEmail,
      };
      this.userSearchQuery   = taker.userName;
      this.userSearchResults = [];

      const preloaded = taker.resultId ? {
        id: taker.resultId, score: taker.score,
        status: taker.resultStatus, completed_at: taker.completedAt,
        interpretation: taker.interpretation,
      } : null;

      await this.loadUserResult(preloaded);

      this.$nextTick(() => {
        const el = document.getElementById('user-result-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },

    // ── User result lookup ────────────────────────────────────────────────
    onUserSearch() {
      clearTimeout(this.userSearchTimeout);
      this.userResultPanel = null;
      if (!this.userSearchQuery.trim()) { this.userSearchResults = []; return; }
      this.userSearchTimeout = setTimeout(async () => {
        try {
          const res = await this.$apiGet('/user', { page: 1, page_size: 20, search: this.userSearchQuery });
          this.userSearchResults = res.data || [];
        } catch (e) { this.userSearchResults = []; }
      }, 300);
    },

    selectLookupUser(user) {
      this.selectedLookupUser = user;
      this.userSearchQuery    = `${user.first_name} ${user.last_name}`;
      this.userSearchResults  = [];
      this.userResultPanel    = null;
    },

    clearLookupUser() {
      this.selectedLookupUser = null;
      this.userSearchQuery    = '';
      this.userSearchResults  = [];
      this.userResultPanel    = null;
    },

    async loadUserResult(preloadedResult) {
      if (!this.selectedLookupUser) return;
      const testId = this.$route.params.id;
      const userId = this.selectedLookupUser.id;
      this.lookupLoading  = true;
      this.userResultPanel = null;

      try {
        const [matrixRes, resultData] = await Promise.all([
          this.$apiGet(`/result/user/${userId}/test/${testId}/answers-matrix`),
          preloadedResult
            ? Promise.resolve(preloadedResult)
            : this.$apiGet('/result', { page: 1, page_size: 1000 }).then(res =>
                (res.data || []).find(r => r.user_id === userId && r.test_id === parseInt(testId)) || null
              ),
        ]);

        const hasAnswers = matrixRes?.success && Object.keys(matrixRes.questions || {}).length > 0;

        if (!resultData && !hasAnswers) {
          this.userResultPanel = { noResult: true };
        } else {
          const questionsArray = Object.entries(matrixRes?.questions || {}).map(([qId, q], idx) => ({
            qId, idx: idx + 1, ...q,
          }));
          this.userResultPanel = {
            noResult: false,
            result: resultData,
            matrix: matrixRes?.success ? { ...matrixRes, questionsArray } : null,
          };
        }
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast?.showToast('Failed to load user result', 'error');
      } finally {
        this.lookupLoading = false;
      }
    },

    // ── Badge / format helpers ────────────────────────────────────────────
    scoreBadge(score) {
      if (score == null) return 'px-2 py-0.5 rounded text-gray-400 bg-gray-100 text-xs font-medium';
      if (score >= 80)   return 'px-2 py-0.5 rounded text-green-700 bg-green-100 text-xs font-medium';
      if (score >= 60)   return 'px-2 py-0.5 rounded text-amber-700 bg-amber-100 text-xs font-medium';
      return 'px-2 py-0.5 rounded text-red-700 bg-red-100 text-xs font-medium';
    },

    statusBadge(status) {
      const m = {
        confirmed:   'px-2 py-0.5 rounded-full text-green-700 bg-green-100 text-xs font-semibold',
        pending:     'px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 text-xs font-semibold',
        in_progress: 'px-2 py-0.5 rounded-full text-blue-700 bg-blue-100 text-xs font-semibold',
      };
      return m[status] || 'px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 text-xs font-semibold';
    },

    assignmentStatusBadge(s) {
      return s === 'assigned'
        ? 'px-2 py-0.5 rounded-full text-blue-700 bg-blue-100 text-xs font-semibold'
        : 'px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 text-xs font-semibold';
    },

    testStatusBadge(s) {
      const m = {
        completed:   'px-2 py-0.5 rounded-full text-green-700 bg-green-100 text-xs font-semibold',
        in_progress: 'px-2 py-0.5 rounded-full text-blue-700 bg-blue-100 text-xs font-semibold',
        not_taken:   'px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 text-xs font-semibold',
      };
      return m[s] || m.not_taken;
    },

    formatAssignmentStatus(s) { return s === 'assigned' ? 'Assigned' : 'Not Assigned'; },
    formatTestStatus(s) {
      return { completed: 'Completed', in_progress: 'In Progress', not_taken: 'Not Taken' }[s] || '—';
    },

    dueDateClass(d) {
      if (!d) return '';
      const days = Math.ceil((new Date(d) - new Date()) / 86400000);
      if (days < 0)  return 'text-red-600 font-semibold';
      if (days <= 3) return 'text-amber-600 font-semibold';
      return 'text-gray-600';
    },

    formatDate(date) {
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    },
  },

  async mounted() {
    this.loading = true;
    await Promise.all([
      this.fetchTestDetails(),
      this.fetchTestTakers(),
      this.fetchOrgsAndGroups(),
    ]);
    this.loading = false;
  },
};
</script>
