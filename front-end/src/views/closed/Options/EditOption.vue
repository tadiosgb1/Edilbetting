<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-sm max-h-[90vh] overflow-y-auto">
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold text-gray-800">Edit Option</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4">
        
        <!-- Content Type (Text vs Image) -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Content Type</label>
          <select v-model="form.content_type" @change="clearOptionSource" class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="text">Text Option</option>
            <option value="image">Image File</option>
          </select>
        </div>

        <!-- Option Content: Text Input OR File Upload -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Option Content</label>
          
          <template v-if="form.content_type === 'text'">
            <input v-model="form.text" type="text" required placeholder="e.g. Strongly Agree"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
          </template>
          
          <template v-else>
            <div class="space-y-2">
              <input type="file" accept="image/*" @change="handleFileChange" class="text-xs w-full" />
              
              <!-- Image Preview (Shows either the new file preview or the old database filename path) -->
              <div v-if="previewUrl || form.existing_image" class="mt-1">
                <span class="text-xs text-gray-500 block mb-1">Current Preview:</span>
                <img :src="previewUrl || getImageUrl(form.existing_image)" class="w-16 h-16 object-cover rounded border" />
              </div>
            </div>
          </template>
        </div>

        <!-- Indication Letter -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Indication Letter</label>
          <input v-model="form.indication_letter" type="text" maxLength="3" placeholder="e.g. E / I"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 uppercase font-semibold" />
        </div>

        <!-- Context-Aware Trait Selection -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Mapped Trait 
            <span v-if="loadingCategory" class="text-xs text-gray-400 font-normal block mt-0.5">(Loading category traits...)</span>
          </label>
          <select 
            v-model="form.triat_id" 
            :disabled="loadingCategory"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:bg-gray-100 disabled:text-gray-400 shadow-sm"
          >
            <option value="">Select Trait (None)</option>
            <option v-for="t in traits" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>

        <!-- Weight -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Weight</label>
          <input v-model.number="form.weight" type="number" step="any" required
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        </div>

        <!-- Position -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Position</label>
          <input v-model.number="form.position" type="number" required
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition duration-150">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow transition duration-150">Edit</button>
        </div>
      </form>

    </div>
  </div>
</template>

<script>
export default {
  props: { 
    data: {
      type: Object,
      required: true
    },
    questionId: {         
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      traits: [],
      loadingCategory: false,
      file: null,
      previewUrl: "",
      form: {
        text: this.data?.text || '',
        content_type: this.data?.content_type || 'text',
        indication_letter: this.data?.indication_letter || '',
        triat_id: this.data?.triat_id || '',
        weight: this.data?.weight !== undefined ? this.data?.weight : 1,
        position: this.data?.position || 1,
        existing_image: this.data?.content_type === 'image' ? this.data?.text : null
      }
    };
  },
  methods: {
    async fetchCategoryTraitsByQuestion() {
      console.log("Fetching category traits for question context. Question ID:", this.questionId);
      try {
        this.loadingCategory = true;
        
        // 1️⃣ Find the question metadata to identify its parent category assignment
        const questionRes = await this.$apiGetById(`/question`, this.questionId);
        const categoryId = questionRes?.category_id;

        if (categoryId) {
          // 2️⃣ Pull traits relative to this specific targeted category assignment natively
          const traitsRes = await this.$apiGet(`/category/${categoryId}/traits`);
          this.traits = traitsRes?.data || [];
        }
      } catch (e) {
        console.error("Failed fetching context category traits based on question context:", e);
      } finally {
        this.loadingCategory = false;
      }
    },

    clearOptionSource() {
      this.form.text = "";
      this.file = null;
      this.form.existing_image = null;
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
        this.previewUrl = "";
      }
    },

    handleFileChange(event) {
      const selectedFile = event.target.files[0];
      if (selectedFile) {
        this.file = selectedFile;
        this.form.text = selectedFile.name; 
        this.previewUrl = URL.createObjectURL(selectedFile);
      }
    },

    getImageUrl(filename) {
      if (!filename) return '';
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}/uploads/${filename}`;
    },

    async submitForm() {
      try {
        let payload;
        let config = {};

        const cleanLetter = this.form.indication_letter 
          ? this.form.indication_letter.toUpperCase().trim() 
          : "";

        // 💡 Check condition: If we're updating to an image with a new binary file, use FormData + custom headers
        if (this.form.content_type === 'image' && this.file) {
          const formData = new FormData();
          formData.append("text", this.form.text);
          formData.append("content_type", this.form.content_type);
          formData.append("indication_letter", cleanLetter);
          formData.append("triat_id", this.form.triat_id);
          formData.append("weight", this.form.weight);
          formData.append("position", this.form.position);
          formData.append("option_file", this.file);

          payload = formData;
          // Overrides utility default configuration structure cleanly
          config = { headers: { "Content-Type": "multipart/form-data" } };
        } else {
          // Otherwise, pass a regular JSON object down through standard payload pipeline structures safely
          payload = {
            text: this.form.text,
            content_type: this.form.content_type,
            indication_letter: cleanLetter,
            triat_id: this.form.triat_id || null,
            weight: this.form.weight,
            position: this.form.position,
            existing_image: this.form.content_type === 'image' ? this.form.existing_image : null
          };
        }

        // 🔄 Uses the patch method against the correct individual item path parameter
        const res = await this.$apiPatch(`/option`, this.data.id,payload, config);

        if (res) {
          this.$root.$refs.toast.showToast('Edited successfully', 'success');
        }

        this.$emit("saved");
        this.$emit("close");
      } catch (e) { 
        console.error("Error updating option data profile:", e); 
      }
    }
  },
  mounted() {
    this.fetchCategoryTraitsByQuestion();
  },
  beforeDestroy() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}
</script>