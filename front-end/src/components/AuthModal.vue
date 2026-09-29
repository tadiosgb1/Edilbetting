<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
      <!-- Close Button -->
      <button @click="$emit('close')" class="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>

      <!-- Tabs -->
      <div class="flex border-b border-slate-800 mb-6">
        <button
          @click="mode = 'login'"
          :class="mode === 'login' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : 'text-slate-400'"
          class="flex-1 pb-2 text-center text-sm transition"
        >
          Login
        </button>
        <button
          @click="mode = 'register'"
          :class="mode === 'register' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : 'text-slate-400'"
          class="flex-1 pb-2 text-center text-sm transition"
        >
          Register
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {{ error }}
      </div>

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="handleAuth" class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Phone or Email</label>
          <input v-model="form.identifier" type="text" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="Phone number or email" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Password</label>
          <input v-model="form.password" type="password" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="••••••••" />
        </div>
        <button :disabled="loading" type="submit" class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded text-sm uppercase transition tracking-wide">
          {{ loading ? 'Logging In...' : 'Log In' }}
        </button>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleAuth" class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Full Name</label>
          <input v-model="form.fullName" type="text" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="John Doe" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Phone Number</label>
          <input v-model="form.phoneNumber" type="tel" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="+251..." />
        </div>
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Date of Birth</label>
          <input v-model="form.dateOfBirth" type="date" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Password</label>
          <input v-model="form.password" type="password" required minlength="6" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="••••••••" />
        </div>
        <button :disabled="loading" type="submit" class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded text-sm uppercase transition tracking-wide">
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthModal',
  props: {
    isOpen: { type: Boolean, default: false },
    initialMode: { type: String, default: 'login' }
  },
  emits: ['close', 'success'],
  data() {
    return {
      mode: this.initialMode,
      loading: false,
      error: '',
      form: {
        identifier: '',
        fullName: '',
        phoneNumber: '',
        dateOfBirth: '',
        password: ''
      }
    };
  },
  watch: {
    initialMode(newVal) {
      this.mode = newVal;
    },
    isOpen(newVal) {
      if (newVal) {
        this.error = '';
      }
    }
  },
  methods: {
    getApiBaseUrl() {
      return (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    },

    async request(path, options = {}) {
      const response = await fetch(`${this.getApiBaseUrl()}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.message || 'Authentication request failed.');
      }

      return data;
    },

    saveSession(data) {
      const user = data.user || {};
      const isAdmin = Boolean(user.isAdmin);

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', isAdmin ? 'admin' : 'user');
      localStorage.setItem('user', JSON.stringify(user));
    },

    async login(phoneNumber, password) {
      // Backend contract: POST /api/users/login
      return this.request('/users/login', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          password
        })
      });
    },

    async register() {
      // Backend/Postman registration contract.
      return this.request('/users/register', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: this.form.phoneNumber,
          fullName: this.form.fullName,
          dateOfBirth: this.form.dateOfBirth || null,
          password: this.form.password
        })
      });
    },

    async handleAuth() {
      this.error = '';
      this.loading = true;

      try {
        let data;

        if (this.mode === 'login') {
          const identifier = this.form.identifier.trim();

          // The current backend login contract uses phoneNumber.
          // Keep the UI as phone/email, but send the identifier in phoneNumber
          // so the request remains compatible with the existing Postman/backend contract.
          data = await this.login(identifier, this.form.password);
        } else {
          await this.register();

          // Registration returns the created user but no JWT, so log the user in
          // immediately with the same credentials before redirecting.
          data = await this.login(this.form.phoneNumber.trim(), this.form.password);
        }

        this.saveSession(data);

        const user = data.user || {};
        const isAdmin = Boolean(user.isAdmin);

        this.$emit('success', {
          mode: this.mode,
          user,
          token: data.token,
          isAdmin
        });
        this.$emit('close');

        // Admins go to the dashboard; normal users go to the home page.
        await this.$router.push(isAdmin ? '/dashboard' : '/');
      } catch (error) {
        this.error = error?.message || 'Unable to complete authentication.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
