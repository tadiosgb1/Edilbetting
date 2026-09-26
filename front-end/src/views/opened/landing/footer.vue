<template>
  <footer class="bg-slate-900 text-white pt-16 pb-8 px-6">

    <div class="max-w-7xl mx-auto">

      <!-- Top section -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-12 pb-12 border-b border-white/10">

        <!-- Brand column -->
        <div class="md:col-span-2 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <i class="fas fa-brain text-white text-base"></i>
            </div>
            <div>
              <span class="text-lg font-black text-white tracking-tight">
                Alpha<span class="text-green-400">Psych</span>
              </span>
              <p class="text-[10px] text-white/40 uppercase tracking-widest leading-none mt-0.5">
                Psychometric Solutions
              </p>
            </div>
          </div>

          <p class="text-white/50 text-sm leading-relaxed max-w-sm">
            The premier behavioral analytics platform for organizations, educators, and researchers. Assess, understand, and develop human potential with validated psychometric tools.
          </p>

          <!-- Social links -->
          <div class="flex gap-3">
            <a v-for="social in socials" :key="social.name" href="#"
              class="w-9 h-9 rounded-xl bg-white/5 hover:bg-green-500 flex items-center justify-center transition-all duration-200 group">
              <i :class="[social.icon, 'text-sm text-white/50 group-hover:text-white transition-colors']"></i>
            </a>
          </div>
        </div>

        <!-- Nav columns -->
        <div v-for="group in navGroups" :key="group.title">
          <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-5">{{ group.title }}</h3>
          <ul class="space-y-3">
            <li v-for="link in group.links" :key="link.name">
              <router-link v-if="link.route" :to="link.route"
                class="text-sm text-white/60 hover:text-green-400 transition-colors">
                {{ link.name }}
              </router-link>
              <a v-else href="#"
                class="text-sm text-white/60 hover:text-green-400 transition-colors">
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

      </div>

      <!-- Bottom bar -->
      <div class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-xs text-white/30">
          © {{ new Date().getFullYear() }} GYZ Psychometrics. All rights reserved.
        </p>
        <div class="flex gap-6">
          <a href="#" class="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy Policy</a>
          <a href="#" class="text-xs text-white/30 hover:text-white/60 transition-colors">Terms of Service</a>
          <a href="#" class="text-xs text-white/30 hover:text-white/60 transition-colors">Data Ethics</a>
        </div>
        <!-- Scroll to top -->
        <a href="#top"
          class="w-10 h-10 bg-white/5 hover:bg-green-500 border border-white/10 hover:border-green-500 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
          title="Back to top">
          <i class="fas fa-arrow-up text-xs"></i>
        </a>
      </div>

    </div>
  </footer>
</template>

<script>
export default {
  name: 'SiteFooter',
  data() {
    return {
      socials: [
        { name: 'LinkedIn', icon: 'fab fa-linkedin-in' },
        { name: 'Twitter',  icon: 'fab fa-twitter' },
        { name: 'Telegram', icon: 'fab fa-telegram-plane' },
        { name: 'Facebook', icon: 'fab fa-facebook-f' },
      ],
      navGroups: [
        {
          title: 'Platform',
          links: [
            { name: 'Assessments',   route: null },
            { name: 'Analytics',     route: null },
            { name: 'Group Testing', route: null },
            { name: 'API Access',    route: null },
          ],
        },
        {
          title: 'Resources',
          links: [
            { name: 'Documentation', route: null },
            { name: 'Sample Reports', route: null },
            { name: 'Methodology',   route: null },
            { name: 'System Status', route: null },
          ],
        },
        {
          title: 'Company',
          links: [
            { name: 'Pricing',       route: '/pricing' },
            { name: 'About Us',      route: '/about' },
            { name: 'News & Events', route: '/news-events' },
            { name: 'Contact',       route: '/contact' },
          ],
        },
      ],
    };
  },
};
</script>
