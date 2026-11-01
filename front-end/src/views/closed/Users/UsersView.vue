<template>
  <section class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-[1920px] mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Administration</p>
          <h1 class="text-2xl font-black text-slate-900 mt-1">Users</h1>
          <p class="text-sm text-slate-500 mt-1">View users registered in the Edilbetting system.</p>
        </div>
        <button
          @click="fetchUsers"
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

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-wider">Registered Users</h2>
          <span class="text-xs font-bold text-slate-400">{{ users.length }} users</span>
        </div>

        <div v-if="loading && users.length === 0" class="p-10 text-center text-slate-400">
          <i class="fas fa-spinner fa-spin text-xl mb-3"></i>
          <p class="text-sm font-medium">Loading users...</p>
        </div>

        <div v-else-if="!loading && users.length === 0" class="p-10 text-center text-slate-400">
          <i class="fas fa-users text-3xl mb-3 text-slate-200"></i>
          <p class="text-sm font-bold">No users found.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Name</th>
                <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Phone</th>
                <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Date of Birth</th>
                <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">KYC</th>
                <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Role</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="user in users" :key="user.userId" class="hover:bg-slate-50/70 transition">
                <td class="px-5 py-4 font-bold text-slate-800">{{ user.fullName || '—' }}</td>
                <td class="px-5 py-4 text-slate-600">{{ user.phoneNumber }}</td>
                <td class="px-5 py-4 text-slate-600">{{ user.dateOfBirth || '—' }}</td>
                <td class="px-5 py-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
                    :class="kycClass(user.kycStatus)">
                    {{ user.kycStatus || 'unverified' }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
                    :class="statusClass(user.status)">
                    {{ user.status || 'unknown' }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-xs font-bold" :class="user.isAdmin ? 'text-amber-600' : 'text-slate-500'">
                    {{ user.isAdmin ? 'Admin' : 'User' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'UsersView',
  data() {
    return {
      users: [],
      loading: false,
      error: '',
    };
  },
  async mounted() {
    await this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = '';

      try {
        const token = localStorage.getItem('token');

        if (!token || localStorage.getItem('role') !== 'admin') {
          this.$router.push('/');
          return;
        }

        const baseUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
          throw new Error(data.error || 'Failed to load users.');
        }

        this.users = data.users || [];
      } catch (error) {
        this.error = error?.message || 'Failed to load users.';
      } finally {
        this.loading = false;
      }
    },
    kycClass(status) {
      return {
        'bg-green-50 text-green-700': status === 'verified',
        'bg-amber-50 text-amber-700': status === 'pending',
        'bg-red-50 text-red-700': status === 'rejected',
        'bg-slate-100 text-slate-500': !status || status === 'unverified',
      };
    },
    statusClass(status) {
      return {
        'bg-green-50 text-green-700': status === 'active',
        'bg-red-50 text-red-700': status === 'blocked',
        'bg-amber-50 text-amber-700': status === 'self_excluded',
        'bg-slate-100 text-slate-500': !status,
      };
    },
  },
};
</script>
