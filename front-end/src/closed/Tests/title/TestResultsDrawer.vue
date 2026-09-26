<template>
  <teleport to="body">
    <!-- Backdrop -->
    <transition enter-active-class="transition-opacity duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]" @click="$emit('close')"></div>
    </transition>

    <!-- Drawer -->
    <transition enter-active-class="transition-transform duration-300 ease-out" enter-from-class="translate-x-full" enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in" leave-from-class="translate-x-0" leave-to-class="translate-x-full">
      <div class="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[160] flex flex-col">

        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <i class="fas fa-chart-bar text-white text-sm"></i>
            </div>
            <div>
              <h2 class="text-white font-bold text-sm">Results</h2>
              <p class="text-indigo-200 text-[10px] uppercase tracking-widest truncate max-w-xs">{{ test.title }}</p>
            </div>
          </div>
          <button @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <!-- Summary stats (admin/org only) -->
        <div v-if="isAdmin || isOrganization" class="shrink-0 grid grid-cols-3 gap-px bg-gray-200 border-b border-gray-200">
          <div class="bg-white px-4 py-3 text-center">
            <p class="text-xl font-black text-gray-900">{{ stats.total }}</p>
            <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Total</p>
          </div>
          <div class="bg-white px-4 py-3 text-center">
            <p class="text-xl font-black text-green-600">{{ stats.confirmed }}</p>
            <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Confirmed</p>
          </div>
          <div class="bg-white px-4 py-3 text-center">
            <p class="text-xl font-black text-amber-500">{{ stats.avgScore }}</p>
            <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Avg Score</p>
          </div>
        </div>

        <!-- Search (admin/org) -->
        <div v-if="isAdmin || isOrganization" class="shrink-0 px-5 py-3 border-b border-gray-100">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
            <input v-model="search" @input="applyFilter" type="text" placeholder="Search by name or email…"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto">

          <!-- Loading -->
          <div v-if="loading" class="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
            <i class="fas fa-spinner fa-spin text-2xl text-indigo-400"></i>
            <span class="text-xs">Loading results…</span>
          </div>

          <!-- Empty -->
          <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
            <i class="fas fa-inbox text-3xl"></i>
            <span class="text-xs">No results found for this test.</span>
          </div>

          <!-- Results list -->
          <div v-else class="divide-y divide-gray-100">
            <div v-for="r in filtered" :key="r.id"
              class="px-5 py-4 hover:bg-gray-50 transition">

              <!-- Row header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <!-- Avatar -->
                  <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                    {{ userInitials(r) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">
                      {{ r.User ? r.User.first_name + ' ' + r.User.last_name : 'User #' + r.user_id }}
                    </p>
                    <p class="text-xs text-gray-400 truncate">{{ r.User?.email || '' }}</p>
                  </div>
                </div>

                <!-- Score + status -->
                <div class="flex items-center gap-2 shrink-0">
                  <span :class="scoreBadge(r.score)" class="text-xs font-bold px-2.5 py-1 rounded-lg">
                    {{ r.score !== null && r.score !== undefined ? r.score + '%' : '—' }}
                  </span>
                  <span :class="statusBadge(r.status)" class="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                    {{ r.status || 'pending' }}
                  </span>
                </div>
              </div>

              <!-- Details row -->
              <div class="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 pl-12">
                <div>
                  <span class="text-gray-400">Completed:</span>
                  <span class="ml-1 font-medium text-gray-700">{{ formatDate(r.completed_at) }}</span>
                </div>
                <div v-if="r.interpretation" class="col-span-2">
                  <span class="text-gray-400">Interpretation:</span>
                  <span class="ml-1 font-medium text-gray-700 italic">{{ r.interpretation }}</span>
                </div>
              </div>

              <!-- Confirm action (admin/org, pending only) -->
              <div v-if="(isAdmin || isOrganization) && r.status === 'pending'" class="mt-3 pl-12">
                <button @click="confirmResult(r)"
                  :disabled="confirming === r.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60">
                  <i v-if="confirming === r.id" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-check"></i>
                  Confirm Result
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-400">
          <span>{{ filtered.length }} result(s)</span>
          <button @click="$emit('close')"
            class="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition text-xs font-medium">
            Close
          </button>
        </div>

      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: 'TestResultsDrawer',
  emits: ['close'],

  props: {
    test: { type: Object, required: true },
  },

  data() {
    return {
      loading: false,
      results: [],
      filtered: [],
      search: '',
      confirming: null,
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
    userId()         { return localStorage.getItem('userId'); },
    organizationId() { return localStorage.getItem('organizationId'); },

    stats() {
      const total     = this.results.length;
      const confirmed = this.results.filter(r => r.status === 'confirmed').length;
      const scores    = this.results.map(r => r.score).filter(s => s !== null && s !== undefined);
      const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%' : '—';
      return { total, confirmed, avgScore };
    },
  },

  methods: {
    userInitials(r) {
      if (!r.User) return '?';
      return ((r.User.first_name?.[0] || '') + (r.User.last_name?.[0] || '')).toUpperCase();
    },

    applyFilter() {
      const q = this.search.toLowerCase().trim();
      if (!q) { this.filtered = [...this.results]; return; }
      this.filtered = this.results.filter(r => {
        const name = `${r.User?.first_name || ''} ${r.User?.last_name || ''}`.toLowerCase();
        return name.includes(q) || r.User?.email?.toLowerCase().includes(q);
      });
    },

    scoreBadge(score) {
      if (score === null || score === undefined) return 'bg-gray-100 text-gray-500';
      if (score >= 80) return 'bg-green-100 text-green-700';
      if (score >= 60) return 'bg-amber-100 text-amber-700';
      return 'bg-red-100 text-red-700';
    },

    statusBadge(status) {
      if (status === 'confirmed') return 'bg-green-100 text-green-700';
      return 'bg-amber-100 text-amber-700';
    },

    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    async fetchResults() {
      this.loading = true;
      try {
        const res = await this.$apiGet('/result', { page: 1, page_size: 1000, test_id: this.test.id });
        let all = res.data || [];

        // Role-based filter
        if (this.isAdmin) {
          // all
        } else if (this.isOrganization) {
          const orgId = parseInt(this.organizationId);
          all = all.filter(r => r.User?.organization_id === orgId);
        } else {
          const uid = parseInt(this.userId);
          all = all.filter(r => r.user_id === uid || r.User?.id === uid);
        }

        // Filter to this test
        this.results = all.filter(r => r.test_id === this.test.id);
        this.filtered = [...this.results];
      } catch (e) {
        console.error('Fetch results error:', e);
      } finally {
        this.loading = false;
      }
    },

    async confirmResult(r) {
      this.confirming = r.id;
      try {
        await this.$apiPut('/result', r.id, { status: 'confirmed' });
        r.status = 'confirmed';
        this.$root.$refs.toast?.showToast('Result confirmed', 'success');
      } catch (e) {
        this.$root.$refs.toast?.showToast('Failed to confirm result', 'error');
      } finally {
        this.confirming = null;
      }
    },
  },

  mounted() {
    this.fetchResults();
  },
};
</script>
