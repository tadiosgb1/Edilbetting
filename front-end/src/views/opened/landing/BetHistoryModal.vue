<template>
  <ConfirmModal
    :open="confirmCancelBet !== null"
    title="Cancel pending bet"
    message="Are you sure you want to cancel this pending bet? This action cannot be undone."
    cancel-text="Keep Bet"
    confirm-text="Yes, Cancel Bet"
    @cancel="confirmCancelBet = null"
    @confirm="confirmCancellation"
  />

  <div v-if="isOpen" class="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
      <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 class="text-lg font-black text-white">📜 Bet History</h3>
          <p class="text-[10px] text-slate-500 mt-0.5">Your saved bets and their current status</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white text-xl font-bold">✕</button>
      </div>

      <div class="flex-1 overflow-y-auto p-3 sm:p-5">
        <div v-if="loading" class="space-y-4">
          <div v-for="n in 3" :key="n" class="h-24 bg-slate-800 rounded-xl animate-pulse"></div>
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

        <div v-else class="space-y-4">
          <article
            v-for="bet in bets"
            :key="bet.betId"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div class="px-4 py-4 sm:px-5">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <button
                  @click="toggleBet(bet)"
                  class="flex-1 min-w-0 text-left hover:bg-slate-900/60 rounded-lg -m-2 p-2 transition">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                    <div>
                      <p class="text-[9px] text-slate-600 uppercase font-black">Bet</p>
                      <p class="text-xs font-black text-white mt-1">#{{ String(bet.betId || '').slice(0, 8) }}</p>
                      <p class="text-[10px] text-slate-500 mt-1">{{ formatDate(bet.placedAt) }}</p>
                    </div>
                    <div>
                      <p class="text-[9px] text-slate-600 uppercase font-black">Amount</p>
                      <p class="text-sm font-black text-white mt-1">{{ money(bet.stake) }} ETB</p>
                    </div>
                    <div>
                      <p class="text-[9px] text-slate-600 uppercase font-black">Status</p>
                      <span :class="statusClass(bet.status)" class="inline-flex mt-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
                        {{ bet.status || 'pending' }}
                      </span>
                    </div>
                    <div>
                      <p class="text-[9px] text-slate-600 uppercase font-black">Potential Payout</p>
                      <p class="text-sm font-black text-emerald-400 mt-1">{{ money(bet.potentialPayout) }} ETB</p>
                    </div>
                  </div>
                </button>

                <div class="flex items-center justify-between gap-2 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0 lg:pl-4">
                  <div class="flex items-center gap-2">
                    <button
                      v-if="isPending(bet)"
                      @click="$emit('pay-bet', bet)"
                      class="px-3 py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-xs font-black">
                      Pay
                    </button>
                    <button
                      v-if="canEditBet(bet)"
                      @click="startEditing(bet)"
                      class="px-3 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-black">
                      Edit
                    </button>
                    <button
                      v-if="isPending(bet)"
                      @click="cancelBet(bet)"
                      :disabled="cancellingBetId === bet.betId"
                      class="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ cancellingBetId === bet.betId ? 'Cancelling…' : 'Cancel' }}
                    </button>
                  </div>
                  <button
                    @click="toggleBet(bet)"
                    class="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-black">
                    {{ isExpanded(bet) ? 'Close ↑' : 'Open ↓' }}
                  </button>
                </div>
              </div>

              <div v-if="isExpanded(bet)" class="mt-5 pt-5 border-t border-slate-800">
                <div v-if="editingBetId === bet.betId" class="mb-5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div class="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p class="text-xs font-black text-white">Edit pending bet</p>
                      <p class="text-[10px] text-slate-500 mt-1">You can change the amount and selections until the event commence time.</p>
                    </div>
                    <button @click="cancelEditing" class="text-xs font-bold text-slate-500 hover:text-white">Close editor</button>
                  </div>

                  <div class="max-w-xs mb-4">
                    <label class="text-[9px] text-slate-600 uppercase font-black">Amount</label>
                    <input
                      v-model.number="editStake"
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-500 outline-none">
                  </div>

                  <div class="space-y-3">
                    <div
                      v-for="selection in editSelections"
                      :key="selection.id"
                      class="bg-slate-900 border border-slate-800 rounded-lg p-3">
                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div class="min-w-0">
                          <p class="text-xs font-black text-white truncate">
                            {{ selection.Event?.homeTeam || selection.outcomeName }} vs {{ selection.Event?.awayTeam || 'Opponent' }}
                          </p>
                          <p class="text-[10px] text-slate-500 mt-0.5">Starts {{ formatDate(selection.Event?.commenceTime) }}</p>
                        </div>
                        <select
                          v-model="selection.outcomeName"
                          class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500">
                          <option v-for="option in matchOptions(selection)" :key="option.key" :value="option.name">
                            {{ option.label }} — {{ option.name }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-end gap-2 mt-4">
                    <button @click="cancelEditing" class="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs font-black">
                      Discard
                    </button>
                    <button
                      @click="saveBet(bet)"
                      :disabled="savingBetId === bet.betId"
                      class="px-4 py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ savingBetId === bet.betId ? 'Saving…' : 'Save Changes' }}
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <p class="text-[9px] text-slate-600 uppercase font-black">Total Odds</p>
                    <p class="text-sm font-black text-amber-400 mt-1">{{ Number(bet.totalOdds || 0).toFixed(2) }}</p>
                  </div>
                  <div>
                    <p class="text-[9px] text-slate-600 uppercase font-black">Selections</p>
                    <p class="text-sm font-black text-white mt-1">{{ (bet.selections || []).length }}</p>
                  </div>
                  <div>
                    <p class="text-[9px] text-slate-600 uppercase font-black">Payment</p>
                    <p class="text-sm font-black text-slate-300 mt-1">Not paid</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="selection in (bet.selections || [])"
                    :key="selection.id"
                    class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    <div class="px-3 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p class="text-xs font-black text-white">
                        {{ selection.Event?.homeTeam || selection.outcomeName }} vs {{ selection.Event?.awayTeam || 'Opponent' }}
                      </p>
                      <p class="text-[10px] text-slate-500">Commences {{ formatDate(selection.Event?.commenceTime) }}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-2 p-3">
                      <div
                        v-for="option in matchOptions(selection)"
                        :key="option.key"
                        :class="option.selected ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'"
                        class="border rounded-lg px-2 py-3 text-center">
                        <p class="text-[9px] font-black uppercase">{{ option.label }}</p>
                        <p class="text-[10px] font-bold truncate mt-0.5">{{ option.name }}</p>
                        <p class="text-[9px] font-black mt-1">{{ option.selected ? '✓ SELECTED' : 'Not selected' }}</p>
                      </div>
                    </div>
                    <div class="px-3 pb-3">
                      <p class="text-[10px] text-slate-500">
                        Odds at bet: <span class="text-slate-300 font-bold">{{ Number(selection.oddsAtBet || 0).toFixed(2) }}</span>
                      </p>
                    </div>
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
import ConfirmModal from '@/components/ConfirmModal.vue';

export default {
  name: 'BetHistoryModal',
  props: {
    isOpen: { type: Boolean, default: false },
    userId: { type: String, default: '' },
    api: { type: String, default: 'http://localhost:3000/api' },
  },
  components: { ConfirmModal },
  emits: ['close', 'pay-bet'],
  data() {
    return {
      bets: [],
      loading: false,
      error: '',
      cancellingBetId: null,
      confirmCancelBet: null,
      savingBetId: null,
      expandedBetIds: [],
      editingBetId: null,
      editStake: null,
      editSelections: [],
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
        this.expandedBetIds = [];
        this.cancelEditing();
      } catch (e) {
        console.error('fetchHistory', e);
        this.error = e.message || 'Could not load bet history.';
      } finally {
        this.loading = false;
      }
    },
    isExpanded(bet) {
      return this.expandedBetIds.includes(bet.betId);
    },
    toggleBet(bet) {
      if (this.isExpanded(bet)) {
        this.expandedBetIds = this.expandedBetIds.filter(id => id !== bet.betId);
      } else {
        this.expandedBetIds = [...this.expandedBetIds, bet.betId];
      }
    },
    isPending(bet) {
      return String(bet.status || '').toLowerCase() === 'pending';
    },
    canEditBet(bet) {
      if (!this.isPending(bet) || !(bet.selections || []).length) return false;
      return bet.selections.every(selection => {
        const commence = selection.Event?.commenceTime;
        return commence && new Date(commence).getTime() > Date.now();
      });
    },
    startEditing(bet) {
      if (!this.canEditBet(bet)) return;
      if (!this.isExpanded(bet)) this.toggleBet(bet);
      this.editingBetId = bet.betId;
      this.editStake = Number(bet.stake || 0);
      this.editSelections = (bet.selections || []).map(selection => ({ ...selection }));
    },
    cancelEditing() {
      this.editingBetId = null;
      this.editStake = null;
      this.editSelections = [];
      this.savingBetId = null;
    },
    async saveBet(bet) {
      if (!this.userId || !this.canEditBet(bet) || this.savingBetId) return;

      this.savingBetId = bet.betId;
      this.error = '';
      try {
        const selections = this.editSelections.map(selection => ({
          eventId: selection.eventId,
          marketKey: selection.marketKey,
          outcomeName: selection.outcomeName,
          point: selection.point ?? null,
        }));
        const res = await fetch(
          `${this.api}/bets/${encodeURIComponent(this.userId)}/${encodeURIComponent(bet.betId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stake: this.editStake, selections }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Could not update the bet.');

        const index = this.bets.findIndex(item => item.betId === bet.betId);
        if (index !== -1) this.bets.splice(index, 1, data.data);
        this.cancelEditing();
      } catch (e) {
        console.error('saveBet', e);
        this.error = e.message || 'Could not update the bet.';
      } finally {
        this.savingBetId = null;
      }
    },
    cancelBet(bet) {
      if (!this.userId || !bet?.betId || !this.isPending(bet) || this.cancellingBetId) return;
      this.confirmCancelBet = bet;
    },
    async confirmCancellation() {
      const bet = this.confirmCancelBet;
      this.confirmCancelBet = null;
      if (!bet || !this.userId || !bet?.betId || !this.isPending(bet) || this.cancellingBetId) return;

      this.cancellingBetId = bet.betId;
      this.error = '';
      try {
        const res = await fetch(
          `${this.api}/bets/${encodeURIComponent(this.userId)}/${encodeURIComponent(bet.betId)}/cancel`,
          { method: 'POST' }
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Could not cancel the bet.');

        const index = this.bets.findIndex(item => item.betId === bet.betId);
        if (index !== -1) {
          this.bets.splice(index, 1, {
            ...this.bets[index],
            ...(data.data || {}),
            status: 'cancelled',
          });
        }
        this.cancelEditing();
      } catch (e) {
        console.error('cancelBet', e);
        this.error = e.message || 'Could not cancel the bet.';
      } finally {
        this.cancellingBetId = null;
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
    matchOptions(selection) {
      const home = selection.Event?.homeTeam || 'Home';
      const away = selection.Event?.awayTeam || 'Away';
      const selected = selection.outcomeName;
      return [
        { key: 'home', label: '1', name: home, selected: selected === home },
        { key: 'draw', label: 'X', name: 'Draw', selected: selected === 'Draw' },
        { key: 'away', label: '2', name: away, selected: selected === away },
      ];
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
