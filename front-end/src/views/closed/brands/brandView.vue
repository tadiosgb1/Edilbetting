<template>
  <section class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div><p class="text-xs font-black text-primary uppercase tracking-widest">Administration</p><h1 class="text-2xl font-black text-slate-900 mt-1">Brand Colors</h1><p class="text-sm text-slate-500 mt-1">Change the platform theme at runtime. Settings are stored locally for now.</p></div>
        <button @click="restoreDefaults" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition"><i class="fas fa-undo"></i> Restore defaults</button>
      </div>
      <div class="grid lg:grid-cols-[1fr_360px] gap-6">
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
          <div class="space-y-5">
            <div v-for="item in colorFields" :key="item.key" class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex-1"><p class="text-sm font-black text-slate-800">{{ item.label }}</p><p class="text-xs text-slate-500 mt-1">{{ item.description }}</p></div>
              <div class="flex items-center gap-2"><input v-model="draft[item.key]" type="color" class="w-12 h-10 rounded-lg border border-slate-200 bg-white p-1 cursor-pointer"><input v-model="draft[item.key]" type="text" maxlength="7" class="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"></div>
            </div>
          </div>
          <div v-if="message" class="mt-5 rounded-lg px-4 py-3 text-sm font-bold" :class="messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">{{ message }}</div>
          <div class="flex justify-end mt-5"><button @click="save" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-black text-sm font-black hover:bg-primary-dense transition"><i class="fas fa-save"></i> Save brand</button></div>
        </div>
        <div class="bg-slate-900 rounded-2xl shadow-sm p-5 sm:p-6 text-white">
          <p class="text-xs font-black uppercase tracking-widest text-slate-400">Live preview</p>
          <div class="mt-5 rounded-xl overflow-hidden border border-slate-700">
            <div class="px-4 py-3" :style="{ backgroundColor: draft.secondary }"><div class="flex items-center gap-2"><span class="px-2 py-1 rounded font-black text-black" :style="{ backgroundColor: draft.primary }">EDIL</span><span class="font-black">BET</span></div></div>
            <div class="p-5" :style="{ backgroundColor: draft.tertiary }"><p class="text-white font-black text-lg">Platform preview</p><p class="text-slate-300 text-xs mt-1">Primary actions and accents use the selected primary color.</p><button class="mt-4 px-4 py-2 rounded-lg font-black text-black" :style="{ backgroundColor: draft.primary }">Primary action</button></div>
          </div>
          <div class="mt-5 space-y-2 text-xs"><p><span class="inline-block w-3 h-3 rounded-full mr-2" :style="{backgroundColor:draft.primary}"></span>Primary {{ draft.primary }}</p><p><span class="inline-block w-3 h-3 rounded-full mr-2" :style="{backgroundColor:draft.secondary}"></span>Secondary {{ draft.secondary }}</p><p><span class="inline-block w-3 h-3 rounded-full mr-2" :style="{backgroundColor:draft.tertiary}"></span>Tertiary {{ draft.tertiary }}</p></div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import { DEFAULT_BRAND, getBrand, saveBrand, resetBrand, applyBrand } from '@/utils/brand';
export default {
  name: 'BrandView',
  data() { return { draft: getBrand(), message: '', messageType: 'success', colorFields: [
    { key: 'primary', label: 'Primary', description: 'Main actions, accents, focus states and brand highlights.' },
    { key: 'secondary', label: 'Secondary', description: 'Dark surfaces, secondary actions and navigation accents.' },
    { key: 'tertiary', label: 'Tertiary', description: 'Supporting brand surfaces and visual depth.' },
  ]}; },
  mounted() { if (this.$checkRole() !== 'admin') { this.$router.push('/'); return; } this.draft = getBrand(); applyBrand(this.draft); },
  methods: {
    save() {
      if (!['primary','secondary','tertiary'].every(key => /^#[0-9a-f]{6}$/i.test(this.draft[key]))) { this.messageType='error'; this.message='Please use valid 6-digit hex colors, for example #F59E0B.'; return; }
      this.draft = saveBrand(this.draft); this.messageType='success'; this.message='Brand colors saved and applied across the app.';
    },
    restoreDefaults() { this.draft={...DEFAULT_BRAND}; resetBrand(); this.messageType='success'; this.message='Default Tailwind brand colors restored.'; },
  },
};
</script>