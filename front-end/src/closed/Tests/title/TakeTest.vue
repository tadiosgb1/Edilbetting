<template>
  <div class="min-h-screen bg-gray-50 text-sm text-gray-800">

    <!-- ===================== LOADING ===================== -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <i class="fas fa-spinner animate-spin text-3xl text-green-500 mb-4"></i>
        <p class="text-gray-500">Loading test...</p>
      </div>
    </div>

    <!-- ===================== ALREADY COMPLETED ===================== -->
    <div v-else-if="alreadyCompleted" class="flex items-center justify-center min-h-screen p-6">
      <div class="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 max-w-md w-full text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-check-double text-blue-500 text-3xl"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Test Already Completed</h2>
        <p class="text-gray-500 mb-6">You have already completed this test.</p>
        <div class="flex gap-3">
          <button @click="$router.push({ name: 'Test-view' })"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition">
            Back to Tests
          </button>
          <button @click="$router.push({ name: 'Result-view' })"
            class="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition">
            View Results
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== SUBMITTED ===================== -->
    <div v-else-if="submitted" class="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div class="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-lg w-full text-center">

        <!-- Time expired banner -->
        <div v-if="timerExpired" class="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-left">
          <i class="fas fa-hourglass-end text-red-500 text-lg shrink-0"></i>
          <div>
            <p class="text-sm font-semibold text-red-700">Time Expired</p>
            <p class="text-xs text-red-500">Your test was automatically submitted when the time ran out.</p>
          </div>
        </div>

        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          :class="timerExpired ? 'bg-amber-100' : 'bg-green-100'">
          <i class="text-3xl" :class="timerExpired ? 'fas fa-clock text-amber-500' : 'fas fa-check-circle text-green-500'"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-1">
          {{ timerExpired ? 'Test Auto-Submitted' : 'Test Submitted!' }}
        </h2>
        <p class="text-gray-500 text-sm mb-6">
          You answered <strong>{{ answeredCount }}</strong> of <strong>{{ questions.length }}</strong> questions.
        </p>

        <!-- Aptitude result card -->
        <div v-if="submitResult && (submitResult.result_type === 'aptitude' || submitResult.result_type === 'mixed')" class="mb-6 text-left">
          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-5">
            <p class="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Score-Based Result</p>
            <div class="flex items-center gap-4 mb-3">
              <div class="text-center">
                <span class="text-5xl font-black text-blue-700 leading-none">{{ Number(submitResult.obtained_marks).toFixed(1) }}</span>
                <p class="text-xs text-gray-400 mt-1">marks</p>
              </div>
              <div class="text-sm text-gray-600">
                <div>out of <strong>{{ Number(submitResult.total_marks).toFixed(1) }}</strong></div>
                <div class="text-lg font-bold mt-1" :class="gradeColor(submitResult.grade)">{{ submitResult.grade }}</div>
              </div>
            </div>
            <!-- Percentage bar -->
            <div class="w-full bg-gray-200 rounded-full h-3 mb-1">
              <div class="h-3 rounded-full transition-all"
                :class="submitResult.percentage >= 60 ? 'bg-green-500' : 'bg-red-400'"
                :style="{ width: Math.min(submitResult.percentage, 100) + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mb-3">
              <span>0</span>
              <span class="font-semibold" :class="submitResult.percentage >= 60 ? 'text-green-600' : 'text-red-500'">
                {{ Number(submitResult.percentage).toFixed(1) }}%
              </span>
              <span>100</span>
            </div>
            <p class="text-xs text-gray-600 italic">{{ submitResult.interpretation }}</p>
          </div>
        </div>

        <!-- MBTI result card -->
        <div v-if="submitResult && (submitResult.result_type === 'mbti' || submitResult.result_type === 'mixed')" class="mb-6 text-left">
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
            <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Personality Type</p>
            <div class="flex items-center gap-4 mb-3">
              <span class="text-5xl font-black text-indigo-700 tracking-widest">{{ submitResult.mbti_type }}</span>
              <div class="text-xs text-gray-500 leading-relaxed">
                <div v-for="dim in mbtiDimensions" :key="dim.left">
                  <span class="font-semibold text-indigo-600">{{ dim.left }}</span> vs
                  <span class="font-semibold text-gray-500">{{ dim.right }}</span>
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-500 mb-2">Confidence: <strong class="text-indigo-600">{{ submitResult.score }}%</strong></p>
            <p class="text-xs text-gray-600 italic leading-relaxed">{{ submitResult.interpretation }}</p>
          </div>
        </div>

        <div class="flex gap-3">
          <button @click="$router.push({ name: 'Test-view' })"
            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition text-sm">
            Back to Tests
          </button>
          <button @click="$router.push({ name: 'Result-view' })"
            class="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition text-sm">
            View Results
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== TEST UI ===================== -->
    <div v-else class="flex h-screen overflow-hidden">

      <!-- LEFT: Question Panel -->
      <div class="flex-1 flex flex-col overflow-hidden">

        <!-- Top Bar -->
        <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 class="font-bold text-gray-800 text-base">{{ test.title }}</h1>
            <p class="text-xs text-gray-400">{{ test.description }}</p>
          </div>
          <div class="flex items-center gap-4">
            <!-- Auto-save indicator -->
            <div v-if="savingAnswer" class="text-xs text-gray-400 flex items-center gap-1">
              <i class="fas fa-circle-notch animate-spin text-green-400"></i> Saving…
            </div>
            <div v-else-if="lastSaved" class="text-xs text-gray-400 flex items-center gap-1">
              <i class="fas fa-cloud-check text-green-400"></i> Saved
            </div>
            <!-- Timer -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm transition-all"
              :class="{
                'border-red-400 bg-red-100 text-red-700 animate-pulse': timerCritical,
                'border-amber-300 bg-amber-50 text-amber-700': timerWarning && !timerCritical,
                'border-gray-200 bg-gray-50 text-gray-600': !timerWarning && !timerCritical,
              }">
              <i class="fas fa-clock text-xs"></i>
              <span>{{ formattedTime }}</span>
            </div>
            <!-- Progress -->
            <div class="text-xs text-gray-500">
              <span class="font-semibold text-green-600">{{ answeredCount }}</span> / {{ questions.length }}
            </div>
          </div>
        </div>

        <!-- Answer Progress Bar -->
        <div class="h-1 bg-gray-100 flex-shrink-0">
          <div class="h-1 bg-green-500 transition-all duration-300" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <!-- Time Progress Bar -->
        <div class="h-1 flex-shrink-0" :class="timerCritical ? 'bg-red-100' : timerWarning ? 'bg-amber-100' : 'bg-gray-50'">
          <div class="h-1 transition-all duration-1000"
            :class="timerCritical ? 'bg-red-500' : timerWarning ? 'bg-amber-400' : 'bg-blue-400'"
            :style="{ width: timePercent + '%' }"></div>
        </div>

        <!-- Question Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="currentQuestion" class="max-w-2xl mx-auto">

            <!-- Question Header -->
            <div class="flex items-start gap-3 mb-6">
              <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {{ currentIndex + 1 }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
                    :class="typeBadge(currentQuestion.type)">{{ currentQuestion.type }}</span>
                  <span v-if="isFlagged(currentQuestion.id)"
                    class="text-[10px] text-amber-600 font-semibold">
                    <i class="fas fa-flag mr-1"></i>Flagged
                  </span>
                </div>
                <p class="text-base font-medium text-gray-800 leading-relaxed">{{ currentQuestion.question_text }}</p>
              </div>
            </div>

            <!-- Options -->
            <div v-if="currentQuestion.type !== 'open'" class="space-y-3">
              <label
                v-for="opt in sortedOptions(currentQuestion)"
                :key="opt.id"
                class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                :class="answers[currentQuestion.id] === opt.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'"
              >
                <input type="radio" :name="'q-' + currentQuestion.id" :value="opt.id"
                  v-model="answers[currentQuestion.id]"
                  @change="onAnswerChange(currentQuestion, opt.id)"
                  class="w-4 h-4 accent-green-500" />
                <span class="text-sm text-gray-700">{{ opt.text }}</span>
                <span v-if="answers[currentQuestion.id] === opt.id" class="ml-auto text-green-500">
                  <i class="fas fa-check-circle"></i>
                </span>
              </label>
            </div>

            <!-- Open Text -->
            <div v-else>
              <textarea v-model="openAnswers[currentQuestion.id]" rows="5"
                placeholder="Write your answer here..."
                @blur="onOpenAnswerBlur(currentQuestion)"
                class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
            </div>

            <!-- Navigation -->
            <div class="flex items-center justify-between mt-8">
              <button @click="prevQuestion" :disabled="currentIndex === 0"
                class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <i class="fas fa-arrow-left text-xs"></i> Previous
              </button>

              <div class="flex items-center gap-3">
                <button @click="toggleFlag(currentQuestion.id)"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition"
                  :class="isFlagged(currentQuestion.id)
                    ? 'border-amber-300 bg-amber-50 text-amber-600'
                    : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-500'">
                  <i class="fas fa-flag text-xs"></i>
                  {{ isFlagged(currentQuestion.id) ? 'Unflag' : 'Flag' }}
                </button>
                <button v-if="answers[currentQuestion.id] || openAnswers[currentQuestion.id]"
                  @click="clearAnswer(currentQuestion)"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-red-300 hover:text-red-500 transition">
                  <i class="fas fa-times text-xs"></i> Clear
                </button>
              </div>

              <button v-if="currentIndex < questions.length - 1" @click="nextQuestion"
                class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition">
                Next <i class="fas fa-arrow-right text-xs"></i>
              </button>
              <button v-else @click="confirmSubmit"
                class="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition">
                <i class="fas fa-paper-plane text-xs"></i> Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Question Navigator -->
      <div class="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 hidden lg:flex">
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Navigator</h3>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <div class="flex flex-wrap gap-2 mb-4 text-[10px] text-gray-500">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-500 inline-block"></span> Answered</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-amber-400 inline-block"></span> Flagged</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-200 inline-block"></span> Unanswered</span>
          </div>
          <div class="grid grid-cols-5 gap-1.5">
            <button v-for="(q, i) in questions" :key="q.id"
              @click="goToQuestion(i)"
              class="w-9 h-9 rounded-lg text-xs font-bold transition-all border-2"
              :class="navButtonClass(q, i)">
              {{ i + 1 }}
            </button>
          </div>
        </div>
        <div class="p-4 border-t border-gray-200">
          <div class="text-xs text-gray-500 mb-3 text-center">{{ answeredCount }} of {{ questions.length }} answered</div>
          <button @click="confirmSubmit"
            class="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition">
            Submit Test
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== TIME EXPIRED OVERLAY ===================== -->
    <div v-if="timerExpired && submitting"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-hourglass-end text-red-500 text-3xl"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Time's Up!</h2>
        <p class="text-gray-500 text-sm mb-4">Submitting your answers automatically...</p>
        <div class="flex items-center justify-center gap-2 text-green-600 font-medium text-sm">
          <i class="fas fa-spinner animate-spin"></i> Saving your responses...
        </div>
      </div>
    </div>

    <!-- ===================== CONFIRM SUBMIT MODAL ===================== -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-amber-500"></i>
          </div>
          <h3 class="font-bold text-gray-800">Submit Test?</h3>
        </div>
        <p class="text-sm text-gray-600 mb-2">
          You have answered <strong>{{ answeredCount }}</strong> of <strong>{{ questions.length }}</strong> questions.
        </p>
        <p v-if="unansweredCount > 0" class="text-sm text-amber-600 mb-2">
          <i class="fas fa-exclamation-circle mr-1"></i> {{ unansweredCount }} unanswered.
        </p>
        <p v-if="flaggedCount > 0" class="text-sm text-amber-600 mb-4">
          <i class="fas fa-flag mr-1"></i> {{ flaggedCount }} flagged for review.
        </p>
        <div class="flex gap-3 mt-4">
          <button @click="showConfirmModal = false"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Review</button>
          <button @click="submitTest" :disabled="submitting"
            class="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            <i v-if="submitting" class="fas fa-spinner animate-spin text-xs"></i>
            {{ submitting ? 'Submitting...' : 'Confirm Submit' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'TakeTest',

  data() {
    return {
      test: {},
      questions: [],
      loading: true,
      submitted: false,
      submitting: false,
      showConfirmModal: false,
      alreadyCompleted: false,

      currentIndex: 0,
      answers: {},       // { questionId: optionId }
      openAnswers: {},   // { questionId: text }
      flagged: new Set(),

      // Result returned from server after compute
      submitResult: null,

      // Auto-save state
      savingAnswer: false,
      lastSaved: false,
      saveQueue: {},       // pending debounced saves
      saveDebounceMs: 800,

      // Timer
      totalSeconds: 0,
      remainingSeconds: 0,
      timerInterval: null,
      timerExpired: false,
      timerSaveInterval: null,  // saves remaining_seconds every 30s
    };
  },

  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex] || null;
    },

    mbtiDimensions() {
      return [
        { left: 'E', right: 'I' },
        { left: 'S', right: 'N' },
        { left: 'T', right: 'F' },
        { left: 'J', right: 'P' },
      ];
    },

    answeredCount() {
      return this.questions.filter(q =>
        q.type === 'open'
          ? !!this.openAnswers[q.id]?.trim()
          : this.answers[q.id] != null
      ).length;
    },

    unansweredCount() { return this.questions.length - this.answeredCount; },
    flaggedCount()    { return this.flagged.size; },

    progressPercent() {
      if (!this.questions.length) return 0;
      return Math.round((this.answeredCount / this.questions.length) * 100);
    },

    timePercent() {
      if (!this.totalSeconds) return 100;
      return Math.round((this.remainingSeconds / this.totalSeconds) * 100);
    },

    formattedTime() {
      const m = Math.floor(this.remainingSeconds / 60);
      const s = this.remainingSeconds % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    timerWarning()  { return this.remainingSeconds <= 300 && this.remainingSeconds > 60; },
    timerCritical() { return this.remainingSeconds <= 60  && this.remainingSeconds > 0;  },
  },

  methods: {
    // ─────────────────────────────────────────────────────────────────────
    //  Initialisation
    // ─────────────────────────────────────────────────────────────────────
    async checkIfCompleted() {
      const userId = parseInt(localStorage.getItem('userId'));
      const testId = parseInt(this.$route.params.id);
      try {
        const res = await this.$apiGet('/result', { page: 1, page_size: 1000 });
        const found = (res.data || []).some(r => r.user_id === userId && r.test_id === testId);
        if (found) { this.alreadyCompleted = true; return true; }
        return false;
      } catch (e) {
        console.error('checkIfCompleted error:', e);
        return false;
      }
    },

    async fetchTest() {
      const id = this.$route.params.id;
      try {
        const res    = await this.$apiGetById('/test', id);
        this.test    = res || {};
        const dur    = parseInt(this.test.duration) || 30;
        this.totalSeconds     = dur * 60;
        this.remainingSeconds = this.totalSeconds;
      } catch (e) { console.error('fetchTest error:', e); }
    },

    async fetchQuestions() {
      const id = this.$route.params.id;
      try {
        const res       = await this.$apiGet('/question', { test_id: id, page_size: 500 });
        this.questions  = res.data || [];
      } catch (e) { console.error('fetchQuestions error:', e); }
    },

    // ─────────────────────────────────────────────────────────────────────
    //  Session restore — fetch previously saved answers + timer from server
    // ─────────────────────────────────────────────────────────────────────
    async restoreSession() {
      const userId = parseInt(localStorage.getItem('userId'));
      const testId = this.$route.params.id;
      try {
        const res = await this.$apiGet(`/answer/session/${userId}/${testId}`);
        if (!res || !res.success) return;

        // Restore answers
        const savedAnswers  = res.answers || {};
        const restoredAns   = {};
        const restoredOpen  = {};

        for (const [qId, data] of Object.entries(savedAnswers)) {
          const qIdInt = parseInt(qId);
          if (data.option_id != null) {
            restoredAns[qIdInt] = data.option_id;
          }
          if (data.open_answer) {
            restoredOpen[qIdInt] = data.open_answer;
          }
        }
        this.answers     = restoredAns;
        this.openAnswers = restoredOpen;

        // Restore flagged questions
        const flaggedIds = res.flagged_ids || [];
        this.flagged = new Set(flaggedIds);

        // Restore timer — only if there are seconds left and < totalSeconds
        if (res.remaining_seconds !== null && res.remaining_seconds > 0) {
          this.remainingSeconds = Math.min(res.remaining_seconds, this.totalSeconds);
        }
      } catch (e) {
        // Silently ignore — fresh session will be used
        console.warn('restoreSession error (non-fatal):', e);
      }
    },

    // ─────────────────────────────────────────────────────────────────────
    //  Auto-save: answer change handlers
    // ─────────────────────────────────────────────────────────────────────
    onAnswerChange(question, optionId) {
      // Immediately persist to server (debounced per question)
      this.debouncedSaveAnswer(question.id, { option_id: optionId, open_answer: null });
    },

    onOpenAnswerBlur(question) {
      const text = this.openAnswers[question.id]?.trim() || null;
      this.debouncedSaveAnswer(question.id, { option_id: null, open_answer: text });
    },

    debouncedSaveAnswer(questionId, payload) {
      // Clear any pending save for this question
      if (this.saveQueue[questionId]) clearTimeout(this.saveQueue[questionId]);

      this.saveQueue[questionId] = setTimeout(() => {
        this.persistAnswer(questionId, payload);
        delete this.saveQueue[questionId];
      }, this.saveDebounceMs);
    },

    async persistAnswer(questionId, payload) {
      const userId = parseInt(localStorage.getItem('userId'));
      this.savingAnswer = true;
      this.lastSaved    = false;
      try {
        await this.$apiPost('/answer/upsert', {
          user_id:     userId,
          question_id: questionId,
          option_id:   payload.option_id   ?? null,
          open_answer: payload.open_answer ?? null,
          is_flagged:  this.flagged.has(questionId),
        });
        this.lastSaved = true;
      } catch (e) {
        console.warn('persistAnswer error:', e);
      } finally {
        this.savingAnswer = false;
      }
    },

    // ─────────────────────────────────────────────────────────────────────
    //  Flag toggle — persists immediately
    // ─────────────────────────────────────────────────────────────────────
    async toggleFlag(questionId) {
      if (this.flagged.has(questionId)) {
        this.flagged.delete(questionId);
      } else {
        this.flagged.add(questionId);
      }
      this.flagged = new Set(this.flagged); // trigger reactivity

      // Persist flag change
      const userId   = parseInt(localStorage.getItem('userId'));
      const optionId = this.answers[questionId] ?? null;
      const openAns  = this.openAnswers[questionId] ?? null;
      try {
        await this.$apiPost('/answer/upsert', {
          user_id:     userId,
          question_id: questionId,
          option_id:   optionId,
          open_answer: openAns,
          is_flagged:  this.flagged.has(questionId),
        });
      } catch (e) { console.warn('flag persist error:', e); }
    },

    clearAnswer(question) {
      delete this.answers[question.id];
      delete this.openAnswers[question.id];
      this.answers     = { ...this.answers };
      this.openAnswers = { ...this.openAnswers };

      // Persist cleared state
      const userId = parseInt(localStorage.getItem('userId'));
      this.$apiPost('/answer/upsert', {
        user_id:     userId,
        question_id: question.id,
        option_id:   null,
        open_answer: null,
        is_flagged:  this.flagged.has(question.id),
      }).catch(() => {});
    },

    // ─────────────────────────────────────────────────────────────────────
    //  Timer persistence
    // ─────────────────────────────────────────────────────────────────────
    async saveTimerState() {
      const userId = parseInt(localStorage.getItem('userId'));
      const testId = this.test.id;
      if (!userId || !testId) return;
      try {
        await this.$apiPost('/progress/upsert', {
          user_id:           userId,
          test_id:           testId,
          remaining_seconds: this.remainingSeconds,
        });
      } catch (e) { /* non-fatal */ }
    },

    startTimer() {
      if (this.totalSeconds <= 0) return;
      this.timerInterval = setInterval(() => {
        if (this.remainingSeconds <= 0) {
          this.stopTimer();
          this.timerExpired = true;
          this.showConfirmModal = false;
          this.submitTest();
          return;
        }
        this.remainingSeconds--;
      }, 1000);

      // Save timer state every 30 seconds
      this.timerSaveInterval = setInterval(() => {
        this.saveTimerState();
      }, 30000);
    },

    stopTimer() {
      if (this.timerInterval)     { clearInterval(this.timerInterval);     this.timerInterval     = null; }
      if (this.timerSaveInterval) { clearInterval(this.timerSaveInterval); this.timerSaveInterval = null; }
    },

    // ─────────────────────────────────────────────────────────────────────
    //  Navigation
    // ─────────────────────────────────────────────────────────────────────
    goToQuestion(i)  { this.currentIndex = i; },
    prevQuestion()   { if (this.currentIndex > 0) this.currentIndex--; },
    nextQuestion()   { if (this.currentIndex < this.questions.length - 1) this.currentIndex++; },
    confirmSubmit()  {
       this.showConfirmModal = true; 
      },


    // ─────────────────────────────────────────────────────────────────────
    //  Submit — flush remaining unsaved answers, then call /result/compute
    // ─────────────────────────────────────────────────────────────────────
   
    async submitTest() {
      this.submitting = true;
      const userId    = parseInt(localStorage.getItem('userId'));
      const now       = new Date().toISOString();

      try {
        // 1. Flush any queued debounced saves immediately
        const pendingIds = Object.keys(this.saveQueue);
        for (const qId of pendingIds) {
          clearTimeout(this.saveQueue[qId]);
          delete this.saveQueue[qId];
        }

        // 2. Ensure every answered question is persisted
        const savePromises = [];
        for (const q of this.questions) {
          if (q.type === 'open') {
            const text = this.openAnswers[q.id]?.trim();
            if (text) {
              savePromises.push(this.$apiPost('/answer/upsert', {
                user_id:     userId,
                question_id: q.id,
                option_id:   null,
                open_answer: text,
                is_flagged:  this.flagged.has(q.id),
              }));
            }
          } else {
            const optId = this.answers[q.id];
            if (optId != null) {
              savePromises.push(this.$apiPost('/answer/upsert', {
                user_id:     userId,
                question_id: q.id,
                option_id:   optId,
                open_answer: null,
                is_flagged:  this.flagged.has(q.id),
              }));
            }
          }
        }
        await Promise.allSettled(savePromises);

        // 3. Ask the server to compute the result
        const computeRes = await this.$apiPost('/result/compute', {
          user_id: userId,
          test_id: this.test.id,
        });

        this.submitResult = computeRes?.result || null;

        this.stopTimer();
        this.showConfirmModal = false;
        this.submitted = true;
        this.$root.$refs.toast?.showToast('Test submitted successfully!', 'success');

      } catch (e) {
        console.error('submitTest error:', e);
        this.$root.$refs.toast?.showToast('Failed to submit test. Please try again.', 'error');
      } finally {
        this.submitting = false;
      }
    },

    // ─────────────────────────────────────────────────────────────────────
    //  UI helpers
    // ─────────────────────────────────────────────────────────────────────
    sortedOptions(question) {
      return [...(question.Options || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
    },

    isFlagged(id) { return this.flagged.has(id); },

    typeBadge(type) {
      const map = {
        multiple_choice: 'bg-blue-50 text-blue-700',
        multiple:        'bg-blue-50 text-blue-700',
        likert:          'bg-amber-50 text-amber-700',
        open:            'bg-gray-100 text-gray-600',
      };
      return map[type] || map.open;
    },

    navButtonClass(q, i) {
      const isActive   = i === this.currentIndex;
      const isAnswered = q.type === 'open'
        ? !!this.openAnswers[q.id]?.trim()
        : this.answers[q.id] != null;
      const isFlagged  = this.flagged.has(q.id);

      if (isActive)   return 'border-green-500 bg-green-500 text-white';
      if (isFlagged)  return 'border-amber-400 bg-amber-50 text-amber-700';
      if (isAnswered) return 'border-green-300 bg-green-50 text-green-700';
      return 'border-gray-200 bg-white text-gray-500 hover:border-green-300';
    },

    gradeColor(grade) {
      const map = {
        Excellent: 'text-green-600',
        'Very Good': 'text-green-500',
        Good: 'text-blue-500',
        Pass: 'text-amber-500',
        Fail: 'text-red-500',
      };
      return map[grade] || 'text-gray-600';
    },
  },

  async mounted() {
    this.loading = true;
    const completed = await this.checkIfCompleted();
    if (!completed) {
      await Promise.all([this.fetchTest(), this.fetchQuestions()]);
      await this.restoreSession();   // restore answers + timer from server
      this.startTimer();
    }
    this.loading = false;
  },

  beforeUnmount() {
    this.stopTimer();
    // Flush any pending saves
    Object.values(this.saveQueue).forEach(t => clearTimeout(t));
  },
};
</script>
