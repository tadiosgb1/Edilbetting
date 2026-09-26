<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <Loading :visible="loading" message="Loading Categories..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Categories</h1>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center space-x-1 text-sm">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Category</span>
      </button>
    </div>

    <!-- Search + Page Size -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <input v-model="searchQuery" @input="fetchItems(1)" type="text" placeholder="Search categories..."
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150" />
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <label>Show</label>
        <select v-model="pageSize" @change="fetchItems(1)" class="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-green-500 focus:border-green-500">
          <option v-for="size in [5, 10, 20, 50, 100]" :key="size" :value="size">{{ size }}</option>
        </select>
        <span>entries</span>
      </div>
    </div>

    <!-- Categories Table -->
    <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200">
          <thead class="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-3 text-left">#</th>
              <th class="px-6 py-3 text-left">Name</th>
              <th class="px-6 py-3 text-left">Description</th>
              <th class="px-6 py-3 text-center">Traits</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="(item, index) in items" :key="item.id">
              <!-- Category Row -->
              <tr class="hover:bg-green-50 transition duration-150">
                <td class="px-6 py-4">{{ index + 1 }}</td>
                <td class="px-6 py-4 font-medium">{{ item.name }}</td>
                <td class="px-6 py-4 text-gray-500">{{ item.description || '—' }}</td>
                <td class="px-6 py-4 text-center">
                  <button
                    @click="toggleTraits(item)"
                    class="text-xs px-3 py-1 rounded-full border transition"
                    :class="expandedCategory === item.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'"
                  >
                    <i class="fas fa-sliders-h mr-1"></i>
                    Traits
                    <span v-if="traitCounts[item.id] !== undefined" class="ml-1 font-semibold">
                      ({{ traitCounts[item.id] }})
                    </span>
                  </button>
                </td>
                <td class="px-6 py-4 text-center space-x-3">
                  <button @click="editItem(item)" title="Edit" class="text-blue-500 hover:text-blue-700">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="openDeleteModal(item.id)" title="Delete" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>

              <!-- Traits Expanded Row -->
              <tr v-if="expandedCategory === item.id" :key="'traits-' + item.id">
                <td colspan="5" class="px-6 py-4 bg-indigo-50/40">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                      Traits in "{{ item.name }}"
                    </h3>
                    <button
                      @click="openAddTraitModal(item)"
                      class="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <i class="fas fa-plus text-[10px]"></i> Add Trait
                    </button>
                  </div>

                  <div v-if="loadingTraits" class="py-4 text-center text-gray-400">
                    <i class="fas fa-spinner animate-spin"></i>
                  </div>

                  <div v-else-if="categoryTraits.length === 0" class="text-xs text-gray-400 italic py-2">
                    No traits defined for this category yet.
                  </div>

                  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div
                      v-for="trait in categoryTraits"
                      :key="trait.id"
                      class="flex items-center justify-between bg-white border border-indigo-100 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p class="text-xs font-medium text-gray-700">{{ trait.name }}</p>
                        <p class="text-[10px] text-gray-400">{{ trait.description || '—' }}</p>
                      </div>
                      <div class="flex gap-2 ml-3">
                        <button @click="editTrait(trait)" class="text-blue-400 hover:text-blue-600">
                          <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button @click="deleteTrait(trait.id)" class="text-red-400 hover:text-red-600">
                          <i class="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="items.length === 0">
              <td colspan="5" class="text-center py-6 text-gray-400 italic">No data found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="(item, index) in items" :key="item.id" class="bg-white border border-gray-200 rounded-xl shadow p-4">
        <div class="flex justify-between mb-2">
          <h2 class="font-bold text-gray-800">{{ item.name }}</h2>
          <div class="flex gap-3 text-sm">
            <button @click="editItem(item)" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
            <button @click="openDeleteModal(item.id)" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <p class="text-xs text-gray-500 mb-3">{{ item.description || '—' }}</p>
        <button @click="toggleTraits(item)" class="text-xs text-indigo-600 underline">
          {{ expandedCategory === item.id ? 'Hide Traits' : 'Show Traits' }}
        </button>
        <div v-if="expandedCategory === item.id" class="mt-3 space-y-2">
          <div v-if="loadingTraits" class="text-center text-gray-400"><i class="fas fa-spinner animate-spin"></i></div>
          <div v-for="trait in categoryTraits" :key="trait.id" class="flex justify-between items-center bg-indigo-50 rounded-lg px-3 py-2">
            <div>
              <p class="text-xs font-medium">{{ trait.name }}</p>
              <p class="text-[10px] text-gray-400">{{ trait.description || '—' }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="editTrait(trait)" class="text-blue-400"><i class="fas fa-edit text-xs"></i></button>
              <button @click="deleteTrait(trait.id)" class="text-red-400"><i class="fas fa-trash text-xs"></i></button>
            </div>
          </div>
          <button @click="openAddTraitModal(item)" class="text-xs text-indigo-600 underline">+ Add Trait</button>
        </div>
      </div>
      <p v-if="items.length === 0" class="text-center text-gray-400 py-6 italic">No data found.</p>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-6 text-sm text-gray-600">
      <span>
        Showing {{ (currentPage - 1) * pageSize + 1 }}
        to {{ Math.min(currentPage * pageSize, count) }}
        of {{ count }} total entries
      </span>
      <div class="flex items-center gap-2">
        <button @click="fetchItems(currentPage - 1)" :disabled="currentPage <= 1"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150">← Previous</button>
        <span class="px-3 py-1 bg-green-600 text-white rounded-lg font-medium">{{ currentPage }}</span>
        <button @click="fetchItems(currentPage + 1)" :disabled="currentPage * pageSize >= count"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150">Next →</button>
      </div>
    </div>

    <!-- Category Add/Edit Modals -->
    <add-category v-if="showModal && !editMode" @close="showModal = false" @saved="fetchItems" />
    <edit-category v-if="showModal && editMode" :data="selectedItem" @close="showModal = false" @saved="fetchItems" />

    <!-- Trait Add/Edit Modals -->
    <add-trait-modal
      v-if="showTraitModal && !traitEditMode"
      :category="selectedCategory"
      @close="showTraitModal = false"
      @saved="onTraitSaved"
    />
    <edit-trait-modal
      v-if="showTraitModal && traitEditMode"
      :data="selectedTrait"
      @close="showTraitModal = false"
      @saved="onTraitSaved"
    />

    <!-- Delete Confirmation Modal -->
    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Delete Category"
      message="Are you sure you want to delete this category?"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script>
import AddCategory from "./AddCategory.vue";
import EditCategory from "./EditCategory.vue";
import AddTraitModal from "../Triats/AddTriat.vue";
import EditTraitModal from "../Triats/EditTriat.vue";
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

export default {
  components: { AddCategory, EditCategory, AddTraitModal, EditTraitModal, Loading, DeleteConfirmModal },

  data() {
    return {
      items: [],
      count: 0,
      currentPage: 1,
      pageSize: 10,
      searchQuery: "",
      selectedItem: null,
      loading: false,
      showModal: false,
      editMode: false,
      deleteModalVisible: false,
      deleteId: null,

      // traits
      expandedCategory: null,
      selectedCategory: null,
      categoryTraits: [],
      traitCounts: {},
      loadingTraits: false,
      showTraitModal: false,
      traitEditMode: false,
      selectedTrait: null,
    };
  },

  methods: {
    async fetchItems(page = 1) {
      this.loading = true;
      this.currentPage = page;
      try {
        const res = await this.$apiGet('/category', {
          page: this.currentPage,
          page_size: this.pageSize,
          search: this.searchQuery,
        });
        this.items = res.data || [];
        this.count = res.count || 0;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    openAddModal()   { this.editMode = false; this.selectedItem = null; this.showModal = true; },
    editItem(item)   { this.editMode = true;  this.selectedItem = item; this.showModal = true; },

    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },

    async confirmDelete() {
      const res = await this.$apiDelete('/category', this.deleteId);
      if (res) this.$root.$refs.toast.showToast('Category deleted successfully', 'success');
      this.deleteModalVisible = false;
      this.fetchItems(this.currentPage);
    },

    async toggleTraits(category) {
      if (this.expandedCategory === category.id) {
        this.expandedCategory = null;
        return;
      }
      this.expandedCategory = category.id;
      this.selectedCategory = category;
      await this.fetchTraitsForCategory(category.id);
    },

    async fetchTraitsForCategory(categoryId) {
      this.loadingTraits = true;
      try {
        const res = await this.$apiGet('/triat', { page_size: 100, category_id: categoryId });
        // filter client-side in case backend doesn't support category_id filter
        this.categoryTraits = (res.data || []).filter(t => t.category_id === categoryId);
        this.traitCounts[categoryId] = this.categoryTraits.length;
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingTraits = false;
      }
    },

    openAddTraitModal(category) {
      this.selectedCategory = category;
      this.traitEditMode = false;
      this.selectedTrait = null;
      this.showTraitModal = true;
    },

    editTrait(trait) {
      this.selectedTrait = trait;
      this.traitEditMode = true;
      this.showTraitModal = true;
    },

    async deleteTrait(id) {
      const res = await this.$apiDelete('/triat', id);
      if (res) this.$root.$refs.toast.showToast('Trait deleted', 'success');
      await this.fetchTraitsForCategory(this.expandedCategory);
    },

    async onTraitSaved() {
      this.showTraitModal = false;
      if (this.expandedCategory) {
        await this.fetchTraitsForCategory(this.expandedCategory);
      }
    },
  },

  mounted() {
    this.fetchItems();
  },
};
</script>
