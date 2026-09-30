<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
      <!-- Close Button -->
      <button @click="$emit('close')" class="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>

      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span class="text-primary">💳</span> Deposit Funds
      </h3>

      <form @submit.prevent="handleDeposit" class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Amount (ETB)</label>
          <input 
            v-model.number="amount" 
            type="number" 
            min="50" 
            required 
            class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" 
            placeholder="Enter amount in ETB" 
          />
        </div>

        <div>
          <label class="block text-xs text-slate-400 uppercase font-bold mb-1">Payment Method</label>
          <select v-model="paymentMethod" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary">
            <option value="telebirr">Telebirr</option>
            <option value="cbe_birr">CBE Birr</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div class="bg-slate-950 p-3 rounded text-xs text-slate-400 flex justify-between">
          <span>Fee:</span>
          <span class="text-emerald-400 font-bold">0.00 ETB</span>
        </div>

        <button type="submit" class="w-full bg-primary hover:bg-primary text-black font-bold py-2.5 rounded text-sm uppercase transition tracking-wide">
          Confirm Deposit
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DepositModal',
  props: {
    isOpen: { type: Boolean, default: false }
  },
  emits: ['close', 'depositSuccess'],
  data() {
    return {
      amount: 500,
      paymentMethod: 'telebirr'
    };
  },
  methods: {
    handleDeposit() {
      if (this.amount > 0) {
        this.$emit('depositSuccess', this.amount);
        this.$emit('close');
      }
    }
  }
};
</script>