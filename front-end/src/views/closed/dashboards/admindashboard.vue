<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">

    <!-- Header -->
    <div class="mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Organization Dashboard</h1>
      <p class="text-xs text-gray-500 mt-0.5">Overview of your organization's assessment activity</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
      <i class="fas fa-spinner animate-spin text-2xl"></i>
    </div>

    <div v-else>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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

        <!-- Test participation over time -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Test Participation Activity</h2>
          <apexchart type="area" height="250" :options="participationOptions" :series="participationSeries" />
        </div>

        <!-- Score breakdown donut -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Score Breakdown</h2>
          <apexchart type="donut" height="250" :options="scoreDonutOptions" :series="scoreDonutSeries" />
        </div>
      </div>

      <!-- Recent Results Table -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Recent Assessment Results</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs divide-y divide-gray-100">
            <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <th class="px-4 py-2 text-left">#</th>
                <th class="px-4 py-2 text-left">Tester</th>
                <th class="px-4 py-2 text-left">Test</th>
                <th class="px-4 py-2 text-center">Score</th>
                <th class="px-4 py-2 text-left">Interpretation</th>
                <th class="px-4 py-2 text-left">Recommendations</th>
                <th class="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(r, i) in stats.recentResults" :key="r.id" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-400">{{ i + 1 }}</td>
                <td class="px-4 py-2 font-medium">{{ r.User ? r.User.first_name + ' ' + r.User.last_name : '—' }}</td>
                <td class="px-4 py-2">{{ r.Test ? r.Test.title : '—' }}</td>
                <td class="px-4 py-2 text-center">
                  <span :class="scoreBadge(r.score)">{{ r.score ?? '—' }}</span>
                </td>
                <td class="px-4 py-2 text-gray-500 italic">{{ r.interpretation || '—' }}</td>
                <td class="px-4 py-2 text-gray-500">{{ r.recommendations || '—' }}</td>
                <td class="px-4 py-2 text-gray-400">{{ formatDate(r.completed_at || r.createdAt) }}</td>
              </tr>
              <tr v-if="!stats.recentResults?.length">
                <td colspan="7" class="px-4 py-6 text-center text-gray-400 italic">No results yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Recent Test Activity</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs divide-y divide-gray-100">
            <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <th class="px-4 py-2 text-left">Tester</th>
                <th class="px-4 py-2 text-left">Test</th>
                <th class="px-4 py-2 text-center">Score</th>
                <th class="px-4 py-2 text-left">Taken At</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in stats.recentProgresses" :key="p.id" class="hover:bg-gray-50">
                <td class="px-4 py-2 font-medium">{{ p.User ? p.User.first_name + ' ' + p.User.last_name : '—' }}</td>
                <td class="px-4 py-2">{{ p.Test ? p.Test.title : '—' }}</td>
                <td class="px-4 py-2 text-center">
                  <span :class="scoreBadge(p.score)">{{ p.score ?? '—' }}</span>
                </td>
                <td class="px-4 py-2 text-gray-400">{{ formatDate(p.taken_at || p.createdAt) }}</td>
              </tr>
              <tr v-if="!stats.recentProgresses?.length">
                <td colspan="4" class="px-4 py-6 text-center text-gray-400 italic">No activity yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";

export default {
  name: "AdminDashboard",
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
        { label: "Total Testers",   value: c.users         ?? 0, icon: "fas fa-users",        bg: "bg-blue-50",   color: "text-blue-500" },
        { label: "Tests Available", value: c.tests         ?? 0, icon: "fas fa-file-alt",     bg: "bg-purple-50", color: "text-purple-500" },
        { label: "Completed Tests", value: c.completedProgresses ?? 0, icon: "fas fa-check-circle", bg: "bg-green-50", color: "text-green-500" },
        { label: "Avg Score",       value: (c.avgScore ?? 0) + '%', icon: "fas fa-chart-line", bg: "bg-amber-50",  color: "text-amber-500" },
      ];
    },

    participationSeries() {
      const scores = (this.stats.recentProgresses || []).map(p => p.score ?? 0);
      return [{ name: "Score", data: scores.length ? scores : [0] }];
    },

    participationOptions() {
      const labels = (this.stats.recentProgresses || []).map((_, i) => `Activity ${i + 1}`);
      return {
        chart: { toolbar: { show: false }, fontFamily: "inherit" },
        xaxis: { categories: labels.length ? labels : ["—"] },
        colors: ["#6366f1"],
        stroke: { curve: "smooth", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
        dataLabels: { enabled: false },
        grid: { borderColor: "#f1f5f9" },
        yaxis: { min: 0, max: 100 },
      };
    },

    scoreDonutSeries() {
      const results = this.stats.recentResults || [];
      const high   = results.filter(r => (r.score ?? 0) >= 80).length;
      const mid    = results.filter(r => (r.score ?? 0) >= 60 && (r.score ?? 0) < 80).length;
      const low    = results.filter(r => (r.score ?? 0) < 60).length;
      return [high || 0, mid || 0, low || 0];
    },

    scoreDonutOptions() {
      return {
        chart: { fontFamily: "inherit" },
        labels: ["High (≥80)", "Medium (60–79)", "Low (<60)"],
        colors: ["#22c55e", "#f59e0b", "#ef4444"],
        legend: { position: "bottom", fontSize: "11px" },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: "65%" } } },
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
