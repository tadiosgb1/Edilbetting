<template>
  <div class="min-h-screen bg-white font-sans text-gray-800">
    <Header @open-login="showLogin = true" @open-register="showRegister = true" />

    <!-- Hero -->
    <section class="bg-slate-900 py-20 text-center">
      <div class="max-w-3xl mx-auto px-6">
        <span class="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest text-green-400 bg-green-400/10 rounded-full uppercase border border-green-400/20">
          Transparent Pricing
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-white mb-4">
          Plans for every organization
        </h1>
        <p class="text-slate-400 text-base leading-relaxed">
          Start free and scale as your team grows. No hidden fees, no surprises.
        </p>
      </div>
    </section>

    <!-- Billing toggle -->
    <div class="flex justify-center py-8 bg-gray-50 border-b border-gray-100">
      <div class="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        <button
          @click="billingCycle = 'monthly'"
          class="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
          :class="billingCycle === 'monthly' ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'"
        >
          Monthly
        </button>
        <button
          @click="billingCycle = 'yearly'"
          class="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          :class="billingCycle === 'yearly' ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'"
        >
          Yearly
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Save 20%</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-24">
      <i class="fas fa-spinner animate-spin text-3xl text-green-500"></i>
    </div>

    <!-- Plans Grid -->
    <section v-else class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="relative bg-white rounded-2xl border-2 p-7 flex flex-col transition-all hover:shadow-xl"
            :class="plan.slug === 'professional' || plan.slug === 'professional_yearly'
              ? 'border-green-500 shadow-lg shadow-green-500/10'
              : 'border-gray-100'"
          >
            <!-- Popular badge -->
            <div
              v-if="plan.slug === 'professional' || plan.slug === 'professional_yearly'"
              class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide whitespace-nowrap"
            >
              Most Popular
            </div>

            <!-- Plan name + description -->
            <div class="mb-5">
              <h3 class="text-lg font-black text-gray-900">{{ plan.name }}</h3>
              <p class="text-xs text-gray-400 mt-1.5 leading-relaxed">{{ plan.description }}</p>
            </div>

            <!-- Price -->
            <div class="mb-6 pb-6 border-b border-gray-100">
              <div v-if="plan.price_cents === 0">
                <span class="text-4xl font-black text-gray-900">Free</span>
                <p class="text-xs text-gray-400 mt-1">Forever</p>
              </div>
              <div v-else>
                <span class="text-4xl font-black text-gray-900">
                  ${{ (plan.price_cents / 100).toFixed(0) }}
                </span>
                <span class="text-sm text-gray-400 ml-1">/ {{ plan.billing_cycle }}</span>
                <p v-if="plan.billing_cycle === 'yearly'" class="text-xs text-green-600 font-medium mt-1">
                  ${{ ((plan.price_cents / 100) / 12).toFixed(0) }}/mo billed annually
                </p>
              </div>
            </div>

            <!-- Limits -->
            <div class="mb-5">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Included</p>
              <ul class="space-y-2.5 text-sm text-gray-600">
                <li class="flex items-center gap-2.5">
                  <i class="fas fa-users text-green-500 w-4 text-center text-xs"></i>
                  {{ plan.max_users === -1 ? 'Unlimited users' : plan.max_users + ' users' }}
                </li>
                <li class="flex items-center gap-2.5">
                  <i class="fas fa-file-alt text-green-500 w-4 text-center text-xs"></i>
                  {{ plan.max_tests === -1 ? 'Unlimited tests' : plan.max_tests + ' tests' }}
                </li>
                <li class="flex items-center gap-2.5">
                  <i class="fas fa-layer-group text-green-500 w-4 text-center text-xs"></i>
                  {{ plan.max_groups === -1 ? 'Unlimited groups' : plan.max_groups + ' groups' }}
                </li>
                <li class="flex items-center gap-2.5">
                  <i class="fas fa-clipboard-check text-green-500 w-4 text-center text-xs"></i>
                  {{ plan.max_test_assignments === -1 ? 'Unlimited assignments' : plan.max_test_assignments + ' assignments' }}
                </li>
              </ul>
            </div>

            <!-- Feature flags -->
            <div class="mb-6 flex-1">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Features</p>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2.5" :class="plan.has_analytics ? 'text-gray-700' : 'text-gray-300'">
                  <i :class="['fas w-4 text-center text-xs', plan.has_analytics ? 'fa-check text-green-500' : 'fa-times text-gray-200']"></i>
                  Analytics
                </li>
                <li class="flex items-center gap-2.5" :class="plan.has_export ? 'text-gray-700' : 'text-gray-300'">
                  <i :class="['fas w-4 text-center text-xs', plan.has_export ? 'fa-check text-green-500' : 'fa-times text-gray-200']"></i>
                  Export Reports
                </li>
                <li class="flex items-center gap-2.5" :class="plan.has_api_access ? 'text-gray-700' : 'text-gray-300'">
                  <i :class="['fas w-4 text-center text-xs', plan.has_api_access ? 'fa-check text-green-500' : 'fa-times text-gray-200']"></i>
                  API Access
                </li>
                <li class="flex items-center gap-2.5" :class="plan.has_custom_branding ? 'text-gray-700' : 'text-gray-300'">
                  <i :class="['fas w-4 text-center text-xs', plan.has_custom_branding ? 'fa-check text-green-500' : 'fa-times text-gray-200']"></i>
                  Custom Branding
                </li>
                <li class="flex items-center gap-2.5" :class="plan.has_priority_support ? 'text-gray-700' : 'text-gray-300'">
                  <i :class="['fas w-4 text-center text-xs', plan.has_priority_support ? 'fa-check text-green-500' : 'fa-times text-gray-200']"></i>
                  Priority Support
                </li>
              </ul>
            </div>

            <!-- CTA -->
            <button
              @click="selectPlan(plan)"
              class="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all"
              :class="plan.slug === 'professional' || plan.slug === 'professional_yearly'
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'"
            >
              {{ plan.price_cents === 0 ? 'Get Started Free' : 'Start ' + plan.name }}
            </button>
          </div>
        </div>

        <!-- Enterprise CTA -->
        <div class="bg-slate-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 class="text-xl font-black text-white mb-2">Need a custom Enterprise plan?</h3>
            <p class="text-slate-400 text-sm">Unlimited everything, dedicated support, custom integrations, and SLA guarantees.</p>
          </div>
          <button @click="$router.push('/contact')"
            class="flex-shrink-0 px-8 py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all text-sm whitespace-nowrap">
            Contact Sales
          </button>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-20 bg-white">
      <div class="max-w-3xl mx-auto px-6">
        <h2 class="text-2xl font-black text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div v-for="faq in faqs" :key="faq.q" class="border border-gray-100 rounded-xl overflow-hidden">
            <button
              @click="faq.open = !faq.open"
              class="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              {{ faq.q }}
              <i class="fas text-gray-400 text-xs transition-transform"
                :class="faq.open ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>
            <div v-if="faq.open" class="px-6 pb-4 text-sm text-gray-500 leading-relaxed">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <Footer />

    <!-- Auth Modals -->
    <login-modal
      v-if="showLogin"
      @close="showLogin = false"
      @switch-to-register="showLogin = false; showRegister = true"
    />
    <register-modal
      v-if="showRegister"
      :pre-selected-plan="pendingPlan"
      @close="showRegister = false; pendingPlan = null"
      @switch-to-login="showRegister = false; showLogin = true; pendingPlan = null"
    />
  </div>
</template>

<script>
import Header from './header.vue';
import Footer from './footer.vue';
import LoginModal from '@/components/AuthModal.vue';
import RegisterModal from '@/components/RegisterModal.vue';

export default {
  name: 'PricingPage',
  components: { Header, Footer, LoginModal, RegisterModal },

  data() {
    return {
      plans: [],
      loading: false,
      billingCycle: 'monthly',
      showLogin: false,
      showRegister: false,
      pendingPlan: null,

      faqs: [
        { q: 'Can I change my plan later?',           a: 'Yes. You can upgrade or downgrade at any time. Changes take effect at the start of the next billing period.', open: false },
        { q: 'Is there a free trial?',                a: 'The Free plan is free forever with no credit card required. Paid plans include a 14-day trial.', open: false },
        { q: 'What happens when I exceed my limits?', a: 'You will be notified and prompted to upgrade. No data is lost — you just cannot create new items until you upgrade.', open: false },
        { q: 'Can I cancel anytime?',                 a: 'Yes. Cancel anytime from your dashboard. You keep access until the end of your billing period.', open: false },
        { q: 'Do you offer discounts for NGOs?',      a: 'Yes. Contact us for special pricing for non-profits, educational institutions, and research organizations.', open: false },
      ],
    };
  },

  computed: {
    filteredPlans() {
      if (this.billingCycle === 'yearly') {
        // Show yearly variants where available, otherwise show monthly
        return this.plans.filter(p =>
          p.billing_cycle === 'yearly' ||
          (p.billing_cycle === 'monthly' && !this.plans.find(y => y.slug === p.slug + '_yearly'))
        );
      }
      // Monthly: exclude yearly variants
      return this.plans.filter(p => p.billing_cycle !== 'yearly');
    },
  },

  methods: {
    selectPlan(plan) {
      // Open the register modal with this plan pre-selected
      this.pendingPlan = plan;
      this.showRegister = true;
    },

    async fetchPlans() {
      this.loading = true;
      try {
        const res = await this.$apiGet('/plans');
        this.plans = res.data || [];
      } catch (e) {
        console.error('Fetch plans error:', e);
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.fetchPlans();
  },
};
</script>
