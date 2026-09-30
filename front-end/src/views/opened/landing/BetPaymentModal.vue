<template>
  <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
      <button @click="close" class="absolute top-4 right-4 text-slate-400 hover:text-white font-bold" :disabled="isSubmitting">✕</button>
      <h3 class="text-lg font-bold text-white mb-1">💳 Deposit for Your Bet</h3>
      <p class="text-xs text-slate-400 mb-4">
        Bet <span class="text-slate-200 font-bold">{{ betId || '—' }}</span> requires
        <span class="text-amber-400 font-black">{{ amount.toFixed(2) }} ETB</span>.
        Send the payment and upload the receipt so it can be reviewed.
      </p>
      <form @submit.prevent="submitPaymentProof" class="space-y-3">
        <div>
          <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Payment Method</label>
          <select v-model="paymentProof.method" required class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
            <option value="telebirr">Telebirr</option><option value="cbe">CBE</option><option value="other">Other / Bank Transfer</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Transaction Reference</label>
          <input v-model.trim="paymentProof.txReference" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Transaction / receipt number"/>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input v-model.trim="paymentProof.senderName" type="text" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Sender name"/>
          <input v-model.trim="paymentProof.senderPhone" type="tel" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Sender phone"/>
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Payment Screenshot *</label>
          <input @change="handlePaymentScreenshot" type="file" accept="image/*" required class="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-amber-400 hover:file:bg-slate-700"/>
          <p class="text-[9px] text-slate-600 mt-1">Upload the Telebirr/CBE receipt screenshot.</p>
        </div>
        <p v-if="error" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{{ error }}</p>
        <button type="submit" :disabled="isSubmitting || !paymentProof.screenshotUrl" class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black py-3 rounded-xl text-sm uppercase tracking-wider transition">
          {{ isSubmitting ? 'Submitting…' : 'Submit Payment Proof →' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BetPaymentModal',
  props: {
    isOpen: { type: Boolean, default: false },
    api: { type: String, default: 'http://localhost:3000/api' },
    userId: { type: String, default: '' },
    betId: { type: [String, Number], default: null },
    amount: { type: Number, default: 0 },
  },
  emits: ['close', 'success'],
  data() {
    return { isSubmitting: false, error: '', paymentProof: this.emptyPaymentProof() };
  },
  watch: {
    isOpen(value) {
      if (value) { this.error = ''; this.paymentProof = this.emptyPaymentProof(); }
    },
  },
  methods: {
    emptyPaymentProof() {
      return { method: 'telebirr', txReference: '', senderName: '', senderPhone: '', screenshotUrl: '', imageHash: '' };
    },
    close() { if (!this.isSubmitting) this.$emit('close'); },
    handlePaymentScreenshot(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { this.paymentProof.screenshotUrl = reader.result; };
      reader.readAsDataURL(file);
    },
    async submitPaymentProof() {
      if (!this.userId) { this.error = 'Please login before submitting payment proof.'; return; }
      if (!this.betId) { this.error = 'A valid bet ID is required before submitting payment proof.'; return; }
      if (!this.paymentProof.screenshotUrl) { this.error = 'Please upload the payment screenshot.'; return; }

      this.isSubmitting = true;
      this.error = '';
      try {
        const res = await fetch(`${this.api}/payments/deposit-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId, betId: this.betId, method: this.paymentProof.method, amount: this.amount,
            txReference: this.paymentProof.txReference || null, senderName: this.paymentProof.senderName || null,
            senderPhone: this.paymentProof.senderPhone || null, screenshotUrl: this.paymentProof.screenshotUrl,
            imageHash: this.paymentProof.imageHash || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Could not submit payment proof.');
        this.$emit('success', data.data);
        this.$emit('close');
        this.paymentProof = this.emptyPaymentProof();
      } catch (e) {
        console.error('BetPaymentModal.submitPaymentProof', e);
        this.error = e.message || 'Could not submit payment proof.';
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>
