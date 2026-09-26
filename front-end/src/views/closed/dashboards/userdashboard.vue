<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">

    <!-- Header -->
    <div class="mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">My Dashboard</h1>
      <p class="text-xs text-gray-500 mt-0.5">Your personal psychometric assessment overview</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
      <i class="fas fa-spinner animate-spin text-2xl"></i>
    </div>

    <div v-else>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
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

      <!-- Score trend chart -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">My Score Trend</h2>
        <apexchart type="line" height="240" :options="trendOptions" :series="trendSeries" />
      </div>

      <!-- My Results Table -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">My Test Results</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs divide-y divide-gray-100">
            <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <th class="px-4 py-2 text-left">#</th>
                <th class="px-4 py-2 text-left">Test</th>
                <th class="px-4 py-2 text-center">Score</th>
                <th class="px-4 py-2 text-left">Interpretation</th>
                <th class="px-4 py-2 text-left">Recommendations</th>
                <th class="px-4 py-2 text-left">Completed</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(r, i) in myResults" :key="r.id" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-400">{{ i + 1 }}</td>
                <td class="px-4 py-2 font-medium">{{ r.Test ? r.Test.title : '—' }}</td>
                <td class="px-4 py-2 text-center">
                  <span :class="scoreBadge(r.score)">{{ r.score ?? '—' }}</span>
                </td>
                <td class="px-4 py-2 text-gray-500 italic">{{ r.interpretation || '—' }}</td>
                <td class="px-4 py-2 text-gray-500">{{ r.recommendations || '—' }}</td>
                <td class="px-4 py-2 text-gray-400">{{ formatDate(r.completed_at || r.createdAt) }}</td>
              </tr>
              <tr v-if="!myResults.length">
                <td colspan="6" class="px-4 py-6 text-center text-gray-400 italic">You haven't completed any tests yet.</td>
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
  name: "UserDashboard",
  components: { apexchart: VueApexCharts },

  data() {
    return {
      loading: true,
      myResults: [],
      myProgresses: [],
    };
  },

  computed: {
    userId() {
      return localStorage.getItem("userId");
    },

    kpiCards() {
      const scores = this.myResults.map(r => r.score ?? 0);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const completed = this.myProgresses.filter(p => (p.score ?? 0) > 0).length;
      return [
        { label: "Tests Taken",     value: this.myResults.length,    icon: "fas fa-file-alt",     bg: "bg-purple-50", color: "text-purple-500" },
        { label: "Average Score",   value: avg + '%',                 icon: "fas fa-chart-line",   bg: "bg-amber-50",  color: "text-amber-500" },
        { label: "Completed Tests", value: completed,                 icon: "fas fa-check-circle", bg: "bg-green-50",  color: "text-green-500" },
      ];
    },

    trendSeries() {
      const scores = this.myResults.map(r => r.score ?? 0);
      return [{ name: "Score", data: scores.length ? scores : [0] }];
    },

    trendOptions() {
      const labels = this.myResults.map((r, i) => r.Test?.title || `Test ${i + 1}`);
      return {
        chart: { toolbar: { show: false }, fontFamily: "inherit" },
        xaxis: { categories: labels.length ? labels : ["—"], labels: { rotate: -30, style: { fontSize: "10px" } } },
        colors: ["#6366f1"],
        stroke: { curve: "smooth", width: 2 },
        markers: { size: 4 },
        dataLabels: { enabled: false },
        grid: { borderColor: "#f1f5f9" },
        yaxis: { min: 0, max: 100, labels: { formatter: v => v + '%' } },
      };
    },
  },

  methods: {
    async fetchMyData() {
      this.loading = true;
      try {
        const [resultsRes, progressRes] = await Promise.all([
          this.$apiGet("/result", { page_size: 50 }),
          this.$apiGet("/progress", { page_size: 50 }),
        ]);

        const userId = parseInt(this.userId);

        // Filter to current user's data
        this.myResults     = (resultsRes.data  || []).filter(r => r.user_id === userId || r.User?.id === userId);
        this.myProgresses  = (progressRes.data || []).filter(p => p.user_id === userId || p.User?.id === userId);
      } catch (e) {
        console.error("User dashboard error:", e);
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
    this.fetchMyData();
  },
};
</script>
