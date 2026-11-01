<template>
  <section class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-[1920px] mx-auto">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <p class="text-xs font-black text-amber-500 uppercase tracking-widest">Administration</p>
          <h1 class="text-2xl font-black text-slate-900 mt-1">Payment Proofs</h1>
          <p class="text-sm text-slate-500 mt-1">Review submitted receipts before completing the linked bet.</p>
        </div>
        <button
          @click="fetchPayments"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>

      <div v-if="error" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ error }}
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
        >
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ card.label }}</p>
          <p class="text-xl font-black text-slate-900 mt-2">{{ card.value }}</p>
        </div>
      </div>

      <div v-if="loading && payments.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        <i class="fas fa-spinner fa-spin text-xl mb-3"></i>
        <p class="text-sm font-medium">Loading payment proofs...</p>
      </div>

      <div v-else-if="payments.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        <i class="fas fa-file-invoice text-3xl text-slate-200 mb-3"></i>
        <p class="text-sm font-bold">No payment proofs found.</p>
      </div>

      <div v-else class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1050px] text-left">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Proof</th>
                <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">User / Bet</th>
                <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Payment</th>
                <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Transaction</th>
                <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Date</th>
                <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="proof in payments" :key="proof.id" class="hover:bg-slate-50/70 transition">
                <td class="px-4 py-4">
                  <button
                    @click="openProof(proof)"
                    class="inline-flex items-center gap-2 text-xs font-black text-slate-700 hover:text-amber-600 transition"
                  >
                    <span class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img
                        v-if="proof.screenshotUrl && !imageErrors[proof.id]"
                        :src="proof.screenshotUrl"
                        :alt="'Proof ' + proof.id"
                        class="w-full h-full object-cover"
                        @error="markImageError(proof.id)"
                      />
                      <i v-else class="fas fa-file-image text-slate-400"></i>
                    </span>
                    <span>
                      <span class="block">Proof #{{ proof.id }}</span>
                      <span class="block text-[10px] font-medium text-amber-600 mt-0.5">View receipt</span>
                    </span>
                  </button>
                </td>
                <td class="px-4 py-4">
                  <p class="text-xs font-bold text-slate-700 max-w-[190px] truncate" :title="proof.User?.fullName || proof.userId">{{ proof.User?.fullName || 'Unknown player' }}</p>
                  <p class="text-[10px] text-slate-400 mt-1 max-w-[190px] truncate" :title="proof.betId || ''">
                    Bet: {{ proof.betId || '—' }}
                  </p>
                </td>
                <td class="px-4 py-4">
                  <p class="text-sm font-black text-amber-600">ETB {{ money(proof.amount) }}</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ proof.method || '—' }}</p>
                  <p class="text-[10px] text-slate-500 mt-1">{{ proof.senderName || '—' }}</p>
                </td>
                <td class="px-4 py-4">
                  <p class="text-xs font-bold text-slate-700 max-w-[160px] truncate" :title="proof.txReference || ''">
                    {{ proof.txReference || '—' }}
                  </p>
                  <p class="text-[10px] text-slate-400 mt-1">{{ proof.senderPhone || '—' }}</p>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <p class="text-xs font-bold text-slate-700">{{ formatDate(proof.createdAt) }}</p>
                </td>
                <td class="px-4 py-4">
                  <span class="inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase" :class="statusClass(proof.status)">
                    {{ proof.status }}
                  </span>
                  <p v-if="proof.status === 'rejected'" class="text-[10px] text-red-600 mt-2 max-w-[150px]" :title="proof.rejectionReason">
                    {{ proof.rejectionReason || 'No reason provided.' }}
                  </p>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="openProof(proof)"
                      class="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-amber-600 hover:border-amber-300 transition"
                      title="View payment proof"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      v-if="proof.status === 'pending'"
                      @click="approve(proof)"
                      :disabled="processingId === proof.id"
                      class="w-9 h-9 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition"
                      title="Approve and complete bet"
                    >
                      <i class="fas" :class="processingId === proof.id ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                    </button>
                    <button
                      v-if="proof.status === 'pending'"
                      @click="openReject(proof)"
                      :disabled="processingId === proof.id"
                      class="w-9 h-9 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition"
                      title="Reject payment proof"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Payment proof preview / review modal -->
    <div
      v-if="selectedProof"
      class="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4"
      @click.self="closeProof"
    >
      <div class="w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-black text-slate-900">Payment Proof #{{ selectedProof.id }}</h2>
              <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase" :class="statusClass(selectedProof.status)">
                {{ selectedProof.status }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Review the submitted receipt and payment details.</p>
          </div>
          <button @click="closeProof" class="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5">
          <div class="grid lg:grid-cols-[minmax(0,1fr)_330px] gap-5">
            <div class="rounded-xl border border-slate-200 bg-slate-100 min-h-[320px] flex items-center justify-center overflow-hidden">
              <div v-if="selectedProof.screenshotUrl && !imageErrors[selectedProof.id]" class="w-full h-full min-h-[320px] flex items-center justify-center p-3">
                <img
                  :src="selectedProof.screenshotUrl"
                  :alt="'Payment proof ' + selectedProof.id"
                  class="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                  @error="markImageError(selectedProof.id)"
                />
              </div>
              <div v-else class="text-center p-8">
                <i class="fas fa-file-image text-4xl text-slate-300 mb-3"></i>
                <p class="text-sm font-bold text-slate-600">The receipt image could not be displayed.</p>
                <p class="text-xs text-slate-400 mt-1">Check that the backend upload file exists and is publicly accessible.</p>
                <a
                  v-if="selectedProof.screenshotUrl"
                  :href="selectedProof.screenshotUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  <i class="fas fa-external-link-alt"></i>
                  Open File
                </a>
              </div>
            </div>

            <div class="space-y-3">
              <div class="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p class="text-[9px] font-black uppercase tracking-wider text-slate-400">Amount</p>
                <p class="text-2xl font-black text-amber-600 mt-1">ETB {{ money(selectedProof.amount) }}</p>
                <p class="text-xs font-bold text-slate-500 uppercase mt-1">{{ selectedProof.method || '—' }}</p>
              </div>

              <div class="rounded-xl border border-slate-200 p-4 space-y-3">
                <div><p class="text-[9px] font-black uppercase text-slate-400">Player</p><p class="text-xs font-bold text-slate-700 mt-1">{{ selectedProof.User?.fullName || 'Unknown player' }}</p><p class="text-[10px] text-slate-400 break-all mt-0.5">{{ selectedProof.User?.phoneNumber || selectedProof.userId }}</p></div>
                <div>
                  <p class="text-[9px] font-black uppercase text-slate-400">Bet</p>
                  <p class="text-xs font-bold text-slate-700 mt-1">{{ betSummary(selectedProof) }}</p>
                  <p class="text-[10px] text-slate-400 break-all mt-0.5">{{ selectedProof.betId || '—' }}</p>
                  <div v-if="selectedProof.Bet?.selections?.length" class="mt-2 space-y-1">
                    <p v-for="selection in selectedProof.Bet.selections" :key="selection.id" class="text-[10px] text-slate-600">
                      {{ selection.Event?.homeTeam || selection.eventId }} vs {{ selection.Event?.awayTeam || '' }} · {{ selection.outcomeName }} @ {{ selection.oddsAtBet }}
                    </p>
                  </div>
                </div>
                <div><p class="text-[9px] font-black uppercase text-slate-400">Transaction Reference</p><p class="text-xs font-bold text-slate-700 break-all mt-1">{{ selectedProof.txReference || '—' }}</p></div>
                <div><p class="text-[9px] font-black uppercase text-slate-400">Sender</p><p class="text-xs font-bold text-slate-700 mt-1">{{ selectedProof.senderName || '—' }}</p><p class="text-xs text-slate-500 mt-0.5">{{ selectedProof.senderPhone || '—' }}</p></div>
                <div><p class="text-[9px] font-black uppercase text-slate-400">Submitted</p><p class="text-xs font-bold text-slate-700 mt-1">{{ formatDate(selectedProof.createdAt) }}</p></div>
              </div>

              <div v-if="selectedProof.status === 'rejected'" class="rounded-xl border border-red-100 bg-red-50 p-4">
                <p class="text-[9px] font-black uppercase tracking-wider text-red-500">Rejection Reason</p>
                <p class="text-xs text-red-700 mt-1">{{ selectedProof.rejectionReason || '—' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedProof.status === 'pending'" class="border-t border-slate-200 px-5 py-4 bg-slate-50">
          <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Rejection reason</label>
          <textarea
            v-model="rejectionReasons[selectedProof.id]"
            rows="2"
            maxlength="255"
            placeholder="Explain why this payment proof is being rejected"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none"
          ></textarea>
          <div class="flex flex-wrap justify-end gap-2 mt-3">
            <button
              @click="approve(selectedProof)"
              :disabled="processingId === selectedProof.id"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-black hover:bg-green-700 disabled:opacity-60 transition"
            >
              <i class="fas" :class="processingId === selectedProof.id ? 'fa-spinner fa-spin' : 'fa-check'"></i>
              Approve &amp; Complete Bet
            </button>
            <button
              @click="reject(selectedProof)"
              :disabled="processingId === selectedProof.id"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-60 transition"
            >
              <i class="fas fa-times"></i>
              Reject Proof
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'PaymentProofView',
  data() {
    return {
      payments: [],
      loading: false,
      processingId: null,
      error: '',
      rejectionReasons: {},
      selectedProof: null,
      imageErrors: {}
    };
  },
  computed: {
    summaryCards() {
      return [
        { label: 'Total', value: this.payments.length },
        { label: 'Pending', value: this.payments.filter(x => x.status === 'pending').length },
        { label: 'Approved', value: this.payments.filter(x => x.status === 'approved').length },
        { label: 'Rejected', value: this.payments.filter(x => x.status === 'rejected').length }
      ];
    }
  },
  async mounted() {
    await this.fetchPayments();
  },
  methods: {
    baseUrl() {
      return (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    },
    authHeaders() {
      return {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (localStorage.getItem('access') || localStorage.getItem('token'))
      };
    },
    async fetchPayments() {
      if (this.$checkRole() !== 'admin') {
        this.$router.push('/');
        return;
      }
      this.loading = true;
      this.error = '';
      try {
        const adminUserId = localStorage.getItem('userId');
        const response = await fetch(
          this.baseUrl() + '/payments?adminUserId=' + encodeURIComponent(adminUserId),
          { headers: this.authHeaders() }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.error || 'Failed to load payment proofs.');
        }
        this.payments = data.data || [];
      } catch (error) {
        this.error = error?.message || 'Failed to load payment proofs.';
      } finally {
        this.loading = false;
      }
    },
    openProof(proof) {
      this.selectedProof = proof;
    },
    closeProof() {
      this.selectedProof = null;
    },
    markImageError(id) {
      this.imageErrors = { ...this.imageErrors, [id]: true };
    },
    async approve(proof) {
      if (this.processingId) return;
      this.processingId = proof.id;
      this.error = '';
      try {
        const response = await fetch(
          this.baseUrl() + '/payments/' + proof.id + '/approve',
          {
            method: 'POST',
            headers: this.authHeaders(),
            body: JSON.stringify({ adminUserId: localStorage.getItem('userId') })
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.error || 'Failed to approve payment proof.');
        }
        this.closeProof();
        await this.fetchPayments();
      } catch (error) {
        this.error = error?.message || 'Failed to approve payment proof.';
      } finally {
        this.processingId = null;
      }
    },
    async reject(proof) {
      if (this.processingId) return;
      const reason = String(this.rejectionReasons[proof.id] || '').trim();
      if (!reason) {
        this.error = 'Please enter a rejection reason before rejecting a payment proof.';
        return;
      }
      this.processingId = proof.id;
      this.error = '';
      try {
        const response = await fetch(
          this.baseUrl() + '/payments/' + proof.id + '/reject',
          {
            method: 'POST',
            headers: this.authHeaders(),
            body: JSON.stringify({
              adminUserId: localStorage.getItem('userId'),
              reason
            })
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.error || 'Failed to reject payment proof.');
        }
        delete this.rejectionReasons[proof.id];
        this.closeProof();
        await this.fetchPayments();
      } catch (error) {
        this.error = error?.message || 'Failed to reject payment proof.';
      } finally {
        this.processingId = null;
      }
    },
    betSummary(proof) {
      const selections = proof?.Bet?.selections || [];
      if (selections.length) {
        return selections.map(s => {
          const home = s.Event?.homeTeam || '';
          const away = s.Event?.awayTeam || '';
          return home && away ? home + ' vs ' + away : (s.outcomeName || proof.betId || '—');
        }).join(' • ');
      }
      return proof?.betId ? 'Bet #' + String(proof.betId).slice(0, 8) : '—';
    },
    money(value) {
      return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    formatDate(value) {
      if (!value) return '—';
      return new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    statusClass(status) {
      return {
        'bg-amber-50 text-amber-700': status === 'pending',
        'bg-green-50 text-green-700': status === 'approved',
        'bg-red-50 text-red-700': status === 'rejected'
      };
    }
  }
};
</script>