<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">

      <!-- Header -->
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Assign Roles</h2>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ user.first_name }} {{ user.last_name }}
          </p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <form @submit.prevent="submitRoles" class="space-y-4">
        <div>
          <!-- Label + Check All / Uncheck All -->
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">Select Roles</label>
            <div class="flex gap-2">
              <button
                type="button"
                @click="selectedRoleIds = roles.map(r => r.id)"
                class="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                Check All
              </button>
              <span class="text-gray-300">|</span>
              <button
                type="button"
                @click="selectedRoleIds = []"
                class="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Uncheck All
              </button>
            </div>
          </div>

          <!-- Role list -->
          <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div v-if="loadingRoles" class="py-6 text-center text-gray-400">
              <i class="fas fa-spinner animate-spin"></i>
            </div>
            <template v-else>
              <label
                v-for="role in roles"
                :key="role.id"
                class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                :class="selectedRoleIds.includes(role.id) ? 'bg-amber-50' : ''"
              >
                <input
                  type="checkbox"
                  :value="role.id"
                  v-model="selectedRoleIds"
                  class="w-4 h-4 accent-amber-500"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-700 font-medium capitalize">{{ role.name }}</p>
                  <p class="text-xs text-gray-400">{{ role.description || '' }}</p>
                </div>
                <span v-if="selectedRoleIds.includes(role.id)" class="text-xs text-amber-600 flex-shrink-0">
                  <i class="fas fa-check-circle"></i>
                </span>
              </label>
              <p v-if="roles.length === 0" class="text-center py-4 text-gray-400 italic text-xs">
                No roles available.
              </p>
            </template>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ selectedRoleIds.length }} role(s) selected</p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script>
export default {
  props: {
    user: { type: Object, required: true },
  },

  data() {
    return {
      roles: [],
      selectedRoleIds: [],
      loading: false,
      loadingRoles: false,
    };
  },

  methods: {
    async fetchRoles() {
      this.loadingRoles = true;
      try {
        const res = await this.$apiGet('/roles', { page_size: 100 });
        this.roles = res.data || [];

        // Pre-check already-assigned roles from the user object
        const assigned = this.user.Roles || this.user.roles || [];
        this.selectedRoleIds = assigned.map(r => r.id);
      } catch (e) {
        console.error('Fetch roles error:', e);
      } finally {
        this.loadingRoles = false;
      }
    },

    async submitRoles() {
      this.loading = true;
      try {
        await this.$apiPut(`/users/${this.user.id}/roles`, '', { roleIds: this.selectedRoleIds });
        this.$root.$refs.toast.showToast('Roles updated successfully', 'success');
        this.$emit('assigned');
        this.$emit('close');
      } catch (e) {
        console.error('Update roles error:', e);
        this.$root.$refs.toast.showToast('Failed to update roles', 'error');
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.fetchRoles();
  },
};
</script>
