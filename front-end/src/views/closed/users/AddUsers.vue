<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">

      <!-- Header -->
      <div class="flex justify-between items-center p-5 border-b border-gray-200">
        <div>
          <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              :class="form.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'">
              <i :class="form.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user-check'"></i>
            </span>
            Add {{ roleLabel }}
          </h2>
          <p class="text-[11px] text-gray-400 mt-0.5 ml-8">
            Role <strong class="text-gray-600">{{ roleLabel }}</strong> will be assigned automatically.
          </p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <!-- Role selector — super_admin can pick admin or tester -->
      <div v-if="canCreateAdmin" class="px-5 pt-4 pb-2 flex gap-2">
        <label class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition text-xs font-semibold"
          :class="form.role === 'admin' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-300'">
          <input type="radio" v-model="form.role" value="admin" class="accent-indigo-600" />
          <i class="fas fa-user-shield"></i> Admin
        </label>
        <label class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition text-xs font-semibold"
          :class="form.role === 'tester' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'">
          <input type="radio" v-model="form.role" value="tester" class="accent-green-600" />
          <i class="fas fa-user-check"></i> Tester
        </label>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <form @submit.prevent="submitForm" class="space-y-4">

          <!-- ── ADMIN FORM — minimal: names, email, phone, gender, password ── -->
          <template v-if="form.role === 'admin'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">First Name <span class="text-red-500">*</span></label>
                <input v-model="form.first_name" type="text" required placeholder="John"
                  class="input-base" />
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Last Name <span class="text-red-500">*</span></label>
                <input v-model="form.last_name" type="text" required placeholder="Doe"
                  class="input-base" />
              </div>
            </div>

            <div>
              <label class="block mb-1 text-xs font-medium text-gray-700">Email <span class="text-red-500">*</span></label>
              <input v-model="form.email" type="email" required placeholder="admin@example.com"
                class="input-base" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Phone</label>
                <input v-model="form.phone_number" type="text" placeholder="+251 911 000 000"
                  class="input-base" />
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Gender</label>
                <select v-model="form.gender" class="input-base bg-white">
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block mb-1 text-xs font-medium text-gray-700">Password <span class="text-red-500">*</span></label>
              <input v-model="form.password" type="password" required placeholder="••••••••"
                class="input-base" />
              <p class="text-[10px] text-gray-400 mt-1">Minimum 6 characters</p>
            </div>
          </template>

          <!-- ── TESTER FORM — full form ── -->
          <template v-else>
            <!-- Names -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">First Name <span class="text-red-500">*</span></label>
                <input v-model="form.first_name" type="text" required placeholder="John" class="input-base" />
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Middle Name</label>
                <input v-model="form.middle_name" type="text" placeholder="A." class="input-base" />
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Last Name <span class="text-red-500">*</span></label>
                <input v-model="form.last_name" type="text" required placeholder="Doe" class="input-base" />
              </div>
            </div>

            <!-- Email + Phone -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Email <span class="text-red-500">*</span></label>
                <input v-model="form.email" type="email" required placeholder="john@example.com" class="input-base" />
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Phone</label>
                <input v-model="form.phone_number" type="text" placeholder="+251 911 000 000" class="input-base" />
              </div>
            </div>

            <!-- DOB + Age -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Date of Birth</label>
                <input v-model="form.date_of_birth" type="date" class="input-base" />
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Age</label>
                <input v-model.number="form.age" type="number" min="1" max="120" placeholder="25" class="input-base" />
              </div>
            </div>

            <!-- Department + Gender -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Department</label>
                <input v-model="form.department" type="text" placeholder="IT Department" class="input-base" />
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Gender</label>
                <select v-model="form.gender" class="input-base bg-white">
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <!-- File uploads -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">Profile Photo</label>
                <input ref="photoInput" @change="handlePhotoUpload" type="file" accept="image/*"
                  class="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 border border-gray-300 rounded-lg" />
                <p class="text-[10px] text-gray-400 mt-0.5">JPG/PNG — max 5 MB</p>
              </div>
              <div>
                <label class="block mb-1 text-xs font-medium text-gray-700">CV / Resume</label>
                <input ref="cvInput" @change="handleCvUpload" type="file" accept=".pdf,.doc,.docx"
                  class="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 border border-gray-300 rounded-lg" />
                <p class="text-[10px] text-gray-400 mt-0.5">PDF/DOC — max 10 MB</p>
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block mb-1 text-xs font-medium text-gray-700">Password <span class="text-red-500">*</span></label>
              <input v-model="form.password" type="password" required placeholder="••••••••" class="input-base" />
              <p class="text-[10px] text-gray-400 mt-1">Minimum 6 characters</p>
            </div>
          </template>

        </form>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button type="button" @click="$emit('close')"
          class="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium">
          Cancel
        </button>
        <button @click="submitForm" :disabled="loading"
          class="px-5 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition text-sm font-medium"
          :class="form.role === 'admin' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-500 hover:bg-green-600'">
          <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
          {{ loading ? 'Creating...' : `Create ${roleLabel}` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AddUsers",

  props: {
    initialRole:    { type: String,  default: "tester" },
    canCreateAdmin: { type: Boolean, default: false },
  },

  emits: ["close", "saved"],

  data() {
    return {
      loading: false,
      form: {
        role:          this.initialRole,
        first_name:    "",
        middle_name:   "",
        last_name:     "",
        email:         "",
        phone_number:  "",
        date_of_birth: "",
        age:           null,
        department:    "",
        gender:        "",
        photo:         null,
        cv:            null,
        password:      "",
        created_by:    localStorage.getItem("userId"),
      },
    };
  },

  computed: {
    roleLabel() {
      return this.form.role === "admin" ? "Admin" : "Tester";
    },
    endpoint() {
      return this.form.role === "admin" ? "/users/create-admin" : "/users/create-tester";
    },
  },

  methods: {
    handlePhotoUpload(e) {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        this.$root.$refs.toast?.showToast("Photo must be less than 5 MB", "error");
        this.$refs.photoInput.value = "";
        return;
      }
      this.form.photo = f;
    },

    handleCvUpload(e) {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) {
        this.$root.$refs.toast?.showToast("CV must be less than 10 MB", "error");
        this.$refs.cvInput.value = "";
        return;
      }
      this.form.cv = f;
    },

    async submitForm() {
      this.loading = true;
      try {
        const fd   = new FormData();
        const skip = ["photo", "cv", "role"];

        // For admin: only send the minimal fields
        const adminFields = ["first_name", "last_name", "email", "phone_number", "gender", "password", "created_by"];
        const fields = this.form.role === "admin"
          ? adminFields
          : Object.keys(this.form).filter(k => !skip.includes(k));

        fields.forEach(k => {
          if (this.form[k] !== null && this.form[k] !== "" && this.form[k] !== undefined) {
            fd.append(k, this.form[k]);
          }
        });

        if (this.form.role === "tester") {
          if (this.form.photo) fd.append("photo", this.form.photo);
          if (this.form.cv)    fd.append("cv",    this.form.cv);
        }

        await this.$apiPost(this.endpoint, fd, { "Content-Type": "multipart/form-data" });

        this.$root.$refs.toast?.showToast(`${this.roleLabel} created successfully`, "success");
        this.$emit("saved");
        this.$emit("close");
      } catch (e) {
        this.$root.$refs.toast?.showToast(e?.message || "Failed to create user", "error");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.input-base {
  @apply border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 transition;
}
</style>
