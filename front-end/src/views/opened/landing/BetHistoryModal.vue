<template>
  <div v-if="isOpen" class="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
      <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 class="text-lg font-black text-white">📜 Bet History</h3>
          <p class="text-[10px] text-slate-500 mt-0.5">Your saved bets and their current status</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white text-xl font-bold">✕</button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="loading" class="space-y-3">
          <div v-for="n in 3" :key="n" class="h-28 bg-slate-800 rounded-xl animate-pulse"></div>
        </div>

        <div v-else-if="error" class="bg-red-950/40 border border-red-900 rounded-xl p-5 text-center">
          <p class="text-sm text-red-300">{{ error }}</p>
          <button @click="fetchHistory" class="mt-3 text-xs font-bold text-amber-400 hover:text-amber-300">Try again</button>
        </div>

        <div v-else-if="!bets.length" class="py-16 text-center">
          <div class="text-4xl mb-3">📋</div>
          <p class="text-sm font-bold text-slate-400">No bets yet</p>
          <p class="text-xs text-slate-600 mt-1">Your booked bets will appear here.</p>
        </div>

        <div v-else class="space-y-3">
          <article v-for="bet in bets" :key="bet.betId" class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Bet #{{ String(bet.betId || '').slice(0, 8) }}
                </p>
                <p class="text-xs text-slate-400 mt-1">{{ formatDate(bet.placedAt) }}</p>
              </div>
              <span
                :class="statusClass(bet.status)"
                class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex-shrink-0">
                {{ bet.status || 'pending' }}
              </span>
            </div>

            <div class="p-4">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <p class="text-[9px] text-slate-600 uppercase font-black">Stake</p>
                  <p class="text-sm font-black text-white mt-1">{{ money(bet.stake) }} ETB</p>
                </div>
                <div>
                  <p class="text-[9px] text-slate-600 uppercase font-black">Total Odds</p>
                  <p class="text-sm font-black text-amber-400 mt-1">{{ Number(bet.totalOdds || 0).toFixed(2) }}</p>
                </div>
                <div>
                  <p class="text-[9px] text-slate-600 uppercase font-black">Potential Payout</p>
                  <p class="text-sm font-black text-emerald-400 mt-1">{{ money(bet.potentialPayout) }} ETB</p>
                </div>
                <div>
                  <p class="text-[9px] text-slate-600 uppercase font-black">Payment</p>
                  <p class="text-sm font-black text-slate-300 mt-1">Not paid</p>
                </div>
              </div>

              <div class="space-y-2">
                <div v-for="selection in (bet.selections || [])" :key="selection.id"
                  class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-white truncate">{{ selection.outcomeName }}</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">
                      {{ selection.marketKey || 'h2h' }}
                      <span v-if="selection.point !== null && selection.point !== undefined"> · {{ selection.point }}</span>
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-[9px] text-slate-600 uppercase font-black">Odds</p>
                    <p class="text-xs font-black text-amber-400">{{ Number(selection.oddsAtBet || 0).toFixed(2) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="px-5 py-3 border-t border-slate-800 flex justify-end flex-shrink-0">
        <button @click="fetchHistory" :disabled="loading"
          class="text-xs font-bold text-slate-400 hover:text-amber-400 disabled:opacity-50">
          ↻ Refresh
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BetHistoryModal',
  props: {
    isOpen: { type: Boolean, default: false },
    userId: { type: String, default: '' },
    api: { type: String, default: 'http://localhost:3000/api' },
  },
  emits: ['close'],
  data() {
    return {
      bets: [],
      loading: false,
      error: '',
    };
  },
  watch: {
    isOpen(value) {
      if (value) this.fetchHistory();
    },
  },
  methods: {
    async fetchHistory() {
      if (!this.userId) {
        this.bets = [];
        this.error = 'Please login to view your bet history.';
        return;
      }
      this.loading = true;
      this.error = '';
      try {
        const res = await fetch(`${this.api}/bets/${encodeURIComponent(this.userId)}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Could not load bet history');
        this.bets = Array.isArray(data.data) ? data.data : [];
      } catch (e) {
        console.error('fetchHistory', e);
        this.error = e.message || 'Could not load bet history.';
      } finally {
        this.loading = false;
      }
    },
    money(value) {
      return Number(value || 0).toFixed(2);
    },
    formatDate(value) {
      if (!value) return '—';
      return new Date(value).toLocaleString([], {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    },
    statusClass(status) {
      return {
        pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        won: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        lost: 'bg-red-500/10 text-red-400 border border-red-500/20',
        void: 'bg-slate-700 text-slate-300 border border-slate-600',
        cancelled: 'bg-slate-700 text-slate-400 border border-slate-600',
      }[status] || 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    },
  },
};
</script>
