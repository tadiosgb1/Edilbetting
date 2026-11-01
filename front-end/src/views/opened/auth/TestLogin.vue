<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans">

    <!-- Logo -->
    <router-link to="/" class="flex items-center gap-2 mb-10 group">
      <div class="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow group-hover:bg-green-600 transition">
        <i class="fas fa-brain text-white text-sm"></i>
      </div>
      <span class="text-lg font-black text-gray-900 tracking-tight">
        Alpha<span class="text-green-500">Psych</span>
      </span>
    </router-link>

    <!-- Card -->
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div class="h-1 w-full bg-gradient-to-r from-green-400 to-green-600"></div>

      <div class="p-8">

        <!-- ── Verifying state ── -->
        <div v-if="step === 'verifying'" class="text-center py-4">
          <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-spinner fa-spin text-green-500 text-lg"></i>
          </div>
          <h1 class="text-lg font-black text-gray-900 mb-1">Verifying your link…</h1>
          <p class="text-gray-400 text-xs">Please wait a moment.</p>
        </div>

        <!-- ── Success: redirect in progress ── -->
        <div v-else-if="step === 'success'" class="text-center py-2">
          <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check-circle text-green-500 text-lg"></i>
          </div>
          <h1 class="text-lg font-black text-gray-900 mb-2">You're in!</h1>
          <p class="text-gray-400 text-xs mb-5">Redirecting you to your test…</p>
          <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div class="bg-green-500 h-1.5 rounded-full animate-progress"></div>
          </div>
        </div>

        <!-- ── Invalid / expired ── -->
        <div v-else-if="step === 'invalid'" class="text-center py-2">
          <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-times-circle text-red-400 text-lg"></i>
          </div>
          <h1 class="text-lg font-black text-gray-900 mb-2">Link Expired</h1>
          <p class="text-gray-400 text-xs mb-5 leading-relaxed">
            This login link has already been used or has expired.<br/>
            Please contact your administrator to resend the assignment.
          </p>
          <router-link to="/"
            class="inline-block w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition text-center">
            Go to Login
          </router-link>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'TestLogin',

  data() {
    return {
      step: 'verifying',  // 'verifying' | 'success' | 'invalid'
    };
  },

  computed: {
    token() {
      return this.$route.params.token || '';
    },
  },

  methods: {
    async verify() {
      if (!this.token) {
        this.step = 'invalid';
        return;
      }

      try {
        // Exchange the magic token for a real session
        const res = await this.$apiPost('/auth/magic-login', { token: this.token });

        // Store session exactly like the normal login does
        localStorage.setItem('access',         res.accessToken);
        localStorage.setItem('refresh',        res.refreshToken);
        localStorage.setItem('userId',         res.id);
        localStorage.setItem('email',          res.email);
        localStorage.setItem('name',           res.email);
        localStorage.setItem('organizationId', res.organization_id || '');
        localStorage.setItem('roles',          JSON.stringify(res.roles || []));
        localStorage.setItem('permissions',    JSON.stringify(res.permissions || []));

        this.step = 'success';

        // Redirect to the tests page after a short delay so the user sees the success state
        setTimeout(() => {
          this.$router.push({ name: 'Test-view' });
        }, 1500);

      } catch (e) {
        this.step = 'invalid';
      }
    },
  },

  mounted() {
    this.verify();
  },
};
</script>

<style scoped>
@keyframes progress {
  from { width: 0%; }
  to   { width: 100%; }
}
.animate-progress {
  animation: progress 1.4s ease-in-out forwards;
}
</style>
