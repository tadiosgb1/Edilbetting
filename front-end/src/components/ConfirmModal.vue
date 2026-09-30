<template>
  <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-800">
        <h3 class="text-base font-black text-white">{{ title }}</h3>
      </div>
      <div class="px-5 py-4">
        <p class="text-sm leading-6 text-slate-300">{{ message }}</p>
      </div>
      <div class="px-5 py-4 border-t border-slate-800 flex justify-end gap-2">
        <button @click="$emit('cancel')" class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-black">
          {{ cancelText }}
        </button>
        <button @click="$emit('confirm')" class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-400 text-xs font-black">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm action' },
    message: { type: String, default: 'Are you sure?' },
    cancelText: { type: String, default: 'Cancel' },
    confirmText: { type: String, default: 'Confirm' },
  },
  emits: ['cancel', 'confirm'],
};
</script>
