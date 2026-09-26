<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">

    <!-- Header -->
    <div class="mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Admin Dashboard</h1>
      <p class="text-xs text-gray-500 mt-0.5">System-wide overview — GYZ Psycho Platform</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
      <i class="fas fa-spinner animate-spin text-2xl"></i>
    </div>

    <div v-else>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div v-for="card in kpiCards" :key="card.label"
          class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', card.bg]">
            <i :class="[card.icon, card.color, 'text-base']"></i>
          </div>
          <div>
            <p class="text-xs text-gray-500">{{ card.label }}</p>
            <p class="text-xl font-bold text-gray-800">{{ card.value }}</p>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        <!-- Users vs Organizations bar -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Platform Growth Overview</h2>
          <apexchart type="bar" height="260" :options="growthOptions" :series="growthSeries" />
        </div>

        <!-- Donut: content breakdown -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Content Breakdown</h2>
          <apexchart type="donut" height="260" :options="donutOptions" :series="donutSeries" />
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        <!-- Score distribution -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Test Score Distribution</h2>
          <apexchart type="area" height="220" :options="scoreOptions" :series="scoreSeries" />
        </div>

        <!-- Recent results table -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Recent Test Results</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs divide-y divide-gray-100">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th class="px-3 py-2 text-left">Tester</th>
                  <th class="px-3 py-2 text-left">Test</th>
                  <th class="px-3 py-2 text-center">Score</th>
                  <th class="px-3 py-2 text-left">Interpretation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="r in stats.recentResults" :key="r.id" class="hover:bg-gray-50">
                  <td class="px-3 py-2">{{ r.User ? r.User.first_name + ' ' + r.User.last_name : '—' }}</td>
                  <td class="px-3 py-2">{{ r.Test ? r.Test.title : '—' }}</td>
                  <td class="px-3 py-2 text-center">
                    <span :class="scoreBadge(r.score)">{{ r.score ?? '—' }}</span>
                  </td>
                  <td class="px-3 py-2 text-gray-500 italic">{{ r.interpretation || '—' }}</td>
                </tr>
                <tr v-if="!stats.recentResults?.length">
                  <td colspan="4" class="px-3 py-4 text-center text-gray-400 italic">No results yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Users + Recent Progresses -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Recent Users -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Recently Registered Users</h2>
          <div class="space-y-3">
            <div v-for="u in stats.recentUsers" :key="u.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                {{ initials(u.first_name, u.last_name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-700 truncate">{{ u.first_name }} {{ u.last_name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
              </div>
              <span class="text-[10px] text-gray-400 flex-shrink-0">{{ formatDate(u.createdAt) }}</span>
            </div>
            <p v-if="!stats.recentUsers?.length" class="text-center text-gray-400 italic text-xs py-4">No users yet.</p>
          </div>
        </div>

        <!-- Recent Progresses -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Recent Test Activity</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs divide-y divide-gray-100">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th class="px-3 py-2 text-left">Tester</th>
                  <th class="px-3 py-2 text-left">Test</th>
                  <th class="px-3 py-2 text-center">Score</th>
                  <th class="px-3 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="p in stats.recentProgresses" :key="p.id" class="hover:bg-gray-50">
                  <td class="px-3 py-2">{{ p.User ? p.User.first_name + ' ' + p.User.last_name : '—' }}</td>
                  <td class="px-3 py-2">{{ p.Test ? p.Test.title : '—' }}</td>
                  <td class="px-3 py-2 text-center">
                    <span :class="scoreBadge(p.score)">{{ p.score ?? '—' }}</span>
                  </td>
                  <td class="px-3 py-2 text-gray-400">{{ formatDate(p.taken_at || p.createdAt) }}</td>
                </tr>
                <tr v-if="!stats.recentProgresses?.length">
                  <td colspan="4" class="px-3 py-4 text-center text-gray-400 italic">No activity yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";

export default {
  name: "SuperDashboard",
  components: { apexchart: VueApexCharts },

  data() {
    return {
      loading: true,
      stats: {},
    };
  },

  computed: {
    kpiCards() {
      const c = this.stats.counts || {};
      return [
        { label: "Total Users",         value: c.users         ?? 0, icon: "fas fa-users",        bg: "bg-blue-50",   color: "text-blue-500" },
        { label: "Organizations",        value: c.organizations ?? 0, icon: "fas fa-building",     bg: "bg-indigo-50", color: "text-indigo-500" },
        { label: "Tests",                value: c.tests         ?? 0, icon: "fas fa-file-alt",     bg: "bg-purple-50", color: "text-purple-500" },
        { label: "Completed Tests",      value: c.completedProgresses ?? 0, icon: "fas fa-check-circle", bg: "bg-emerald-50", color: "text-emerald-500" },
      ];
    },

    growthSeries() {
      const c = this.stats.counts || {};
      return [{
        name: "Count",
        data: [c.users ?? 0, c.organizations ?? 0, c.groups ?? 0, c.tests ?? 0, c.results ?? 0, c.progresses ?? 0],
      }];
    },

    growthOptions() {
      return {
        chart: { toolbar: { show: false }, fontFamily: "inherit" },
        xaxis: { categories: ["Users", "Orgs", "Groups", "Tests", "Results", "Progresses"] },
        colors: ["#22c55e"],
        dataLabels: { enabled: false },
        plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
        grid: { borderColor: "#f1f5f9" },
        tooltip: { theme: "light" },
      };
    },

    donutSeries() {
      const c = this.stats.counts || {};
      return [c.tests ?? 0, c.questions ?? 0, c.categories ?? 0, c.traits ?? 0];
    },

    donutOptions() {
      return {
        chart: { fontFamily: "inherit" },
        labels: ["Tests", "Questions", "Categories", "Traits"],
        colors: ["#6366f1", "#22c55e", "#f59e0b", "#14b8a6"],
        legend: { position: "bottom", fontSize: "11px" },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: "65%" } } },
      };
    },

    scoreSeries() {
      const scores = (this.stats.recentResults || []).map(r => r.score ?? 0);
      return [{ name: "Score", data: scores.length ? scores : [0] }];
    },

    scoreOptions() {
      const labels = (this.stats.recentResults || []).map((_, i) => `Result ${i + 1}`);
      return {
        chart: { toolbar: { show: false }, fontFamily: "inherit" },
        xaxis: { categories: labels.length ? labels : ["—"] },
        colors: ["#6366f1"],
        stroke: { curve: "smooth", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
        dataLabels: { enabled: false },
        grid: { borderColor: "#f1f5f9" },
        yaxis: { min: 0, max: 100 },
      };
    },
  },

  methods: {
    async fetchStats() {
      this.loading = true;
      try {
        const res = await this.$apiGet("/dashboard/stats");
        this.stats = res;
      } catch (e) {
        console.error("Dashboard stats error:", e);
      } finally {
        this.loading = false;
      }
    },

    scoreBadge(score) {
      if (score === null || score === undefined) return "px-2 py-0.5 rounded text-gray-400 bg-gray-100 text-[10px] font-medium";
      if (score >= 80) return "px-2 py-0.5 rounded text-green-700 bg-green-100 text-[10px] font-medium";
      if (score >= 60) return "px-2 py-0.5 rounded text-amber-700 bg-amber-100 text-[10px] font-medium";
      return "px-2 py-0.5 rounded text-red-700 bg-red-100 text-[10px] font-medium";
    },

    initials(first, last) {
      return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
    },

    formatDate(date) {
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },
  },

  mounted() {
    this.fetchStats();
  },
};
</script>
