<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 text-sm max-h-[90vh] overflow-y-auto">

      <!-- Header -->
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold text-gray-800">Edit Question</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <div v-if="loadingInitialData" class="py-12 text-center text-gray-500 font-medium">
        Loading question…
      </div>

      <form v-else @submit.prevent="submitForm" class="space-y-4">

        <!-- Question Text -->
        <div>
          <label class="block mb-1 font-medium">Question <span class="text-red-500">*</span></label>
          <textarea v-model="form.question_text" required rows="3"
            class="w-full border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"></textarea>
        </div>

        <!-- Scoring Mode -->
        <div>
          <label class="block mb-1 font-medium">Scoring Mode <span class="text-red-500">*</span></label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition"
              :class="form.scoring_mode === 'aptitude' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'">
              <input type="radio" v-model="form.scoring_mode" value="aptitude" @change="onScoringModeChange" class="accent-blue-500" />
              <span class="font-semibold">Score-Based (Aptitude)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition"
              :class="form.scoring_mode === 'mbti' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-600'">
              <input type="radio" v-model="form.scoring_mode" value="mbti" @change="onScoringModeChange" class="accent-purple-500" />
              <span class="font-semibold">Type-Based (MBTI)</span>
            </label>
          </div>
          <p v-if="form.scoring_mode === 'aptitude'" class="text-xs text-blue-600 mt-1">
            Each option has a correct/incorrect flag and a score. Supports partial marking.
          </p>
          <p v-else class="text-xs text-purple-600 mt-1">
            Each option maps to a personality trait via weight and indication letter (E, I, N, S…).
          </p>
        </div>

        <!-- Category — only for MBTI/type-based questions -->
        <div v-if="form.scoring_mode === 'mbti'">
          <label class="block mb-1 font-medium">Category <span class="text-red-500">*</span></label>
          <select v-model="form.category_id" @change="onCategoryChange"
            :required="form.scoring_mode === 'mbti'"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
            <option disabled value="">Select Category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <!-- Test -->
        <div>
          <label class="block mb-1 font-medium">Test <span class="text-red-500">*</span></label>
          <select v-model="form.test_id" required
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
            <option disabled value="">Select Test</option>
            <option v-for="test in tests" :key="test.id" :value="test.id">{{ test.title }}</option>
          </select>
        </div>

        <!-- Question Type -->
        <div>
          <label class="block mb-1 font-medium">Question Type <span class="text-red-500">*</span></label>
          <select v-model="form.type" required
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="multiple_choice">Multiple Choice</option>
            <option v-if="form.scoring_mode === 'mbti'" value="likert">Likert Scale</option>
            <option value="open">Open / Essay</option>
          </select>
        </div>

        <!-- Aptitude: Marks -->
        <div v-if="form.scoring_mode === 'aptitude' && form.type !== 'open'">
          <label class="block mb-1 font-medium">Total Marks</label>
          <input v-model.number="form.marks" type="number" min="0" step="0.5"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. 2" />
          <p class="text-xs text-gray-400 mt-1">Informational — actual marks come from each option's score field.</p>
        </div>

        <!-- Aptitude: Explanation -->
        <div v-if="form.scoring_mode === 'aptitude'">
          <label class="block mb-1 font-medium">Explanation <span class="text-gray-400 text-xs">(shown after answering)</span></label>
          <textarea v-model="form.explanation" rows="2"
            class="w-full border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Optional: explain the correct answer…"></textarea>
        </div>

        <!-- ─── OPTIONS ─── -->
        <div v-if="form.type !== 'open'">
          <div class="flex items-center justify-between mb-2">
            <label class="font-medium">Options</label>
            <span v-if="form.scoring_mode === 'aptitude'"
              class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
              Mark correct answers ✓
            </span>
          </div>

          <!-- APTITUDE options -->
          <template v-if="form.scoring_mode === 'aptitude'">
            <div v-for="(opt, i) in options" :key="i"
              class="border rounded-lg mb-3 p-3 bg-gray-50 space-y-2"
              :class="opt.is_correct ? 'border-green-400 bg-green-50' : ''">
              <div class="flex gap-2 items-center">
                <label class="flex items-center gap-1 cursor-pointer min-w-[70px]">
                  <input type="checkbox" v-model="opt.is_correct" class="accent-green-500 w-4 h-4" />
                  <span class="text-xs font-semibold" :class="opt.is_correct ? 'text-green-600' : 'text-gray-400'">
                    {{ opt.is_correct ? 'Correct' : 'Wrong' }}
                  </span>
                </label>
                <input v-model="opt.text" :placeholder="`Option ${i + 1} text`" required
                  class="flex-1 border rounded px-2 py-1 bg-white" />
                <input v-model="opt.indication_letter" placeholder="A…" maxlength="3"
                  class="w-12 border rounded px-2 py-1 text-center bg-white font-semibold uppercase" />
                <button type="button" @click="removeOption(i, opt)"
                  class="text-red-400 hover:text-red-600 px-1">✖</button>
              </div>
              <div class="flex gap-2 items-center text-xs">
                <div class="flex items-center gap-1">
                  <span class="text-gray-500">Score:</span>
                  <input v-model.number="opt.score" type="number" step="0.5" min="0"
                    :placeholder="opt.is_correct ? String(form.marks || 1) : '0'"
                    class="w-20 border rounded px-2 py-1 bg-white" />
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-gray-500">Pos:</span>
                  <input v-model.number="opt.position" type="number" min="1"
                    class="w-16 border rounded px-2 py-1 bg-white" />
                </div>
              </div>
            </div>
          </template>

          <!-- MBTI options -->
          <template v-else>
            <div v-for="(opt, i) in options" :key="i" class="border p-3 rounded-lg mb-3 bg-gray-50 space-y-2">
              <div class="flex gap-2 items-center">
                <select v-if="form.type === 'multiple_choice'" v-model="opt.content_type"
                  @change="clearOptionSource(opt)" class="w-1/4 border rounded px-2 py-1 bg-white">
                  <option value="text">Text Option</option>
                  <option value="image">Image File</option>
                </select>
                <div class="flex-1 flex items-center gap-2">
                  <template v-if="opt.content_type === 'text' || form.type === 'likert'">
                    <input v-model="opt.text" placeholder="Option Text" required
                      class="w-full border rounded px-2 py-1 bg-white" />
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-3 w-full">
                      <input type="file" accept="image/*" @change="handleFileChange($event, opt)"
                        class="text-xs max-w-xs" :required="!opt.existing_image" />
                      <img v-if="opt.previewUrl || opt.existing_image"
                        :src="opt.previewUrl || getImageUrl(opt.existing_image)"
                        class="w-8 h-8 object-cover rounded border" />
                    </div>
                  </template>
                </div>
                <input v-model="opt.indication_letter" placeholder="E/I…" maxlength="3"
                  class="w-1/6 border rounded px-2 py-1 text-center bg-white font-semibold uppercase" />
                <button type="button" @click="removeOption(i, opt)"
                  class="text-red-500 px-1 text-base hover:text-red-700">✖</button>
              </div>
              <div class="flex gap-2 items-center text-xs">
                <div class="w-2/5">
                  <select v-model="opt.triat_id" class="w-full border rounded px-2 py-1 bg-white">
                    <option value="">Select Trait (None)</option>
                    <option v-for="t in triats" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <div class="w-1/4 flex items-center gap-1">
                  <span class="text-gray-500">W:</span>
                  <input v-model.number="opt.weight" type="number" step="any"
                    class="w-full border rounded px-2 py-1 bg-white" />
                </div>
                <div class="w-1/4 flex items-center gap-1">
                  <span class="text-gray-500">Pos:</span>
                  <input v-model.number="opt.position" type="number"
                    class="w-full border rounded px-2 py-1 bg-white" />
                </div>
              </div>
            </div>
          </template>

          <button type="button" @click="addOption" class="text-green-600 text-sm font-medium mt-1">
            + Add Option
          </button>
        </div>

        <!-- Open question marks/weight -->
        <div v-if="form.type === 'open'">
          <label class="block mb-1 font-medium">
            {{ form.scoring_mode === 'aptitude' ? 'Marks' : 'Weight' }}
          </label>
          <input v-model.number="form.marks" type="number" step="any"
            class="w-full border rounded px-3 py-2" />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" :disabled="saving"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditQuestion',
  props: {
    questionId: { type: [String, Number], required: true },
  },
  emits: ['close', 'saved'],
  data() {
    return {
      tests: [],
      categories: [],
      triats: [],
      loadingInitialData: true,
      saving: false,
      removedOptionIds: [],

      form: {
        question_text: '',
        type: 'multiple_choice',
        scoring_mode: 'aptitude',
        category_id: '',
        test_id: '',
        marks: 1,
        explanation: '',
      },
      options: [],
    };
  },

  methods: {
    // ── Fetch helpers ──
    async fetchLookupData() {
      try {
        const [testRes, catRes] = await Promise.all([
          this.$apiGet('/test',     { page: 1, page_size: 10000 }),
          this.$apiGet('/category', { page: 1, page_size: 10000 }),
        ]);
        this.tests      = testRes.data  || [];
        this.categories = catRes.data   || [];
      } catch (e) {
        console.error('Failed loading lookups:', e);
      }
    },

    async fetchQuestionProfile() {
      try {
        this.loadingInitialData = true;
        const res = await this.$apiGetById('/question', this.questionId);
        if (!res) return;

        this.form.question_text = res.question_text || '';
        this.form.type          = res.type          || 'multiple_choice';
        this.form.scoring_mode  = res.scoring_mode  || 'aptitude';
        this.form.category_id   = res.category_id   || '';
        this.form.test_id       = res.test_id        || '';
        this.form.marks         = res.marks          !== undefined ? Number(res.marks) : 1;
        this.form.explanation   = res.explanation    || '';

        // Sync traits for selected category
        if (this.form.category_id) {
          const selected = this.categories.find(c => c.id === this.form.category_id);
          this.triats = selected?.Triats || [];
        }

        // Map options
        if (res.Options && res.Options.length > 0) {
          this.options = res.Options
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(opt => ({
              id:                opt.id,
              text:              opt.text              || '',
              file:              null,
              previewUrl:        '',
              content_type:      opt.content_type      || 'text',
              indication_letter: opt.indication_letter || '',
              triat_id:          opt.triat_id          || '',
              weight:            opt.weight            !== undefined ? opt.weight : 1,
              is_correct:        opt.is_correct        || false,
              score:             opt.score             !== undefined ? Number(opt.score) : 0,
              position:          opt.position          || 1,
              existing_image:    opt.content_type === 'image' ? opt.text : null,
            }));
        }
      } catch (e) {
        console.error('Failed loading question:', e);
      } finally {
        this.loadingInitialData = false;
      }
    },

    // ── Scoring mode switch ──
    onScoringModeChange() {
      // If switching to aptitude, patch existing options shape
      if (this.form.scoring_mode === 'aptitude') {
        if (this.form.type === 'likert') this.form.type = 'multiple_choice';
        this.options = this.options.map((opt, i) => ({
          id:                opt.id,
          text:              opt.text              || '',
          indication_letter: opt.indication_letter || '',
          is_correct:        false,
          score:             0,
          position:          opt.position || i + 1,
        }));
      } else {
        this.options = this.options.map((opt, i) => ({
          id:                opt.id,
          text:              opt.text              || '',
          file:              null,
          previewUrl:        '',
          content_type:      'text',
          indication_letter: opt.indication_letter || '',
          triat_id:          '',
          weight:            1,
          position:          opt.position || i + 1,
          existing_image:    null,
        }));
      }
    },

    // ── Category change ──
    onCategoryChange() {
      const selected = this.categories.find(c => c.id === this.form.category_id);
      this.triats = selected?.Triats || [];
      this.options.forEach(opt => { opt.triat_id = ''; });
    },

    // ── Option helpers ──
    clearOptionSource(opt) {
      opt.text = '';
      opt.file = null;
      opt.existing_image = null;
      if (opt.previewUrl) { URL.revokeObjectURL(opt.previewUrl); opt.previewUrl = ''; }
    },
    handleFileChange(event, opt) {
      const f = event.target.files[0];
      if (f) { opt.file = f; opt.text = f.name; opt.previewUrl = URL.createObjectURL(f); }
    },
    getImageUrl(filename) {
      if (!filename) return '';
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${base}/uploads/${filename}`;
    },

    addOption() {
      const pos = this.options.length + 1;
      if (this.form.scoring_mode === 'aptitude') {
        this.options.push({ text: '', is_correct: false, score: 0, indication_letter: '', position: pos });
      } else {
        this.options.push({ text: '', file: null, previewUrl: '', content_type: 'text',
                            indication_letter: '', triat_id: '', weight: 1, position: pos, existing_image: null });
      }
    },

    removeOption(i, opt) {
      if (opt.id) this.removedOptionIds.push(opt.id);
      const removed = this.options.splice(i, 1)[0];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      this.options.forEach((o, idx) => (o.position = idx + 1));
    },

    // ── Submit ──
    async submitForm() {
      this.saving = true;
      try {
        const formData = new FormData();
        formData.append('question_text', this.form.question_text);
        formData.append('type',          this.form.type);
        formData.append('scoring_mode',  this.form.scoring_mode);
        if (this.form.scoring_mode === 'mbti' && this.form.category_id) {
          formData.append('category_id', this.form.category_id);
        }
        formData.append('test_id',       this.form.test_id);
        formData.append('marks',         this.form.marks || 0);
        formData.append('explanation',   this.form.explanation || '');
        formData.append('removed_option_ids', JSON.stringify(this.removedOptionIds));

        if (this.form.type !== 'open') {
          const processedOptions = this.options.map((opt, idx) => {
            if (this.form.scoring_mode === 'aptitude') {
              return {
                id:                opt.id    || null,
                text:              opt.text,
                content_type:      'text',
                indication_letter: opt.indication_letter
                  ? opt.indication_letter.toUpperCase().trim() : null,
                is_correct:        Boolean(opt.is_correct),
                score:             parseFloat(opt.score) || 0,
                weight:            0,
                position:          opt.position || idx + 1,
                file_key:          null,
              };
            } else {
              if (opt.content_type === 'image' && opt.file) {
                formData.append(`option_file_${idx}`, opt.file);
              }
              return {
                id:                opt.id    || null,
                text:              opt.text,
                content_type:      this.form.type === 'likert' ? 'text' : opt.content_type,
                indication_letter: opt.indication_letter
                  ? opt.indication_letter.toUpperCase().trim() : null,
                triat_id:          opt.triat_id  || null,
                weight:            opt.weight,
                is_correct:        false,
                score:             0,
                position:          opt.position || idx + 1,
                existing_image:    opt.content_type === 'image' ? opt.existing_image : null,
                file_key:          opt.content_type === 'image' && opt.file ? `option_file_${idx}` : null,
              };
            }
          });
          formData.append('options', JSON.stringify(processedOptions));
        }

        const res = await this.$apiPut('/question', this.questionId, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res) this.$root.$refs.toast.showToast('Question updated successfully', 'success');
        this.$emit('saved');
        this.$emit('close');
      } catch (e) {
        console.error('Edit failed:', e);
      } finally {
        this.saving = false;
      }
    },
  },

  async mounted() {
    await this.fetchLookupData();
    await this.fetchQuestionProfile();
  },
  beforeUnmount() {
    this.options.forEach(opt => { if (opt.previewUrl) URL.revokeObjectURL(opt.previewUrl); });
  },
};
</script>
