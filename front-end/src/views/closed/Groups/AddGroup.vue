<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Add Group</h2>
          <p v-if="organizationName" class="text-xs text-gray-500 mt-0.5">
            Organization: {{ organizationName }}
          </p>
        </div>

        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4">
        <!-- Show dropdown only for admins/testers and when organization is not pre-selected -->
        <div v-if="showOrganizationDropdown">
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Organization
          </label>

          <select
            v-model="form._id"
            required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
          >
            <option disabled value="">Select Organization</option>
            <option
              v-for="org in organizations"
              :key="org.id"
              :value="org.id"
            >
              {{ org.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Name
          </label>

          <input
            v-model="form.name"
            type="text"
            required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150"
          />
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Description
          </label>

          <input
            v-model="form.description"
            type="text"
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150"
          />
        </div>

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
            <i
              v-if="loading"
              class="fas fa-spinner animate-spin text-xs"
            ></i>

            {{ loading ? 'Saving...' : 'Add' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: null,
    },
    organization: {
      type: Object,
      default: null,
    },
  },

  data() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    const isOrganizationUser = roles.includes('organization');

    return {
      loading: false,
      organizations: [],
      roles,
      isOrganizationUser,

      organizationName:
        this.organization?.name ||
        localStorage.getItem('organizationName') ||
        '',

      form: {
        _id:
          this.organization?.id ||
          (isOrganizationUser
            ? localStorage.getItem('organizationId')
            : this.data?._id || ''),

        organization:
          this.organization?.name ||
          localStorage.getItem('organizationName') ||
          this.data?.organization ||
          '',

        name: this.data?.name || '',
        description: this.data?.description || '',
      },
    };
  },

  computed: {
    showOrganizationDropdown() {
      return !this.organization && !this.isOrganizationUser;
    },
  },

  methods: {
    async fetchOrganizations() {
      // Skip loading organizations for organization users
      if (this.organization || this.isOrganizationUser) return;

      try {
        const res = await this.$apiGet('/organization', {
          page_size: 100,
        });

        this.organizations = res.data || [];
      } catch (error) {
        console.error(error);
      }
    },

    async submitForm() {
      this.loading = true;

      try {
        // Opened from OrganizationView
        if (this.organization) {
          this.form._id = this.organization.id;
          this.form.organization = this.organization.name;
        }

        // Logged in as organization
        if (this.isOrganizationUser) {
          this.form._id = localStorage.getItem('organizationId');
          this.form.organization =
            localStorage.getItem('organizationName') || '';
        }

        const res = await this.$apiPost('/group', this.form);

        if (res) {
          this.$root.$refs.toast.showToast(
            'Group added successfully',
            'success'
          );
        }

        this.$emit('saved');
        this.$emit('close');
      } catch (error) {
        console.error(error);

        this.$root.$refs.toast.showToast(
          'Failed to add group',
          'error'
        );
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.fetchOrganizations();
  },
};
</script>