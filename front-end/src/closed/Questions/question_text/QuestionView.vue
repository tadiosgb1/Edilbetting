<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <Loading :visible="loading" message="Loading Questions..." />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Questions</h1>
      <button @click="openAddModal"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center space-x-1 text-sm">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Question</span>
      </button>
    </div>

    <!-- Search + Page Size -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <input v-model="searchQuery" @input="fetchItems(1)" type="text" placeholder="Search questions..."
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition duration-150" />
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <label>Show</label>
        <select v-model="pageSize" @change="fetchItems(1)" class="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-green-500 focus:border-green-500">
          <option v-for="size in [5, 10, 20, 50]" :key="size" :value="size">{{ size }}</option>
        </select>
        <span>entries</span>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="bg-white overflow-hidden rounded-xl border border-gray-200 hidden md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm divide-y divide-gray-200">
          <thead class="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-3 text-left">#</th>
              <th class="px-6 py-3 text-left">Question</th>
              <th class="px-6 py-3 text-left">Type</th>
              <th class="px-6 py-3 text-left">Mode</th>
              <th class="px-6 py-3 text-left">Mode</th>
              <th class="px-6 py-3 text-left">Category</th>
              <th class="px-6 py-3 text-left">Test</th>
              <th class="px-6 py-3 text-center">Options</th>
              <th class="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="(item, index) in items" :key="item.id">
              <!-- Question Row -->
              <tr class="hover:bg-green-50 transition duration-150">
                <td class="px-6 py-4">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="px-6 py-4 max-w-xs">
                  <p class="font-medium text-gray-800 truncate">{{ item.question_text }}</p>
                </td>
                <td class="px-6 py-4">
                  <span :class="typeBadge(item.type)">{{ formatType(item.type) || '—' }}</span>
                </td>
                <td class="px-6 py-4">
                  <span :class="modeBadge(item.scoring_mode)">{{ item.scoring_mode || '—' }}</span>
                </td>
                <td class="px-6 py-4 text-gray-500">{{ item.Category?.name || item.category_id || '—' }}</td>
                <td class="px-6 py-4 text-gray-500">{{ item.Test?.title || item.test_id || '—' }}</td>
                <td class="px-6 py-4 text-center">
                  <button
                    v-if="item.type !== 'open'"
                    @click="toggleOptions(item)"
                    class="text-xs px-3 py-1 rounded-full border transition"
                    :class="expandedQuestion === item.id
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-purple-200 hover:text-purple-600'"
                  >
                    <i class="fas fa-list-ul mr-1"></i>
                    Options
                    <span v-if="optionCounts[item.id] !== undefined" class="ml-1 font-semibold">
                      ({{ optionCounts[item.id] }})
                    </span>
                  </button>
                  <span v-else class="text-xs text-gray-400 italic">Open</span>
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

              <!-- Options Expanded Row -->
              <tr v-if="expandedQuestion === item.id" :key="'opts-' + item.id">
                <td colspan="8" class="px-6 py-4 bg-purple-50/40">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                      Options for this question
                    </h3>
                    <button
                      @click="openAddOptionModal(item)"
                      class="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <i class="fas fa-plus text-[10px]"></i> Add Option
                    </button>
                  </div>

                  <div v-if="loadingOptions" class="py-4 text-center text-gray-400">
                    <i class="fas fa-spinner animate-spin"></i>
                  </div>

                  <div v-else-if="questionOptions.length === 0" class="text-xs text-gray-400 italic py-2">
                    No options defined yet.
                  </div>

                  <div v-else class="overflow-x-auto">
                    <table class="min-w-full text-xs divide-y divide-purple-100">
                      <thead class="bg-purple-50 text-purple-600 uppercase text-[10px] font-semibold">
                        <tr>
                          <th class="px-4 py-2 text-left">Text</th>
                          <th class="px-4 py-2 text-left">Value</th>
                          <th class="px-4 py-2 text-left">Weight</th>
                          <th class="px-4 py-2 text-left">Score</th>
                          <th class="px-4 py-2 text-left">Correct?</th>
                          <th class="px-4 py-2 text-left">Position</th>
                          <th class="px-4 py-2 text-left">Indicator Letter</th>
                          
                          <th class="px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-purple-50">
                        <tr v-for="opt in questionOptions" :key="opt.id" class="hover:bg-purple-50">
                          <td class="px-4 py-2 font-medium">
  <!-- If the content type is an image, display the actual image -->
  <div v-if="opt.content_type === 'image'" class="my-1">
    <img 
      :src="opt.text" 
      alt="Option Image" 
      class="max-h-16 w-auto rounded border border-purple-100 object-cover shadow-sm hover:scale-105 transition-transform duration-200 cursor-zoom-in"
    />
  </div>
  
  <!-- Otherwise, display it as normal text -->
  <span v-else>{{ opt.text }}</span>
</td>
                          <td class="px-4 py-2 text-gray-500">{{ opt.value ?? '—' }}</td>
                          <td class="px-4 py-2 text-gray-500">{{ opt.weight ?? '—' }}</td>
                          <td class="px-4 py-2">
                            <span v-if="opt.score != null && Number(opt.score) !== 0"
                              class="text-xs font-semibold text-blue-600">{{ opt.score }}</span>
                            <span v-else class="text-gray-400">—</span>
                          </td>
                          <td class="px-4 py-2">
                            <span v-if="opt.is_correct"
                              class="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">✓ Yes</span>
                            <span v-else class="text-gray-400 text-xs">—</span>
                          </td>
                          <td class="px-4 py-2 text-gray-500">{{ opt.position ?? '—' }}</td>
                          <td class="px-4 py-2 text-gray-500">{{ opt.indication_letter ?? '—' }}</td>
                          <td class="px-4 py-2 text-center space-x-2">
                            <button @click="editOption(opt)" class="text-blue-400 hover:text-blue-600">
                              <i class="fas fa-edit"></i>
                            </button>
                            <button @click="deleteOption(opt.id)" class="text-red-400 hover:text-red-600">
                              <i class="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="items.length === 0">
              <td colspan="8" class="text-center py-6 text-gray-400 italic">No questions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="(item, index) in items" :key="item.id" class="bg-white border border-gray-200 rounded-xl shadow p-4">
        <div class="flex justify-between mb-2">
          <h2 class="font-bold text-gray-800 text-xs">Q{{ (currentPage - 1) * pageSize + index + 1 }}</h2>
          <div class="flex gap-3 text-sm">
            <button @click="editItem(item)" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
            <button @click="openDeleteModal(item.id)" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <p class="text-gray-700 mb-2">{{ item.question_text }}</p>
        <div class="flex gap-2 flex-wrap text-xs text-gray-500 mb-2">
          <span>Type: <b>{{ item.type }}</b></span>
          <span>Category: <b>{{ item.Category?.name || '—' }}</b></span>
        </div>
        <button v-if="item.type !== 'open'" @click="toggleOptions(item)" class="text-xs text-purple-600 underline">
          {{ expandedQuestion === item.id ? 'Hide Options' : 'Show Options' }}
        </button>
        <div v-if="expandedQuestion === item.id" class="mt-3 space-y-1">
          <div v-if="loadingOptions" class="text-center text-gray-400"><i class="fas fa-spinner animate-spin"></i></div>
          <div v-for="opt in questionOptions" :key="opt.id" class="flex justify-between items-center bg-purple-50 rounded px-3 py-1.5">
          <span class="text-xs">
  <!-- If it's an image, render the thumbnail -->
  <span v-if="opt.content_type === 'image'" class="inline-block align-middle my-1">
    <img 
      :src="opt.text" 
      alt="Option Image" 
      class="max-h-12 w-auto rounded border border-purple-100 object-cover shadow-sm"
    />
  </span>
  
  <!-- Otherwise, just display the plain text -->
  <span v-else>{{ opt.text }}</span>

  <!-- The weight badge stays visible for both types -->
  <span class="text-gray-400 ml-1">(w: {{ opt.weight }})</span>
</span> <div class="flex gap-2">
              <button @click="editOption(opt)" class="text-blue-400"><i class="fas fa-edit text-xs"></i></button>
              <button @click="deleteOption(opt.id)" class="text-red-400"><i class="fas fa-trash text-xs"></i></button>
            </div>
          </div>
          <button @click="openAddOptionModal(item)" class="text-xs text-purple-600 underline">+ Add Option</button>
        </div>
      </div>
      <p v-if="items.length === 0" class="text-center text-gray-400 py-6 italic">No questions found.</p>
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

    <!-- Question Add/Edit Modals -->
    <add-question v-if="showModal && !editMode" @close="showModal = false" @saved="fetchItems" />
    <edit-question 
  v-if="showModal && editMode" 
  :question-id="selectedItem.id"
  :categories="categories"
  @close="showModal = false" 
  @saved="fetchItems" 
/>
    <!-- Option Add/Edit Modals -->
    <add-option-modal
      v-if="showOptionModal && !optionEditMode"
      :question="selectedQuestion"
      @close="showOptionModal = false"
      @saved="onOptionSaved"
    />
   <edit-option-modal
  v-if="showOptionModal && optionEditMode"
  :data="selectedOption"
  :questionId="selectedOption.question_id" 
  @close="showOptionModal = false"
  @saved="onOptionSaved"
/>

    <!-- Delete Confirmation Modal -->
    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Delete Question"
      message="Are you sure you want to delete this question?"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script>
import AddQuestion from "./AddQuestion.vue";
import EditQuestion from "./EditQuestion.vue";
import AddOptionModal from "../../../views/closed/Options/AddOption.vue";
import EditOptionModal from "../../../views/closed/Options/EditOption.vue";
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

export default {
  components: { AddQuestion, EditQuestion, AddOptionModal, EditOptionModal, Loading, DeleteConfirmModal },

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

      // options
      expandedQuestion: null,
      selectedQuestion: null,
      questionOptions: [],
      optionCounts: {},
      loadingOptions: false,
      showOptionModal: false,
      optionEditMode: false,
      selectedOption: null,
    };
  },

  methods: {
    async fetchItems(page = 1) {
      this.loading = true;
      this.currentPage = page;
      try {
        const res = await this.$apiGet('/question', {
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

    openAddModal()  { this.editMode = false; this.selectedItem = null; this.showModal = true; },
    editItem(item)  { this.editMode = true;  this.selectedItem = item; this.showModal = true; },

    openDeleteModal(id) { this.deleteId = id; this.deleteModalVisible = true; },

    async confirmDelete() {
      await this.$apiDelete('/question', this.deleteId);
      this.deleteModalVisible = false;
      this.fetchItems(this.currentPage);
    },

    typeBadge(type) {
      const map = {
        multiple_choice: 'px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700',
        multiple:        'px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700',
        likert:          'px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700',
        open:            'px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600',
      };
      return map[type] || map.open;
    },

    formatType(type) {
      const map = { multiple_choice: 'MCQ', multiple: 'MCQ', likert: 'Likert', open: 'Open' };
      return map[type] || type;
    },

    modeBadge(mode) {
      if (mode === 'aptitude') return 'px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700';
      if (mode === 'mbti')     return 'px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700';
      return 'px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500';
    },

    async toggleOptions(question) {
      if (this.expandedQuestion === question.id) {
        this.expandedQuestion = null;
        return;
      }
      this.expandedQuestion = question.id;
      this.selectedQuestion = question;
      await this.fetchOptionsForQuestion(question.id);
    },

    async fetchOptionsForQuestion(questionId) {
      this.loadingOptions = true;
      try {
        const res = await this.$apiGet('/option', { page_size: 100, question_id: questionId });
        this.questionOptions = (res.data || []).filter(o => o.question_id === questionId);
        this.optionCounts[questionId] = this.questionOptions.length;
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingOptions = false;
      }
    },

    openAddOptionModal(question) {
      this.selectedQuestion = question;
      this.optionEditMode = false;
      this.selectedOption = null;
      this.showOptionModal = true;
    },

    editOption(option) {
      this.selectedOption = option;
      this.optionEditMode = true;
      this.showOptionModal = true;
    },

    async deleteOption(id) {
      const res = await this.$apiDelete('/option', id);
      if (res) this.$root.$refs.toast.showToast('Option deleted', 'success');
      await this.fetchOptionsForQuestion(this.expandedQuestion);
    },

    async onOptionSaved() {
      this.showOptionModal = false;
      if (this.expandedQuestion) {
        await this.fetchOptionsForQuestion(this.expandedQuestion);
      }
    },
  },

  mounted() {
    this.fetchItems();
  },
};
</script>
