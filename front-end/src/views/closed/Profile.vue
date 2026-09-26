<template>
  <div class="p-6 bg-gray-50 min-h-screen text-sm text-gray-800">
    <Loading :visible="loading" message="Loading Profile..." />

    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
      <div>
        <h1 class="text-lg font-bold text-gray-800">My Profile</h1>
        <p class="text-xs text-gray-400 mt-0.5">View and manage your personal information</p>
      </div>
    </div>

    <!-- Profile Content -->
    <div class="max-w-4xl mx-auto space-y-6">

      <!-- ── Personal Information Card (read-only) ── -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <!-- Card header banner -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold ring-2 ring-white/30">
              {{ userInitials }}
            </div>
            <div class="text-white">
              <h2 class="text-xl font-bold leading-tight">{{ fullName }}</h2>
              <p class="text-sm text-green-100">{{ userEmail }}</p>
              <div class="flex flex-wrap gap-1.5 mt-1.5">
                <span
                  v-for="role in userRoles" :key="role"
                  class="px-2 py-0.5 bg-white/20 text-white text-[10px] font-semibold rounded-full uppercase tracking-wide"
                >{{ role }}</span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="showChangePassword = true"
              class="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <i class="fas fa-key text-[11px]"></i>
              <span class="hidden sm:inline">Change Password</span>
            </button>
            <button
              @click="openEditDrawer"
              class="bg-white hover:bg-green-50 text-green-600 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
            >
              <i class="fas fa-edit text-[11px]"></i>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        <!-- Read-only info grid -->
        <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div v-for="field in profileFields" :key="field.key">
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              <i :class="field.icon" class="mr-1"></i>{{ field.label }}
            </p>
            <p class="text-sm font-medium text-gray-800 truncate">
              {{ form[field.key] || '—' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── Organization Card ── -->
      <div v-if="showOrganizationInfo" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center gap-3 text-white">
          <i class="fas fa-building text-xl"></i>
          <div>
            <h2 class="text-base font-bold">Organization Information</h2>
            <p class="text-xs text-blue-100">Your organization details</p>
          </div>
        </div>

        <div v-if="organization" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              <i class="fas fa-building mr-1"></i>Name
            </p>
            <p class="text-sm font-medium text-gray-800">{{ organization.name || '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              <i class="fas fa-envelope mr-1"></i>Official Email
            </p>
            <p class="text-sm font-medium text-gray-800">{{ organization.official_email || '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              <i class="fas fa-phone mr-1"></i>Official Phone
            </p>
            <p class="text-sm font-medium text-gray-800">{{ organization.official_phone || '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              <i class="fas fa-map-marker-alt mr-1"></i>Address
            </p>
            <p class="text-sm font-medium text-gray-800">{{ organization.address || '—' }}</p>
          </div>

          <div v-if="isOrganization" class="sm:col-span-2 pt-4 border-t border-gray-100">
            <button
              @click="editOrganization"
              class="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <i class="fas fa-edit"></i> Edit Organization
            </button>
          </div>
        </div>

        <div v-else class="p-8 text-center text-gray-400">
          <i class="fas fa-building text-4xl mb-3 block"></i>
          <p class="text-xs">No organization information available</p>
        </div>
      </div>

    </div><!-- /max-w -->
  </div><!-- /page -->

  <!-- ══════════════════════════════════════════════════════ -->
  <!--  EDIT PROFILE DRAWER  (slides in from the right)      -->
  <!-- ══════════════════════════════════════════════════════ -->
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
        v-if="editDrawerOpen"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
        @click="cancelEdit"
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
      <div
        v-if="editDrawerOpen"
        class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[160] flex flex-col"
      >
        <!-- Drawer header -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <i class="fas fa-user-edit text-white text-sm"></i>
            </div>
            <div>
              <h2 class="text-white font-bold text-sm">Edit Profile</h2>
              <p class="text-green-100 text-[10px] uppercase tracking-widest">Personal Information</p>
            </div>
          </div>
          <button
            @click="cancelEdit"
            class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <!-- Drawer body (scrollable) -->
        <form @submit.prevent="updateProfile" class="flex-1 overflow-y-auto">
          <div class="p-6 space-y-5">

            <!-- Avatar preview -->
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                {{ drawerInitials }}
              </div>
              <div>
                <p class="font-semibold text-gray-800 text-sm">{{ drawerFullName }}</p>
                <p class="text-xs text-gray-400">{{ editForm.email }}</p>
              </div>
            </div>

            <!-- First Name -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-user text-gray-400 mr-1.5"></i>First Name
              </label>
              <input
                v-model="editForm.first_name"
                type="text"
                required
                placeholder="Enter first name"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
              />
            </div>

            <!-- Middle Name -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-user text-gray-400 mr-1.5"></i>Middle Name
              </label>
              <input
                v-model="editForm.middle_name"
                type="text"
                placeholder="Enter middle name (optional)"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-user text-gray-400 mr-1.5"></i>Last Name
              </label>
              <input
                v-model="editForm.last_name"
                type="text"
                required
                placeholder="Enter last name"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-envelope text-gray-400 mr-1.5"></i>Email Address
              </label>
              <input
                v-model="editForm.email"
                type="email"
                required
                placeholder="Enter email address"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
              />
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-phone text-gray-400 mr-1.5"></i>Phone Number
              </label>
              <input
                v-model="editForm.phone"
                type="text"
                placeholder="Enter phone number"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
              />
            </div>

            <!-- Roles (read-only) -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-id-badge text-gray-400 mr-1.5"></i>Role(s)
              </label>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="role in userRoles" :key="role"
                  class="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold"
                >{{ role }}</span>
              </div>
            </div>

          </div><!-- /p-6 -->
        </form>

        <!-- Drawer footer (sticky) -->
        <div class="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            @click="cancelEdit"
            class="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="updateProfile"
            :disabled="saving"
            class="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition disabled:opacity-60"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin text-xs"></i>
            <i v-else class="fas fa-save text-xs"></i>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

      </div><!-- /drawer panel -->
    </transition>
  </teleport>

  <!-- Change Password Modal -->
  <ChangePasswordModal
    v-if="showChangePassword"
    @close="showChangePassword = false"
  />
</template>

<script>
import Loading from "@/components/Loading.vue";
import ChangePasswordModal from "@/components/ChangePasswordModal.vue";

export default {
  name: "Profile",
  components: { Loading, ChangePasswordModal },

  data() {
    return {
      loading: false,
      saving: false,
      editDrawerOpen: false,
      showChangePassword: false,

      // read-only display form
      form: {
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
      },

      // mutable copy used inside the drawer
      editForm: {
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
      },

      organization: null,

      profileFields: [
        { key: "first_name",  label: "First Name",    icon: "fas fa-user" },
        { key: "middle_name", label: "Middle Name",   icon: "fas fa-user" },
        { key: "last_name",   label: "Last Name",     icon: "fas fa-user" },
        { key: "email",       label: "Email Address", icon: "fas fa-envelope" },
        { key: "phone",       label: "Phone Number",  icon: "fas fa-phone" },
      ],
    };
  },

  computed: {
    userId() {
      return localStorage.getItem("userId");
    },
    userRoles() {
      try {
        const raw = localStorage.getItem("roles");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    },
    isAdmin()        { return this.userRoles.some(r => r.toLowerCase() === "admin"); },
    isOrganization() { return this.userRoles.some(r => r.toLowerCase() === "organization"); },
    isTester()       { return this.userRoles.some(r => r.toLowerCase() === "tester"); },
    showOrganizationInfo() {
      return this.isOrganization || (this.isTester && this.organization);
    },

    // display card
    fullName() {
      return [this.form.first_name, this.form.middle_name, this.form.last_name]
        .filter(Boolean).join(" ") || "User";
    },
    userInitials() {
      return ((this.form.first_name?.[0] || "") + (this.form.last_name?.[0] || "")).toUpperCase() || "U";
    },
    userEmail() { return this.form.email || "No email"; },

    // drawer live preview
    drawerFullName() {
      return [this.editForm.first_name, this.editForm.middle_name, this.editForm.last_name]
        .filter(Boolean).join(" ") || "User";
    },
    drawerInitials() {
      return ((this.editForm.first_name?.[0] || "") + (this.editForm.last_name?.[0] || "")).toUpperCase() || "U";
    },
  },

  methods: {
    async loadProfile() {
      this.loading = true;
      try {
        const response = await this.$apiGet(`/users/${this.userId}`);
        this.form = {
          first_name:  response.first_name  || "",
          middle_name: response.middle_name || "",
          last_name:   response.last_name   || "",
          email:       response.email       || "",
          phone:       response.phone       || "",
        };
        if (response.organization) this.organization = response.organization;
      } catch (error) {
        console.error("Failed to load profile:", error);
        this.$root.$refs.toast?.showToast("Failed to load profile", "error");
      } finally {
        this.loading = false;
      }
    },

    openEditDrawer() {
      // copy current values into the editable form
      this.editForm = { ...this.form };
      this.editDrawerOpen = true;
    },

    cancelEdit() {
      this.editDrawerOpen = false;
    },

    async updateProfile() {
      this.saving = true;
      try {
        const response = await this.$apiPut(`/users`, this.userId, this.editForm);
        if (response && !response.error) {
          // push changes back to the display form
          this.form = { ...this.editForm };
          this.$root.$refs.toast?.showToast("Profile updated successfully", "success");
          this.editDrawerOpen = false;
        } else {
          throw new Error(response?.error || "Update failed");
        }
      } catch (error) {
        console.error("Failed to update profile:", error);
        this.$root.$refs.toast?.showToast(
          error.message || "Failed to update profile", "error"
        );
      } finally {
        this.saving = false;
      }
    },

    editOrganization() {
      this.$router.push({ name: "Organization-edit", params: { id: this.organization.id } });
    },
  },

  mounted() {
    this.loadProfile();
  },
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
</style>
