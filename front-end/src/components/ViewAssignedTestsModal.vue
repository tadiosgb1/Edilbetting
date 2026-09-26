<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">

      <!-- Header -->
      <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <i class="fas fa-list-alt text-white text-sm"></i>
          </div>
          <div>
            <h2 class="text-white font-bold text-sm">Assigned Tests</h2>
            <p class="text-indigo-100 text-[10px] uppercase tracking-widest flex items-center gap-1">
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

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6">

        <!-- Loading -->
        <div v-if="loading" class="py-10 text-center text-gray-400">
          <i class="fas fa-spinner animate-spin text-2xl mb-2 block"></i>
          <span class="text-xs">Loading assignments...</span>
        </div>

        <!-- Empty -->
        <div v-else-if="assignments.length === 0" class="py-10 text-center text-gray-400">
          <i class="fas fa-clipboard text-3xl mb-2 block text-gray-300"></i>
          <p class="text-sm font-medium text-gray-500">No tests assigned yet</p>
          <p class="text-xs text-gray-400 mt-1">Use the Assign Test button to get started.</p>
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
          <div
            v-for="a in assignments"
            :key="a.id"
            class="flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-800 truncate text-sm">{{ a.test?.title || '—' }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <span :class="statusBadge(a.status)">{{ formatStatus(a.status) }}</span>
                <span v-if="a.test?.duration" class="text-[10px] text-gray-400">
                  <i class="fas fa-clock mr-0.5"></i>{{ a.test.duration }}
                </span>
                <span v-if="a.due_date" class="text-[10px]" :class="dueDateClass(a.due_date)">
                  <i class="fas fa-calendar-alt mr-0.5"></i>Due: {{ formatDate(a.due_date) }}
                </span>
              </div>
              <p v-if="a.notes" class="text-xs text-gray-500 mt-1.5 italic bg-gray-50 px-2 py-1 rounded">
                "{{ a.notes }}"
              </p>
            </div>
            <button
              @click="removeAssignment(a.id)"
              :disabled="removingId === a.id"
              title="Remove assignment"
              class="ml-3 shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
            >
              <i v-if="removingId === a.id" class="fas fa-spinner animate-spin text-xs"></i>
              <i v-else class="fas fa-trash text-xs"></i>
            </button>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
        <span class="text-xs text-gray-400">{{ assignments.length }} assignment(s)</span>
        <button @click="$emit('close')"
          class="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition">
          Close
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'ViewAssignedTestsModal',

  props: {
    targetType: { type: String, required: true }, // "user" or "group"
    targetId:   { type: Number, required: true },
    targetName: { type: String, default: '' },
  },

  emits: ['close'],

  data() {
    return {
      assignments: [],
      loading:     false,
      removingId:  null,
    };
  },

  methods: {
    async fetchAssignments() {
      this.loading = true;
      try {
        const endpoint = this.targetType === 'user'
          ? `/test-assignments/user/${this.targetId}`
          : `/test-assignments/group/${this.targetId}`;
        const res = await this.$apiGet(endpoint);
        this.assignments = res.data || [];
      } catch (e) {
        console.error('Fetch assignments error:', e);
      } finally {
        this.loading = false;
      }
    },

    async removeAssignment(id) {
      this.removingId = id;
      try {
        await this.$apiDelete(`/test-assignments/${id}`);
        this.$root.$refs.toast?.showToast('Assignment removed', 'success');
        this.assignments = this.assignments.filter(a => a.id !== id);
      } catch (e) {
        console.error('Remove assignment error:', e);
        this.$root.$refs.toast?.showToast('Failed to remove assignment', 'error');
      } finally {
        this.removingId = null;
      }
    },

    statusBadge(status) {
      const map = {
        pending:     'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200',
        in_progress: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200',
        completed:   'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200',
        expired:     'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200',
      };
      return map[status] || map.pending;
    },

    formatStatus(status) {
      const labels = {
        pending:     'Pending',
        in_progress: 'In Progress',
        completed:   'Completed',
        expired:     'Expired',
      };
      return labels[status] || status;
    },

    dueDateClass(dueDate) {
      const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
      if (days < 0)  return 'text-red-500 font-semibold';
      if (days <= 3) return 'text-amber-600 font-semibold';
      return 'text-gray-400';
    },

    formatDate(date) {
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },
  },

  mounted() {
    this.fetchAssignments();
  },
};
</script>
