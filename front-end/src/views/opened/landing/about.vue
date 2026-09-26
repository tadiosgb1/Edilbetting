<template>
  <div class="min-h-screen bg-white font-sans text-gray-800">
    <Header @open-login="showLogin = true" @open-register="showRegister = true" />

    <!-- ═══════════════════════════════════════════════════════════════
         HERO
    ═══════════════════════════════════════════════════════════════ -->
    <section class="bg-slate-900 py-24 relative overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>
      <div class="relative max-w-4xl mx-auto px-6 text-center">
        <span class="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-green-400 bg-green-400/10 rounded-full uppercase border border-green-400/20">
          About GYZ Psycho
        </span>
        <h1 class="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
          The Science Behind<br/>
          <span class="text-green-400">Human Understanding</span>
        </h1>
        <p class="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
          We build psychometric tools grounded in decades of behavioral science research — helping organizations make better decisions about their most important asset: people.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         MISSION
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <span class="text-xs font-semibold tracking-widest text-green-600 uppercase">Our Mission</span>
          <h2 class="text-3xl font-black text-gray-900 mt-2 mb-6">
            Making psychometrics accessible to every organization
          </h2>
          <p class="text-gray-500 leading-relaxed mb-4">
            Psychometrics — the science of measuring psychological attributes — has long been confined to expensive consultancies and academic institutions. GYZ Psycho changes that.
          </p>
          <p class="text-gray-500 leading-relaxed mb-4">
            We provide a SaaS platform that gives HR teams, educators, and researchers access to the same validated assessment frameworks used by Fortune 500 companies, at a fraction of the cost.
          </p>
          <p class="text-gray-500 leading-relaxed">
            Our assessments are built on established frameworks including the <strong class="text-gray-700">Myers-Briggs Type Indicator (MBTI)</strong>, <strong class="text-gray-700">Big Five (OCEAN)</strong>, and <strong class="text-gray-700">Holland's RIASEC</strong> model — all adapted for modern digital delivery.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div v-for="stat in missionStats" :key="stat.label"
            class="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <p class="text-3xl font-black mb-1" :class="stat.color">{{ stat.value }}</p>
            <p class="text-xs text-gray-500 font-medium">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         WHAT IS PSYCHOMETRICS
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-14">
          <span class="text-xs font-semibold tracking-widest text-green-600 uppercase">The Science</span>
          <h2 class="text-3xl font-black text-gray-900 mt-2">What is Psychometrics?</h2>
          <p class="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
            Psychometrics is the field of study concerned with the theory and technique of psychological measurement. It encompasses the design, administration, and interpretation of quantitative tests for the measurement of psychological variables such as intelligence, aptitude, and personality traits.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="concept in concepts" :key="concept.title"
            class="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4" :class="concept.bg">
              <i :class="[concept.icon, concept.color]"></i>
            </div>
            <h3 class="font-bold text-gray-800 mb-2">{{ concept.title }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">{{ concept.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         FRAMEWORKS WE SUPPORT
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-14">
          <span class="text-xs font-semibold tracking-widest text-green-600 uppercase">Assessment Frameworks</span>
          <h2 class="text-3xl font-black text-gray-900 mt-2">Built on validated science</h2>
          <p class="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
            Every assessment on GYZ Psycho is grounded in peer-reviewed psychological research.
          </p>
        </div>

        <div class="space-y-4">
          <div v-for="fw in frameworks" :key="fw.name"
            class="flex items-start gap-5 p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
              :class="fw.bg + ' ' + fw.color">
              {{ fw.abbr }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <h3 class="font-bold text-gray-800">{{ fw.name }}</h3>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" :class="fw.tagBg + ' ' + fw.tagColor">
                  {{ fw.tag }}
                </span>
              </div>
              <p class="text-sm text-gray-500 leading-relaxed">{{ fw.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         USE CASES
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-14">
          <span class="text-xs font-semibold tracking-widest text-green-600 uppercase">Who We Serve</span>
          <h2 class="text-3xl font-black text-gray-900 mt-2">Built for every context</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="uc in useCases" :key="uc.title"
            class="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-md transition-all">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" :class="uc.bg">
              <i :class="[uc.icon, uc.color, 'text-lg']"></i>
            </div>
            <h3 class="font-bold text-gray-800 mb-2">{{ uc.title }}</h3>
            <p class="text-xs text-gray-500 leading-relaxed">{{ uc.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         VALUES
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-slate-900">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-14">
          <span class="text-xs font-semibold tracking-widest text-green-400 uppercase">Our Values</span>
          <h2 class="text-3xl font-black text-white mt-2">What we stand for</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="val in values" :key="val.title"
            class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <i :class="[val.icon, 'text-green-400 text-xl mb-4 block']"></i>
            <h3 class="font-bold text-white mb-2">{{ val.title }}</h3>
            <p class="text-sm text-white/50 leading-relaxed">{{ val.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         CTA
    ═══════════════════════════════════════════════════════════════ -->
    <section class="py-20 bg-white">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <h2 class="text-3xl font-black text-gray-900 mb-4">Ready to understand your people better?</h2>
        <p class="text-gray-500 mb-8 text-sm">Start with a free account. No credit card required.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="showRegister = true"
            class="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-green-500/20">
            Get Started Free
          </button>
          <router-link to="/pricing"
            class="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm">
            View Pricing
          </router-link>
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
  name: 'AboutPage',
  components: { Header, Footer, LoginModal, RegisterModal },

  data() {
    return {
      showLogin: false,
      showRegister: false,

      missionStats: [
        { value: '500+',  label: 'Organizations',       color: 'text-green-600' },
        { value: '50K+',  label: 'Assessments Taken',   color: 'text-blue-600' },
        { value: '12+',   label: 'Validated Frameworks', color: 'text-purple-600' },
        { value: '99.9%', label: 'Platform Uptime',     color: 'text-amber-600' },
      ],

      concepts: [
        {
          title: 'Reliability',
          desc: 'A reliable test produces consistent results across different administrations. We use Cronbach\'s alpha and test-retest reliability coefficients to validate every instrument on our platform.',
          icon: 'fas fa-redo', bg: 'bg-green-50', color: 'text-green-600',
        },
        {
          title: 'Validity',
          desc: 'Validity ensures a test measures what it claims to measure. Our assessments undergo construct validity, content validity, and criterion-related validity checks before deployment.',
          icon: 'fas fa-check-double', bg: 'bg-blue-50', color: 'text-blue-600',
        },
        {
          title: 'Standardization',
          desc: 'Standardized tests are administered and scored in a consistent manner. GYZ Psycho enforces uniform conditions and uses norm-referenced scoring to enable meaningful comparisons.',
          icon: 'fas fa-balance-scale', bg: 'bg-purple-50', color: 'text-purple-600',
        },
        {
          title: 'Norm Referencing',
          desc: 'Results are interpreted relative to a normative population. Our platform maintains continuously updated norm tables segmented by industry, age group, and educational background.',
          icon: 'fas fa-chart-bell', bg: 'bg-amber-50', color: 'text-amber-600',
        },
        {
          title: 'Trait Theory',
          desc: 'Rooted in the Five-Factor Model and other trait-based frameworks, our assessments measure stable personality dimensions that predict behavior across contexts.',
          icon: 'fas fa-dna', bg: 'bg-rose-50', color: 'text-rose-600',
        },
        {
          title: 'Ethical Use',
          desc: 'Psychometric data is sensitive. We enforce strict data governance, informed consent protocols, and prohibit discriminatory use of assessment results.',
          icon: 'fas fa-shield-alt', bg: 'bg-teal-50', color: 'text-teal-600',
        },
      ],

      frameworks: [
        {
          abbr: 'MBTI', name: 'Myers-Briggs Type Indicator',
          tag: 'Personality', tagBg: 'bg-purple-50', tagColor: 'text-purple-700',
          bg: 'bg-purple-50', color: 'text-purple-700',
          desc: 'Based on Carl Jung\'s theory of psychological types, MBTI categorizes individuals into 16 personality types across four dichotomies: Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, and Judging/Perceiving.',
        },
        {
          abbr: 'OCEAN', name: 'Big Five Personality Traits',
          tag: 'Personality', tagBg: 'bg-blue-50', tagColor: 'text-blue-700',
          bg: 'bg-blue-50', color: 'text-blue-700',
          desc: 'The most empirically validated personality model in psychology. Measures Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism — dimensions that predict job performance, academic success, and life outcomes.',
        },
        {
          abbr: 'RIASEC', name: 'Holland\'s Career Interest Model',
          tag: 'Career', tagBg: 'bg-green-50', tagColor: 'text-green-700',
          bg: 'bg-green-50', color: 'text-green-700',
          desc: 'John Holland\'s theory classifies people and work environments into six types: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional. Used globally for career counseling and job matching.',
        },
        {
          abbr: 'EQ', name: 'Emotional Intelligence Assessment',
          tag: 'Emotional', tagBg: 'bg-amber-50', tagColor: 'text-amber-700',
          bg: 'bg-amber-50', color: 'text-amber-700',
          desc: 'Based on the Mayer-Salovey-Caruso model, this assessment measures the ability to perceive, use, understand, and manage emotions — a key predictor of leadership effectiveness and interpersonal success.',
        },
        {
          abbr: 'IQ', name: 'Cognitive Ability Testing',
          tag: 'Aptitude', tagBg: 'bg-indigo-50', tagColor: 'text-indigo-700',
          bg: 'bg-indigo-50', color: 'text-indigo-700',
          desc: 'Measures general mental ability including verbal reasoning, numerical reasoning, abstract thinking, and processing speed. Strong predictor of training success and job performance across all occupational levels.',
        },
      ],

      useCases: [
        {
          title: 'Corporate HR',
          desc: 'Pre-employment screening, leadership development, team composition analysis, and succession planning.',
          icon: 'fas fa-briefcase', bg: 'bg-blue-50', color: 'text-blue-600',
        },
        {
          title: 'Education',
          desc: 'Student aptitude assessment, learning style identification, career guidance, and academic placement.',
          icon: 'fas fa-graduation-cap', bg: 'bg-green-50', color: 'text-green-600',
        },
        {
          title: 'Clinical & Research',
          desc: 'Psychological screening, research data collection, longitudinal studies, and clinical intake assessments.',
          icon: 'fas fa-flask', bg: 'bg-purple-50', color: 'text-purple-600',
        },
        {
          title: 'Individual Growth',
          desc: 'Self-awareness, personal development planning, career exploration, and relationship compatibility.',
          icon: 'fas fa-user-circle', bg: 'bg-amber-50', color: 'text-amber-600',
        },
      ],

      values: [
        {
          title: 'Scientific Integrity',
          desc: 'Every assessment is grounded in peer-reviewed research. We never deploy instruments that lack empirical validation.',
          icon: 'fas fa-microscope',
        },
        {
          title: 'Accessibility',
          desc: 'World-class psychometric tools should not be limited to large enterprises. We make them available to organizations of all sizes.',
          icon: 'fas fa-globe',
        },
        {
          title: 'Privacy First',
          desc: 'Psychological data is among the most sensitive. We enforce strict data minimization, encryption, and user consent at every step.',
          icon: 'fas fa-lock',
        },
        {
          title: 'Fairness & Bias Reduction',
          desc: 'We actively audit our assessments for cultural, gender, and socioeconomic bias, and publish our methodology openly.',
          icon: 'fas fa-balance-scale',
        },
        {
          title: 'Actionable Insights',
          desc: 'Raw scores mean nothing without context. Our platform translates results into clear, actionable recommendations.',
          icon: 'fas fa-lightbulb',
        },
        {
          title: 'Continuous Improvement',
          desc: 'Psychometric science evolves. We continuously update our norm tables, scoring algorithms, and frameworks as new research emerges.',
          icon: 'fas fa-sync-alt',
        },
      ],
    };
  },
};
</script>
