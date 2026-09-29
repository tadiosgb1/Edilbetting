<template>
  <section class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-[1920px] mx-auto">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <button @click="$router.push({ name: 'sports' })" class="text-xs font-bold text-slate-400 hover:text-slate-700 mb-2">
            <i class="fas fa-arrow-left mr-1"></i> Back to Sports
          </button>
          <p class="text-xs font-black text-amber-500 uppercase tracking-widest">Sportsbook Events</p>
          <h1 class="text-2xl font-black text-slate-900 mt-1">{{ sportKey }}</h1>
          <p class="text-sm text-slate-500 mt-1">Events loaded from the configured backend Events API.</p>
        </div>
        <button @click="loadEvents" :disabled="loading" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> Refresh
        </button>
      </div>

      <div v-if="error" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div v-for="card in summary" :key="card.label" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ card.label }}</p>
          <p class="text-xl font-black text-slate-900 mt-2">{{ card.value }}</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-black text-slate-800 uppercase tracking-wider">Event List</h2>
            <p class="text-[10px] text-slate-400 mt-1">GET /api/events/{{ sportKey }}</p>
          </div>
          <span class="text-xs font-bold text-slate-400">{{ events.length }} events</span>
        </div>

        <div v-if="loading && events.length === 0" class="p-12 text-center text-slate-400">
          <i class="fas fa-spinner fa-spin text-xl mb-3"></i><p class="text-sm font-medium">Loading events...</p>
        </div>

        <div v-else-if="events.length === 0" class="p-12 text-center text-slate-400">
          <i class="fas fa-calendar-times text-3xl text-slate-200 mb-3"></i><p class="text-sm font-bold">No events found for this sport.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-[900px] w-full text-xs">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Event ID</th>
                <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Match</th>
                <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Start Time</th>
                <th class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-wider text-slate-400">Status</th>
                <th class="px-5 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Last Synced</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="event in events" :key="event.eventId" class="hover:bg-slate-50/70 transition">
                <td class="px-5 py-4 font-bold text-slate-600">{{ event.eventId }}</td>
                <td class="px-4 py-4">
                  <p class="font-black text-slate-800">{{ event.homeTeam }}</p>
                  <p class="text-slate-400 mt-0.5">vs {{ event.awayTeam }}</p>
                </td>
                <td class="px-4 py-4 text-slate-600">{{ formatDate(event.commenceTime) }}</td>
                <td class="px-4 py-4 text-center">
                  <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase" :class="statusClass(event.status)">{{ event.status }}</span>
                </td>
                <td class="px-5 py-4 text-slate-500">{{ formatDate(event.lastSyncedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "EventsView",
  data() { return { events: [], loading: false, error: "" }; },
  computed: {
    sportKey() { return this.$route.params.sportKey || ""; },
    summary() {
      return [
        { label: "Total", value: this.events.length },
        { label: "Upcoming", value: this.events.filter(e => e.status === "upcoming").length },
        { label: "Live", value: this.events.filter(e => e.status === "live").length },
        { label: "Finished", value: this.events.filter(e => e.status === "finished").length },
      ];
    },
  },
  watch: { "$route.params.sportKey": "loadEvents" },
  mounted() { this.loadEvents(); },
  methods: {
    async loadEvents() {
      this.loading = true; this.error = "";
      try {
        const base = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api").replace(/\/$/, "");
        const response = await fetch(`${base}/events/${encodeURIComponent(this.sportKey)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) throw new Error(data.error || "Failed to load events.");
        this.events = data.data || [];
      } catch (error) {
        this.error = error?.message || "Failed to load events.";
      } finally { this.loading = false; }
    },
    formatDate(value) {
      if (!value) return "—";
      return new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    },
    statusClass(status) {
      return {
        "bg-blue-50 text-blue-700": status === "upcoming",
        "bg-red-50 text-red-700": status === "live",
        "bg-green-50 text-green-700": status === "finished",
        "bg-slate-100 text-slate-600": status === "cancelled",
        "bg-amber-50 text-amber-700": status === "postponed",
      };
    },
  },
};
</script>
