<template>
  <section class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-[1920px] mx-auto">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div><p class="text-xs font-black text-amber-500 uppercase tracking-widest">Administration</p><h1 class="text-2xl font-black text-slate-900 mt-1">Payment Proofs</h1><p class="text-sm text-slate-500 mt-1">Review submitted receipts before completing the linked bet.</p></div>
        <button @click="fetchPayments" :disabled="loading" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition"><i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>Refresh</button>
      </div>
      <div v-if="error" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div v-for="card in summaryCards" :key="card.label" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ card.label }}</p><p class="text-xl font-black text-slate-900 mt-2">{{ card.value }}</p></div>
      </div>
      <div v-if="loading && payments.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400"><i class="fas fa-spinner fa-spin text-xl mb-3"></i><p class="text-sm font-medium">Loading payment proofs...</p></div>
      <div v-else-if="payments.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400"><i class="fas fa-file-invoice text-3xl text-slate-200 mb-3"></i><p class="text-sm font-bold">No payment proofs found.</p></div>
      <div v-else class="space-y-4">
        <article v-for="proof in payments" :key="proof.id" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div class="p-5 flex flex-col xl:flex-row gap-5">
            <div class="w-full xl:w-80 shrink-0"><div class="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200"><img :src="proof.screenshotUrl" :alt="'Payment proof ' + proof.id" class="w-full h-full object-contain" /></div></div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div><div class="flex items-center gap-2"><span class="text-lg font-black text-slate-900">Proof #{{ proof.id }}</span><span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase" :class="statusClass(proof.status)">{{ proof.status }}</span></div><p class="text-xs text-slate-400 mt-1">{{ formatDate(proof.createdAt) }}</p></div>
                <div class="text-right"><p class="text-xl font-black text-amber-600">ETB {{ money(proof.amount) }}</p><p class="text-[10px] text-slate-400 uppercase font-bold">{{ proof.method }}</p></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                <div class="rounded-lg bg-slate-50 border border-slate-100 p-3"><p class="text-[9px] uppercase tracking-wider font-black text-slate-400">User ID</p><p class="text-xs font-bold text-slate-700 break-all mt-1">{{ proof.userId }}</p></div>
                <div class="rounded-lg bg-slate-50 border border-slate-100 p-3"><p class="text-[9px] uppercase tracking-wider font-black text-slate-400">Bet ID</p><p class="text-xs font-bold text-slate-700 break-all mt-1">{{ proof.betId || '—' }}</p></div>
                <div class="rounded-lg bg-slate-50 border border-slate-100 p-3"><p class="text-[9px] uppercase tracking-wider font-black text-slate-400">Transaction Reference</p><p class="text-xs font-bold text-slate-700 break-all mt-1">{{ proof.txReference || '—' }}</p></div>
                <div class="rounded-lg bg-slate-50 border border-slate-100 p-3"><p class="text-[9px] uppercase tracking-wider font-black text-slate-400">Sender</p><p class="text-xs font-bold text-slate-700 mt-1">{{ proof.senderName || '—' }}</p><p class="text-[10px] text-slate-500">{{ proof.senderPhone || '' }}</p></div>
              </div>
              <div v-if="proof.status === 'rejected'" class="mt-4 rounded-lg border border-red-100 bg-red-50 p-3"><p class="text-[9px] uppercase tracking-wider font-black text-red-500">Rejection Reason</p><p class="text-xs text-red-700 mt-1">{{ proof.rejectionReason || '—' }}</p></div>
              <div v-if="proof.status === 'pending'" class="mt-5">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Rejection reason</label>
                <textarea v-model="rejectionReasons[proof.id]" rows="2" maxlength="255" placeholder="Explain why this payment proof is being rejected" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none"></textarea>
                <div class="flex flex-wrap gap-2 mt-3">
                  <button @click="approve(proof)" :disabled="processingId === proof.id" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-black hover:bg-green-700 disabled:opacity-60 transition"><i class="fas fa-check"></i>Approve &amp; Complete Bet</button>
                  <button @click="reject(proof)" :disabled="processingId === proof.id" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-60 transition"><i class="fas fa-times"></i>Reject Proof</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
<script>
export default {
  name:'PaymentProofView',
  data(){return{payments:[],loading:false,processingId:null,error:'',rejectionReasons:{}}},
  computed:{summaryCards(){return[{label:'Total',value:this.payments.length},{label:'Pending',value:this.payments.filter(x=>x.status==='pending').length},{label:'Approved',value:this.payments.filter(x=>x.status==='approved').length},{label:'Rejected',value:this.payments.filter(x=>x.status==='rejected').length}]}},
  async mounted(){await this.fetchPayments()},
  methods:{
    baseUrl(){return(import.meta.env.VITE_BACKEND_URL||'http://localhost:3000/api').replace(/\/$/,'')},
    authHeaders(){return{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem('token')}},
    async fetchPayments(){
      if(this.$checkRole()!=='admin'){this.$router.push('/');return}
      this.loading=true;this.error='';
      try{const adminUserId=localStorage.getItem('userId');const response=await fetch(this.baseUrl()+'/payments?adminUserId='+encodeURIComponent(adminUserId),{headers:this.authHeaders()});const data=await response.json().catch(()=>({}));if(!response.ok||data.success===false)throw new Error(data.error||'Failed to load payment proofs.');this.payments=data.data||[]}catch(error){this.error=error?.message||'Failed to load payment proofs.'}finally{this.loading=false}
    },
    async approve(proof){
      if(this.processingId)return;this.processingId=proof.id;this.error='';
      try{const response=await fetch(this.baseUrl()+'/payments/'+proof.id+'/approve',{method:'POST',headers:this.authHeaders(),body:JSON.stringify({adminUserId:localStorage.getItem('userId')})});const data=await response.json().catch(()=>({}));if(!response.ok||data.success===false)throw new Error(data.error||'Failed to approve payment proof.');await this.fetchPayments()}catch(error){this.error=error?.message||'Failed to approve payment proof.'}finally{this.processingId=null}
    },
    async reject(proof){
      if(this.processingId)return;const reason=String(this.rejectionReasons[proof.id]||'').trim();if(!reason){this.error='Please enter a rejection reason before rejecting a payment proof.';return}
      this.processingId=proof.id;this.error='';
      try{const response=await fetch(this.baseUrl()+'/payments/'+proof.id+'/reject',{method:'POST',headers:this.authHeaders(),body:JSON.stringify({adminUserId:localStorage.getItem('userId'),reason})});const data=await response.json().catch(()=>({}));if(!response.ok||data.success===false)throw new Error(data.error||'Failed to reject payment proof.');delete this.rejectionReasons[proof.id];await this.fetchPayments()}catch(error){this.error=error?.message||'Failed to reject payment proof.'}finally{this.processingId=null}
    },
    money(value){return Number(value).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})},
    formatDate(value){if(!value)return'—';return new Date(value).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})},
    statusClass(status){return{'bg-amber-50 text-amber-700':status==='pending','bg-green-50 text-green-700':status==='approved','bg-red-50 text-red-700':status==='rejected'}}
  }
}
</script>