<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans">

    <!-- Logo -->
    <router-link to="/" class="flex items-center gap-2 mb-10 group">
    
      <span class="text-lg font-black text-gray-900 tracking-tight">
        Alpha<span class="text-green-500">Psych</span>
      </span>
    </router-link>

    <!-- Card -->
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div class="h-1 w-full bg-gradient-to-r from-green-400 to-green-600"></div>

      <div class="p-8">

        <!-- ── Invalid token ── -->
        <template v-if="step === 'invalid'">
          <div class="text-center py-2">
            <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-times-circle text-red-400 text-lg"></i>
            </div>
            <h1 class="text-lg font-black text-gray-900 mb-2">Link Expired</h1>
            <p class="text-gray-400 text-xs mb-5">This reset link is invalid or has expired.</p>
            <router-link
              to="/forgot-password"
              class="inline-block w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition text-center"
            >
              Request New Link
            </router-link>
          </div>
        </template>

        <!-- ── Reset form ── -->
        <template v-else-if="step === 'form'">
          <div class="text-center mb-7">
            <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-lock text-green-500 text-lg"></i>
            </div>
            <h1 class="text-xl font-black text-gray-900">New Password</h1>
            <p class="text-gray-400 text-xs mt-1">Set a new password for your account.</p>
          </div>

          <form @submit.prevent="submit" class="space-y-4">

            <!-- New password -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">New Password</label>
              <div class="relative">
                <i class="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input
                  v-model="form.newPassword"
                  :type="show.pwd ? 'text' : 'password'"
                  required
                  placeholder="At least 6 characters"
                  class="w-full pl-9 pr-9 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  :class="errors.newPassword ? 'border-red-400' : 'border-gray-200'"
                />
                <button type="button" @click="show.pwd = !show.pwd"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                  <i :class="show.pwd ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                </button>
              </div>
              <p v-if="errors.newPassword" class="text-red-500 text-[11px] mt-1 flex items-center gap-1">
                <i class="fas fa-exclamation-circle"></i> {{ errors.newPassword }}
              </p>
              <!-- Strength bar -->
              <div v-if="form.newPassword" class="mt-2 flex gap-1">
                <div v-for="n in 4" :key="n"
                  class="h-1 flex-1 rounded-full transition-all"
                  :class="n <= strength.score ? strength.color : 'bg-gray-200'">
                </div>
              </div>
            </div>

            <!-- Confirm password -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">Confirm Password</label>
              <div class="relative">
                <i class="fas fa-shield-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input
                  v-model="form.confirmPassword"
                  :type="show.confirm ? 'text' : 'password'"
                  required
                  placeholder="Re-enter password"
                  class="w-full pl-9 pr-9 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  :class="errors.confirmPassword ? 'border-red-400' : 'border-gray-200'"
                />
                <button type="button" @click="show.confirm = !show.confirm"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                  <i :class="show.confirm ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="text-red-500 text-[11px] mt-1 flex items-center gap-1">
                <i class="fas fa-exclamation-circle"></i> {{ errors.confirmPassword }}
              </p>
              <p v-else-if="form.confirmPassword && form.newPassword === form.confirmPassword"
                class="text-green-500 text-[11px] mt-1 flex items-center gap-1">
                <i class="fas fa-check-circle"></i> Passwords match
              </p>
            </div>

            <!-- Server error -->
            <p v-if="serverError" class="text-red-500 text-[11px] flex items-center gap-1">
              <i class="fas fa-exclamation-circle"></i> {{ serverError }}
            </p>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <i v-if="loading" class="fas fa-spinner fa-spin text-xs"></i>
              <i v-else class="fas fa-check text-xs"></i>
              {{ loading ? 'Saving…' : 'Set New Password' }}
            </button>
          </form>
        </template>

        <!-- ── Success ── -->
        <template v-else-if="step === 'success'">
          <div class="text-center py-2">
            <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-check-circle text-green-500 text-lg"></i>
            </div>
            <h1 class="text-lg font-black text-gray-900 mb-2">Password Updated</h1>
            <p class="text-gray-400 text-xs mb-5">You can now sign in with your new password.</p>
            <router-link
              to="/"
              class="inline-block w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition text-center"
            >
              Go to Login
            </router-link>
          </div>
        </template>

      </div>
    </div>

    <!-- Back link -->
    <router-link to="/"
      class="mt-6 text-xs text-gray-400 hover:text-green-500 font-semibold flex items-center gap-1.5 transition">
      <i class="fas fa-arrow-left text-[10px]"></i> Back to Login
    </router-link>

  </div>
</template>

<script>
export default {
  name: 'ResetPassword',

  data() {
    return {
      step: 'form',   // 'form' | 'success' | 'invalid'
      loading: false,
      serverError: '',
      form: { newPassword: '', confirmPassword: '' },
      errors: { newPassword: '', confirmPassword: '' },
      show: { pwd: false, confirm: false },
    };
  },

  computed: {
    token() {
      return this.$route.params.token || '';
    },
    strength() {
      const p = this.form.newPassword;
      let score = 0;
      if (p.length >= 6)  score++;
      if (p.length >= 10) score++;
      if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
      if (/[^A-Za-z0-9]/.test(p)) score++;
      const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
      return { score, color: colors[score] };
    },
  },

  methods: {
    validate() {
      this.errors = { newPassword: '', confirmPassword: '' };
      let ok = true;
      if (!this.form.newPassword || this.form.newPassword.length < 6) {
        this.errors.newPassword = 'At least 6 characters required';
        ok = false;
      }
      if (this.form.newPassword !== this.form.confirmPassword) {
        this.errors.confirmPassword = 'Passwords do not match';
        ok = false;
      }
      return ok;
    },

    async submit() {
      this.serverError = '';
      if (!this.validate()) return;

      this.loading = true;
      try {
        // POST /auth/reset-password  { token, newPassword }
        await this.$apiPost('/auth/reset-password', {
          token: this.token,
          newPassword: this.form.newPassword,
        });
        this.step = 'success';
        setTimeout(() => this.$router.push('/'), 3000);
      } catch (e) {
        const raw = e?.message;
        const msg = (raw && typeof raw === 'object' && raw.error)
          ? raw.error
          : (typeof raw === 'string' ? raw : 'Something went wrong.');
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
          this.step = 'invalid';
        } else {
          this.serverError = msg;
        }
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    if (!this.token) this.step = 'invalid';
  },
};
</script>
