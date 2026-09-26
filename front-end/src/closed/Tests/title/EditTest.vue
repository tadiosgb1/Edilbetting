<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">

      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold text-gray-800">
          Edit Test
        </h2>

        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4">

        <!-- Title -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Title
          </label>

          <input
            v-model="form.title"
            type="text"
            required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Description
          </label>

          <input
            v-model="form.description"
            type="text"
            required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150"
          />
        </div>

        <!-- Duration -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Duration (Minutes)
          </label>

          <input
            v-model.number="form.duration"
            type="number"
            min="1"
            required
            placeholder="e.g 30"
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150"
          />

          <small class="text-gray-500">
            Enter duration in minutes
          </small>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 pt-2">

          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="px-4 py-2 bg-green-500 text-white rounded-lg"
          >
            Edit
          </button>

        </div>

      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: Object
  },

  data() {
    return {
      form: {
        title: this.data?.title || '',
        description: this.data?.description || '',
        duration: this.data?.duration || ''
      }
    };
  },

  methods: {
    async submitForm() {
      try {

        // get created_by from localStorage
        const created_by = localStorage.getItem("userId");

        // payload
        const payload = {
          ...this.form,
          created_by
        };

        // edit request
        const res = await this.$apiPut(
          "/test",
          this.data.id,
          payload
        );

        if (res) {
          this.$root.$refs.toast.showToast(
            "Edited successfully",
            "success"
          );
        }

        this.$emit("saved");
        this.$emit("close");

      } catch (e) {
        console.error(e);
      }
    }
  }
};
</script>