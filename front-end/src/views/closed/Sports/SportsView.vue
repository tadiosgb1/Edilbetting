<template>
  <section class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-[1920px] mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p class="text-xs font-black text-amber-500 uppercase tracking-widest">Sportsbook Administration</p>
          <h1 class="text-2xl font-black text-slate-900 mt-1">Sports</h1>
          <p class="text-sm text-slate-500 mt-1">Sports and leagues loaded from the Edilbetting backend.</p>
        </div>
        <button @click="loadSports" :disabled="loading" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> Refresh
        </button>
      </div>

      <div v-if="error" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>

      <div v-if="loading && types.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        <i class="fas fa-spinner fa-spin text-xl mb-3"></i><p class="text-sm font-medium">Loading sports...</p>
      </div>

      <div v-else-if="types.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        <i class="fas fa-futbol text-3xl text-slate-200 mb-3"></i><p class="text-sm font-bold">No sports available.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <article v-for="type in types" :key="type.key" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <i :class="sportIcon(type.name)" class="text-lg"></i>
              </div>
              <div>
                <h2 class="text-base font-black text-slate-900">{{ type.name }}</h2>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ type.leagueCount }} leagues</p>
              </div>
            </div>
            <span class="px-2 py-1 rounded-full bg-green-50 text-green-700 text-[9px] font-black uppercase">Active</span>
          </div>

          <div class="p-4 space-y-2 max-h-72 overflow-y-auto">
            <div v-for="sport in leaguesFor(type)" :key="sport.sportKey" class="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-700 truncate">{{ sport.title }}</p>
                <p class="text-[9px] text-slate-400 mt-1">{{ sport.sportKey }} · {{ sport.country || 'International' }}</p>
              </div>
              <button @click="openEvents(sport.sportKey)" class="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase hover:bg-slate-700 transition">
                Events <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
            <p v-if="leaguesFor(type).length === 0" class="text-xs text-slate-400 text-center py-5">No league records returned for this sport.</p>
          </div>
        </article>
      </div>

      <div class="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p class="text-[10px] text-blue-700 uppercase font-black tracking-wider">Backend data</p>
        <p class="text-xs text-blue-700/80 mt-1">Sport categories come from <code>/api/sports/types</code>. League records come from the configured sports endpoint so each Events action has the real <code>sportKey</code> required by the Events API.</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "SportsView",
  data() {
    return { types: [], leagues: [], loading: false, error: "" };
  },
  mounted() { this.loadSports(); },
  methods: {
    baseUrl() {
      return (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api").replace(/\/$/, "");
    },
    async get(path) {
      const response = await fetch(`${this.baseUrl()}${path}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.error || "Failed to load sports.");
      return data;
    },
    async loadSports() {
      this.loading = true; this.error = "";
      try {
        const [typesData, sportsData] = await Promise.all([
          this.get("/sports/types"),
          this.get("/sports"),
        ]);
        this.types = typesData.data || [];
        this.leagues = sportsData.data || [];
      } catch (error) {
        this.error = error?.message || "Failed to load sports.";
      } finally { this.loading = false; }
    },
    leaguesFor(type) {
      return this.leagues.filter(s => (s.groupName || "Other").toLowerCase() === String(type.name).toLowerCase());
    },
    openEvents(sportKey) {
      this.$router.push({ name: "events", params: { sportKey } });
    },
    sportIcon(name) {
      const value = String(name).toLowerCase();
      if (value.includes("soccer") || value.includes("football")) return "fas fa-futbol";
      if (value.includes("basket")) return "fas fa-basketball-ball";
      if (value.includes("tennis")) return "fas fa-table-tennis";
      if (value.includes("baseball")) return "fas fa-baseball-ball";
      if (value.includes("cricket")) return "fas fa-baseball-ball";
      return "fas fa-trophy";
    },
  },
};
</script>
