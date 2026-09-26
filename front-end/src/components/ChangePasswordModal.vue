<template>
  <teleport to="body">

    <!-- Backdrop -->
    <transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
        @click="$emit('close')"
      ></div>
    </transition>

    <!-- Drawer panel -->
    <transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[160] flex flex-col">

        <!-- Drawer header — same green gradient as Edit Profile -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <i class="fas fa-lock text-white text-sm"></i>
            </div>
            <div>
              <h2 class="text-white font-bold text-sm">Change Password</h2>
              <p class="text-green-100 text-[10px] uppercase tracking-widest">Security Settings</p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <!-- Drawer body (scrollable) -->
        <form @submit.prevent="submit" class="flex-1 overflow-y-auto">
          <div class="p-6 space-y-5">

            <!-- Security tip banner -->
            <div class="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <i class="fas fa-shield-alt text-green-500 mt-0.5 text-sm shrink-0"></i>
              <p class="text-xs text-green-700 leading-relaxed">
                Use a strong password with uppercase letters, numbers, and symbols. Never share it with anyone.
              </p>
            </div>

            <!-- Current Password -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-key text-gray-400 mr-1.5"></i>Current Password
              </label>
              <div class="relative">
                <input
                  v-model="form.currentPassword"
                  :type="show.current ? 'text' : 'password'"
                  required
                  placeholder="Enter your current password"
                  class="w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  :class="errors.currentPassword ? 'border-red-400' : 'border-gray-300'"
                />
                <button type="button" @click="show.current = !show.current"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <i :class="show.current ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                </button>
              </div>
              <p v-if="errors.currentPassword" class="text-red-500 text-[11px] mt-1">
                <i class="fas fa-exclamation-circle mr-1"></i>{{ errors.currentPassword }}
              </p>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-3">
              <div class="flex-1 h-px bg-gray-100"></div>
              <span class="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">New Password</span>
              <div class="flex-1 h-px bg-gray-100"></div>
            </div>

            <!-- New Password -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-lock text-gray-400 mr-1.5"></i>New Password
              </label>
              <div class="relative">
                <input
                  v-model="form.newPassword"
                  :type="show.newPwd ? 'text' : 'password'"
                  required
                  placeholder="At least 6 characters"
                  class="w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  :class="errors.newPassword ? 'border-red-400' : 'border-gray-300'"
                />
                <button type="button" @click="show.newPwd = !show.newPwd"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <i :class="show.newPwd ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                </button>
              </div>
              <p v-if="errors.newPassword" class="text-red-500 text-[11px] mt-1">
                <i class="fas fa-exclamation-circle mr-1"></i>{{ errors.newPassword }}
              </p>

              <!-- Strength bar -->
              <div v-if="form.newPassword" class="mt-2.5 space-y-1.5">
                <div class="flex gap-1">
                  <div
                    v-for="n in 4" :key="n"
                    class="h-1.5 flex-1 rounded-full transition-all duration-300"
                    :class="n <= strength.score ? strength.barColor : 'bg-gray-200'"
                  ></div>
                </div>
                <div class="flex items-center gap-1.5">
                  <i class="fas fa-circle text-[6px]" :class="strength.textColor"></i>
                  <p class="text-[11px] font-semibold" :class="strength.textColor">{{ strength.label }}</p>
                </div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-check-circle text-gray-400 mr-1.5"></i>Confirm New Password
              </label>
              <div class="relative">
                <input
                  v-model="form.confirmPassword"
                  :type="show.confirm ? 'text' : 'password'"
                  required
                  placeholder="Re-enter new password"
                  class="w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  :class="errors.confirmPassword ? 'border-red-400' : 'border-gray-300'"
                />
                <button type="button" @click="show.confirm = !show.confirm"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <i :class="show.confirm ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                </button>
              </div>
              <!-- Match indicator -->
              <p v-if="errors.confirmPassword" class="text-red-500 text-[11px] mt-1">
                <i class="fas fa-exclamation-circle mr-1"></i>{{ errors.confirmPassword }}
              </p>
              <p
                v-else-if="form.confirmPassword && form.newPassword === form.confirmPassword"
                class="text-green-600 text-[11px] mt-1"
              >
                <i class="fas fa-check-circle mr-1"></i>Passwords match
              </p>
            </div>

            <!-- Server error -->
            <div
              v-if="serverError"
              class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3"
            >
              <i class="fas fa-exclamation-triangle shrink-0"></i>
              <span>{{ serverError }}</span>
            </div>

          </div>
        </form>

        <!-- Drawer footer (sticky) -->
        <div class="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submit"
            :disabled="saving"
            class="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition disabled:opacity-60"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin text-xs"></i>
            <i v-else class="fas fa-shield-alt text-xs"></i>
            {{ saving ? 'Updating…' : 'Update Password' }}
          </button>
        </div>

      </div><!-- /drawer panel -->
    </transition>

  </teleport>
</template>

<script>
export default {
  name: 'ChangePasswordModal',
  emits: ['close', 'changed'],

  data() {
    return {
      saving: false,
      serverError: '',
      form: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      errors: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      show: {
        current: false,
        newPwd: false,
        confirm: false
      }
    };
  },

  computed: {
    strength() {
      const p = this.form.newPassword;
      let score = 0;
      if (p.length >= 6)  score++;
      if (p.length >= 10) score++;
      if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
      if (/[^A-Za-z0-9]/.test(p)) score++;

      const levels = [
        { label: 'Too short', barColor: 'bg-red-400',    textColor: 'text-red-500'    },
        { label: 'Weak',      barColor: 'bg-orange-400', textColor: 'text-orange-500' },
        { label: 'Fair',      barColor: 'bg-yellow-400', textColor: 'text-yellow-600' },
        { label: 'Good',      barColor: 'bg-blue-400',   textColor: 'text-blue-500'   },
        { label: 'Strong',    barColor: 'bg-green-500',  textColor: 'text-green-600'  },
      ];
      return { score, ...levels[score] };
    }
  },

  methods: {
    validate() {
      this.errors = { currentPassword: '', newPassword: '', confirmPassword: '' };
      let valid = true;

      if (!this.form.currentPassword) {
        this.errors.currentPassword = 'Current password is required';
        valid = false;
      }
      if (!this.form.newPassword || this.form.newPassword.length < 6) {
        this.errors.newPassword = 'New password must be at least 6 characters';
        valid = false;
      } else if (this.form.newPassword === this.form.currentPassword) {
        this.errors.newPassword = 'New password must differ from current password';
        valid = false;
      }
      if (this.form.newPassword !== this.form.confirmPassword) {
        this.errors.confirmPassword = 'Passwords do not match';
        valid = false;
      }
      return valid;
    },

    async submit() {
      this.serverError = '';
      if (!this.validate()) return;

      this.saving = true;
      try {
        await this.$apiPost('/auth/change-password', {
          currentPassword: this.form.currentPassword,
          newPassword: this.form.newPassword
        });

        this.$root.$refs.toast?.showToast('Password changed successfully', 'success');
        this.$emit('changed');
        this.$emit('close');
      } catch (e) {
        const raw = e?.message;
        if (raw && typeof raw === 'object' && raw.error) {
          this.serverError = raw.error;
        } else if (typeof raw === 'string') {
          this.serverError = raw;
        } else {
          this.serverError = 'Failed to change password. Please try again.';
        }
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>
