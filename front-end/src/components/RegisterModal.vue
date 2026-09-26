<template>
  <div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal -->
    <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

      <!-- Top bar -->
      <div class="h-1.5 w-full bg-gradient-to-r from-green-400 to-green-600 flex-shrink-0"></div>

      <!-- Close -->
      <button @click="$emit('close')"
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition z-10">
        <i class="fas fa-times text-xs"></i>
      </button>

      <!-- Scrollable content -->
      <div class="overflow-y-auto flex-1 p-8">

        <!-- Logo -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
            <i class="fas fa-brain text-green-400 text-sm"></i>
          </div>
          <span class="font-black text-slate-900 text-lg tracking-tight">Alphaooo<span class="text-green-500">Psych</span></span>
        </div>

        <h2 class="text-2xl font-black text-slate-900 mb-1">Create Account</h2>
        <p class="text-sm text-gray-400 mb-6">Join thousands of organizations using GYZ Psycho</p>

        <!-- Account type toggle -->
        <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            @click="switchToIndividual"
            class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            :class="accountType === 'individual' ? 'bg-white shadow text-slate-900' : 'text-gray-500 hover:text-gray-700'"
          >
            <i class="fas fa-user mr-2 text-xs"></i>Individual
          </button>
          <button
            @click="accountType = 'organization'"
            class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            :class="accountType === 'organization' ? 'bg-white shadow text-slate-900' : 'text-gray-500 hover:text-gray-700'"
          >
            <i class="fas fa-building mr-2 text-xs"></i>Organization
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════
             ORGANIZATION — Step 1: No plan selected yet
        ══════════════════════════════════════════════════ -->
        <template v-if="accountType === 'organization' && !selectedPlan">
          <div class="border border-amber-100 bg-amber-50 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
            <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-tags text-amber-500 text-lg"></i>
            </div>
            <div>
              <p class="text-sm font-black text-slate-900 mb-1">Select a Plan First</p>
              <p class="text-xs text-slate-500 leading-relaxed">
                Organization accounts require a subscription plan. Browse our plans and click
                <strong>"Get Started"</strong> on any plan to continue registration.
              </p>
            </div>
            <router-link
              to="/pricing"
              @click="$emit('close')"
              class="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all text-xs shadow-lg shadow-green-500/20"
            >
              View Plans &amp; Pricing
              <i class="fas fa-arrow-right text-[10px]"></i>
            </router-link>
            <button @click="accountType = 'individual'" class="text-xs text-gray-400 hover:text-gray-600 underline">
              Register as Individual instead
            </button>
          </div>
        </template>

        <!-- ══════════════════════════════════════════════════
             ORGANIZATION — Step 2: Plan selected, show form
        ══════════════════════════════════════════════════ -->
        <template v-if="accountType === 'organization' && selectedPlan">
          <form @submit.prevent="register" class="space-y-5">
            <!-- Selected plan banner -->
            <div class="flex items-center justify-between gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                  <i class="fas fa-check text-white text-xs"></i>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-green-600 leading-none">Selected Plan</p>
                  <p class="text-sm font-black text-slate-900 leading-tight mt-0.5">
                    {{ selectedPlan.name }}
                    <span class="font-normal text-slate-400 text-xs ml-1">
                      {{ selectedPlan.price_cents === 0 ? '— Free' : '— $' + (selectedPlan.price_cents / 100).toFixed(0) + '/mo' }}
                    </span>
                  </p>
                </div>
              </div>
              <button type="button" @click="selectedPlan = null"
                class="text-xs text-green-600 hover:text-green-800 font-bold underline shrink-0">
                Change
              </button>
            </div>

            <!-- ── Admin user ── -->
            <div class="border border-gray-100 rounded-2xl p-5 space-y-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Administrator</p>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="field-label">First Name</label>
                  <input v-model="form.first_name" type="text" required class="field-input" placeholder="John" />
                </div>
                <div>
                  <label class="field-label">Last Name</label>
                  <input v-model="form.last_name" type="text" required class="field-input" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label class="field-label">Admin Email</label>
                <input v-model="form.email" type="email" required class="field-input" placeholder="admin@org.com" />
              </div>

              <div>
                <label class="field-label">Phone <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
                <input v-model="form.phone" type="text" class="field-input" placeholder="+251 9XX XXX XXX" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="field-label">Password</label>
                  <input v-model="form.password" type="password" required class="field-input" />
                </div>
                <div>
                  <label class="field-label">Confirm</label>
                  <input v-model="form.confirm_password" type="password" required class="field-input" />
                </div>
              </div>
            </div>

            <!-- ── Organization details ── -->
            <div class="border border-gray-100 rounded-2xl p-5 space-y-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Organization Details</p>

              <div>
                <label class="field-label">Organization Name</label>
                <input v-model="form.org_name" type="text" required class="field-input" placeholder="Acme Corp" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="field-label">Official Email</label>
                  <input v-model="form.org_email" type="email" class="field-input" placeholder="info@org.com" />
                </div>
                <div>
                  <label class="field-label">Type</label>
                  <select v-model="form.org_type" class="field-input bg-white">
                    <option>Company</option>
                    <option>University</option>
                    <option>School</option>
                    <option>NGO</option>
                    <option>Research</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="field-label">Address</label>
                <input v-model="form.address" type="text" class="field-input" placeholder="Bole, Addis Ababa" />
              </div>
            </div>

            <!-- Error -->
            <div v-if="error"
              class="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
              <i class="fas fa-exclamation-circle shrink-0"></i>
              {{ error }}
            </div>

            <!-- Submit -->
            <button type="submit" :disabled="loading"
              class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
              <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
              {{ loading ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>
        </template>

        <!-- ══════════════════════════════════════════════════
             INDIVIDUAL FORM
        ══════════════════════════════════════════════════ -->
        <form v-if="accountType === 'individual'" @submit.prevent="register" class="space-y-4">

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label">First Name</label>
              <input v-model="form.first_name" type="text" required class="field-input" />
            </div>
            <div>
              <label class="field-label">Last Name</label>
              <input v-model="form.last_name" type="text" required class="field-input" />
            </div>
          </div>

          <div>
            <label class="field-label">Email</label>
            <input v-model="form.email" type="email" required class="field-input" />
          </div>

          <div>
            <label class="field-label">Phone <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
            <input v-model="form.phone_number" type="text" placeholder="+251 911 000 000" class="field-input" />
          </div>

          <!-- New Profile Fields -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label">Date of Birth <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
              <input v-model="form.date_of_birth" type="date" class="field-input" />
            </div>
            <div>
              <label class="field-label">Age <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
              <input v-model.number="form.age" type="number" min="1" max="120" class="field-input" placeholder="25" />
            </div>
          </div>

          <div>
            <label class="field-label">Department <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
            <input v-model="form.department" type="text" placeholder="IT Department" class="field-input" />
          </div>

          <div>
            <label class="field-label">Gender <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
            <select v-model="form.gender" class="field-input bg-white">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <!-- Photo Upload -->
          <div>
            <label class="field-label">Profile Photo <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
            <input ref="photoInput" @change="handlePhotoUpload" type="file" accept="image/*" class="field-input" />
            <p class="text-xs text-gray-400 mt-1">Upload a profile photo (JPG, PNG, GIF - max 5MB)</p>
          </div>

          <!-- CV Upload -->
          <div>
            <label class="field-label">CV/Resume <span class="text-gray-300 normal-case font-normal">(optional)</span></label>
            <input ref="cvInput" @change="handleCvUpload" type="file" accept=".pdf,.doc,.docx" class="field-input" />
            <p class="text-xs text-gray-400 mt-1">Upload CV/Resume (PDF, DOC, DOCX - max 10MB)</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label">Password</label>
              <input v-model="form.password" type="password" required class="field-input" />
            </div>
            <div>
              <label class="field-label">Confirm</label>
              <input v-model="form.confirm_password" type="password" required class="field-input" />
            </div>
          </div>

          <!-- Error -->
          <div v-if="error"
            class="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
            <i class="fas fa-exclamation-circle shrink-0"></i>
            {{ error }}
          </div>

          <!-- Submit -->
          <button type="submit" :disabled="loading"
            class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
            <i v-if="loading" class="fas fa-spinner animate-spin text-xs"></i>
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">
          Already have an account?
          <button @click="$emit('switch-to-login')" class="text-green-600 hover:text-green-700 font-semibold ml-1">
            Sign in
          </button>
        </p>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterModal',
  emits: ['close', 'switch-to-login'],

  props: {
    // Optional: pre-selected plan passed in from pricing page
    preSelectedPlan: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      accountType: 'individual',
      loading: false,
      error: '',
      selectedPlan: null,

      form: {
        first_name: '', last_name: '', email: '', phone: '', phone_number: '',
        password: '', confirm_password: '',
        date_of_birth: '', age: null, department: '', gender: '',
        photo: null, cv: null,
        // org fields
        org_name: '', org_email: '', org_type: 'Company', address: '',
      },
    };
  },

  methods: {
    handlePhotoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          this.$root.$refs.toast?.showToast('Photo file size must be less than 5MB', 'error');
          this.$refs.photoInput.value = '';
          return;
        }
        this.form.photo = file;
      }
    },

    handleCvUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          this.$root.$refs.toast?.showToast('CV file size must be less than 10MB', 'error');
          this.$refs.cvInput.value = '';
          return;
        }
        this.form.cv = file;
      }
    },

    switchToIndividual() {
      this.accountType = 'individual';
    },

    async register() {
      this.error = '';

      if (this.form.password !== this.form.confirm_password) {
        this.error = 'Passwords do not match.';
        return;
      }

      // Validate password strength
      if (this.form.password.length < 6) {
        this.error = 'Password must be at least 6 characters long.';
        return;
      }

      this.loading = true;
      try {
        if (this.accountType === 'individual') {
          // Create FormData for file upload support
          const formData = new FormData();
          
          // Add all text fields
          formData.append('first_name', this.form.first_name);
          formData.append('last_name', this.form.last_name);
          formData.append('email', this.form.email);
          formData.append('password', this.form.password);
          
          // Add optional fields if they have values
          if (this.form.phone_number) formData.append('phone_number', this.form.phone_number);
          if (this.form.phone) formData.append('phone', this.form.phone);
          if (this.form.date_of_birth) formData.append('date_of_birth', this.form.date_of_birth);
          if (this.form.age) formData.append('age', this.form.age);
          if (this.form.department) formData.append('department', this.form.department);
          if (this.form.gender) formData.append('gender', this.form.gender);
          
          // Add files if present
          if (this.form.photo) formData.append('photo', this.form.photo);
          if (this.form.cv) formData.append('cv', this.form.cv);

          const response = await this.$apiPost('/auth/register', formData, {
            'Content-Type': 'multipart/form-data'
          });

          // Show success message
          this.$root.$refs.toast?.showToast('Account created successfully! Please login.', 'success');
          
          this.$emit('close');
          this.$emit('switch-to-login');
        } else {
          // Organization registration - send in nested format
          const payload = {
            user: {
              first_name: this.form.first_name,
              last_name:  this.form.last_name,
              email:      this.form.email,
              phone:      this.form.phone || null,
              password:   this.form.password,
            },
            organization: {
              name:           this.form.org_name,
              official_email: this.form.org_email || null,
              official_phone: this.form.org_phone || null,
              address:        this.form.address || null,
              org_type:       this.form.org_type,
              description:    this.form.description || null,
            }
          };

          const orgRes = await this.$apiPost('/organization', payload);
          const orgId = orgRes?.organization?.id;

          // Assign selected plan if exists
          if (orgId && this.selectedPlan?.id) {
            await this.$apiPost('/subscriptions', {
              organization_id: orgId,
              plan_id:         this.selectedPlan.id,
              activated_by:    null,
            });
          }

          // Show success message
          this.$root.$refs.toast?.showToast('Organization account created successfully! Please login.', 'success');
          
          this.$emit('close');
          this.$emit('switch-to-login');
        }
      } catch (err) {
        console.error('Registration error:', err);
        
        // Extract error message from different response formats
        let errorMessage = 'Registration failed. Please try again.';
        
        if (err?.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err?.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
  },

  watch: {
    // No-op — kept for future use
  },

  mounted() {
    // If a plan was passed in from the pricing page, pre-select it and go straight to org form
    if (this.preSelectedPlan) {
      this.selectedPlan = this.preSelectedPlan;
      this.accountType = 'organization';
    }
  },
};
</script>

<style scoped>
.field-label {
  @apply block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide;
}
.field-input {
  @apply w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
    focus:outline-none focus:ring-2 focus:ring-green-500 transition;
}
</style>
