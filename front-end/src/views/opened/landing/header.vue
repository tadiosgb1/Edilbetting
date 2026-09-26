<template>
  <header class="sticky top-0 z-[100] shadow-md">

    <!-- ── Top Bar ── -->
    <div class="bg-green-600 text-white text-[11px] font-medium">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">

        <!-- Left: contact info -->
        <div class="flex items-center gap-4">
          <a href="tel:+1234567890" class="flex items-center gap-1.5 hover:text-green-100 transition">
            <i class="fas fa-phone-alt text-[10px]"></i>
            <span>+251 91 392 5558</span>
          </a>
          <a href="mailto:info@gyzpsych.com" class="hidden sm:flex items-center gap-1.5 hover:text-green-100 transition">
            <i class="fas fa-envelope text-[10px]"></i>
            <span>info@gyzpsych.com</span>
          </a>
        </div>

        <!-- Right: social icons + tagline -->
        <div class="flex items-center gap-3">
          <span class="hidden md:inline text-green-100/80">Psychometric Solutions</span>
          <div class="flex items-center gap-2 ml-2">
            <a href="#" aria-label="Facebook" class="hover:text-green-100 transition"><i class="fab fa-facebook-f text-[10px]"></i></a>
            <a href="#" aria-label="Twitter"  class="hover:text-green-100 transition"><i class="fab fa-twitter text-[10px]"></i></a>
            <a href="#" aria-label="LinkedIn" class="hover:text-green-100 transition"><i class="fab fa-linkedin-in text-[10px]"></i></a>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Main Nav Bar ── -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">

        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="relative">
            <!-- glow -->
            <div class="absolute inset-0 rounded-full bg-green-400 blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
            <!-- spinning dashed ring -->
            <div class="absolute inset-[-3px] rounded-full border-2 border-dashed border-green-400/60 group-hover:border-green-500 animate-spin-slow transition-colors duration-300"></div>
            <!-- image -->
            <img
              src="../../../assets/img/gyz.PNG"
              alt="GYZPsych Logo"
              class="relative w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div class="flex flex-col leading-none">
            <span class="text-base font-black text-gray-900 tracking-tight">
              GYZ<span class="text-green-500">Psych</span>
            </span>
            <span class="text-[9px] font-medium text-gray-400 uppercase tracking-widest mt-0.5 hidden sm:block">
              Psychometric Solutions
            </span>
          </div>
        </router-link>

        <!-- Desktop Nav -->
        <nav class="hidden lg:flex items-center gap-1">
          <router-link
            v-for="nav in navLinks"
            :key="nav.path"
            :to="nav.path"
            class="px-4 py-2 text-gray-600 text-xs font-semibold uppercase tracking-wider hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
            active-class="text-green-600 bg-green-50"
          >
            {{ nav.name }}
          </router-link>
        </nav>

        <!-- Desktop Actions -->
        <div class="hidden md:flex items-center gap-3">
          <button
            @click="$emit('open-login')"
            class="px-5 py-2 text-gray-600 hover:text-green-600 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-green-50 transition border border-gray-200 hover:border-green-200"
          >
            Sign In
          </button>
          <button
            @click="$emit('open-register')"
            class="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow shadow-green-500/30 transition"
          >
            Get Started
          </button>
        </div>

        <!-- Mobile menu button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 transition"
          :class="{ 'bg-green-50 text-green-600': mobileMenuOpen }"
        >
          <i class="fas text-sm" :class="mobileMenuOpen ? 'fa-times' : 'fa-bars'"></i>
        </button>
      </div>

      <!-- Mobile Menu -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="mobileMenuOpen" class="lg:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2 space-y-1">
          <router-link
            v-for="nav in navLinks"
            :key="nav.path"
            :to="nav.path"
            @click="mobileMenuOpen = false"
            class="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:text-green-600 hover:bg-green-50 text-sm font-semibold transition"
          >
            {{ nav.name }}
            <i class="fas fa-chevron-right text-[10px] text-gray-300"></i>
          </router-link>

          <!-- Mobile contact info -->
          <div class="pt-2 pb-1 px-4 flex flex-col gap-1 text-xs text-gray-500">
            <a href="tel:+1234567890" class="flex items-center gap-2 hover:text-green-600 transition">
              <i class="fas fa-phone-alt text-green-500"></i> +251 91 392 5558
            </a>
            <a href="mailto:info@gyzpsych.com" class="flex items-center gap-2 hover:text-green-600 transition">
              <i class="fas fa-envelope text-green-500"></i> info@gyzpsych.com
            </a>
          </div>

          <div class="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <button
              @click="mobileMenuOpen = false; $emit('open-login')"
              class="w-full py-3 text-gray-600 hover:text-green-600 text-sm font-semibold rounded-xl hover:bg-green-50 transition border border-gray-200"
            >
              Sign In
            </button>
            <button
              @click="mobileMenuOpen = false; $emit('open-register')"
              class="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </transition>
    </div>

  </header>

  <!-- Auth Modals -->
  <login-modal
    v-if="showLogin"
    @close="showLogin = false"
    @switch-to-register="showLogin = false; showRegister = true"
  />
  <register-modal
    v-if="showRegister"
    @close="showRegister = false"
    @switch-to-login="showRegister = false; showLogin = true"
  />
</template>

<script>
import LoginModal from '@/components/AuthModal.vue';
import RegisterModal from '@/components/RegisterModal.vue';

export default {
  name: 'SiteHeader',
  components: { LoginModal, RegisterModal },
  emits: ['open-login', 'open-register'],

  data() {
    return {
      mobileMenuOpen: false,
      showLogin: false,
      showRegister: false,
      navLinks: [
        { name: 'Home',          path: '/' },
        { name: 'Features',      path: '/#features' },
        { name: 'About',         path: '/about' },
        { name: 'News & Events', path: '/news-events' },
        { name: 'Pricing',       path: '/pricing' },
        { name: 'Contact',       path: '/contact' },
      ],
    };
  },

  mounted() {
    this.$el.addEventListener('open-login',    () => { this.showLogin    = true; });
    this.$el.addEventListener('open-register', () => { this.showRegister = true; });
  },

  watch: {
    $route() {
      this.mobileMenuOpen = false;
    },
  },
};
</script>
