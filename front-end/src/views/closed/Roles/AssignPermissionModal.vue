<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Assign Permissions</h2>
          <p class="text-xs text-gray-500 mt-0.5">Role: {{ role.name }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <form @submit.prevent="submitAssignment" class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">Select Permissions</label>
            <div class="flex gap-2">
              <button
                type="button"
                @click="selectedPermissions = permissions.map(p => p.id)"
                class="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                Check All
              </button>
              <span class="text-gray-300">|</span>
              <button
                type="button"
                @click="selectedPermissions = []"
                class="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Uncheck All
              </button>
            </div>
          </div>
          <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            <label
              v-for="p in permissions"
              :key="p.id"
              class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
              :class="selectedPermissions.includes(p.id) ? 'bg-green-50' : ''"
            >
              <input type="checkbox" :value="p.id" v-model="selectedPermissions" class="w-4 h-4 accent-green-500" />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-700 font-medium">{{ p.name }}</p>
                <p class="text-xs text-gray-400 font-mono">{{ p.code }}</p>
              </div>
              <span v-if="selectedPermissions.includes(p.id)" class="text-xs text-green-600 font-medium flex-shrink-0">
                <i class="fas fa-check-circle"></i>
              </span>
            </label>
            <p v-if="permissions.length === 0" class="text-center py-4 text-gray-400 italic text-xs">
              No permissions available.
            </p>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ selectedPermissions.length }} permission(s) selected</p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
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
    role: { type: Object, required: true },
  },
  data() {
    return {
      loading: false,
      permissions: [],
      selectedPermissions: [],
    };
  },
  methods: {
    async fetchPermissions() {
      try {
        const response = await this.$apiGet('/permissions', { page_size: 100 });
        this.permissions = response.data || [];

        // Pre-check already-assigned permissions
        if (this.role.Permissions && Array.isArray(this.role.Permissions)) {
          this.selectedPermissions = this.role.Permissions.map(p => p.id);
        }
      } catch (e) {
        console.error(e);
      }
    },

    async submitAssignment() {
      if (this.selectedPermissions.length === 0) return;
      this.loading = true;
      try {
        await this.$apiPut(`/roles/${this.role.id}/permissions`, '', { permissionIds: this.selectedPermissions });
        this.$root.$refs.toast.showToast('Permissions assigned successfully', 'success');
        this.$emit('assigned');
        this.$emit('close');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast.showToast('Failed to assign permissions', 'error');
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchPermissions();
  },
};
</script>
