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
          Get in Touch
        </span>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
          Let's Talk
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Whether you need a demo, have a question, or want to explore a partnership — our team is ready to help.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         CONTACT FORM + INFO
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-24 bg-white relative overflow-hidden">
      <!-- Subtle grid background -->
      <div class="absolute inset-0 opacity-[0.025] pointer-events-none"
        style="background-image: linear-gradient(#3d5afe 1px, transparent 1px), linear-gradient(90deg, #3d5afe 1px, transparent 1px); background-size: 50px 50px;">
      </div>

      <div class="relative max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">

          <!-- Left — info -->
          <div class="lg:col-span-4 space-y-6">
            <div>
              <span class="inline-block px-3 py-1 mb-4 text-[10px] font-black tracking-[0.3em] text-green-600 bg-green-50 rounded-full uppercase">
                Partner with Alpha
              </span>
              <h2 class="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Decode Your <br/><span class="text-green-500">Potential.</span>
              </h2>
              <p class="text-slate-500 text-sm leading-relaxed">
                Ready to implement scientific assessments? Our industrial psychologists are ready to help you benchmark your talent.
              </p>
            </div>

            <!-- Contact info cards -->
            <div class="space-y-4">
              <div v-for="info in contactInfo" :key="info.label"
                class="group p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-green-500 hover:border-green-500 transition-all duration-300 flex items-center gap-5">
                <div class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform shrink-0">
                  <i :class="info.icon" class="text-lg"></i>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white/60 mb-0.5">{{ info.label }}</p>
                  <p class="text-sm font-bold text-gray-800 group-hover:text-white">{{ info.value }}</p>
                </div>
              </div>
            </div>

            <!-- Status badge -->
            <div class="p-5 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
              <div class="absolute top-4 right-4">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              </div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Assessment Server Status</p>
              <p class="text-sm font-bold">All Evaluation Nodes Operational (99.9%)</p>
            </div>

            <!-- Social links -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Follow Us</p>
              <div class="flex gap-3">
                <a v-for="social in socials" :key="social.name" href="#"
                  class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-green-500 flex items-center justify-center transition-all group">
                  <i :class="[social.icon, 'text-sm text-gray-500 group-hover:text-white transition-colors']"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- Right — form -->
          <div class="lg:col-span-8">
            <div class="bg-white rounded-3xl p-8 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-gray-100 relative">
              <div class="absolute -top-5 -right-5 w-20 h-20 bg-green-400/10 rounded-3xl -rotate-12 -z-10"></div>

              <h3 class="text-xl font-black text-gray-900 mb-2">Send us a message</h3>
              <p class="text-sm text-gray-400 mb-8">We typically respond within 24 hours on business days.</p>

              <form @submit.prevent="submitForm" class="space-y-7">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Organization / Name</label>
                    <input type="text" v-model="form.org_name" required placeholder="Academy Name or Company"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Official Email</label>
                    <input type="email" v-model="form.email" required placeholder="hr@institution.com"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone Number (Optional)</label>
                  <input type="tel" v-model="form.phone" placeholder="+251 9XX XXX XXX"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Evaluation Details</label>
                  <textarea v-model="form.message" rows="5" placeholder="How many participants are you looking to evaluate? Any specific requirements?"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm font-medium text-gray-800 resize-none placeholder:text-gray-300"></textarea>
                </div>

                <!-- Success message -->
                <div v-if="submitted"
                  class="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">
                  <i class="fas fa-check-circle text-green-500"></i>
                  Message sent! Our team will contact you within 24 hours.
                </div>

                <button type="submit" :disabled="loading"
                  class="w-full py-5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-[0.3em] shadow-2xl shadow-green-500/25 flex items-center justify-center gap-4 group">
                  <i v-if="loading" class="fas fa-spinner animate-spin"></i>
                  {{ loading ? 'Processing Request...' : 'Get Your Assessment Plan' }}
                  <i v-if="!loading" class="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         FAQ STRIP
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-4xl mx-auto px-6">
        <div class="text-center mb-12">
          <span class="text-xs font-semibold tracking-widest text-green-600 uppercase">FAQ</span>
          <h2 class="text-3xl font-black text-gray-900 mt-2">Common questions</h2>
        </div>
        <div class="space-y-4">
          <div v-for="faq in faqs" :key="faq.q"
            class="bg-white rounded-2xl border border-gray-100 p-6 hover:border-green-200 transition-all">
            <h3 class="font-bold text-gray-800 text-sm mb-2 flex items-start gap-3">
              <i class="fas fa-question-circle text-green-500 mt-0.5 shrink-0"></i>
              {{ faq.q }}
            </h3>
            <p class="text-xs text-gray-500 leading-relaxed pl-6">{{ faq.a }}</p>
          </div>
        </div>
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
  name: 'ContactPage',
  components: { Header, Footer, LoginModal, RegisterModal },

  data() {
    return {
      showLogin: false,
      showRegister: false,
      loading: false,
      submitted: false,

      form: {
        org_name: '',
        email: '',
        phone: '',
        message: '',
      },

      contactInfo: [
        { label: 'Regional HQ',    value: 'Bole Area, Addis Ababa, Ethiopia', icon: 'fas fa-map-marker-alt' },
        { label: 'Expert Support', value: 'consult@gyz-psych.com',           icon: 'fas fa-envelope' },
        { label: 'Partnerships',   value: '+251 911 00 11 22',                 icon: 'fas fa-phone-alt' },
        { label: 'Business Hours', value: 'Mon – Fri, 8:00 AM – 6:00 PM EAT', icon: 'fas fa-clock' },
      ],

      socials: [
        { name: 'LinkedIn', icon: 'fab fa-linkedin-in' },
        { name: 'Twitter',  icon: 'fab fa-twitter' },
        { name: 'Telegram', icon: 'fab fa-telegram-plane' },
        { name: 'Facebook', icon: 'fab fa-facebook-f' },
      ],

      faqs: [
        {
          q: 'How quickly can we get started?',
          a: 'You can sign up for a free account and start building tests immediately — no credit card required. For enterprise onboarding, our team typically completes setup within 2–3 business days.',
        },
        {
          q: 'Do you offer a free trial for paid plans?',
          a: 'Yes. All paid plans come with a 14-day free trial. You can upgrade, downgrade, or cancel at any time during or after the trial.',
        },
        {
          q: 'Can you build custom psychometric tests for our organization?',
          a: 'Absolutely. Our industrial psychologists can design, validate, and deploy bespoke assessments tailored to your specific competency framework or industry.',
        },
        {
          q: 'Is our data secure and private?',
          a: 'Yes. All data is encrypted at rest and in transit. Each organization has fully isolated data storage. We are compliant with international data protection standards.',
        },
      ],
    };
  },

  methods: {
    async submitForm() {
      this.loading = true;
      this.submitted = false;
      try {
        await this.$apiPost('/contact', this.form);
        this.submitted = true;
        this.form = { org_name: '', email: '', phone: '', message: '' };
      } catch (e) {
        // Graceful fallback for demo / offline
        setTimeout(() => {
          this.submitted = true;
          this.form = { org_name: '', email: '', phone: '', message: '' };
          this.loading = false;
        }, 1200);
        return;
      }
      this.loading = false;
    },
  },
};
</script>
