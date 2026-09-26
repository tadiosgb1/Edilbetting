<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 text-sm max-h-[90vh] overflow-y-auto">

      <!-- Header -->
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold text-gray-800">Add Question</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <!-- Tab switcher: Manual / Excel -->
      <div class="flex gap-2 mb-5">
        <button type="button" @click="activeTab = 'manual'"
          :class="activeTab === 'manual' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          class="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition">
          <i class="fas fa-pen mr-1"></i> Manual Entry
        </button>
        <button type="button" @click="activeTab = 'excel'"
          :class="activeTab === 'excel' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          class="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition">
          <i class="fas fa-file-excel mr-1"></i> Bulk Upload (Excel)
        </button>
      </div>

      <!-- ═══════════════════════════ MANUAL ENTRY ═══════════════════════════ -->
      <form v-if="activeTab === 'manual'" @submit.prevent="submitForm" class="space-y-4">

        <!-- Question Text -->
        <div>
          <label class="block mb-1 font-medium">Question <span class="text-red-500">*</span></label>
          <textarea v-model="form.question_text" required rows="3"
            class="w-full border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"></textarea>
        </div>

        <!-- Scoring Mode (primary control) -->
        <div>
          <label class="block mb-1 font-medium">Scoring Mode <span class="text-red-500">*</span></label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition"
              :class="form.scoring_mode === 'aptitude' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'">
              <input type="radio" v-model="form.scoring_mode" value="aptitude" class="accent-blue-500" />
              <span class="font-semibold">Score-Based (Aptitude)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition"
              :class="form.scoring_mode === 'mbti' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-600'">
              <input type="radio" v-model="form.scoring_mode" value="mbti" class="accent-purple-500" />
              <span class="font-semibold">Type-Based (MBTI)</span>
            </label>
          </div>
          <p v-if="form.scoring_mode === 'aptitude'" class="text-xs text-blue-600 mt-1">
            Each option has a correct/incorrect flag and a score (marks). Total marks = sum of correct option scores.
          </p>
          <p v-else class="text-xs text-purple-600 mt-1">
            Each option maps to a personality trait/dimension via weight and indication letter (E, I, N, S, T, F, J, P…).
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
          <div v-if="testId" class="flex items-center gap-2 px-3 py-2 border border-green-300 bg-green-50 rounded-lg">
            <i class="fas fa-link text-green-500 text-xs"></i>
            <span class="text-sm font-medium text-green-700">{{ lockedTestTitle || `Test #${testId}` }}</span>
            <span class="ml-auto text-[10px] text-green-500 uppercase tracking-wide font-semibold">Auto-linked</span>
          </div>
          <select v-else v-model="form.test_id" required
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
          <label class="block mb-1 font-medium">Total Marks for this Question</label>
          <input v-model.number="form.marks" type="number" min="0" step="0.5"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. 2" />
          <p class="text-xs text-gray-400 mt-1">
            Marks are awarded per option (score field). This value is informational/for totalling.
          </p>
        </div>

        <!-- Explanation (Aptitude) -->
        <div v-if="form.scoring_mode === 'aptitude'">
          <label class="block mb-1 font-medium">Explanation <span class="text-gray-400 text-xs">(shown after answering)</span></label>
          <textarea v-model="form.explanation" rows="2"
            class="w-full border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Optional: explain the correct answer…"></textarea>
        </div>

        <!-- ─── OPTIONS (for multiple_choice and likert) ─── -->
        <div v-if="form.type !== 'open'">
          <div class="flex items-center justify-between mb-2">
            <label class="font-medium">Options</label>
            <span v-if="form.scoring_mode === 'aptitude'"
              class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
              Mark correct answers ✓
            </span>
          </div>

          <!-- APTITUDE option rows -->
          <template v-if="form.scoring_mode === 'aptitude'">
            <div v-for="(opt, i) in options" :key="i"
              class="border rounded-lg mb-3 p-3 bg-gray-50 space-y-2"
              :class="opt.is_correct ? 'border-green-400 bg-green-50' : ''">
              <div class="flex gap-2 items-center">
                <!-- Correct toggle -->
                <label class="flex items-center gap-1 cursor-pointer min-w-[70px]">
                  <input type="checkbox" v-model="opt.is_correct" class="accent-green-500 w-4 h-4" />
                  <span class="text-xs font-semibold" :class="opt.is_correct ? 'text-green-600' : 'text-gray-400'">
                    {{ opt.is_correct ? 'Correct' : 'Wrong' }}
                  </span>
                </label>
                <!-- Option text -->
                <input v-model="opt.text" :placeholder="`Option ${i + 1} text`" required
                  class="flex-1 border rounded px-2 py-1 bg-white" />
                <!-- Letter -->
                <input v-model="opt.indication_letter" placeholder="A…" maxlength="3"
                  class="w-12 border rounded px-2 py-1 text-center bg-white font-semibold uppercase" />
                <!-- Remove -->
                <button type="button" @click="removeOption(i)" class="text-red-400 hover:text-red-600 px-1">✖</button>
              </div>
              <div class="flex gap-2 items-center text-xs">
                <div class="flex items-center gap-1">
                  <span class="text-gray-500">Score:</span>
                  <input v-model.number="opt.score" type="number" step="0.5" min="0"
                    :placeholder="opt.is_correct ? form.marks || '1' : '0'"
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

          <!-- MBTI option rows -->
          <template v-else>
            <div v-for="(opt, i) in options" :key="i" class="border p-3 rounded-lg mb-3 bg-gray-50 space-y-2">
              <div class="flex gap-2 items-center">
                <!-- Content type (MCQ only) -->
                <select v-if="form.type === 'multiple_choice'" v-model="opt.content_type"
                  @change="clearOptionSource(opt)" class="w-1/4 border rounded px-2 py-1 bg-white">
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                </select>
                <!-- Text/image input -->
                <div class="flex-1 flex items-center gap-2">
                  <template v-if="opt.content_type === 'text' || form.type === 'likert'">
                    <input v-model="opt.text" placeholder="Option text" required
                      class="w-full border rounded px-2 py-1 bg-white" />
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-3 w-full">
                      <input type="file" accept="image/*" @change="handleFileChange($event, opt)" class="text-xs max-w-xs" required />
                      <img v-if="opt.previewUrl" :src="opt.previewUrl" class="w-8 h-8 object-cover rounded border" />
                    </div>
                  </template>
                </div>
                <!-- Indication letter -->
                <input v-model="opt.indication_letter" placeholder="E/I…" maxlength="3"
                  class="w-1/6 border rounded px-2 py-1 text-center bg-white font-semibold uppercase" />
                <button type="button" @click="removeOption(i)" class="text-red-500 px-1 text-base hover:text-red-700">✖</button>
              </div>
              <div class="flex gap-2 items-center text-xs">
                <div class="w-2/5">
                  <select v-model="opt.triat_id" class="w-full border rounded px-2 py-1 bg-white">
                    <option disabled value="">Trait</option>
                    <option v-for="t in triats" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <div class="w-1/4 flex items-center gap-1">
                  <span class="text-gray-500">W:</span>
                  <input v-model.number="opt.weight" type="number" step="any" placeholder="Weight"
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

        <!-- OPEN question: MBTI weight / Aptitude marks -->
        <div v-if="form.type === 'open'">
          <label class="block mb-1 font-medium">
            {{ form.scoring_mode === 'aptitude' ? 'Marks' : 'Weight' }}
          </label>
          <input v-model.number="form.marks" type="number" step="any"
            class="w-full border rounded px-3 py-2" />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" :disabled="saving"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            {{ saving ? 'Saving…' : 'Save Question' }}
          </button>
        </div>
      </form>

      <!-- ═══════════════════════════ BULK EXCEL UPLOAD ═══════════════════════════ -->
      <div v-if="activeTab === 'excel'" class="space-y-5">

        <!-- Choose scoring mode for the upload -->
        <div class="border rounded-xl p-4 bg-gray-50">
          <p class="font-semibold text-gray-700 mb-2">Select Upload Type</p>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition"
              :class="bulkMode === 'aptitude' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'">
              <input type="radio" v-model="bulkMode" value="aptitude" class="accent-blue-500" />
              <span class="font-semibold text-xs">Score-Based (Aptitude)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition"
              :class="bulkMode === 'mbti' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-600'">
              <input type="radio" v-model="bulkMode" value="mbti" class="accent-purple-500" />
              <span class="font-semibold text-xs">Type-Based (MBTI)</span>
            </label>
          </div>
        </div>

        <!-- Step 1: Download template -->
        <div class="border rounded-xl p-4 bg-gray-50">
          <p class="font-semibold text-gray-700 mb-1">Step 1 — Download Template</p>
          <p class="text-gray-500 text-xs mb-3">
            <template v-if="bulkMode === 'aptitude'">
              Score-based columns: <code class="bg-gray-200 px-1 rounded">question_text, type, test_id, marks, explanation</code>
              + per option: <code class="bg-gray-200 px-1 rounded">opt#_text, opt#_is_correct (TRUE/FALSE), opt#_score, opt#_letter</code>
            </template>
            <template v-else>
              MBTI columns: <code class="bg-gray-200 px-1 rounded">question_text, type, test_id, category_id, weight</code>
              + per option: <code class="bg-gray-200 px-1 rounded">opt#_text, opt#_letter, opt#_triat_id, opt#_weight, opt#_position</code>
            </template>
          </p>
          <button type="button" @click="downloadTemplate"
            class="inline-flex items-center gap-2 px-4 py-2 text-white text-xs font-semibold rounded-lg transition"
            :class="bulkMode === 'aptitude' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'">
            <i class="fas fa-download"></i>
            Download {{ bulkMode === 'aptitude' ? 'Aptitude' : 'MBTI' }} Template (.xlsx)
          </button>
        </div>

        <!-- Step 2: Upload filled file -->
        <div class="border rounded-xl p-4 bg-gray-50">
          <p class="font-semibold text-gray-700 mb-3">Step 2 — Upload Filled File</p>
          <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-green-50 transition"
            :class="bulkMode === 'aptitude' ? 'border-blue-300' : 'border-purple-300'"
            @dragover.prevent @drop.prevent="onDrop">
            <i class="fas fa-file-excel text-3xl mb-2" :class="bulkMode === 'aptitude' ? 'text-blue-400' : 'text-purple-400'"></i>
            <span class="text-xs text-gray-500">
              {{ excelFile ? excelFile.name : 'Drag & drop or click to select .xlsx / .xls' }}
            </span>
            <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExcelFileChange" />
          </label>
        </div>

        <!-- Preview -->
        <div v-if="parsedRows.length" class="border rounded-xl p-4 bg-gray-50">
          <p class="font-semibold text-gray-700 mb-2">Preview — {{ parsedRows.length }} question(s) found</p>
          <div class="overflow-x-auto max-h-48 overflow-y-auto">
            <table class="w-full text-xs border-collapse">
              <thead class="bg-gray-200 sticky top-0">
                <tr>
                  <th class="border px-2 py-1 text-left">#</th>
                  <th class="border px-2 py-1 text-left">Question</th>
                  <th class="border px-2 py-1 text-left">Type</th>
                  <th class="border px-2 py-1 text-left">Mode</th>
                  <th class="border px-2 py-1 text-left">Test</th>
                  <th v-if="bulkMode === 'mbti'" class="border px-2 py-1 text-left">Cat</th>
                  <th v-if="bulkMode === 'aptitude'" class="border px-2 py-1 text-left">Marks</th>
                  <th class="border px-2 py-1 text-left">Options</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in parsedRows" :key="i" class="even:bg-white odd:bg-gray-50">
                  <td class="border px-2 py-1">{{ i + 1 }}</td>
                  <td class="border px-2 py-1 max-w-[160px] truncate">{{ row.question_text }}</td>
                  <td class="border px-2 py-1">{{ row.type }}</td>
                  <td class="border px-2 py-1">
                    <span :class="row.scoring_mode === 'aptitude' ? 'text-blue-600 font-semibold' : 'text-purple-600 font-semibold'">
                      {{ row.scoring_mode }}
                    </span>
                  </td>
                  <td class="border px-2 py-1">{{ row.test_id }}</td>
                  <td v-if="bulkMode === 'mbti'" class="border px-2 py-1">{{ row.category_id }}</td>
                  <td v-if="bulkMode === 'aptitude'" class="border px-2 py-1">{{ row.marks }}</td>
                  <td class="border px-2 py-1">{{ row.options.length }} opt(s)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Upload errors -->
        <div v-if="uploadErrors.length" class="border border-red-200 rounded-xl p-4 bg-red-50">
          <p class="font-semibold text-red-600 mb-2">Errors</p>
          <ul class="list-disc list-inside text-xs text-red-500 space-y-1">
            <li v-for="(err, i) in uploadErrors" :key="i">{{ err }}</li>
          </ul>
        </div>

        <!-- Progress -->
        <div v-if="uploadProgress.total > 0" class="space-y-1">
          <div class="flex justify-between text-xs text-gray-600">
            <span>Uploading {{ uploadProgress.done }} / {{ uploadProgress.total }}</span>
            <span>{{ Math.round((uploadProgress.done / uploadProgress.total) * 100) }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="h-2 rounded-full transition-all"
              :class="bulkMode === 'aptitude' ? 'bg-blue-500' : 'bg-purple-500'"
              :style="{ width: (uploadProgress.done / uploadProgress.total * 100) + '%' }"></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="button" @click="submitBulk" :disabled="!parsedRows.length || bulkSaving"
            class="px-4 py-2 text-white rounded-lg disabled:opacity-60 flex items-center gap-2"
            :class="bulkMode === 'aptitude' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'">
            <i v-if="bulkSaving" class="fas fa-spinner fa-spin"></i>
            {{ bulkSaving ? `Uploading… (${uploadProgress.done}/${uploadProgress.total})` : `Upload ${parsedRows.length || ''} Questions` }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';

const MAX_OPTS = 6;

export default {
  name: 'AddQuestion',
  props: {
    testId: { type: [String, Number], default: null },
  },
  emits: ['close', 'saved'],
  data() {
    return {
      activeTab: 'manual',
      saving: false,
      tests: [],
      categories: [],
      triats: [],

      form: {
        question_text: '',
        type: 'multiple_choice',
        scoring_mode: 'aptitude',  // default: score-based
        category_id: '',
        test_id: '',
        marks: 1,
        explanation: '',
      },
      options: [
        { text: '', is_correct: false, score: 0, indication_letter: '', position: 1 },
        { text: '', is_correct: false, score: 0, indication_letter: '', position: 2 },
        { text: '', is_correct: false, score: 0, indication_letter: '', position: 3 },
        { text: '', is_correct: false, score: 0, indication_letter: '', position: 4 },
      ],

      // Excel bulk
      bulkMode: 'aptitude',
      excelFile: null,
      parsedRows: [],
      uploadErrors: [],
      bulkSaving: false,
      uploadProgress: { done: 0, total: 0 },
    };
  },

  computed: {
    lockedTestTitle() {
      if (!this.testId) return '';
      const found = this.tests.find(t => String(t.id) === String(this.testId));
      return found ? found.title : '';
    },
  },

  watch: {
    'form.scoring_mode'(mode) {
      // When switching mode, rebuild the default options shape
      if (mode === 'aptitude') {
        this.options = [
          { text: '', is_correct: false, score: 0, indication_letter: '', position: 1 },
          { text: '', is_correct: false, score: 0, indication_letter: '', position: 2 },
          { text: '', is_correct: false, score: 0, indication_letter: '', position: 3 },
          { text: '', is_correct: false, score: 0, indication_letter: '', position: 4 },
        ];
        if (this.form.type === 'likert') this.form.type = 'multiple_choice';
      } else {
        this.options = [
          { text: '', file: null, previewUrl: '', content_type: 'text', indication_letter: '', triat_id: '', weight: 1, position: 1 },
          { text: '', file: null, previewUrl: '', content_type: 'text', indication_letter: '', triat_id: '', weight: 1, position: 2 },
        ];
      }
    },
  },

  methods: {
    makeAptitudeOption(pos) {
      return { text: '', is_correct: false, score: 0, indication_letter: '', position: pos };
    },
    makeMbtiOption(pos) {
      return { text: '', file: null, previewUrl: '', content_type: 'text',
               indication_letter: '', triat_id: '', weight: 1, position: pos };
    },

    async fetchTests() {
      const res = await this.$apiGet('/test', { page: 1, page_size: 200 });
      this.tests = res.data || [];
    },
    async fetchCategories() {
      const res = await this.$apiGet('/category', { page: 1, page_size: 200 });
      this.categories = res.data || [];
    },

    onCategoryChange() {
      const selected = this.categories.find(c => c.id === this.form.category_id);
      this.triats = selected?.Triats || [];
    },

    clearOptionSource(opt) {
      opt.text = '';
      opt.file = null;
      if (opt.previewUrl) { URL.revokeObjectURL(opt.previewUrl); opt.previewUrl = ''; }
    },
    handleFileChange(event, opt) {
      const f = event.target.files[0];
      if (f) { opt.file = f; opt.text = f.name; opt.previewUrl = URL.createObjectURL(f); }
    },

    addOption() {
      const pos = this.options.length + 1;
      this.options.push(
        this.form.scoring_mode === 'aptitude'
          ? this.makeAptitudeOption(pos)
          : this.makeMbtiOption(pos)
      );
    },
    removeOption(i) {
      const removed = this.options.splice(i, 1)[0];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      this.options.forEach((o, idx) => (o.position = idx + 1));
    },

    async submitForm() {
      this.saving = true;
      try {
        const formData = new FormData();
        formData.append('question_text', this.form.question_text);
        formData.append('type', this.form.type);
        formData.append('scoring_mode', this.form.scoring_mode);
        if (this.form.scoring_mode === 'mbti' && this.form.category_id) {
          formData.append('category_id', this.form.category_id);
        }
        formData.append('test_id', this.testId || this.form.test_id);
        formData.append('marks', this.form.marks || 0);
        formData.append('explanation', this.form.explanation || '');

        if (this.form.type !== 'open') {
          const processedOptions = this.options.map((opt, idx) => {
            if (this.form.scoring_mode === 'aptitude') {
              return {
                text: opt.text,
                content_type: 'text',
                indication_letter: opt.indication_letter
                  ? opt.indication_letter.toUpperCase().trim() : null,
                is_correct: Boolean(opt.is_correct),
                score: parseFloat(opt.score) || 0,
                weight: 0,
                position: opt.position || idx + 1,
                file_key: null,
              };
            } else {
              if (opt.content_type === 'image' && opt.file) {
                formData.append(`option_file_${idx}`, opt.file);
              }
              return {
                text: opt.text,
                content_type: this.form.type === 'likert' ? 'text' : opt.content_type,
                indication_letter: opt.indication_letter
                  ? opt.indication_letter.toUpperCase().trim() : null,
                triat_id: opt.triat_id || null,
                weight: opt.weight,
                is_correct: false,
                score: 0,
                position: opt.position || idx + 1,
                file_key: opt.content_type === 'image' && opt.file ? `option_file_${idx}` : null,
              };
            }
          });
          formData.append('options', JSON.stringify(processedOptions));
        }

        const res = await this.$apiPost('/question', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res) this.$root.$refs.toast.showToast('Question added successfully', 'success');
        this.$emit('saved');
        this.$emit('close');
      } catch (e) {
        console.error(e);
      } finally {
        this.saving = false;
      }
    },

    // ── Excel Template Download ──
    downloadTemplate() {
      const MAX_OPTS = 6;
      if (this.bulkMode === 'aptitude') {
        // Build aptitude template client-side
        const headers = [
          'question_text', 'type', 'test_id', 'marks', 'explanation'
        ];
        for (let i = 1; i <= MAX_OPTS; i++) {
          headers.push(`opt${i}_text`, `opt${i}_is_correct`, `opt${i}_score`, `opt${i}_letter`);
        }
        const ex1 = [
          'What is the capital of France?', 'multiple_choice', '1', '2',
          'Paris is the capital and largest city of France.',
          'Paris',  'TRUE',  '2', 'A',
          'London', 'FALSE', '0', 'B',
          'Berlin', 'FALSE', '0', 'C',
          'Madrid', 'FALSE', '0', 'D',
          '', '', '', '',
          '', '', '', ''
        ];
        const ex2 = [
          'Which are prime numbers? (multi-select)', 'multiple_choice', '1', '3', '',
          '2', 'TRUE',  '1', 'A',
          '3', 'TRUE',  '1', 'B',
          '4', 'FALSE', '0', 'C',
          '5', 'TRUE',  '1', 'D',
          '6', 'FALSE', '0', 'E',
          '',  'FALSE', '0', 'F'
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ex1, ex2]);
        ws['!cols'] = [
          { wch: 50 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 40 },
          ...Array(MAX_OPTS * 4).fill({ wch: 14 })
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aptitude Questions');
        XLSX.writeFile(wb, 'aptitude_questions_template.xlsx');
      } else {
        // MBTI template – build client-side
        const headers = ['question_text', 'type', 'test_id', 'category_id', 'weight'];
        for (let i = 1; i <= MAX_OPTS; i++) {
          headers.push(`opt${i}_text`, `opt${i}_letter`, `opt${i}_triat_id`, `opt${i}_weight`, `opt${i}_position`);
        }
        const ex1 = [
          'What best describes your energy source?', 'multiple_choice', '1', '1', '0',
          'Energized by social interaction', 'E', '1', '1', '1',
          'Energized by solitude',           'I', '2', '1', '2',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        const ex2 = [
          'I enjoy working in teams.', 'likert', '1', '1', '0',
          'Strongly Agree',    '', '1', '5', '1',
          'Agree',             '', '1', '4', '2',
          'Neutral',           '', '1', '3', '3',
          'Disagree',          '', '1', '2', '4',
          'Strongly Disagree', '', '1', '1', '5',
          '', '', '', '', ''
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ex1, ex2]);
        ws['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, ...Array(MAX_OPTS * 5).fill({ wch: 16 })];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'MBTI Questions');
        XLSX.writeFile(wb, 'mbti_questions_template.xlsx');
      }
    },

    onExcelFileChange(e) {
      const f = e.target.files[0];
      if (f) { this.excelFile = f; this.parseExcel(f); }
    },
    onDrop(e) {
      const f = e.dataTransfer.files[0];
      if (f) { this.excelFile = f; this.parseExcel(f); }
    },

    parseExcel(file) {
      this.parsedRows = [];
      this.uploadErrors = [];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          const mode = this.bulkMode;

          this.parsedRows = rows
            .filter(r => {
              if (!r.question_text || !r.type) return false;
              if (!(r.test_id || this.testId)) return false;
              // category only required for MBTI
              if (mode === 'mbti' && !r.category_id) return false;
              return true;
            })
            .map(r => {
              const options = [];
              for (let i = 1; i <= MAX_OPTS; i++) {
                const text = String(r[`opt${i}_text`] || '').trim();
                if (!text) continue;
                if (mode === 'aptitude') {
                  const isCorrectRaw = String(r[`opt${i}_is_correct`] || '').trim().toLowerCase();
                  options.push({
                    text,
                    content_type: 'text',
                    indication_letter: String(r[`opt${i}_letter`] || '').toUpperCase().trim() || null,
                    is_correct: isCorrectRaw === 'true' || isCorrectRaw === '1' || isCorrectRaw === 'yes',
                    score: r[`opt${i}_score`] !== '' ? Number(r[`opt${i}_score`]) : 0,
                    weight: 0,
                    position: i,
                    file_key: null,
                  });
                } else {
                  options.push({
                    text,
                    content_type: 'text',
                    indication_letter: String(r[`opt${i}_letter`] || '').toUpperCase().trim() || null,
                    triat_id: r[`opt${i}_triat_id`] ? Number(r[`opt${i}_triat_id`]) : null,
                    weight: r[`opt${i}_weight`] !== '' ? Number(r[`opt${i}_weight`]) : 1,
                    is_correct: false, score: 0,
                    position: r[`opt${i}_position`] !== '' ? Number(r[`opt${i}_position`]) : i,
                    file_key: null,
                  });
                }
              }
              return {
                question_text: String(r.question_text).trim(),
                type: String(r.type).trim(),
                scoring_mode: mode,
                test_id: Number(r.test_id) || 0,
                category_id: mode === 'mbti' ? Number(r.category_id) : (r.category_id ? Number(r.category_id) : null),
                marks: mode === 'aptitude' ? (r.marks !== '' ? Number(r.marks) : 1) : 0,
                explanation: mode === 'aptitude' ? String(r.explanation || '').trim() : '',
                weight: mode === 'mbti' ? (r.weight !== '' ? Number(r.weight) : 0) : 0,
                options,
              };
            });
        } catch (err) {
          this.uploadErrors.push('Failed to parse file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    },

    async submitBulk() {
      if (!this.parsedRows.length) return;
      this.bulkSaving = true;
      this.uploadErrors = [];
      this.uploadProgress = { done: 0, total: this.parsedRows.length };

      for (const row of this.parsedRows) {
        try {
          const formData = new FormData();
          formData.append('question_text', row.question_text);
          formData.append('type', row.type);
          formData.append('scoring_mode', row.scoring_mode);
          if (row.category_id) formData.append('category_id', row.category_id);
          formData.append('test_id', this.testId ? this.testId : row.test_id);
          formData.append('marks', row.marks || 0);
          formData.append('explanation', row.explanation || '');
          if (row.type !== 'open' && row.options.length) {
            formData.append('options', JSON.stringify(row.options));
          }
          await this.$apiPost('/question', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (e) {
          this.uploadErrors.push(`Row "${row.question_text.slice(0, 40)}…": ${e.message || e}`);
        } finally {
          this.uploadProgress.done++;
        }
      }

      this.bulkSaving = false;
      if (!this.uploadErrors.length) {
        this.$root.$refs.toast.showToast(`${this.parsedRows.length} question(s) uploaded successfully`, 'success');
        this.$emit('saved');
        this.$emit('close');
      } else {
        this.$root.$refs.toast.showToast(`Uploaded with ${this.uploadErrors.length} error(s)`, 'error');
      }
    },
  },

  mounted() {
    this.fetchTests();
    this.fetchCategories();
    if (this.testId) this.form.test_id = this.testId;
  },
  beforeUnmount() {
    this.options.forEach(opt => { if (opt.previewUrl) URL.revokeObjectURL(opt.previewUrl); });
  },
};
</script>
