<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Add Option</h2>
          <p v-if="question" class="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{{ question.question_text }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Option Text</label>
          <input v-model="form.text" type="text" required placeholder="e.g. Strongly Agree"
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Value</label>
            <input v-model="form.value" type="text"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Weight</label>
            <input v-model.number="form.weight" type="number"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Position</label>
            <input v-model.number="form.position" type="number"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" :disabled="loading" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
            <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
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
    data:     { type: Object, default: null },
    question: { type: Object, default: null }, // passed when opened from QuestionView
  },
  data() {
    return {
      loading: false,
      form: {
        question_id: this.question?.id || this.data?.question_id || '',
        text:        this.data?.text     || '',
        value:       this.data?.value    || '',
        weight:      this.data?.weight   || 1,
        position:    this.data?.position || 1,
      },
    };
  },
  methods: {
    async submitForm() {
      this.loading = true;
      try {
        const res = await this.$apiPost('/option', this.form);
        if (res) this.$root.$refs.toast.showToast('Option added successfully', 'success');
        this.$emit('saved');
        this.$emit('close');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast.showToast('Failed to add option', 'error');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
