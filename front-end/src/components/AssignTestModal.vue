<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">

      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <i class="fas fa-clipboard-check text-white text-sm"></i>
          </div>
          <div>
            <h2 class="text-white font-bold text-sm">Assign Test</h2>
            <!-- When test is fixed, show test name; otherwise show target name -->
            <p v-if="test" class="text-purple-100 text-[10px] uppercase tracking-widest flex items-center gap-1">
              <i class="fas fa-file-alt"></i> {{ test.title }}
            </p>
            <p v-else class="text-purple-100 text-[10px] uppercase tracking-widest flex items-center gap-1">
              <i :class="targetType === 'user' ? 'fas fa-user' : 'fas fa-users'"></i>
              {{ targetName }}
            </p>
          </div>
        </div>
        <button @click="$emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <!-- Tab switcher — only shown when opened from TestView (test prop provided, no fixed target) -->
      <div v-if="test && !targetId" class="flex border-b border-gray-100 shrink-0 px-6 pt-4 gap-1">
        <button
          @click="assignMode = 'user'"
          class="px-4 py-2 text-xs font-semibold rounded-t-lg transition-all"
          :class="assignMode === 'user'
            ? 'bg-purple-500 text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
        >
          <i class="fas fa-user mr-1.5"></i>Assign to User
        </button>
        <button
          @click="assignMode = 'group'"
          class="px-4 py-2 text-xs font-semibold rounded-t-lg transition-all"
          :class="assignMode === 'group'
            ? 'bg-purple-500 text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
        >
          <i class="fas fa-users mr-1.5"></i>Assign to Group
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6 space-y-5">

        <!-- ── Fixed test info (when test prop is passed) ── -->
        <div v-if="test" class="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
          <div class="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
            <i class="fas fa-file-alt text-purple-600 text-sm"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-purple-800 truncate">{{ test.title }}</p>
            <p class="text-xs text-purple-500">{{ test.duration || 'No duration set' }}</p>
          </div>
          <span class="text-[10px] bg-purple-200 text-purple-700 font-semibold px-2 py-0.5 rounded-full">Selected</span>
        </div>

        <!-- ── Test selector (when no test prop — opened from Users/Groups view) ── -->
        <div v-if="!test">
          <label class="block mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Select Test
          </label>
          <div class="relative mb-2">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
            <input
              v-model="testSearch"
              type="text"
              placeholder="Search tests..."
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
          </div>
          <div v-if="loadingTests" class="py-6 text-center text-gray-400">
            <i class="fas fa-spinner animate-spin text-lg"></i>
          </div>
          <div v-else class="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-100">
            <label
              v-for="t in filteredTests"
              :key="t.id"
              class="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 cursor-pointer transition"
              :class="selectedTestId === t.id ? 'bg-purple-50' : ''"
            >
              <input type="radio" :value="t.id" v-model="selectedTestId" class="w-4 h-4 accent-purple-500 shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ t.title }}</p>
                <p class="text-xs text-gray-400">{{ t.duration || 'No duration set' }}</p>
              </div>
              <i v-if="selectedTestId === t.id" class="fas fa-check-circle text-purple-500 shrink-0"></i>
            </label>
            <p v-if="!filteredTests.length" class="text-center py-5 text-gray-400 italic text-xs">
              {{ testSearch ? 'No tests match your search.' : 'No tests available.' }}
            </p>
          </div>
        </div>

        <!-- ── Target selector (when test is fixed — opened from TestView) ── -->
        <div v-if="test && !targetId">
          <label class="block mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {{ assignMode === 'user' ? 'Select User' : 'Select Group' }}
          </label>

          <!-- Search -->
          <div class="relative mb-2">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
            <input
              v-model="targetSearch"
              @input="onTargetSearch"
              type="text"
              :placeholder="assignMode === 'user' ? 'Search by name or email...' : 'Search groups...'"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
          </div>

          <!-- Target list -->
          <div v-if="loadingTargets" class="py-6 text-center text-gray-400">
            <i class="fas fa-spinner animate-spin text-lg"></i>
          </div>
          <div v-else class="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-100">
            <label
              v-for="item in filteredTargets"
              :key="item.id"
              class="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 cursor-pointer transition"
              :class="selectedTargetId === item.id ? 'bg-purple-50' : ''"
            >
              <input type="radio" :value="item.id" v-model="selectedTargetId" class="w-4 h-4 accent-purple-500 shrink-0" />
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                :class="assignMode === 'user' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                {{ assignMode === 'user'
                  ? ((item.first_name?.[0] || '') + (item.last_name?.[0] || '')).toUpperCase()
                  : (item.name?.[0] || 'G').toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">
                  {{ assignMode === 'user' ? `${item.first_name} ${item.last_name}` : item.name }}
                </p>
                <p class="text-xs text-gray-400 truncate">
                  {{ assignMode === 'user' ? item.email : (item.description || '') }}
                </p>
              </div>
              <i v-if="selectedTargetId === item.id" class="fas fa-check-circle text-purple-500 shrink-0"></i>
            </label>
            <p v-if="!filteredTargets.length" class="text-center py-5 text-gray-400 italic text-xs">
              {{ targetSearch ? 'No results match your search.' : `No ${assignMode === 'user' ? 'users' : 'groups'} available.` }}
            </p>
          </div>
        </div>

        <!-- Due date -->
        <div>
          <label class="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Due Date <span class="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            v-model="dueDate"
            type="date"
            class="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Notes <span class="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="Instructions or context for the tester..."
            class="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm resize-none"
          ></textarea>
        </div>

        <!-- Email notice -->
        <div class="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
          <i class="fas fa-envelope mt-0.5 shrink-0 text-indigo-400"></i>
          <span>
            A notification email with login credentials will be sent automatically to
            <strong>{{ effectiveTargetType === 'group' ? 'all members of the selected group' : 'the selected user' }}</strong>.
          </span>
        </div>

      </div>

      <!-- Footer -->
      <div class="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
        <button type="button" @click="$emit('close')"
          class="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
          Cancel
        </button>
        <button
          @click="submitAssignment"
          :disabled="loading || !canSubmit"
          class="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
        >
          <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
          <i v-else class="fas fa-clipboard-check text-xs"></i>
          {{ loading ? 'Assigning...' : 'Assign Test' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'AssignTestModal',

  props: {
    // ── Mode A: opened from Users/Groups view — test must be selected ──
    targetType: { type: String, default: null },   // "user" or "group"
    targetId:   { type: Number, default: null },
    targetName: { type: String, default: '' },

    // ── Mode B: opened from TestView — test is fixed, target must be selected ──
    test: { type: Object, default: null },          // { id, title, duration }

    // Optional pre-selection (Mode A)
    preselectedTestId: { type: Number, default: null },
  },

  emits: ['close', 'assigned'],

  data() {
    return {
      // Mode A — test selection
      allTests:       [],
      testSearch:     '',
      selectedTestId: null,
      loadingTests:   false,

      // Mode B — target selection
      assignMode:       'user',   // 'user' | 'group'
      allTargets:       [],
      filteredTargets:  [],
      targetSearch:     '',
      selectedTargetId: null,
      loadingTargets:   false,
      targetSearchTimeout: null,

      // Shared
      dueDate:  '',
      notes:    '',
      loading:  false,
    };
  },

  computed: {
    // Which test ID to submit
    effectiveTestId() {
      return this.test ? this.test.id : this.selectedTestId;
    },

    // Which target type to submit
    effectiveTargetType() {
      return this.targetId ? this.targetType : this.assignMode;
    },

    // Which target ID to submit
    effectiveTargetId() {
      return this.targetId ?? this.selectedTargetId;
    },

    canSubmit() {
      return !!this.effectiveTestId && !!this.effectiveTargetId;
    },

    filteredTests() {
      if (!this.testSearch.trim()) return this.allTests;
      const q = this.testSearch.toLowerCase();
      return this.allTests.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    },
  },

  watch: {
    // When switching between user/group tabs, reset selection and reload
    assignMode() {
      this.selectedTargetId = null;
      this.targetSearch = '';
      this.loadTargets();
    },
  },

  methods: {
    // ── Mode A: fetch all tests ──
    async fetchTests() {
      this.loadingTests = true;
      try {
        const res = await this.$apiGet('/test/all', { page: 1, page_size: 500 });
        this.allTests = res.data || [];
      } catch (e) {
        console.error('Fetch tests error:', e);
      } finally {
        this.loadingTests = false;
      }
    },

    // ── Mode B: load users or groups ──
    async loadTargets() {
      this.loadingTargets = true;
      try {
        if (this.assignMode === 'user') {
          const res = await this.$apiGet('/users', { page: 1, page_size: 200, search: this.targetSearch });
          this.allTargets = res.data || [];
        } else {
          const res = await this.$apiGet('/group', { page: 1, page_size: 200, search: this.targetSearch });
          this.allTargets = res.data || [];
        }
        this.filteredTargets = [...this.allTargets];
      } catch (e) {
        console.error('Load targets error:', e);
        this.allTargets = [];
        this.filteredTargets = [];
      } finally {
        this.loadingTargets = false;
      }
    },

    onTargetSearch() {
      clearTimeout(this.targetSearchTimeout);
      this.targetSearchTimeout = setTimeout(() => this.loadTargets(), 300);
    },

    async submitAssignment() {
      if (!this.canSubmit) return;
      this.loading = true;
      try {
        await this.$apiPost('/test-assignments', {
          test_id:          this.effectiveTestId,
          assigned_to_type: this.effectiveTargetType,
          assigned_to_id:   this.effectiveTargetId,
          assigned_by:      parseInt(localStorage.getItem('userId')),
          due_date:         this.dueDate || null,
          notes:            this.notes   || null,
        });
        this.$root.$refs.toast?.showToast('Test assigned successfully', 'success');
        this.$emit('assigned');
        this.$emit('close');
      } catch (e) {
        console.error('Assign test error:', e);
        const msg = e?.response?.data?.error || e?.message || 'Failed to assign test';
        this.$root.$refs.toast?.showToast(msg, 'error');
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    if (!this.test) {
      // Mode A: need to load tests
      this.fetchTests();
      if (this.preselectedTestId) this.selectedTestId = this.preselectedTestId;
    } else if (!this.targetId) {
      // Mode B: test is fixed, load targets
      this.loadTargets();
    }
  },
};
</script>
