<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Add Trait</h2>
          <p v-if="category" class="text-xs text-gray-500 mt-0.5">Category: {{ category.name }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4">

        <!-- Category dropdown — only shown when not pre-set from parent -->
        <div v-if="!category">
          <label class="block mb-1 text-sm font-medium text-gray-700">Category</label>
          <select v-model="form.category_id" required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm">
            <option disabled value="">Select Category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Name</label>
          <input v-model="form.name" type="text" required
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Description</label>
          <input v-model="form.description" type="text"
            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
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
    category: { type: Object, default: null }, // pre-set when opened from CategoryView
  },
  data() {
    return {
      loading: false,
      categories: [],
      form: {
        category_id: this.category?.id || this.data?.category_id || '',
        name:        this.data?.name        || '',
        description: this.data?.description || '',
      },
    };
  },
  methods: {
    async fetchCategories() {
      if (this.category) return; // no need if pre-set
      try {
        const res = await this.$apiGet('/category', { page: 1, page_size: 100 });
        this.categories = res.data || [];
      } catch (e) {
        console.error(e);
      }
    },
    async submitForm() {
      this.loading = true;
      try {
        const res = await this.$apiPost('/triat', this.form);
        if (res) this.$root.$refs.toast.showToast('Trait added successfully', 'success');
        this.$emit('saved');
        this.$emit('close');
      } catch (e) {
        console.error(e);
        this.$root.$refs.toast.showToast('Failed to add trait', 'error');
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchCategories();
  },
};
</script>
