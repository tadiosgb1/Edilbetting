<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 text-sm">

      <!-- Header -->
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Assign Test</h2>
          <p class="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
            <i class="fas fa-file-alt mr-1 text-green-500"></i>{{ test.title }}
          </p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <!-- Step 1: Choose target type -->
      <div class="mb-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assign to</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="targetType = 'user'"
            class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
            :class="targetType === 'user' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'"
          >
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="targetType === 'user' ? 'bg-green-500' : 'bg-gray-100'">
              <i class="fas fa-user text-sm" :class="targetType === 'user' ? 'text-white' : 'text-gray-400'"></i>
            </div>
            <div>
              <p class="font-semibold text-gray-800 text-xs">Individual</p>
              <p class="text-[10px] text-gray-400">Assign to a specific user</p>
            </div>
          </button>

          <button
            @click="targetType = 'group'"
            class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
            :class="targetType === 'group' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'"
          >
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="targetType === 'group' ? 'bg-blue-500' : 'bg-gray-100'">
              <i class="fas fa-users text-sm" :class="targetType === 'group' ? 'text-white' : 'text-gray-400'"></i>
            </div>
            <div>
              <p class="font-semibold text-gray-800 text-xs">Group</p>
              <p class="text-[10px] text-gray-400">Assign to an entire group</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Search & select target -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Select {{ targetType === 'user' ? 'User' : 'Group' }}
          </p>
          <span v-if="selectedTargetId" class="text-[10px] text-green-600 font-medium">
            <i class="fas fa-check-circle mr-1"></i>Selected
          </span>
        </div>

        <input
          v-model="searchQuery"
          type="text"
          :placeholder="targetType === 'user' ? 'Search by name or email...' : 'Search groups...'"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <div class="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-48 overflow-y-auto">
          <div v-if="loadingList" class="py-6 text-center text-gray-400">
            <i class="fas fa-spinner animate-spin"></i>
          </div>

          <label
            v-for="item in filteredList"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition"
            :class="selectedTargetId === item.id ? 'bg-green-50' : ''"
          >
            <input type="radio" :value="item.id" v-model="selectedTargetId" class="w-4 h-4 accent-green-500" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-700 truncate">
                {{ targetType === 'user' ? item.first_name + ' ' + item.last_name : item.name }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ targetType === 'user' ? item.email : (item.description || item.organization || '') }}
              </p>
            </div>
            <i v-if="selectedTargetId === item.id" class="fas fa-check-circle text-green-500 flex-shrink-0 text-xs"></i>
          </label>

          <p v-if="!loadingList && filteredList.length === 0"
            class="text-center py-4 text-gray-400 italic text-xs">
            No {{ targetType === 'user' ? 'users' : 'groups' }} found.
          </p>
        </div>
      </div>

      <!-- Step 3: Optional settings -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Due Date <span class="text-gray-300 font-normal normal-case">(optional)</span>
          </label>
          <input v-model="dueDate" type="date"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Notes <span class="text-gray-300 font-normal normal-case">(optional)</span>
          </label>
          <input v-model="notes" type="text" placeholder="e.g. Complete before review"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <!-- Summary -->
      <div v-if="selectedTargetId && selectedTargetName"
        class="mb-4 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <i :class="targetType === 'user' ? 'fas fa-user text-green-500' : 'fas fa-users text-blue-500'"></i>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-500">Assigning <strong class="text-gray-700">{{ test.title }}</strong> to</p>
          <p class="text-sm font-semibold text-gray-800 truncate">{{ selectedTargetName }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button type="button" @click="$emit('close')"
          class="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
          Cancel
        </button>
        <button
          @click="assign"
          :disabled="loading || !selectedTargetId"
          class="px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 text-white"
          :class="targetType === 'user' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'"
        >
          <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
          {{ loading ? 'Assigning...' : 'Assign Test' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'AssignTestFromTestView',
  props: { test: { type: Object, required: true } },
  emits: ['close', 'assigned'],

  data() {
    return {
      targetType: 'user',
      selectedTargetId: null,
      searchQuery: '',
      dueDate: '',
      notes: '',
      loading: false,
      loadingList: false,
      users: [],
      groups: [],
    };
  },

  computed: {
    filteredList() {
      const list = this.targetType === 'user' ? this.users : this.groups;
      if (!this.searchQuery.trim()) return list;
      const q = this.searchQuery.toLowerCase();
      return list.filter(item => {
        if (this.targetType === 'user') {
          return (item.first_name + ' ' + item.last_name).toLowerCase().includes(q) ||
                 item.email?.toLowerCase().includes(q);
        }
        return item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      });
    },

    selectedTargetName() {
      const list = this.targetType === 'user' ? this.users : this.groups;
      const found = list.find(i => i.id === this.selectedTargetId);
      if (!found) return '';
      return this.targetType === 'user' ? found.first_name + ' ' + found.last_name : found.name;
    },
  },

  watch: {
    targetType() {
      this.selectedTargetId = null;
      this.searchQuery = '';
    },
  },

  methods: {
    async fetchUsers() {
      this.loadingList = true;
      try {
        const res = await this.$apiGet('/users', { page_size: 200 });
        this.users = res.data || [];
      } catch (e) { console.error(e); }
      finally { this.loadingList = false; }
    },

    async fetchGroups() {
      try {
        const res = await this.$apiGet('/group', { page_size: 200 });
        this.groups = res.data || [];
      } catch (e) { console.error(e); }
    },

    async assign() {
      if (!this.selectedTargetId) return;
      this.loading = true;
      try {
        await this.$apiPost('/test-assignments', {
          test_id:          this.test.id,
          assigned_to_type: this.targetType,
          assigned_to_id:   this.selectedTargetId,
          assigned_by:      parseInt(localStorage.getItem('userId')),
          due_date:         this.dueDate || null,
          notes:            this.notes   || null,
        });
        this.$root.$refs.toast?.showToast(
          `"${this.test.title}" assigned to ${this.selectedTargetName}`,
          'success'
        );
        this.$emit('assigned');
        this.$emit('close');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast?.showToast(e?.message || 'Failed to assign test', 'error');
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.fetchUsers();
    this.fetchGroups();
  },
};
</script>
