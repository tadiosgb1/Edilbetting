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
        <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <i class="fas fa-tasks text-white text-sm"></i>
            </div>
            <div>
              <h2 class="text-white font-bold text-sm">Progress</h2>
              <p class="text-purple-200 text-[10px] uppercase tracking-widest truncate max-w-xs">{{ test.title }}</p>
            </div>
          </div>
          <button @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <!-- Summary stats (admin/org) -->
        <div v-if="isAdmin || isOrganization" class="shrink-0 grid grid-cols-3 gap-px bg-gray-200 border-b border-gray-200">
          <div class="bg-white px-4 py-3 text-center">
            <p class="text-xl font-black text-gray-900">{{ stats.total }}</p>
            <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Participants</p>
          </div>
          <div class="bg-white px-4 py-3 text-center">
            <p class="text-xl font-black text-green-600">{{ stats.completed }}</p>
            <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Completed</p>
          </div>
          <div class="bg-white px-4 py-3 text-center">
            <p class="text-xl font-black text-purple-600">{{ stats.avgPct }}%</p>
            <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Avg Progress</p>
          </div>
        </div>

        <!-- Search (admin/org) -->
        <div v-if="isAdmin || isOrganization" class="shrink-0 px-5 py-3 border-b border-gray-100">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
            <input v-model="search" @input="applyFilter" type="text" placeholder="Search by name or email…"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 transition" />
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto">

          <!-- Loading -->
          <div v-if="loading" class="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
            <i class="fas fa-spinner fa-spin text-2xl text-purple-400"></i>
            <span class="text-xs">Loading progress…</span>
          </div>

          <!-- Empty -->
          <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
            <i class="fas fa-hourglass-start text-3xl"></i>
            <span class="text-xs">No progress records found for this test.</span>
          </div>

          <!-- Progress list -->
          <div v-else class="divide-y divide-gray-100">
            <div v-for="p in filtered" :key="p.id" class="px-5 py-4 hover:bg-gray-50 transition">

              <!-- Row header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                    {{ userInitials(p) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">
                      {{ p.User ? p.User.first_name + ' ' + p.User.last_name : 'User #' + p.user_id }}
                    </p>
                    <p class="text-xs text-gray-400 truncate">{{ p.User?.email || '' }}</p>
                  </div>
                </div>

                <!-- Status badge -->
                <span :class="activityBadge(p)" class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                  {{ activityLabel(p) }}
                </span>
              </div>

              <!-- Progress bar -->
              <div class="mt-3 pl-12">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Completion</span>
                  <span class="text-xs font-bold" :class="pctColor(p.percentage_completed)">
                    {{ p.percentage_completed !== null && p.percentage_completed !== undefined
                      ? p.percentage_completed + '%'
                      : '—' }}
                  </span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-500"
                    :class="pctBarColor(p.percentage_completed)"
                    :style="{ width: (p.percentage_completed || 0) + '%' }">
                  </div>
                </div>
              </div>

              <!-- Meta details -->
              <div class="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 pl-12">
                <div v-if="p.current_question">
                  <span class="text-gray-400">Current Q:</span>
                  <span class="ml-1 font-medium text-gray-700">#{{ p.current_question }}</span>
                </div>
                <div v-if="p.time_spent">
                  <span class="text-gray-400">Time spent:</span>
                  <span class="ml-1 font-medium text-gray-700">{{ formatTime(p.time_spent) }}</span>
                </div>
                <div v-if="p.taken_at">
                  <span class="text-gray-400">Started:</span>
                  <span class="ml-1 font-medium text-gray-700">{{ formatDate(p.taken_at) }}</span>
                </div>
                <div v-if="p.updated_at">
                  <span class="text-gray-400">Last activity:</span>
                  <span class="ml-1 font-medium text-gray-700">{{ formatDate(p.updated_at) }}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-400">
          <span>{{ filtered.length }} record(s)</span>
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
  name: 'TestProgressDrawer',
  emits: ['close'],

  props: {
    test: { type: Object, required: true },
  },

  data() {
    return {
      loading: false,
      records: [],
      filtered: [],
      search: '',
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
      const total     = this.records.length;
      const completed = this.records.filter(p => (p.percentage_completed || 0) >= 100).length;
      const pcts      = this.records.map(p => p.percentage_completed).filter(v => v !== null && v !== undefined);
      const avgPct    = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
      return { total, completed, avgPct };
    },
  },

  methods: {
    userInitials(p) {
      if (!p.User) return '?';
      return ((p.User.first_name?.[0] || '') + (p.User.last_name?.[0] || '')).toUpperCase();
    },

    applyFilter() {
      const q = this.search.toLowerCase().trim();
      if (!q) { this.filtered = [...this.records]; return; }
      this.filtered = this.records.filter(p => {
        const name = `${p.User?.first_name || ''} ${p.User?.last_name || ''}`.toLowerCase();
        return name.includes(q) || p.User?.email?.toLowerCase().includes(q);
      });
    },

    activityLabel(p) {
      const pct = p.percentage_completed || 0;
      if (pct >= 100) return 'Completed';
      if (pct > 0)    return 'In Progress';
      return 'Not Started';
    },

    activityBadge(p) {
      const pct = p.percentage_completed || 0;
      if (pct >= 100) return 'bg-green-100 text-green-700';
      if (pct > 0)    return 'bg-blue-100 text-blue-700';
      return 'bg-gray-100 text-gray-500';
    },

    pctColor(pct) {
      if (pct === null || pct === undefined) return 'text-gray-400';
      if (pct >= 100) return 'text-green-600';
      if (pct >= 50)  return 'text-blue-600';
      return 'text-purple-600';
    },

    pctBarColor(pct) {
      if (!pct) return 'bg-gray-300';
      if (pct >= 100) return 'bg-green-500';
      if (pct >= 50)  return 'bg-blue-500';
      return 'bg-purple-500';
    },

    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatTime(seconds) {
      if (!seconds) return '—';
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    },

    async fetchProgress() {
      this.loading = true;
      try {
        const res = await this.$apiGet('/progress', { page: 1, page_size: 1000, test_id: this.test.id });
        let all = res.data || [];

        // Role-based filter
        if (this.isAdmin) {
          // all
        } else if (this.isOrganization) {
          const orgId = parseInt(this.organizationId);
          all = all.filter(p => p.User?.organization_id === orgId);
        } else {
          const uid = parseInt(this.userId);
          all = all.filter(p => p.user_id === uid || p.User?.id === uid);
        }

        // Filter to this test
        this.records = all.filter(p => p.test_id === this.test.id);
        this.filtered = [...this.records];
      } catch (e) {
        console.error('Fetch progress error:', e);
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.fetchProgress();
  },
};
</script>
