<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div
      class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6"
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 border-b pb-3">
        <h2 class="text-xl font-semibold text-gray-800">
          Edit Organization
        </h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="submitForm">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Organization Information -->
          <div class="space-y-4">
            <h3 class="text-md font-semibold text-gray-700 border-b pb-2">
              Organization Information
            </h3>

            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                v-model="form.address"
                type="text"
                required
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">
                Contact Email
              </label>
              <input
                v-model="form.contact_email"
                type="email"
                required
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                v-model="form.phone"
                type="text"
                required
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Admin Info (Read-only for safety) -->
          <div class="space-y-4">
            <h3 class="text-md font-semibold text-gray-700 border-b pb-2">
              Admin Account (View Only)
            </h3>

            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                :value="data?.first_name || data?.admin?.first_name"
                type="text"
                disabled
                class="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-500"
              />
            </div>

            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                :value="data?.last_name || data?.admin?.last_name"
                type="text"
                disabled
                class="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-500"
              />
            </div>

            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">
                Login Email
              </label>
              <input
                :value="data?.email || data?.admin?.email"
                type="email"
                disabled
                class="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-500"
              />
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 mt-8 border-t pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            :disabled="loading"
            class="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {{ loading ? "Saving..." : "Save Changes" }}
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
      default: () => ({})
    }
  },

  data() {
    return {
      loading: false,
      form: {
        name: "",
        address: "",
        contact_email: "",
        phone: "",
      }
    };
  },

  mounted() {
    // Pre-fill form with existing data
    if (this.data) {
      this.form.name = this.data.name || "";
      this.form.address = this.data.address || "";
      this.form.contact_email = this.data.contact_email || this.data.official_email || "";
      this.form.phone = this.data.phone || this.data.official_phone || "";
    }
  },

  methods: {
    async submitForm() {
      this.loading = true;

      try {
        const payload = {
          name: this.form.name,
          address: this.form.address,
          official_email: this.form.contact_email,
          official_phone: this.form.phone,
        };

        console.log("Update payload:", payload);

        const res = await this.$apiPut("/organization", this.data.id, payload);

        if (res) {
          this.$root.$refs.toast.showToast(
            "Organization updated successfully",
            "success"
          );
          this.$emit("saved");
          this.$emit("close");
        }
      } catch (e) {
        console.error("Organization update error:", e);
        this.$root.$refs.toast.showToast(
          e?.response?.data?.error || "Failed to update organization",
          "error"
        );
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>