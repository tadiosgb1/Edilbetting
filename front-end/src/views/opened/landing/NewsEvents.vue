<template>
  <div class="min-h-screen bg-white font-sans text-gray-800">
    <Header @open-login="showLogin = true" @open-register="showRegister = true" />

    <!-- ═══════════════════════════════════════════════════════════════
         HERO
    ═══════════════════════════════════════════════════════════════ -->
    <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden py-24 lg:py-32">
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div class="absolute top-10 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>
      <div class="relative max-w-7xl mx-auto px-6 text-center">
        <span class="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-green-400 bg-green-400/10 rounded-full uppercase border border-green-400/20">
          News &amp; Events
        </span>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
          Stay Ahead of the Curve
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Platform updates, research insights, upcoming webinars, and partnership announcements from the GYZ Psycho team.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         FILTER TABS
    ═══════════════════════════════════════════════════════════════ -->
    <section class="bg-white border-b border-gray-100 sticky top-[60px] z-40">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0"
          :class="activeTab === tab
            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
        >
          {{ tab }}
        </button>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         FEATURED POST
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="bg-slate-900 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 group hover:shadow-2xl transition-all">
          <!-- Visual side -->
          <div class="relative h-64 lg:h-auto bg-gradient-to-br from-green-600 to-indigo-700 flex items-center justify-center overflow-hidden">
            <div class="absolute inset-0 opacity-20"
              style="background-image: radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%);">
            </div>
            <i class="fas fa-rocket text-white text-7xl relative z-10 group-hover:scale-110 transition-transform duration-500"></i>
            <span class="absolute top-6 left-6 px-4 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              Featured · Platform Update
            </span>
          </div>
          <!-- Content side -->
          <div class="p-10 lg:p-14 flex flex-col justify-center">
            <p class="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">April 28, 2026</p>
            <h2 class="text-2xl lg:text-3xl font-black text-white leading-tight mb-4 group-hover:text-green-400 transition-colors">
              GYZ Psycho v2.0 — Real-time Analytics &amp; New Trait Engine
            </h2>
            <p class="text-white/60 text-sm leading-relaxed mb-8">
              Our biggest release yet brings live dashboards, an upgraded Big Five scoring engine, a redesigned report builder, and multi-language support for Amharic and Tigrigna. This update reflects months of feedback from our partner organizations across East Africa.
            </p>
            <div class="flex flex-wrap gap-3 mb-8">
              <span v-for="tag in ['Analytics', 'Big Five', 'Multi-language', 'Reports']" :key="tag"
                class="px-3 py-1 bg-white/10 text-white/60 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                {{ tag }}
              </span>
            </div>
            <a href="#"
              class="inline-flex items-center gap-3 px-7 py-3.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-all text-sm w-fit shadow-lg shadow-green-500/20">
              Read Full Article
              <i class="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         ALL POSTS GRID
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <article
            v-for="post in filteredPosts"
            :key="post.title"
            class="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all group flex flex-col overflow-hidden"
          >
            <!-- Card visual -->
            <div class="h-44 flex items-center justify-center relative overflow-hidden" :class="post.bgGradient">
              <i :class="[post.icon, 'text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300', post.iconColor]"></i>
              <span class="absolute top-4 left-4 px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest"
                :class="post.badgeClass">
                {{ post.tag }}
              </span>
            </div>
            <!-- Card body -->
            <div class="p-6 flex flex-col flex-1">
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">{{ post.date }}</p>
              <h3 class="font-black text-gray-800 text-base leading-snug mb-3 group-hover:text-green-600 transition-colors">
                {{ post.title }}
              </h3>
              <p class="text-xs text-gray-500 leading-relaxed flex-1">{{ post.excerpt }}</p>
              <div class="mt-5 flex items-center justify-between">
                <div class="flex gap-2">
                  <span v-for="kw in post.keywords" :key="kw"
                    class="px-2.5 py-1 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-lg uppercase tracking-wider">
                    {{ kw }}
                  </span>
                </div>
                <a href="#" class="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 text-xs font-bold transition-colors">
                  Read <i class="fas fa-arrow-right text-[10px]"></i>
                </a>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty state -->
        <div v-if="filteredPosts.length === 0" class="text-center py-24">
          <i class="fas fa-newspaper text-4xl text-gray-200 mb-4"></i>
          <p class="text-gray-400 font-semibold">No posts in this category yet.</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         UPCOMING EVENTS
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14">
          <span class="text-xs font-semibold tracking-widest text-green-600 uppercase">Upcoming Events</span>
          <h2 class="text-3xl font-black text-gray-900 mt-2">Join us live</h2>
          <p class="text-gray-500 mt-2 text-sm max-w-lg mx-auto">
            Webinars, workshops, and conferences where you can connect with our team and the broader psychometrics community.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="event in upcomingEvents" :key="event.title"
            class="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all p-6 flex flex-col gap-4">
            <!-- Date badge -->
            <div class="flex items-start justify-between">
              <div class="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0"
                :class="event.dateBg">
                <span class="text-[10px] font-black uppercase tracking-widest" :class="event.dateColor">{{ event.month }}</span>
                <span class="text-2xl font-black leading-none" :class="event.dateColor">{{ event.day }}</span>
              </div>
              <span class="px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest"
                :class="event.badgeClass">
                {{ event.type }}
              </span>
            </div>
            <div>
              <h3 class="font-black text-gray-800 text-sm leading-snug mb-2">{{ event.title }}</h3>
              <p class="text-xs text-gray-500 leading-relaxed">{{ event.desc }}</p>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <i class="fas fa-clock text-green-500"></i> {{ event.time }}
              <span class="mx-1">·</span>
              <i class="fas fa-globe text-green-500"></i> {{ event.format }}
            </div>
            <a href="#"
              class="mt-auto inline-flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-500 text-green-700 hover:text-white font-bold rounded-xl transition-all text-xs">
              Register Free
              <i class="fas fa-arrow-right text-[10px]"></i>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         NEWSLETTER CTA
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-slate-900">
      <div class="max-w-2xl mx-auto px-6 text-center">
        <i class="fas fa-envelope-open-text text-green-400 text-3xl mb-5"></i>
        <h2 class="text-3xl font-black text-white mb-3">Never miss an update</h2>
        <p class="text-slate-400 text-sm mb-8">
          Subscribe to our newsletter for platform news, research insights, and event invitations.
        </p>
        <form @submit.prevent="subscribeNewsletter" class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            v-model="newsletterEmail"
            required
            placeholder="your@email.com"
            class="flex-1 px-5 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-green-500/40 text-sm font-medium"
          />
          <button type="submit"
            class="px-7 py-3.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-all text-sm shrink-0">
            Subscribe
          </button>
        </form>
        <p class="text-white/20 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>

    <Footer />

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
  </div>
</template>

<script>
import Header from './header.vue';
import Footer from './footer.vue';
import LoginModal from '@/components/AuthModal.vue';
import RegisterModal from '@/components/RegisterModal.vue';

export default {
  name: 'NewsEventsPage',
  components: { Header, Footer, LoginModal, RegisterModal },

  data() {
    return {
      showLogin: false,
      showRegister: false,
      activeTab: 'All',
      newsletterEmail: '',

      tabs: ['All', 'Platform Update', 'Research', 'Webinar', 'Partnership', 'Feature'],

      posts: [
        {
          title: 'New: Multi-language Assessment Support (Amharic & Tigrigna)',
          excerpt: 'GYZ Psycho now supports assessments in Amharic and Tigrigna, expanding access to psychometric tools across East Africa.',
          date: 'April 10, 2026',
          tag: 'Feature',
          icon: 'fas fa-language',
          iconColor: 'text-amber-600',
          bgGradient: 'bg-gradient-to-br from-amber-50 to-orange-100',
          badgeClass: 'bg-amber-100 text-amber-700',
          keywords: ['i18n', 'Africa'],
        },
        {
          title: 'Webinar: Using Big Five Assessments for Talent Acquisition',
          excerpt: 'Join our industrial psychologists for a live walkthrough on integrating personality data into your hiring pipeline.',
          date: 'May 15, 2026',
          tag: 'Webinar',
          icon: 'fas fa-video',
          iconColor: 'text-indigo-600',
          bgGradient: 'bg-gradient-to-br from-indigo-50 to-blue-100',
          badgeClass: 'bg-indigo-100 text-indigo-700',
          keywords: ['Big Five', 'HR'],
        },
        {
          title: 'GYZ Psycho Partners with 3 Leading Universities in Ethiopia',
          excerpt: 'We are proud to announce partnerships with Addis Ababa University, Jimma University, and Hawassa University for student aptitude programs.',
          date: 'March 22, 2026',
          tag: 'Partnership',
          icon: 'fas fa-university',
          iconColor: 'text-teal-600',
          bgGradient: 'bg-gradient-to-br from-teal-50 to-green-100',
          badgeClass: 'bg-teal-100 text-teal-700',
          keywords: ['Education', 'Ethiopia'],
        },
        {
          title: 'Research: Psychometric Testing Improves Retention by 34%',
          excerpt: 'Our latest white paper reveals how organizations using structured assessments see significantly lower employee turnover rates.',
          date: 'February 5, 2026',
          tag: 'Research',
          icon: 'fas fa-flask',
          iconColor: 'text-rose-600',
          bgGradient: 'bg-gradient-to-br from-rose-50 to-pink-100',
          badgeClass: 'bg-rose-100 text-rose-700',
          keywords: ['Retention', 'Data'],
        },
        {
          title: 'Platform Update: Bulk Test Assignment & CSV Import',
          excerpt: 'HR teams can now assign tests to hundreds of users at once using our new CSV import tool — saving hours of manual work.',
          date: 'January 18, 2026',
          tag: 'Platform Update',
          icon: 'fas fa-file-csv',
          iconColor: 'text-green-600',
          bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100',
          badgeClass: 'bg-green-100 text-green-700',
          keywords: ['Bulk', 'CSV'],
        },
        {
          title: 'Introducing Custom Branding for Enterprise Clients',
          excerpt: 'Enterprise plan subscribers can now white-label the assessment portal with their own logo, colors, and domain.',
          date: 'December 10, 2025',
          tag: 'Feature',
          icon: 'fas fa-paint-brush',
          iconColor: 'text-purple-600',
          bgGradient: 'bg-gradient-to-br from-purple-50 to-violet-100',
          badgeClass: 'bg-purple-100 text-purple-700',
          keywords: ['Enterprise', 'Branding'],
        },
      ],

      upcomingEvents: [
        {
          title: 'Webinar: Big Five in Talent Acquisition',
          desc: 'A live session with our industrial psychologists on using personality data in hiring decisions.',
          month: 'May',
          day: '15',
          time: '3:00 PM EAT',
          format: 'Online',
          type: 'Webinar',
          dateBg: 'bg-indigo-50',
          dateColor: 'text-indigo-600',
          badgeClass: 'bg-indigo-100 text-indigo-700',
        },
        {
          title: 'Workshop: Building Custom Psychometric Tests',
          desc: 'Hands-on workshop for HR professionals on designing and validating custom assessments on the GYZ Psycho platform.',
          month: 'Jun',
          day: '3',
          time: '10:00 AM EAT',
          format: 'Hybrid',
          type: 'Workshop',
          dateBg: 'bg-green-50',
          dateColor: 'text-green-600',
          badgeClass: 'bg-green-100 text-green-700',
        },
        {
          title: 'East Africa HR Summit 2026',
          desc: 'GYZ Psycho will be exhibiting at the annual East Africa HR Summit. Visit our booth for live demos and exclusive offers.',
          month: 'Jul',
          day: '20',
          time: 'All Day',
          format: 'In-person · Addis Ababa',
          type: 'Conference',
          dateBg: 'bg-amber-50',
          dateColor: 'text-amber-600',
          badgeClass: 'bg-amber-100 text-amber-700',
        },
      ],
    };
  },

  computed: {
    filteredPosts() {
      if (this.activeTab === 'All') return this.posts;
      return this.posts.filter(p => p.tag === this.activeTab);
    },
  },

  methods: {
    subscribeNewsletter() {
      alert(`Thanks! You've subscribed with ${this.newsletterEmail}. Welcome aboard.`);
      this.newsletterEmail = '';
    },
  },
};
</script>
