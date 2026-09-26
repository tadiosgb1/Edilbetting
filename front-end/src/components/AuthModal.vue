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

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="handleAuth" class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Email or Phone</label>
          <input v-model="form.identifier" type="text" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="user@example.com" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Password</label>
          <input v-model="form.password" type="password" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="••••••••" />
        </div>
        <button type="submit" class="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded text-sm uppercase transition tracking-wide">
          Log In
        </button>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleAuth" class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Full Name</label>
          <input v-model="form.fullName" type="text" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="John Doe" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Email</label>
          <input v-model="form.email" type="email" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="user@example.com" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Password</label>
          <input v-model="form.password" type="password" required class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="••••••••" />
        </div>
        <button type="submit" class="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded text-sm uppercase transition tracking-wide">
          Create Account
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
      form: { identifier: '', fullName: '', email: '', password: '' }
    };
  },
  watch: {
    initialMode(newVal) {
      this.mode = newVal;
    }
  },
  methods: {
    handleAuth() {
      // Logic for authentication submit
      this.$emit('success', { mode: this.mode, user: this.form });
      this.$emit('close');
    }
  }
};
</script>