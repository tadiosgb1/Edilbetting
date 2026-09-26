<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-sm">

      <!-- Header -->
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Group Members</h2>
          <p class="text-xs text-gray-500 mt-0.5">{{ group.name }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-8 text-center text-gray-400">
        <i class="fas fa-spinner animate-spin"></i>
      </div>

      <!-- Members list -->
      <div v-else>
        <div class="divide-y divide-gray-100 max-h-72 overflow-y-auto rounded-lg border border-gray-200">
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p class="font-medium text-gray-700">
                {{ member.first_name }} {{ member.last_name }}
              </p>
              <p class="text-xs text-gray-400">{{ member.email }}</p>
              <p v-if="member.phone" class="text-xs text-gray-400">{{ member.phone }}</p>
            </div>
            <button
              @click="removeMember(member)"
              :disabled="removingId === member.id"
              title="Remove from group"
              class="text-red-400 hover:text-red-600 disabled:opacity-40 ml-4 flex-shrink-0"
            >
              <i v-if="removingId === member.id" class="fas fa-spinner animate-spin text-xs"></i>
              <i v-else class="fas fa-user-minus"></i>
            </button>
          </div>

          <p v-if="members.length === 0" class="text-center py-6 text-gray-400 italic text-xs">
            No members in this group yet.
          </p>
        </div>

        <!-- Member count -->
        <p class="text-xs text-gray-500 mt-3">{{ members.length }} member(s)</p>
      </div>

      <!-- Footer -->
      <div class="flex justify-end mt-4">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition duration-150"
        >
          Close
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  props: {
    group: { type: Object, required: true },
  },

  data() {
    return {
      members: [],
      membershipIds: {}, // userId -> membershipRecordId map for deletion
      loading: false,
      removingId: null,
    };
  },

  methods: {
    async fetchMembers() {
      this.loading = true;
      try {
        const res = await this.$apiGet(`/user-groups/group/${this.group.id}`, { page_size: 100 });
        this.members = res.data || [];
      } catch (e) {
        console.error('Fetch members error:', e);
      } finally {
        this.loading = false;
      }
    },

    async removeMember(member) {
      this.removingId = member.id;
      try {
        // DELETE /api/user-groups/group/:groupId/user/:userId
        await this.$apiDelete(`/user-groups/group/${this.group.id}/user/${member.id}`);
        this.$root.$refs.toast.showToast(
          `${member.first_name} ${member.last_name} removed from group`,
          'success'
        );
        // Remove from local list
        this.members = this.members.filter(m => m.id !== member.id);
      } catch (e) {
        console.error('Remove member error:', e);
        this.$root.$refs.toast.showToast('Failed to remove member', 'error');
      } finally {
        this.removingId = null;
      }
    },
  },

  mounted() {
    this.fetchMembers();
  },
};
</script>
