<template>
  <div v-if="role === 'admin' || role === 'super_admin'" class="p-4 sm:p-6 bg-slate-50 min-h-full text-sm text-slate-800">
    <div class="max-w-[1920px] mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p class="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Edilbetting Admin</p>
          <h1 class="text-2xl font-black text-slate-900 mt-1">Sportsbook Dashboard</h1>
          <p class="text-xs text-slate-500 mt-1">Sample platform activity — ready to connect to live betting data.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
            <span class="w-2 h-2 rounded-full bg-green-500"></span> System Online
          </span>
          <span class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500">Today</span>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div v-for="card in kpiCards" :key="card.label" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ card.label }}</p>
              <p class="text-2xl font-black text-slate-900 mt-2">{{ card.value }}</p>
              <p class="text-[10px] mt-2 font-bold" :class="card.changeClass"><i :class="card.icon"></i> {{ card.change }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="card.bg">
              <i :class="[card.fa, card.color]"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div class="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-black text-slate-800">Betting Activity</h2>
              <p class="text-[10px] text-slate-400 mt-1">Sample stakes and platform revenue over the last 7 days</p>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETB</span>
          </div>
          <apexchart type="area" height="280" :options="activityOptions" :series="activitySeries" />
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 class="text-sm font-black text-slate-800">Bet Status</h2>
          <p class="text-[10px] text-slate-400 mt-1 mb-2">Current sample ticket distribution</p>
          <apexchart type="donut" height="245" :options="betStatusOptions" :series="betStatusSeries" />
          <div class="grid grid-cols-2 gap-2 mt-1">
            <div v-for="item in betStatusLegend" :key="item.label" class="text-center">
              <p class="text-sm font-black text-slate-800">{{ item.value }}</p>
              <p class="text-[9px] text-slate-400 uppercase font-bold">{{ item.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div class="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 class="text-sm font-black text-slate-800">Live & Upcoming Events</h2>
              <p class="text-[10px] text-slate-400 mt-1">Sample sportsbook event monitor</p>
            </div>
            <span class="text-[10px] font-black text-red-500 uppercase tracking-wider"><i class="fas fa-circle text-[7px]"></i> Live</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-slate-50 text-slate-400 uppercase text-[9px] font-black">
                <tr>
                  <th class="px-5 py-3 text-left">Event</th><th class="px-4 py-3 text-left">League</th>
                  <th class="px-4 py-3 text-center">Status</th><th class="px-4 py-3 text-center">Market</th>
                  <th class="px-5 py-3 text-right">Odds</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="event in liveEvents" :key="event.id" class="hover:bg-slate-50">
                  <td class="px-5 py-4"><p class="font-bold text-slate-800">{{ event.home }}</p><p class="text-slate-400 mt-0.5">vs {{ event.away }}</p></td>
                  <td class="px-4 py-4 text-slate-500">{{ event.league }}</td>
                  <td class="px-4 py-4 text-center"><span :class="event.live ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'" class="px-2 py-1 rounded-full text-[9px] font-black uppercase">{{ event.status }}</span></td>
                  <td class="px-4 py-4 text-center text-slate-500 font-medium">{{ event.market }}</td>
                  <td class="px-5 py-4 text-right font-black text-slate-800">{{ event.odds }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="px-5 py-4 border-b border-slate-100">
            <h2 class="text-sm font-black text-slate-800">Wallet Overview</h2>
            <p class="text-[10px] text-slate-400 mt-1">Sample financial activity</p>
          </div>
          <div class="p-5 space-y-4">
            <div v-for="wallet in walletStats" :key="wallet.label" class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="wallet.bg"><i :class="[wallet.icon, wallet.color, 'text-xs']"></i></div>
                <span class="text-xs font-bold text-slate-600">{{ wallet.label }}</span>
              </div>
              <span class="text-sm font-black text-slate-900">{{ wallet.value }}</span>
            </div>
          </div>
          <div class="mx-5 mb-5 rounded-lg bg-amber-50 border border-amber-100 p-3">
            <p class="text-[9px] text-amber-700 uppercase font-black tracking-wider">Sample data</p>
            <p class="text-[10px] text-amber-600 mt-1 leading-relaxed">These figures are placeholders until connected to live wallet, bet and settlement data.</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-black text-slate-800">Recent Bets</h2>
            <p class="text-[10px] text-slate-400 mt-1">Sample betting tickets for the admin overview</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-black text-slate-400 uppercase">{{ recentBets.length }} tickets</span>
            <button @click="$router.push({ name: 'bets' })" class="text-[10px] font-black text-green-600 hover:text-green-700 uppercase tracking-wider">View all bets <i class="fas fa-arrow-right ml-1"></i></button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-50 text-slate-400 uppercase text-[9px] font-black">
              <tr>
                <th class="px-5 py-3 text-left">Ticket</th><th class="px-4 py-3 text-left">Customer</th><th class="px-4 py-3 text-left">Selection</th>
                <th class="px-4 py-3 text-center">Odds</th><th class="px-4 py-3 text-right">Stake</th><th class="px-4 py-3 text-right">Potential Win</th><th class="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="bet in recentBets" :key="bet.id" class="hover:bg-slate-50">
                <td class="px-5 py-4 font-black text-slate-700">{{ bet.ticket }}</td><td class="px-4 py-4 text-slate-600">{{ bet.customer }}</td>
                <td class="px-4 py-4"><p class="font-bold text-slate-700">{{ bet.selection }}</p><p class="text-[9px] text-slate-400">{{ bet.event }}</p></td>
                <td class="px-4 py-4 text-center font-black text-slate-700">{{ bet.odds }}</td><td class="px-4 py-4 text-right font-bold text-slate-700">{{ bet.stake }}</td>
                <td class="px-4 py-4 text-right font-bold text-slate-700">{{ bet.potential }}</td>
                <td class="px-5 py-4 text-center"><span :class="betStatusClass(bet.status)" class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase">{{ bet.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <AdminDashboard v-else-if="role === 'organization'" />
  <UserDashboard v-else />
</template>

<script>
import VueApexCharts from "vue3-apexcharts";
import AdminDashboard from "./dashboards/admindashboard.vue";
import UserDashboard from "./dashboards/userdashboard.vue";
import checkRole from "@/utils/checkRole";

export default {
  name: "FirstDash",
  components: { apexchart: VueApexCharts, AdminDashboard, UserDashboard },
  data() {
    return {
      kpiCards: [
        { label: "Total Bets Today", value: "1,284", change: "+12.6% vs yesterday", icon: "fas fa-arrow-up", fa: "fas fa-ticket-alt", bg: "bg-blue-50", color: "text-blue-500", changeClass: "text-green-600" },
        { label: "Total Stakes", value: "ETB 486.2K", change: "+8.4% this week", icon: "fas fa-arrow-up", fa: "fas fa-coins", bg: "bg-amber-50", color: "text-amber-500", changeClass: "text-green-600" },
        { label: "Potential Payout", value: "ETB 812.7K", change: "Across open tickets", icon: "fas fa-clock", fa: "fas fa-hand-holding-usd", bg: "bg-purple-50", color: "text-purple-500", changeClass: "text-slate-400" },
        { label: "Active Bettors", value: "3,846", change: "+5.2% this week", icon: "fas fa-arrow-up", fa: "fas fa-users", bg: "bg-green-50", color: "text-green-500", changeClass: "text-green-600" },
      ],
      activitySeries: [
        { name: "Stakes", data: [42000, 58000, 51000, 76000, 69000, 91000, 99200] },
        { name: "Revenue", data: [6200, 8400, 7300, 11100, 9800, 12800, 14100] },
      ],
      liveEvents: [
        { id: 1, home: "Arsenal", away: "Chelsea", league: "Premier League", status: "LIVE 67'", live: true, market: "1X2", odds: "1.72 / 3.65 / 4.80" },
        { id: 2, home: "Real Madrid", away: "Barcelona", league: "La Liga", status: "20:00", live: false, market: "1X2", odds: "2.10 / 3.75 / 3.05" },
        { id: 3, home: "Inter Milan", away: "AC Milan", league: "Serie A", status: "21:45", live: false, market: "Over/Under", odds: "1.84 / 1.92" },
        { id: 4, home: "Bayern Munich", away: "Dortmund", league: "Bundesliga", status: "22:00", live: false, market: "BTTS", odds: "1.61 / 2.20" },
      ],
      walletStats: [
        { label: "Deposits today", value: "ETB 612.4K", icon: "fas fa-plus-circle", bg: "bg-green-50", color: "text-green-600" },
        { label: "Withdrawals today", value: "ETB 284.7K", icon: "fas fa-minus-circle", bg: "bg-red-50", color: "text-red-500" },
        { label: "Pending withdrawals", value: "ETB 42.8K", icon: "fas fa-hourglass-half", bg: "bg-amber-50", color: "text-amber-600" },
        { label: "Platform revenue", value: "ETB 71.6K", icon: "fas fa-chart-line", bg: "bg-blue-50", color: "text-blue-600" },
      ],
      recentBets: [
        { id: 1, ticket: "EDB-104928", customer: "M. Tesfaye", selection: "Arsenal to Win", event: "Arsenal vs Chelsea", odds: "1.72", stake: "ETB 2,000", potential: "ETB 3,440", status: "Won" },
        { id: 2, ticket: "EDB-104927", customer: "A. Bekele", selection: "Over 2.5 Goals", event: "Real Madrid vs Barcelona", odds: "1.84", stake: "ETB 1,500", potential: "ETB 2,760", status: "pending" },
        { id: 3, ticket: "EDB-104926", customer: "S. Alemu", selection: "Both Teams To Score", event: "Inter vs AC Milan", odds: "1.61", stake: "ETB 5,000", potential: "ETB 8,050", status: "Open" },
        { id: 4, ticket: "EDB-104925", customer: "D. Girma", selection: "Bayern to Win", event: "Bayern vs Dortmund", odds: "1.48", stake: "ETB 750", potential: "ETB 1,110", status: "Lost" },
        { id: 5, ticket: "EDB-104924", customer: "R. Kassa", selection: "Double Chance 1X", event: "Napoli vs Roma", odds: "1.36", stake: "ETB 3,000", potential: "ETB 4,080", status: "pending" },
      ],
    };
  },
  computed: {
    role() {
      const role = checkRole();
      if (role === "admin" || role === "super_admin" || role === "organization" || role === "tester") {
        return role;
      }
      return "tester";
    },
    activityOptions() {
      return {
        chart: { toolbar: { show: false }, fontFamily: "inherit" },
        colors: ["#f59e0b", "#22c55e"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.28, opacityTo: 0.03 } },
        xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], labels: { style: { fontSize: "10px" } } },
        yaxis: { labels: { formatter: value => "ETB " + (value / 1000).toFixed(0) + "K" } },
        grid: { borderColor: "#f1f5f9" },
        legend: { position: "top", horizontalAlign: "right", fontSize: "10px" },
        tooltip: { y: { formatter: value => "ETB " + Number(value).toLocaleString() } },
      };
    },
    betStatusSeries() { return [742, 318, 156, 68]; },
    betStatusOptions() {
      return {
        chart: { fontFamily: "inherit" },
        labels: ["Pending", "Won", "Lost", "Void"],
        colors: ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b"],
        legend: { show: false }, dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: "68%" } } },
      };
    },
    betStatusLegend() {
      return [
        { label: "Pending", value: "742" }, { label: "Won", value: "318" },
        { label: "Lost", value: "156" }, { label: "Pending", value: "68" },
      ];
    },
  },
  methods: {
    betStatusClass(status) {
      return {
        "bg-green-50 text-green-700": status === "Won",
        "bg-amber-50 text-amber-700": status === "pending",
        "bg-red-50 text-red-700": status === "Lost",
        "bg-amber-50 text-amber-700": status === "pending",
      };
    },
  },
};
</script>
