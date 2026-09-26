<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold text-gray-800">Edit Role</h2>

```
    <button
      @click="$emit('close')"
      class="text-gray-400 hover:text-gray-600"
    >
      &times;
    </button>
  </div>

  <form @submit.prevent="submitForm" class="space-y-4">
    <div>
      <label class="block mb-1 text-sm font-medium text-gray-700">
        Name
      </label>

      <input
        v-model="form.name"
        type="text"
        required
        :readonly="isSystemRole"
        :class="[
          'border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none shadow-sm transition duration-150',
          isSystemRole
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'focus:ring-2 focus:ring-green-500'
        ]"
      />

      <p
        v-if="isSystemRole"
        class="text-xs text-gray-500 mt-1"
      >
        System roles cannot be renamed.
      </p>
    </div>

    <div>
      <label class="block mb-1 text-sm font-medium text-gray-700">
        Description
      </label>

      <textarea
        v-model="form.description"
        rows="3"
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150"
      ></textarea>
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

        {{ loading ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </form>
</div>
```

  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      loading: false,

      form: {
        name: this.data?.name || "",
        description: this.data?.description || "",
      },

      systemRoles: [
        "admin",
        "organization",
        "tester",
      ],
    };
  },

  computed: {
    isSystemRole() {
      return this.systemRoles.includes(
        (this.data?.name || "").toLowerCase()
      );
    },
  },

  methods: {
    async submitForm() {
      this.loading = true;

      try {
        // Prevent name modification for seeded roles
        if (this.isSystemRole) {
          this.form.name = this.data.name;
        }

        const res = await this.$apiPut(
          "/roles",
          this.data.id,
          this.form
        );

        if (res) {
          this.$root.$refs.toast.showToast(
            "Role updated successfully",
            "success"
          );
        }

        this.$emit("saved");
        this.$emit("close");
      } catch (e) {
        console.error(e);

        this.$root.$refs.toast.showToast(
          "Error updating role",
          "error"
        );
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
