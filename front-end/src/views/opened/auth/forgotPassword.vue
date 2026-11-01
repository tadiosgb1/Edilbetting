<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans">


    <!-- Card -->
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

      <!-- Top accent -->
      <div class="h-1 w-full bg-gradient-to-r from-green-400 to-green-600"></div>

      <div class="p-8">

        <!-- ── Step 1: form ── -->
        <template v-if="step === 'form'">
          <div class="text-center mb-7">
            <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-lock-open text-green-500 text-lg"></i>
            </div>
            <h1 class="text-xl font-black text-gray-900">Forgot Password?</h1>
            <p class="text-gray-400 text-xs mt-1.5 leading-relaxed">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
              <div class="relative">
                <i class="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input
                  v-model="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  :class="{ 'border-red-400 focus:ring-red-300': error }"
                />
              </div>
              <p v-if="error" class="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                <i class="fas fa-exclamation-circle"></i> {{ error }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <i v-if="loading" class="fas fa-spinner fa-spin text-xs"></i>
              <i v-else class="fas fa-paper-plane text-xs"></i>
              {{ loading ? 'Sending…' : 'Send Reset Link' }}
            </button>
          </form>
        </template>

        <!-- ── Step 2: sent ── -->
        <template v-else>
          <div class="text-center py-2">
            <div class="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <i class="fas fa-envelope-open-text text-green-500 text-2xl"></i>
            </div>
            <h1 class="text-lg font-black text-gray-900 mb-2">Check your inbox</h1>
            <p class="text-gray-400 text-xs leading-relaxed mb-1">We sent a reset link to</p>
            <p class="text-green-600 font-bold text-sm mb-5">{{ email }}</p>
            <p class="text-gray-400 text-[11px] leading-relaxed">
              Didn't get it? Check spam, or
              <button
                @click="step = 'form'; error = ''"
                class="text-green-500 font-semibold hover:underline"
              >try again</button>.
            </p>
          </div>
        </template>

      </div>
    </div>

    <!-- Back to login -->
    <router-link
      to="/"
      class="mt-6 text-xs text-gray-400 hover:text-green-500 font-semibold flex items-center gap-1.5 transition"
    >
      <i class="fas fa-arrow-left text-[10px]"></i> Back to Login
    </router-link>

  </div>
</template>

<script>
export default {
  name: 'ForgotPassword',
  data() {
    return {
      step: 'form',
      email: '',
      loading: false,
      error: '',
    };
  },
  methods: {
    async submit() {
      this.error = '';
      this.loading = true;
      try {
        await this.$apiPost('/auth/forgot-password', { email: this.email });
        this.step = 'sent';
      } catch (e) {
        const raw = e?.message;
        this.error = (raw && typeof raw === 'object' && raw.error)
          ? raw.error
          : (typeof raw === 'string' ? raw : 'Something went wrong. Please try again.');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
