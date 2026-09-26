
<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">
    <!-- Loading -->
    <Loading :visible="loading" message="Loading Users..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <h1 class="text-lg font-bold text-gray-800">Users Detail</h1>
    </div>

    <!-- Detail Card -->
    <div class="bg-white overflow-hidden rounded-md border border-gray-200 p-4 hidden md:block space-y-2">
      <div><strong>ID:</strong> {{ item.id }}</div>
      <div><strong>First Name:</strong> {{ item.first_name }}</div>
      <div><strong>Middle Name:</strong> {{ item.middle_name || '—' }}</div>
      <div><strong>Last Name:</strong> {{ item.last_name }}</div>
      <div><strong>Email:</strong> {{ item.email }}</div>
      <div><strong>Phone:</strong> {{ item.phone_number || item.phone || '—' }}</div>
      <div><strong>Date of Birth:</strong> {{ item.date_of_birth || '—' }}</div>
      <div><strong>Age:</strong> {{ item.age || '—' }}</div>
      <div><strong>Department:</strong> {{ item.department || '—' }}</div>
      <div><strong>Gender:</strong> {{ formatGender(item.gender) }}</div>
      
      <!-- Profile Photo -->
      <div v-if="item.photo">
        <strong>Profile Photo:</strong>
        <div class="mt-2">
          <img :src="$getFileUrl(item.photo)" alt="Profile photo" class="w-32 h-32 object-cover rounded-lg border">
        </div>
      </div>
      
      <!-- CV -->
      <div v-if="item.cv">
        <strong>CV/Resume:</strong>
        <div class="mt-1">
          <a :href="$getFileUrl(item.cv)" target="_blank" class="text-blue-600 hover:underline">View CV/Resume</a>
        </div>
      </div>
    </div>

    <!-- Mobile View -->
    <div class="md:hidden bg-white rounded-md border border-gray-200 p-4 space-y-2">
      <div><strong>ID:</strong> {{ item.id }}</div>
      <div><strong>First Name:</strong> {{ item.first_name }}</div>
      <div><strong>Middle Name:</strong> {{ item.middle_name || '—' }}</div>
      <div><strong>Last Name:</strong> {{ item.last_name }}</div>
      <div><strong>Email:</strong> {{ item.email }}</div>
      <div><strong>Phone:</strong> {{ item.phone_number || item.phone || '—' }}</div>
      <div><strong>Date of Birth:</strong> {{ item.date_of_birth || '—' }}</div>
      <div><strong>Age:</strong> {{ item.age || '—' }}</div>
      <div><strong>Department:</strong> {{ item.department || '—' }}</div>
      <div><strong>Gender:</strong> {{ formatGender(item.gender) }}</div>
      
      <!-- Profile Photo -->
      <div v-if="item.photo">
        <strong>Profile Photo:</strong>
        <div class="mt-2">
          <img :src="$getFileUrl(item.photo)" alt="Profile photo" class="w-24 h-24 object-cover rounded-lg border">
        </div>
      </div>
      
      <!-- CV -->
      <div v-if="item.cv">
        <strong>CV/Resume:</strong>
        <div class="mt-1">
          <a :href="$getFileUrl(item.cv)" target="_blank" class="text-blue-600 hover:underline">View CV/Resume</a>
        </div>
      </div>
    </div>

    <button @click="$router.back()" class="mt-4 text-blue-600 hover:underline">Back</button>
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";

export default {
  components: { Loading },
  data() {
    return {
      item: {},
      loading: false,
    };
  },
  methods: {
    formatGender(gender) {
      if (!gender) return '—';
      
      const genderMap = {
        'male': 'Male',
        'female': 'Female', 
        'other': 'Other',
        'prefer_not_to_say': 'Prefer not to say'
      };
      
      return genderMap[gender] || gender;
    },
  },
  async mounted() {
    this.loading = true;
    const id = this.$route.params.id;
    try {
      const response = await this.$apiGetById('/users', id);
      this.item = response || {};
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  },
};
</script>
