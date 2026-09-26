<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <!-- Responsive modal - wider on large screens -->
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800">Edit User</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
      </div>

      <!-- Scrollable form content -->
      <div class="flex-1 overflow-y-auto p-6">
        <form @submit.prevent="submitForm" class="space-y-6">

        <div class="space-y-6">
          
          <!-- Personal Information Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
            
            <!-- Name fields - responsive grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">First Name *</label>
                <input v-model="form.first_name" type="text" required
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
              </div>
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Middle Name</label>
                <input v-model="form.middle_name" type="text"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
              </div>
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Last Name *</label>
                <input v-model="form.last_name" type="text" required
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
              </div>
            </div>

            <!-- Email and Phone -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Email Address *</label>
                <input v-model="form.email" type="email" required
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
              </div>
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Phone Number</label>
                <input v-model="form.phone_number" type="text"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
              </div>
            </div>

            <!-- Date of Birth and Age -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Date of Birth</label>
                <input v-model="form.date_of_birth" type="date"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
              </div>
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Age</label>
                <input v-model.number="form.age" type="number" min="1" max="120"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150"
                  placeholder="Enter age" />
              </div>
            </div>

            <!-- Department and Gender -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Department</label>
                <input v-model="form.department" type="text"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150"
                  placeholder="Enter department" />
              </div>
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Gender</label>
                <select v-model="form.gender"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150 bg-white">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Current Files Section -->
          <div v-if="form.photo || form.cv" class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Current Files</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Current Photo -->
              <div v-if="form.photo && !newPhoto">
                <label class="block mb-2 text-sm font-medium text-gray-700">Current Photo</label>
                <img :src="$getFileUrl(form.photo)" alt="Profile photo" class="w-24 h-24 object-cover rounded-lg border">
              </div>

              <!-- Current CV -->
              <div v-if="form.cv && !newCv">
                <label class="block mb-2 text-sm font-medium text-gray-700">Current CV</label>
                <a :href="$getFileUrl(form.cv)" target="_blank" class="text-blue-600 hover:underline text-sm">
                  <i class="fas fa-file-pdf mr-2"></i>View Current CV
                </a>
              </div>
            </div>
          </div>

          <!-- File Uploads Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 border-b pb-2">
              {{ (form.photo || form.cv) ? 'Update Files' : 'Upload Files' }}
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Photo Upload -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">
                  {{ form.photo ? 'Change Photo' : 'Upload Photo' }}
                </label>
                <input ref="photoInput" @change="handlePhotoUpload" type="file" accept="image/*"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
                <p class="text-xs text-gray-500 mt-1">Upload profile photo (JPG, PNG, GIF - max 5MB)</p>
              </div>

              <!-- CV Upload -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">
                  {{ form.cv ? 'Change CV/Resume' : 'Upload CV/Resume' }}
                </label>
                <input ref="cvInput" @change="handleCvUpload" type="file" accept=".pdf,.doc,.docx"
                  class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
                <p class="text-xs text-gray-500 mt-1">Upload CV/Resume (PDF, DOC, DOCX - max 10MB)</p>
              </div>
            </div>
          </div>

          <!-- Account Security -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Account Security</h3>
            
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">
                New Password 
                <span class="text-gray-400 font-normal">(leave blank to keep current)</span>
              </label>
              <input v-model="form.password" type="password" placeholder="••••••••"
                class="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150" />
            </div>
          </div>

        </div>

        </form>
      </div>

      <!-- Footer with buttons -->
      <div class="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
        <button type="button" @click="$emit('close')"
          class="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition duration-150 text-sm font-medium">
          Cancel
        </button>
        <button @click="submitForm" :disabled="loading"
          class="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition duration-150 text-sm font-medium">
          <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
          {{ loading ? 'Updating...' : 'Update User' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: { type: Object, required: true },
  },
  data() {
    return {
      loading: false,
      newPhoto: null,
      newCv: null,
      form: {
        first_name: this.data?.first_name || '',
        middle_name: this.data?.middle_name || '',
        last_name: this.data?.last_name || '',
        email: this.data?.email || '',
        phone_number: this.data?.phone_number || this.data?.phone || '',
        date_of_birth: this.data?.date_of_birth || '',
        age: this.data?.age || null,
        department: this.data?.department || '',
        gender: this.data?.gender || '',
        photo: this.data?.photo || '',
        cv: this.data?.cv || '',
        password: '',
      },
    };
  },
  methods: {
    handlePhotoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          this.$root.$refs.toast.showToast('Photo file size must be less than 5MB', 'error');
          this.$refs.photoInput.value = '';
          return;
        }
        this.newPhoto = file;
      }
    },

    handleCvUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          this.$root.$refs.toast.showToast('CV file size must be less than 10MB', 'error');
          this.$refs.cvInput.value = '';
          return;
        }
        this.newCv = file;
      }
    },

    async submitForm() {
      this.loading = true;
      try {
        // Create FormData for file upload support
        const formData = new FormData();
        
        // Add all form fields except files
        Object.keys(this.form).forEach(key => {
          if (key !== 'photo' && key !== 'cv' && this.form[key] !== null && this.form[key] !== '') {
            // Don't send blank password
            if (key === 'password' && !this.form[key]) return;
            formData.append(key, this.form[key]);
          }
        });
        
        // Add new files if present
        if (this.newPhoto) {
          formData.append('photo', this.newPhoto);
        }
        if (this.newCv) {
          formData.append('cv', this.newCv);
        }
        const headers={
          'Content-Type': 'multipart/form-data'
        }
        
        // Send as multipart/form-data using the utils apiPatch method
        const res = await this.$apiPatch('/users', this.data.id, formData, headers);
        
        if (res) {
          this.$root.$refs.toast?.showToast('User updated successfully', 'success');
          this.$emit('saved');
          this.$emit('close');
        }
      } catch (e) {
        console.error(e);
        const message = e?.message || 'Failed to update user';
        this.$root.$refs.toast?.showToast(message, 'error');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
