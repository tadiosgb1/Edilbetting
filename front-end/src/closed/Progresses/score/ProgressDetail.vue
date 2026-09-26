<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">
    <Loading :visible="loading" message="Loading answers..." />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <div>
        <h1 class="text-lg font-bold text-gray-800">Test Answers</h1>
        <p v-if="progress.User && progress.Test" class="text-xs text-gray-500 mt-0.5">
          {{ progress.User.first_name }} {{ progress.User.last_name }}
          &nbsp;·&nbsp;
          {{ progress.Test.title }}
          &nbsp;·&nbsp;
          {{ formatDate(progress.taken_at) }}
        </p>
      </div>
      <button @click="$router.back()" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        <i class="fas fa-arrow-left text-xs"></i> Back
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="!loading" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-2xl font-bold text-gray-800">{{ questions.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Total Questions</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ answeredCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Answered</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-2xl font-bold text-amber-500">{{ questions.length - answeredCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Unanswered</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-2xl font-bold" :class="progress.score >= 80 ? 'text-green-600' : progress.score >= 60 ? 'text-amber-500' : 'text-red-500'">
          {{ progress.score ?? '—' }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Score</p>
      </div>
    </div>

    <!-- Questions + Answers -->
    <div v-if="!loading" class="space-y-4">
      <div
        v-for="(q, i) in questions"
        :key="q.id"
        class="bg-white rounded-xl border border-gray-200 p-5"
      >
        <!-- Question Header -->
        <div class="flex items-start gap-3 mb-4">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            :class="isAnswered(q) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'">
            {{ i + 1 }}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded"
                :class="typeBadge(q.type)">{{ q.type }}</span>
              <span v-if="!isAnswered(q)" class="text-[10px] text-amber-600 font-medium">
                <i class="fas fa-exclamation-circle mr-0.5"></i>Not answered
              </span>
            </div>
            <p class="text-sm font-medium text-gray-800">{{ q.question_text }}</p>
          </div>
        </div>

        <!-- Options (multiple / likert) -->
        <div v-if="q.type !== 'open'" class="space-y-2 ml-10">
          <div
            v-for="opt in sortedOptions(q)"
            :key="opt.id"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm"
            :class="isSelectedOption(q.id, opt.id)
              ? 'border-green-400 bg-green-50 text-green-800 font-medium'
              : 'border-gray-100 text-gray-600'"
          >
            <i v-if="isSelectedOption(q.id, opt.id)" class="fas fa-check-circle text-green-500 flex-shrink-0"></i>
            <i v-else class="far fa-circle text-gray-300 flex-shrink-0"></i>
            <span>{{ opt.text }}</span>
            <span v-if="isSelectedOption(q.id, opt.id)" class="ml-auto text-xs text-green-600">
              Selected
            </span>
          </div>
          <p v-if="!sortedOptions(q).length" class="text-xs text-gray-400 italic ml-1">No options found.</p>
        </div>

        <!-- Open answer -->
        <div v-else class="ml-10">
          <div v-if="getOpenAnswer(q.id)" class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
            {{ getOpenAnswer(q.id) }}
          </div>
          <p v-else class="text-xs text-gray-400 italic">No answer provided.</p>
        </div>
      </div>

      <p v-if="questions.length === 0" class="text-center text-gray-400 italic py-8">
        No questions found for this test.
      </p>
    </div>
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";

export default {
  components: { Loading },

  data() {
    return {
      progress: {},
      questions: [],
      answers: [],   // all answers for this user + test
      loading: false,
    };
  },

  computed: {
    answeredCount() {
      return this.questions.filter(q => this.isAnswered(q)).length;
    },
  },

  methods: {
    // Check if a question was answered
    isAnswered(q) {
      return this.answers.some(a => a.question_id === q.id);
    },

    // Check if a specific option was selected for a question
    isSelectedOption(questionId, optionId) {
      return this.answers.some(a => a.question_id === questionId && a.option_id === optionId);
    },

    // Get open text answer for a question
    getOpenAnswer(questionId) {
      const a = this.answers.find(a => a.question_id === questionId);
      return a?.answer_text || null;
    },

    sortedOptions(q) {
      return [...(q.Options || [])].sort((a, b) => a.position - b.position);
    },

    typeBadge(type) {
      const map = {
        multiple: 'bg-blue-50 text-blue-700',
        likert:   'bg-amber-50 text-amber-700',
        open:     'bg-gray-100 text-gray-600',
      };
      return map[type] || map.open;
    },

    formatDate(date) {
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    },

    async fetchData() {
      this.loading = true;
      const progressId = this.$route.params.id;

      try {
        // 1. Fetch the progress record (includes User + Test)
        const prog = await this.$apiGetById('/progress', progressId);
        this.progress = prog || {};

        const userId = this.progress.user_id;
        const testId = this.progress.test_id;

        if (!userId || !testId) return;

        // 2. Fetch all questions for this test (with Options)
        const qRes = await this.$apiGet('/question', { test_id: testId, page_size: 200 });
        this.questions = qRes.data || [];

        // 3. Fetch all answers by this user for these questions
        const aRes = await this.$apiGet('/answer', { user_id: userId, page_size: 500 });
        const allAnswers = aRes.data || [];

        // Filter to only answers for questions in this test
        const questionIds = new Set(this.questions.map(q => q.id));
        this.answers = allAnswers.filter(a => questionIds.has(a.question_id));

      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.fetchData();
  },
};
</script>
