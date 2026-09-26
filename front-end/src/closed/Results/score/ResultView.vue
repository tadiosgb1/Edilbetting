<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800 relative">
    <!-- Loading -->
    <Loading :visible="loading" message="Loading results..." />

    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">
          Results Management Matrix
        </h1>

        <p class="text-gray-500 mt-1">
          Monitor assessment results, answer breakdowns, and recommendations.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <input
          v-model="searchQuery"
          @input="fetchItems(1)"
          type="text"
          placeholder="Search interpretation..."
          class="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <select
          v-model="pageSize"
          @change="fetchItems(1)"
          class="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option v-for="size in [5,10,20,50]" :key="size" :value="size">
            {{ size }} entries
          </option>
        </select>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div
        v-for="test in uniqueTests"
        :key="test.id"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            ID #{{ test.id }}
          </span>

          <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {{ test.testers.length }} submissions
          </span>
        </div>

        <h3 class="mt-4 text-lg font-bold text-gray-800 line-clamp-2">
          {{ test.title }}
        </h3>

        <div class="mt-5 flex items-center justify-between">
          <div>
            <p class="text-xs uppercase text-gray-400">
              Average Score
            </p>

            <p class="text-xl font-bold text-green-600">
              {{ calculateAverageScore(test.testers) }}%
            </p>
          </div>

          <button
            @click="openTestBreakdownModal(test)"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            View Testers
          </button>
        </div>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th class="px-6 py-4 text-left">#</th>
              <th class="px-6 py-4 text-left">Tester</th>
              <th class="px-6 py-4 text-left">Test</th>
              <th class="px-6 py-4 text-center">Score</th>
              <th class="px-6 py-4 text-center">Status</th>
              <th class="px-6 py-4 text-left">Interpretation</th>
              <th class="px-6 py-4 text-center">Details</th>
              <th class="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <template v-for="(item,index) in items" :key="item.id">

              <!-- Main Row -->
              <tr class="hover:bg-green-50 transition">
                <td class="px-6 py-4">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>

                <td class="px-6 py-4">
                  <p class="font-semibold text-gray-800">
                    {{ item.User?.first_name }} {{ item.User?.last_name }}
                  </p>

                  <p class="text-xs text-gray-400">
                    {{ item.User?.email }}
                  </p>
                </td>

                <td class="px-6 py-4">
                  <p class="font-semibold text-gray-700">
                    {{ item.Test?.title }}
                  </p>

                  <span class="text-xs text-gray-400 font-mono">
                    #{{ item.test_id }}
                  </span>
                </td>

                <td class="px-6 py-4 text-center">
                  <span :class="scoreBadge(item.score)">
                    {{ item.score }}%
                  </span>
                </td>

                <td class="px-6 py-4 text-center">
                  <span :class="statusBadge(item.status)">
                    {{ item.status }}
                  </span>
                </td>

                <td class="px-6 py-4 max-w-xs">
                  <p class="truncate">
                    {{ item.interpretation }}
                  </p>
                </td>

                <td class="px-6 py-4 text-center">
                  <button
                    @click="openDetailsModal(item)"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl"
                  >
                    View Details
                  </button>
                </td>

                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-3">
                    <button
                      v-if="item.status === 'pending'"
                      @click="confirmResult(item)"
                      class="text-green-600 hover:text-green-700"
                    >
                      <i class="fas fa-check-circle text-lg"></i>
                    </button>

                    <button
                      @click="openDeleteModal(item.id)"
                      class="text-red-500 hover:text-red-600"
                    >
                      <i class="fas fa-trash text-lg"></i>
                    </button>
                  </div>
                </td>
              </tr>

            </template>

            <tr v-if="items.length === 0">
              <td colspan="8" class="text-center py-10 text-gray-400">
                No result data found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="lg:hidden space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-gray-800">
              {{ item.User?.first_name }} {{ item.User?.last_name }}
            </h3>

            <p class="text-xs text-gray-400 mt-1">
              {{ item.Test?.title }}
            </p>
          </div>

          <span :class="scoreBadge(item.score)">
            {{ item.score }}%
          </span>
        </div>

        <p class="mt-4 text-gray-600">
          {{ item.interpretation }}
        </p>

        <div class="mt-4 flex gap-2">
          <button
            @click="openDetailsModal(item)"
            class="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-semibold"
          >
            View Details
          </button>

          <button
            @click="openDeleteModal(item.id)"
            class="bg-red-100 text-red-600 px-4 rounded-xl"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-8 flex items-center justify-between">
      <p class="text-sm text-gray-500">
        Showing
        {{ count === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}
        -
        {{ Math.min(currentPage * pageSize, count) }}
        of {{ count }}
      </p>

      <div class="flex items-center gap-2">
        <button
          @click="fetchItems(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="px-4 py-2 border rounded-xl bg-white disabled:opacity-40"
        >
          Previous
        </button>

        <span class="px-4 py-2 bg-green-600 text-white rounded-xl font-bold">
          {{ currentPage }}
        </span>

        <button
          @click="fetchItems(currentPage + 1)"
          :disabled="currentPage * pageSize >= count"
          class="px-4 py-2 border rounded-xl bg-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>

    <!-- DETAILS MODAL -->
    <div
      v-if="detailsModalVisible"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="detailsModalVisible = false"
    >
      <div class="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl">
        
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800">
              Result Details
            </h2>

            <p class="text-sm text-gray-400 mt-1">
              {{ selectedItem?.Test?.title }}
            </p>
          </div>

          <button
            @click="detailsModalVisible = false"
            class="text-3xl text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto max-h-[80vh]">

          <!-- User Info -->
          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 rounded-2xl p-4 border">
              <p class="text-xs uppercase text-gray-400">
                Participant
              </p>

              <h3 class="font-bold text-gray-800 mt-2">
                {{ selectedItem?.User?.first_name }}
                {{ selectedItem?.User?.last_name }}
              </h3>

              <p class="text-sm text-gray-500 mt-1">
                {{ selectedItem?.User?.email }}
              </p>
            </div>

            <div class="bg-gray-50 rounded-2xl p-4 border">
              <p class="text-xs uppercase text-gray-400">
                Score
              </p>

              <h3 class="font-bold text-2xl text-green-600 mt-2">
                {{ selectedItem?.score }}%
              </h3>
            </div>

            <div class="bg-gray-50 rounded-2xl p-4 border">
              <p class="text-xs uppercase text-gray-400">
                Status
              </p>

              <div class="mt-2">
                <span :class="statusBadge(selectedItem?.status)">
                  {{ selectedItem?.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Interpretation -->
          <div class="mb-6">
            <h3 class="font-bold text-gray-800 mb-3">
              Interpretation
            </h3>

            <div class="bg-white border rounded-2xl p-5 leading-relaxed">
              {{ selectedItem?.interpretation }}
            </div>
          </div>

          <!-- Recommendations -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-gray-800">
                Recommendations
              </h3>

              <button
                @click="updateRecommendations(selectedItem)"
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl"
              >
                Save
              </button>
            </div>

            <textarea
              v-model="selectedItem.recommendations"
              rows="5"
              class="w-full border border-gray-300 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- Answer Matrix -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-800">
                Answer Matrix
              </h3>

              <button
                @click="loadAnswersMatrix(selectedItem)"
                class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl"
              >
                Load Answers
              </button>
            </div>

            <div
              v-if="answersMatrix[selectedItem?.id]"
              class="space-y-4"
            >
              <div
                v-for="(qDetails,qId) in answersMatrix[selectedItem.id].questions"
                :key="qId"
                class="border rounded-2xl p-4 bg-gray-50"
              >
                <div class="flex justify-between items-start gap-4">
                  <div>
                    <span class="text-xs font-mono text-gray-400">
                      QID: {{ qId }}
                    </span>

                    <h4 class="font-semibold text-gray-800 mt-2">
                      {{ qDetails.question_text }}
                    </h4>
                  </div>

                  <span
                    class="text-xs px-3 py-1 rounded-full font-semibold"
                    :class="qDetails.is_correct
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'"
                  >
                    {{ qDetails.is_correct ? 'Correct' : 'Incorrect' }}
                  </span>
                </div>

                <div class="mt-4 bg-white rounded-xl p-4 border">
                  <p class="text-xs uppercase text-gray-400">
                    Selected Answer
                  </p>

                  <p class="mt-2 italic text-gray-700">
                    "{{ qDetails.selected_option_text }}"
                  </p>
                </div>
              </div>
            </div>

            <div
              v-else
              class="text-sm text-gray-400 italic"
            >
              Answers not loaded.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <delete-confirm-modal
      :visible="deleteModalVisible"
      title="Delete Result"
      message="Are you sure you want to delete this result?"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

export default {
  components: {
    Loading,
    DeleteConfirmModal
  },

  data() {
    return {
      loading: false,

      items: [],
      count: 0,

      currentPage: 1,
      pageSize: 10,

      searchQuery: "",

      deleteModalVisible: false,
      deleteId: null,

      detailsModalVisible: false,
      selectedItem: null,

      answersMatrix: {}
    };
  },

  computed: {
    uniqueTests() {
      const grouped = {};

      this.items.forEach(item => {
        if (!grouped[item.test_id]) {
          grouped[item.test_id] = {
            id: item.test_id,
            title: item.Test?.title,
            testers: []
          };
        }

        grouped[item.test_id].testers.push(item);
      });

      return Object.values(grouped);
    }
  },

  methods: {
    async fetchItems(page = 1) {
      this.loading = true;

      this.currentPage = page;

      try {
        const params = {
          page,
          page_size: this.pageSize,
          search: this.searchQuery
        };

        const res = await this.$apiGet("/result", params);

        this.items = res.data || [];
        this.count = res.count || 0;

      } catch (error) {
        console.error(error);

        this.items = [];
        this.count = 0;

      } finally {
        this.loading = false;
      }
    },

    calculateAverageScore(testers) {
      if (!testers.length) return 0;

      const total = testers.reduce((sum,item) => {
        return sum + Number(item.score || 0);
      },0);

      return Math.round(total / testers.length);
    },

    openDetailsModal(item) {
      this.selectedItem = JSON.parse(JSON.stringify(item));
      this.detailsModalVisible = true;
    },

    async loadAnswersMatrix(item) {
      if (this.answersMatrix[item.id]) return;

      this.loading = true;

      try {
        const res = await this.$apiGet(
          `/result/user/${item.user_id}/test/${item.test_id}/answers-matrix`
        );

        if (res.success) {
          this.$set(this.answersMatrix, item.id, res);
        }

      } catch (error) {
        console.error(error);

      } finally {
        this.loading = false;
      }
    },

    async updateRecommendations(item) {
      this.loading = true;

      try {
        await this.$apiPut(
          `/result/${item.id}`,
          "",
          {
            recommendations: item.recommendations
          }
        );

        this.$root.$refs.toast?.showToast(
          "Recommendations updated.",
          "success"
        );

      } catch (error) {
        console.error(error);

      } finally {
        this.loading = false;
      }
    },

    async confirmResult(item) {
      this.loading = true;

      try {
        await this.$apiPut(
          `/result/${item.id}/status`,
          "",
          {
            status: "confirmed",
            recommendations: item.recommendations,
            test_id: item.test_id
          }
        );

        this.$root.$refs.toast?.showToast(
          "Result confirmed.",
          "success"
        );

        this.fetchItems(this.currentPage);

      } catch (error) {
        console.error(error);

      } finally {
        this.loading = false;
      }
    },

    openDeleteModal(id) {
      this.deleteId = id;
      this.deleteModalVisible = true;
    },

    async confirmDelete() {
      try {
        await this.$apiDelete("/result", this.deleteId);

        this.$root.$refs.toast?.showToast(
          "Result deleted successfully.",
          "success"
        );

        this.fetchItems(this.currentPage);

      } catch (error) {
        console.error(error);

      } finally {
        this.deleteModalVisible = false;
      }
    },

    scoreBadge(score) {
      if (score >= 80) {
        return "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold";
      }

      if (score >= 60) {
        return "bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold";
      }

      return "bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold";
    },

    statusBadge(status) {
      return status === "confirmed"
        ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase"
        : "bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold uppercase";
    }
  },

  mounted() {
    this.fetchItems();
  }
};
</script>