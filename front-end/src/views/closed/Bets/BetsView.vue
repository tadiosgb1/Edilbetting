<template>
  <section class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-[1920px] mx-auto">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <p class="text-xs font-black text-amber-500 uppercase tracking-widest">Sportsbook Administration</p>
          <h1 class="text-2xl font-black text-slate-900 mt-1">Bets</h1>
          <p class="text-sm text-slate-500 mt-1">Sample betting tickets based on the backend Bet model.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500">
            {{ bets.length }} sample bets
          </span>
          <button
            @click="resetSampleData"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition"
          >
            <i class="fas fa-sync-alt"></i>
            Reset
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div v-for="card in summaryCards" :key="card.label" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ card.label }}</p>
          <p class="text-xl font-black text-slate-900 mt-2">{{ card.value }}</p>
          <p class="text-[10px] text-slate-400 mt-1">{{ card.detail }}</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 class="text-sm font-black text-slate-800 uppercase tracking-wider">Bet Tickets</h2>
            <p class="text-[10px] text-slate-400 mt-1">Fields mirror Bet.js: betId, userId, stake, totalOdds, potentialPayout, status, placedAt and settledAt.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="filter in filters"
              :key="filter"
              @click="activeFilter = filter"
              class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition"
              :class="activeFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
            >
              {{ filter }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1050px] w-full text-xs">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Bet ID</th>
                <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">User ID</th>
                <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wider text-slate-400">Stake</th>
                <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wider text-slate-400">Total Odds</th>
                <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wider text-slate-400">Potential Payout</th>
                <th class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-wider text-slate-400">Status</th>
                <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Placed At</th>
                <th class="px-5 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Settled At</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="bet in filteredBets" :key="bet.betId" class="hover:bg-slate-50/70 transition">
                <td class="px-5 py-4">
                  <span class="font-black text-slate-700">{{ shortId(bet.betId) }}</span>
                  <p class="text-[9px] text-slate-400 mt-1">{{ bet.betId }}</p>
                </td>
                <td class="px-4 py-4">
                  <span class="font-medium text-slate-600">{{ shortId(bet.userId) }}</span>
                  <p class="text-[9px] text-slate-400 mt-1">{{ bet.userId }}</p>
                </td>
                <td class="px-4 py-4 text-right font-black text-slate-800">ETB {{ money(bet.stake) }}</td>
                <td class="px-4 py-4 text-right font-black text-amber-600">{{ Number(bet.totalOdds).toFixed(4) }}</td>
                <td class="px-4 py-4 text-right font-black text-slate-800">ETB {{ money(bet.potentialPayout) }}</td>
                <td class="px-4 py-4 text-center">
                  <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase" :class="statusClass(bet.status)">
                    {{ bet.status }}
                  </span>
                </td>
                <td class="px-4 py-4 text-slate-500">{{ formatDate(bet.placedAt) }}</td>
                <td class="px-5 py-4 text-slate-500">{{ bet.settledAt ? formatDate(bet.settledAt) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredBets.length === 0" class="p-12 text-center text-slate-400">
          <i class="fas fa-ticket-alt text-3xl text-slate-200 mb-3"></i>
          <p class="text-sm font-bold">No bets match this status.</p>
        </div>
      </div>

      <div class="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p class="text-[10px] text-amber-700 uppercase font-black tracking-wider">Sample data</p>
        <p class="text-xs text-amber-700/80 mt-1 leading-relaxed">
          These tickets are placeholders for the frontend UI. They follow the current Sequelize Bet model and are not loaded from the database yet.
        </p>
      </div>
    </div>
  </section>
</template>

<script>
const SAMPLE_BETS = [
  {
    betId: "2e8d6d4a-7b2c-4f11-91c1-000000000101",
    userId: "8c0b9d12-21aa-4b77-9e31-000000000201",
    stake: "2000.00",
    totalOdds: "1.7200",
    potentialPayout: "3440.00",
    status: "won",
    placedAt: "2026-09-29T08:42:00",
    settledAt: "2026-09-29T10:18:00",
  },
  {
    betId: "2e8d6d4a-7b2c-4f11-91c1-000000000102",
    userId: "8c0b9d12-21aa-4b77-9e31-000000000202",
    stake: "1500.00",
    totalOdds: "1.8400",
    potentialPayout: "2760.00",
    status: "pending",
    placedAt: "2026-09-29T09:15:00",
    settledAt: null,
  },
  {
    betId: "2e8d6d4a-7b2c-4f11-91c1-000000000103",
    userId: "8c0b9d12-21aa-4b77-9e31-000000000203",
    stake: "5000.00",
    totalOdds: "1.6100",
    potentialPayout: "8050.00",
    status: "pending",
    placedAt: "2026-09-29T09:37:00",
    settledAt: null,
  },
  {
    betId: "2e8d6d4a-7b2c-4f11-91c1-000000000104",
    userId: "8c0b9d12-21aa-4b77-9e31-000000000204",
    stake: "750.00",
    totalOdds: "1.4800",
    potentialPayout: "1110.00",
    status: "lost",
    placedAt: "2026-09-29T07:50:00",
    settledAt: "2026-09-29T09:44:00",
  },
  {
    betId: "2e8d6d4a-7b2c-4f11-91c1-000000000105",
    userId: "8c0b9d12-21aa-4b77-9e31-000000000205",
    stake: "3000.00",
    totalOdds: "1.3600",
    potentialPayout: "4080.00",
    status: "void",
    placedAt: "2026-09-28T19:22:00",
    settledAt: "2026-09-29T08:05:00",
  },
  {
    betId: "2e8d6d4a-7b2c-4f11-91c1-000000000106",
    userId: "8c0b9d12-21aa-4b77-9e31-000000000206",
    stake: "1250.00",
    totalOdds: "2.1500",
    potentialPayout: "2687.50",
    status: "cancelled",
    placedAt: "2026-09-28T18:11:00",
    settledAt: "2026-09-28T18:25:00",
  },
];

export default {
  name: "BetsView",
  data() {
    return {
      bets: SAMPLE_BETS.map(bet => ({ ...bet })),
      activeFilter: "all",
      filters: ["all", "pending", "won", "lost", "void", "cancelled"],
    };
  },
  computed: {
    filteredBets() {
      if (this.activeFilter === "all") return this.bets;
      return this.bets.filter(bet => bet.status === this.activeFilter);
    },
    summaryCards() {
      const totalStake = this.bets.reduce((sum, bet) => sum + Number(bet.stake), 0);
      const potential = this.bets.reduce((sum, bet) => sum + Number(bet.potentialPayout), 0);
      return [
        { label: "Total Bets", value: this.bets.length, detail: "Sample tickets" },
        { label: "Total Stakes", value: `ETB ${this.money(totalStake)}`, detail: "All sample bets" },
        { label: "Potential Payout", value: `ETB ${this.money(potential)}`, detail: "Across sample tickets" },
        { label: "Pending", value: this.bets.filter(bet => bet.status === "pending").length, detail: "Awaiting settlement" },
        { label: "Settled", value: this.bets.filter(bet => bet.settledAt).length, detail: "Has settledAt" },
      ];
    },
  },
  methods: {
    resetSampleData() {
      this.bets = SAMPLE_BETS.map(bet => ({ ...bet }));
      this.activeFilter = "all";
    },
    shortId(id) {
      return id ? `${id.slice(0, 8)}…` : "—";
    },
    money(value) {
      return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatDate(value) {
      if (!value) return "—";
      return new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    statusClass(status) {
      return {
        "bg-amber-50 text-amber-700": status === "pending",
        "bg-green-50 text-green-700": status === "won",
        "bg-red-50 text-red-700": status === "lost",
        "bg-slate-100 text-slate-600": status === "void",
        "bg-purple-50 text-purple-700": status === "cancelled",
      };
    },
  },
};
</script>
