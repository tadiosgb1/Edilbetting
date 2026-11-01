<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <Toast ref="toast" />

    <div class="w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 relative overflow-hidden">

      <!-- Top Accent -->
      <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-indigo-700 to-orange-500"></div>

      <!-- Header -->
      <div class="mb-8 text-center">
        <router-link to="/" class="inline-flex items-center gap-2 mb-4">
          <div class="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
            <i class="fas fa-brain text-green-400 text-xs"></i>
          </div>
          <span class="font-black text-slate-900 text-base tracking-tight">Alpha<span class="text-green-500">Psych</span></span>
        </router-link>
        <h2 class="text-3xl font-black text-slate-900">Create Account</h2>
        <p class="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">
          Psychometric Access Portal
        </p>
      </div>

      <!-- Account Type Switch -->
      <div class="flex bg-slate-100 rounded-2xl p-1 mb-8">
        <button
          @click="accountType = 'individual'"
          :class="accountType === 'individual' ? activeTab : inactiveTab"
        >
          <i class="fas fa-user mr-2 text-xs"></i>Individual
        </button>
        <button
          @click="handleOrgTabClick"
          :class="accountType === 'organization' ? activeTab : inactiveTab"
        >
          <i class="fas fa-building mr-2 text-xs"></i>Organization
        </button>
      </div>

      <!-- ── ORGANIZATION: no plan selected yet ── -->
      <template v-if="accountType === 'organization' && !selectedPlan">
        <div class="text-center py-10 space-y-6">
          <div class="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
            <i class="fas fa-tags text-amber-500 text-2xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-900 mb-2">Choose a Plan First</h3>
            <p class="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              Organization accounts require a subscription plan. Browse our plans and click
              <strong>"Get Started"</strong> to continue registration.
            </p>
          </div>
          <router-link to="/pricing"
            class="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-green-500/20">
            View Plans &amp; Pricing
            <i class="fas fa-arrow-right text-xs"></i>
          </router-link>
          <p class="text-xs text-slate-400">
            Already have a plan in mind?
            <button @click="accountType = 'individual'" class="text-indigo-500 hover:underline font-semibold ml-1">
              Register as Individual instead
            </button>
          </p>
        </div>
      </template>

      <!-- ── FORM (individual OR org with plan) ── -->
      <form v-else @submit.prevent="register" class="space-y-8">

        <!-- Selected plan banner (org only) -->
        <div v-if="accountType === 'organization' && selectedPlan"
          class="flex items-center justify-between gap-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <i class="fas fa-check text-white text-sm"></i>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-green-600">Selected Plan</p>
              <p class="text-sm font-black text-slate-900">{{ selectedPlan.name }}
                <span class="font-normal text-slate-500 ml-1">
                  {{ selectedPlan.price_cents === 0 ? '— Free' : '— $' + (selectedPlan.price_cents / 100).toFixed(0) + '/mo' }}
                </span>
              </p>
            </div>
          </div>
          <router-link to="/pricing"
            class="text-xs text-green-600 hover:text-green-700 font-bold underline shrink-0">
            Change
          </router-link>
        </div>

        <!-- ================= INDIVIDUAL ================= -->
        <template v-if="accountType === 'individual'">
          <div class="space-y-4">
            <h3 class="section-title">Personal Information</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="custom-label">First Name</label>
                <input v-model="form.first_name" required class="input" placeholder="John" />
              </div>
              <div>
                <label class="custom-label">Last Name</label>
                <input v-model="form.last_name" required class="input" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label class="custom-label">Middle Name <span class="text-slate-300">(optional)</span></label>
              <input v-model="form.middle_name" class="input" />
            </div>

            <div>
              <label class="custom-label">Email</label>
              <input v-model="form.email" type="email" required class="input" placeholder="you@example.com" />
            </div>

            <div>
              <label class="custom-label">Phone <span class="text-slate-300">(optional)</span></label>
              <input v-model="form.phone" class="input" placeholder="+251 9XX XXX XXX" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="custom-label">Password</label>
                <input v-model="form.password" type="password" required class="input" />
              </div>
              <div>
                <label class="custom-label">Confirm Password</label>
                <input v-model="form.confirm_password" type="password" required class="input" />
              </div>
            </div>
          </div>
        </template>

        <!-- ================= ORGANIZATION ================= -->
        <template v-if="accountType === 'organization'">

          <!-- 👤 ADMIN USER -->
          <div class="border border-slate-100 rounded-2xl p-6 space-y-4">
            <h3 class="section-title">Organization Administrator</h3>
            <p class="text-xs text-slate-400 font-semibold -mt-2">
              This user will manage the organization and invite others.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="custom-label">First Name</label>
                <input v-model="form.first_name" required class="input" placeholder="John" />
              </div>
              <div>
                <label class="custom-label">Last Name</label>
                <input v-model="form.last_name" required class="input" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label class="custom-label">Middle Name <span class="text-slate-300">(optional)</span></label>
              <input v-model="form.middle_name" class="input" />
            </div>

            <div>
              <label class="custom-label">Admin Email (Login)</label>
              <input v-model="form.email" type="email" required class="input" placeholder="admin@organization.com" />
            </div>

            <div>
              <label class="custom-label">Phone <span class="text-slate-300">(optional)</span></label>
              <input v-model="form.phone" class="input" placeholder="+251 9XX XXX XXX" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="custom-label">Password</label>
                <input v-model="form.password" type="password" required class="input" />
              </div>
              <div>
                <label class="custom-label">Confirm Password</label>
                <input v-model="form.confirm_password" type="password" required class="input" />
              </div>
            </div>
          </div>

          <!-- 🏢 ORGANIZATION INFO -->
          <div class="border border-slate-100 rounded-2xl p-6 space-y-4">
            <h3 class="section-title">Organization Details</h3>

            <div>
              <label class="custom-label">Organization Name</label>
              <input v-model="form.org_name" required class="input" placeholder="Acme Corp" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="custom-label">Official Email</label>
                <input v-model="form.org_email" type="email" class="input" placeholder="info@org.com" />
              </div>
              <div>
                <label class="custom-label">Official Phone</label>
                <input v-model="form.org_phone" class="input" placeholder="+251 11 XXX XXXX" />
              </div>
            </div>

            <div>
              <label class="custom-label">Address</label>
              <input v-model="form.address" class="input" placeholder="Bole, Addis Ababa" />
            </div>

            <div>
              <label class="custom-label">Organization Type</label>
              <select v-model="form.org_type" class="input">
                <option>Company</option>
                <option>University</option>
                <option>School</option>
                <option>NGO</option>
                <option>Research</option>
              </select>
            </div>

            <div>
              <label class="custom-label">Description <span class="text-slate-300">(optional)</span></label>
              <textarea v-model="form.description" class="input h-24" placeholder="Brief description of your organization..."></textarea>
            </div>
          </div>

        </template>

        <!-- ERROR -->
        <div v-if="error" class="error-box">
          <i class="fas fa-exclamation-circle mr-2"></i>{{ error }}
        </div>

        <!-- SUBMIT -->
        <button type="submit" :disabled="loading" class="submit-btn">
          <i v-if="loading" class="fas fa-spinner animate-spin mr-2"></i>
          <span>{{ loading ? 'Creating Account...' : 'Create Account' }}</span>
        </button>

      </form>

      <!-- Footer -->
      <div class="mt-8 text-center">
        <p class="text-xs text-slate-400 font-bold uppercase">
          Already have access?
          <router-link to="/login" class="text-indigo-500 ml-1 hover:underline">
            Login
          </router-link>
        </p>
      </div>

    </div>
  </div>
</template>

<script>
import Toast from "../../../components/Toast.vue";

export default {
  name: "RegisterGYZPsych",
  components: { Toast },

  data() {
    return {
      accountType: "individual",
      loading: false,
      error: "",
      selectedPlan: null,   // populated from ?plan= query param

      form: {
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        // ORGANIZATION
        org_name: "",
        org_email: "",
        org_phone: "",
        org_type: "Company",
        address: "",
        description: "",
      },
    };
  },

  computed: {
    activeTab() {
      return "w-1/2 py-3 rounded-xl bg-white shadow font-bold text-xs uppercase tracking-wider text-slate-900 transition-all";
    },
    inactiveTab() {
      return "w-1/2 py-3 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-wider transition-all hover:text-slate-600";
    },
  },

  methods: {
    handleOrgTabClick() {
      this.accountType = 'organization';
      // If no plan is pre-selected, the template will show the "choose a plan" prompt
    },

    async loadPlanFromQuery() {
      const planId = this.$route?.query?.plan;
      if (planId) {
        this.accountType = 'organization';
        try {
          const res = await this.$apiGet(`/plans/${planId}`);
          this.selectedPlan = res.data || res;
        } catch (e) {
          // Fallback: build a minimal plan object from query params
          this.selectedPlan = {
            id: planId,
            name: this.$route.query.planName || 'Selected Plan',
            price_cents: null,
          };
        }
      }
    },

    async register() {
      this.error = "";

      if (this.form.password !== this.form.confirm_password) {
        this.error = "Passwords do not match.";
        return;
      }

      this.loading = true;

      try {
        if (this.accountType === "individual") {
          await this.$apiPost("/auth/register", {
            first_name:  this.form.first_name,
            middle_name: this.form.middle_name,
            last_name:   this.form.last_name,
            email:       this.form.email,
            phone:       this.form.phone,
            password:    this.form.password,
          });
        } else {
          // Organization registration - send in the format backend expects
          const payload = {
            user: {
              first_name:  this.form.first_name,
              middle_name: this.form.middle_name,
              last_name:   this.form.last_name,
              email:       this.form.email,
              phone:       this.form.phone,
              password:    this.form.password,
            },
            organization: {
              name:           this.form.org_name,
              official_email: this.form.org_email,
              official_phone: this.form.org_phone,
              address:        this.form.address,
              org_type:       this.form.org_type,
              description:    this.form.description,
            }
          };

          console.log('=== FRONTEND: Sending organization registration ===');
          console.log('Payload:', JSON.stringify(payload, null, 2));

          const orgRes = await this.$apiPost("/organization", payload);
          
          console.log('Organization response:', orgRes);
          
          const orgId = orgRes?.organization?.id;

          // Assign selected plan if exists
          if (orgId && this.selectedPlan?.id) {
            await this.$apiPost("/subscriptions", {
              organization_id: orgId,
              plan_id:         this.selectedPlan.id,
              activated_by:    null,
            });
          }
        }

        this.$refs.toast?.showSuccessToastMessage("Account successfully created.");
        setTimeout(() => this.$router.push("/login"), 1200);

      } catch (err) {
        this.error =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Registration failed. Please try again.";
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.loadPlanFromQuery();
  },
};
</script>

<style scoped>
.section-title {
  @apply text-xs font-black uppercase tracking-widest text-slate-500 mb-1;
}

.input {
  @apply w-full px-4 py-3 bg-white border border-gray-200 rounded-xl
  text-gray-900 text-sm font-medium
  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
  transition-all placeholder:text-gray-300;
}

.custom-label {
  @apply block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5;
}

.submit-btn {
  @apply w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest
  flex items-center justify-center transition-all disabled:opacity-60;
}

.error-box {
  @apply bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center;
}
</style>
