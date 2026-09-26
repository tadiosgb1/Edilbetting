<template>
  <div class="min-h-screen flex bg-slate-50 font-sans">
    <div class="hidden lg:flex lg:w-7/12 bg-slate-900 flex-col justify-between p-16 relative overflow-hidden">
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-primary-dense/20 blur-[120px] rounded-full"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full"></div>

      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-16">
          <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <i class="fas fa-brain text-white text-xl"></i>
          </div>
          <span class="text-white font-black text-3xl tracking-tighter uppercase">GYZ<span class="text-primary">Psych</span></span>
        </div>

        <div class="space-y-6">
          <h1 class="text-6xl font-black text-white leading-tight">
            The Science of <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dense">Human Potential.</span> <br/>
            Decoded.
          </h1>
          <p class="text-slate-400 text-xl max-w-xl leading-relaxed font-medium">
            Access the leading behavioral analytics platform. 
            Benchmark talent and drive growth with 
            <span class="text-secondary font-bold">verified data</span>.
          </p>
        </div>
      </div>

      <div class="relative z-10 grid grid-cols-2 gap-8">
        <div class="flex flex-col gap-2">
          <div class="h-1 w-12 bg-secondary rounded-full"></div>
          <h3 class="text-white font-bold uppercase tracking-widest text-xs">Scientific Accuracy</h3>
          <p class="text-slate-500 text-sm">Validated psychometric frameworks.</p>
        </div>
        <div class="flex flex-col gap-2">
          <div class="h-1 w-12 bg-primary rounded-full"></div>
          <h3 class="text-white font-bold uppercase tracking-widest text-xs">Real-time Analytics</h3>
          <p class="text-slate-500 text-sm">Instant candidate progress tracking.</p>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-5/12 flex items-center justify-center p-8 bg-white lg:bg-transparent">
      <Toast ref="toast" />
      
      <div class="w-full max-w-md">
        <div class="lg:hidden flex flex-col items-center mb-10 text-center">
          <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 text-white">
             <i class="fas fa-user-check"></i>
          </div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tighter uppercase">GYZ Psych</h2>
        </div>

        <div class="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 p-10 md:p-12 border border-slate-100 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary-dense to-secondary"></div>

          <div class="mb-10">
            <h2 class="text-3xl font-black text-slate-900">Portal Access</h2>
            <div class="flex items-center gap-2 mt-2">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Assessment Engine: Online</p>
            </div>
          </div>

          <form @submit.prevent="login" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email or Phone</label>
              <div class="relative group">
                <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors"></i>
                <input
                  type="text"
                  v-model="form.email"
                  required
                  placeholder="name@organization.com or +1234567890"
                  class="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:ring-0 focus:border-primary outline-none transition-all text-sm font-bold text-slate-800"
                />
              </div>
              <p class="text-xs text-slate-400 ml-1">Enter your email address or phone number</p>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-end px-1">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Key</label>
                <a @click="$emit('close')" href="/forgot-password" class="text-[10px] font-black uppercase text-secondary hover:underline transition-colors">Reset?</a>
              </div>
              <div class="relative group">
                <i class="fas fa-shield-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors"></i>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="form.password"
                  required
                  placeholder="••••••••"
                  class="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:ring-0 focus:border-primary outline-none transition-all text-sm font-bold text-slate-800"
                />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-sm"></i>
                </button>
              </div>
            </div>

            <transition name="error-shake">
              <div v-if="error" class="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border-l-4 border-red-500">
                <i class="fas fa-exclamation-triangle text-sm"></i>
                <p class="text-[11px] font-bold uppercase leading-none">{{ error }}</p>
              </div>
            </transition>

            <button
              type="submit"
              class="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-3 group"
              :disabled="loading"
            >
              <template v-if="!loading">
                Enter Portal <i class="fas fa-chevron-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
              </template>
              <template v-else>
                <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Authenticating Session...
              </template>
            </button>
          </form>

          <div class="mt-12 text-center pt-6 border-t border-slate-50">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Institutional Access? 

              <router-link :to="{ path: '/register'}" class="text-primary hover:text-primary-dense ml-1 transition-colors">
                Register Organization
              </router-link>

            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Toast from "../../../components/Toast.vue";

export default {
  name: "LoginGYZPsych",
  components: { Toast },
  data() {
    return {
      form: { email: "", password: "" },
      error: "",
      loading: false,
      showPassword: false,
    };
  },
  methods: {
    async login() {
      this.error = "";
      this.loading = true;
      try {
        const response = await this.$apiPost("/auth/login", this.form);
        localStorage.setItem("access",        response.accessToken);
        localStorage.setItem("token",         response.accessToken);   // legacy key
        localStorage.setItem("refreshToken",  response.refreshToken);
        localStorage.setItem("userId",        response.id);
        localStorage.setItem("organizationId",response.organization_id || "");
        localStorage.setItem("email",         response.email);
        localStorage.setItem("name",          `${response.first_name || ""} ${response.last_name || ""}`.trim() || response.email);
        const roleNames = (response.roles || []).map(r => r.name || r);
        localStorage.setItem("roles",       JSON.stringify(roleNames));
        localStorage.setItem("permissions", JSON.stringify(response.permissions || []));
        this.$refs.toast?.showSuccessToastMessage("Secure Session Initialized.");
    
        setTimeout(() => {
          this.$router.push({ path: "/dashboard/first-dash" });
        }, 1200);
      } catch (err) {
        console.error("Login error:", err);
        this.error = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || "Invalid Session Credentials.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Industry Standard Professional Palette */
.bg-primary { background-color: #4F46E5; } /* Indigo */
.text-primary { color: #4F46E5; }
.bg-primary-dense { background-color: #3730A3; } /* Deep Indigo */
.text-primary-dense { color: #3730A3; }
.bg-secondary { background-color: #FF6B00; } /* Amber Action */
.text-secondary { color: #FF6B00; }
.border-primary { border-color: #4F46E5; }

.error-shake-enter-active {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>