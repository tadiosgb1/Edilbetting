<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col pb-16 lg:pb-0">

    <!-- ══════════ HEADER ══════════ -->
    <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div class="flex items-center justify-between px-3 sm:px-5 h-14">
        <div class="flex items-center gap-3">
          <!-- Mobile hamburger -->
          <button @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <!-- Logo -->
          <div class="flex items-center gap-1.5 cursor-pointer" @click="resetToHome">
            <span class="bg-amber-500 text-black font-black text-base sm:text-lg px-2 py-0.5 rounded tracking-widest leading-tight">EDIL</span>
            <span class="font-black text-base sm:text-lg tracking-wide text-white">BET</span>
          </div>
          <!-- Desktop nav -->
          <nav class="hidden lg:flex items-center gap-1 ml-5">
            <button @click="resetToHome"
              :class="currentView === 'home' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
              class="px-3 py-1.5 rounded text-sm font-semibold transition">🏠 Home</button>
            <button @click="goToSports"
              :class="['sports','live','detail'].includes(currentView) ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
              class="px-3 py-1.5 rounded text-sm font-semibold transition">⚽ Sports</button>
            <button @click="goToLive"
              :class="currentView === 'live' ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
              class="px-3 py-1.5 rounded text-sm font-semibold transition flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>Live
            </button>
          </nav>
        </div>
        <!-- Right: balance + deposit + auth -->
        <div class="flex items-center gap-1.5 sm:gap-2.5">
          <div v-if="userBalance !== null"
            class="bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
            <span class="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wide hidden sm:inline">Balance</span>
            <span class="text-amber-400 font-black text-xs sm:text-sm">{{ userBalance.toFixed(2) }}</span>
            <span class="text-slate-500 text-[10px] hidden sm:inline">ETB</span>
          </div>
          <button v-if="isLoggedIn" @click="showBetHistoryModal = true"
            class="hidden sm:inline-flex bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition">
            Bet History
          </button>
          <button @click="showDepositModal = true"
            class="bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition shadow-md shadow-amber-500/20">
            <span class="hidden sm:inline">Deposit</span>
            <span class="sm:hidden font-black text-base leading-none">+</span>
          </button>
          <template v-if="!isLoggedIn">
            <button @click="openAuth('login')"
              class="hidden sm:inline-flex text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition">Login</button>
            <button @click="openAuth('register')"
              class="hidden sm:inline-flex bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-sm font-bold px-3 py-1.5 rounded-lg transition">Register</button>
            <button @click="openAuth('login')" class="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </button>
          </template>
          <div v-else class="relative">
            <button @click="profileMenuOpen = !profileMenuOpen"
              class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1.5 transition">
              <span class="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center text-black font-black text-xs">
                {{ userInitial }}
              </span>
              <span class="hidden sm:block text-xs font-bold text-slate-200 max-w-24 truncate">{{ currentUser?.fullName || currentUser?.phoneNumber }}</span>
              <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div v-if="profileMenuOpen" class="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[60]">
              <div class="px-4 py-3 border-b border-slate-800">
                <p class="text-xs font-black text-white truncate">{{ currentUser?.fullName || 'User' }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5 truncate">{{ currentUser?.phoneNumber || '' }}</p>
              </div>
              <button @click="showBetHistoryModal=true; profileMenuOpen=false"
                class="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition">📜 Bet History</button>
              <button @click="logout"
                class="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-slate-800 transition border-t border-slate-800">↪ Logout</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Mobile dropdown -->
      <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-150"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
        <div v-if="mobileMenuOpen" class="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-sm">
          <div class="px-3 py-3 flex flex-col gap-1">
            <button @click="resetToHome(); mobileMenuOpen=false"
              :class="currentView==='home' ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500':'text-slate-300 hover:bg-slate-800'"
              class="w-full text-left px-4 py-2.5 rounded text-sm font-semibold transition">🏠 Home</button>
            <button @click="goToSports(); mobileMenuOpen=false"
              class="w-full text-left px-4 py-2.5 rounded text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">⚽ Sports</button>
            <button @click="goToLive(); mobileMenuOpen=false"
              class="w-full text-left px-4 py-2.5 rounded text-sm font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Live</button>
            <button v-if="isLoggedIn" @click="showBetHistoryModal=true; mobileMenuOpen=false"
              class="w-full text-left px-4 py-2.5 rounded text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">📜 Bet History</button>
            <template v-if="!isLoggedIn">
              <div class="border-t border-slate-800 mt-1 pt-2 flex gap-2">
                <button @click="openAuth('login');mobileMenuOpen=false"
                  class="flex-1 py-2.5 text-sm font-bold text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition">Login</button>
                <button @click="openAuth('register');mobileMenuOpen=false"
                  class="flex-1 py-2.5 text-sm font-bold text-amber-400 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition">Register</button>
              </div>
            </template>
          </div>
        </div>
      </transition>
    </header>

    <!-- ══════════ MAIN LAYOUT ══════════ -->
    <div class="flex-1 flex overflow-hidden">

      <!-- ════ LEFT SIDEBAR ════ -->
      <aside class="w-64 bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col overflow-y-auto flex-shrink-0 custom-scroll">

        <!-- Search -->
        <div class="p-3 border-b border-slate-800">
          <div class="relative">
            <input v-model="sidebarSearch" placeholder="Search matches…"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"/>
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
          </div>
        </div>

        <!-- Top Matches / Upcoming -->
        <div class="p-3 border-b border-slate-800">
          <div class="flex gap-2">
            <button @click="goToSports()"
              class="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 text-[10px] font-black text-amber-400 uppercase tracking-wide transition">
              ⭐ Top Matches
            </button>
            <button @click="goToLive()"
              class="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wide transition">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>Upcoming
            </button>
          </div>
        </div>

        <!-- TOP LEAGUES (always visible above sport types) -->
        <div class="border-b border-slate-800">
          <div class="px-3 pt-3 pb-1 flex items-center justify-between">
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Leagues</p>
            <span v-if="loadingTopLeagues" class="text-[9px] text-amber-400 animate-pulse">…</span>
          </div>
          <ul class="pb-2">
            <li v-for="lg in topLeagues" :key="lg.key">
              <button @click="selectLeague(lg.key)"
                :class="selectedSportKey===lg.key && ['sports','live'].includes(currentView)
                  ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
                class="w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition">
                <span class="flex-shrink-0 text-sm">{{ leagueFlag(lg.key) }}</span>
                <span class="truncate flex-1">{{ lg.title }}</span>
                <span class="text-[9px] text-slate-600 flex-shrink-0">{{ lg.matchCount || '' }}</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- SPORTS section header -->
        <div class="px-3 pt-3 pb-1">
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sports</p>
        </div>

        <!-- Sport types — each expandable to show countries → leagues -->
        <div v-if="loadingSportTypes" class="px-4 py-3 text-xs text-slate-500 animate-pulse">Loading sports…</div>
        <ul v-else class="pb-4">
          <li v-for="type in sportTypes" :key="type.key">
            <!-- Sport type row -->
            <button @click="toggleSportType(type)"
              :class="expandedSportType===type.key ? 'text-white' : 'text-slate-300 hover:text-white'"
              class="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-800/70 transition group">
              <span class="text-base flex-shrink-0">{{ sportTypeIcon(type.key) }}</span>
              <span class="flex-1 text-xs font-bold">{{ type.name }}</span>
              <span class="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex-shrink-0">{{ type.leagueCount }}</span>
              <svg class="w-3 h-3 text-slate-500 flex-shrink-0 transition-transform duration-200"
                :class="expandedSportType===type.key ? 'rotate-90' : ''"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <!-- Countries under this sport type -->
            <div v-if="expandedSportType===type.key" class="bg-slate-950/40">
              <div v-if="loadingCountries" class="px-6 py-2 text-[10px] text-slate-500 animate-pulse">Loading countries…</div>
              <ul v-else>
                <li v-for="country in countries" :key="country.code">
                  <!-- Country row -->
                  <button @click="toggleCountry(country)"
                    :class="expandedCountry===country.code ? 'text-white bg-slate-800/60':'text-slate-400 hover:text-white hover:bg-slate-800/40'"
                    class="w-full text-left pl-7 pr-3 py-2 flex items-center gap-2 transition text-[11px] font-semibold">
                    <span class="flex-shrink-0">{{ countryFlag(country.name) }}</span>
                    <span class="flex-1 truncate">{{ country.name }}</span>
                    <span class="text-[9px] text-slate-600 flex-shrink-0">{{ country.leagueCount }}</span>
                    <svg class="w-2.5 h-2.5 text-slate-600 flex-shrink-0 transition-transform duration-200"
                      :class="expandedCountry===country.code ? 'rotate-90':''"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  <!-- Leagues under this country -->
                  <div v-if="expandedCountry===country.code" class="bg-slate-950/60">
                    <div v-if="loadingLeagues" class="pl-10 py-2 text-[10px] text-slate-500 animate-pulse">Loading…</div>
                    <ul v-else>
                      <li v-for="league in leagues" :key="league.sportKey">
                        <button @click="selectLeague(league.sportKey)"
                          :class="selectedSportKey===league.sportKey && ['sports','live'].includes(currentView)
                            ? 'text-amber-400 font-black'
                            : 'text-slate-500 hover:text-slate-200'"
                          class="w-full text-left pl-10 pr-3 py-2 text-[11px] transition flex items-center gap-2">
                          <span class="w-1 h-1 rounded-full bg-current flex-shrink-0"></span>
                          <span class="truncate">{{ league.title }}</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </aside>

      <!-- ════ CENTER MAIN ════ -->
      <main class="flex-1 overflow-y-auto bg-slate-950">

        <!-- ── HOME VIEW ── -->
        <div v-if="currentView==='home'" class="p-3 md:p-4 space-y-5">
          <!-- Hero Banner -->
          <div class="relative bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-xl p-5 md:p-6 overflow-hidden shadow-xl">
            <div class="absolute right-0 top-0 w-48 h-full opacity-10">
              <svg viewBox="0 0 100 100" fill="currentColor" class="text-white w-full h-full">
                <circle cx="75" cy="25" r="40"/><circle cx="30" cy="70" r="30"/>
              </svg>
            </div>
            <div class="relative">
              <span class="inline-block bg-black/30 text-amber-200 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-2">🎁 Welcome Bonus</span>
              <h1 class="text-xl md:text-3xl font-black text-white leading-tight">100% First Deposit Bonus</h1>
              <p class="text-amber-200 text-sm mt-1">Up to <span class="font-black text-white">5,000 ETB</span></p>
              <button @click="openAuth('register')"
                class="mt-4 inline-flex items-center gap-2 bg-black hover:bg-slate-900 text-amber-400 font-black px-5 py-2.5 rounded-lg text-sm transition border border-amber-500/30">
                Claim Bonus →
              </button>
            </div>
          </div>

          <!-- Featured Matches -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                🔥 Featured Matches
                <span v-if="loadingTopMatches" class="text-[10px] text-amber-400 font-normal animate-pulse">Loading…</span>
              </h2>
              <button @click="goToSports()" class="text-xs text-amber-400 hover:text-amber-300 font-bold">View All →</button>
            </div>
            <div v-if="!loadingTopMatches && topMatches.length===0"
              class="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-500 text-sm">
              No featured matches available right now.
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div v-for="match in topMatches" :key="match.id"
                class="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-xl p-3.5 transition cursor-pointer"
                @click="selectLeague(match.sport_key)">
                <div class="flex justify-between items-center text-[10px] text-slate-500 mb-2.5">
                  <span class="font-bold uppercase tracking-wider flex items-center gap-1">
                    {{ leagueFlag(match.sport_key) }} {{ match.sport_title }}
                  </span>
                  <span v-if="isLive(match.commence_time)" class="text-red-400 font-black flex items-center gap-1 animate-pulse">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> LIVE
                  </span>
                  <span v-else class="text-slate-500">{{ formatDate(match.commence_time) }}</span>
                </div>
                <div class="mb-3">
                  <p class="font-black text-white text-sm leading-tight">{{ match.home_team }}</p>
                  <p class="text-slate-500 text-[10px] my-0.5 font-bold uppercase">vs</p>
                  <p class="font-black text-white text-sm leading-tight">{{ match.away_team }}</p>
                </div>
                <div v-if="getH2HOdds(match)" class="grid grid-cols-3 gap-1.5">
                  <button v-for="(btn,i) in h2hBtns(match)" :key="i"
                    v-if="btn.odd"
                    @click.stop="toggleBet(match, btn.sel, btn.odd)"
                    :class="isSelectionActive(match.id,btn.sel) ? 'bg-amber-500 text-black':'bg-slate-800 hover:bg-slate-700 text-slate-200'"
                    class="rounded-lg p-1.5 text-center transition flex flex-col items-center">
                    <span class="text-[9px] text-slate-400 font-bold uppercase">{{ btn.label }}</span>
                    <span class="font-black text-xs">{{ btn.odd.toFixed(2) }}</span>
                  </button>
                </div>
                <div v-else class="text-[10px] text-slate-600 text-center py-1">Odds not available</div>
              </div>
            </div>
          </div>

          <!-- Top Leagues grid -->
          <div>
            <h2 class="text-sm font-black text-white uppercase tracking-wide mb-3">🏆 Top Leagues</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <button v-for="lg in topLeagues" :key="lg.key"
                @click="selectLeague(lg.key)"
                class="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 text-center transition group">
                <div class="text-2xl mb-1">{{ leagueFlag(lg.key) }}</div>
                <p class="text-xs font-bold text-slate-300 group-hover:text-amber-400 transition leading-tight truncate">{{ lg.title }}</p>
              </button>
            </div>
          </div>
        </div>

        <!-- ── SPORTS / LIVE VIEW (match list) ── -->
        <div v-else-if="currentView==='sports' || currentView==='live'" class="p-3 md:p-4 space-y-3">

          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button @click="resetToHome" class="hover:text-amber-400 transition">Home</button>
            <span>/</span>
            <span v-if="expandedSportType" class="text-slate-400">{{ sportTypeName(expandedSportType) }}</span>
            <template v-if="expandedSportType"><span>/</span></template>
            <span v-if="expandedCountry" class="text-slate-400">{{ countryNameFor(expandedCountry) }}</span>
            <template v-if="expandedCountry"><span>/</span></template>
            <span class="text-amber-400 font-bold truncate">{{ currentLeagueTitle || selectedSportKey }}</span>
          </div>

          <!-- Toolbar -->
          <div class="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-black text-white uppercase tracking-wide truncate max-w-xs">
                {{ currentLeagueTitle || selectedSportKey.replace(/_/g,' ').toUpperCase() }}
              </h2>
              <span v-if="loadingOdds" class="text-xs text-amber-400 animate-pulse">Loading…</span>
            </div>
            <div class="flex gap-1.5 flex-wrap">
              <button @click="filterLive=false; currentView='sports'"
                :class="!filterLive ? 'bg-amber-500 text-black':'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                class="text-xs font-bold px-3 py-1.5 rounded-lg transition">All</button>
              <button @click="filterLive=true; currentView='live'"
                :class="filterLive ? 'bg-red-600 text-white':'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                class="text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>Live
              </button>
              <select v-model="selectedMarket"
                class="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 transition">
                <option value="1x2">1X2</option>
                <option value="ou">Over/Under</option>
                <option value="btts">BTTS</option>
              </select>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!loadingOdds && filteredMatches.length===0"
            class="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
            <p class="text-slate-400 text-sm mb-1">No matches for this selection.</p>
            <p class="text-slate-600 text-xs">Pick a league from the sidebar.</p>
          </div>

          <!-- Loading skeleton -->
          <div v-if="loadingOdds" class="space-y-3">
            <div v-for="n in 4" :key="n" class="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
              <div class="h-2 bg-slate-800 rounded w-32 mb-3"></div>
              <div class="h-4 bg-slate-800 rounded w-48 mb-2"></div>
              <div class="h-4 bg-slate-800 rounded w-40 mb-3"></div>
              <div class="grid grid-cols-3 gap-2">
                <div class="h-10 bg-slate-800 rounded-lg"></div>
                <div class="h-10 bg-slate-800 rounded-lg"></div>
                <div class="h-10 bg-slate-800 rounded-lg"></div>
              </div>
            </div>
          </div>

          <!-- Match cards -->
          <div v-else class="space-y-2">
            <div v-for="match in filteredMatches" :key="match.id"
              class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition">

              <!-- Match header: date + league + LIVE badge -->
              <div class="flex items-center justify-between px-3.5 pt-3 pb-1.5 border-b border-slate-800/60">
                <div class="flex items-center gap-1.5 text-[10px]">
                  <span class="text-slate-500">{{ formatDate(match.commenceTime) }}</span>
                  <span class="text-slate-700">·</span>
                  <span class="text-slate-500 flex items-center gap-1">
                    {{ leagueFlag(match.sport_key) }} {{ match.sport_title }}
                  </span>
                </div>
                <span v-if="match.isLive" class="text-[10px] text-red-400 font-black flex items-center gap-1 animate-pulse">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-flex"></span> LIVE
                </span>
              </div>

              <!-- Teams row + odds inline (like hulu-sport) -->
              <div class="px-3.5 py-2.5 flex items-stretch gap-2">
                <!-- Teams column -->
                <div class="flex-1 min-w-0">
                  <p class="font-black text-white text-sm leading-snug truncate">{{ match.homeTeam }}</p>
                  <p class="font-black text-white text-sm leading-snug truncate mt-1">{{ match.awayTeam }}</p>
                </div>

                <!-- 1X2 odds (market tab: 1x2) -->
                <template v-if="selectedMarket==='1x2'">
                  <div class="flex gap-1.5 items-center">
                    <button v-for="(btn,i) in [
                      {label:'1', sel:'Home Win (1)', odd:match.odds.home},
                      {label:'X', sel:'Draw (X)',     odd:match.odds.draw},
                      {label:'2', sel:'Away Win (2)', odd:match.odds.away},
                    ]" :key="i"
                      @click="btn.odd && toggleBet(match, btn.sel, btn.odd)"
                      :class="[
                        isSelectionActive(match.id, btn.sel) ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
                        !btn.odd ? 'opacity-40 cursor-default' : 'cursor-pointer'
                      ]"
                      class="border rounded-lg w-14 h-12 flex flex-col items-center justify-center transition flex-shrink-0">
                      <span class="text-[9px] font-black uppercase" :class="isSelectionActive(match.id,btn.sel)?'text-black':'text-slate-500'">{{ btn.label }}</span>
                      <span class="font-black text-sm leading-none">{{ btn.odd ? btn.odd.toFixed(2) : '-' }}</span>
                    </button>
                  </div>
                </template>

                <!-- O/U odds -->
                <template v-else-if="selectedMarket==='ou'">
                  <div class="flex gap-1.5 items-center">
                    <button v-for="(btn,i) in [
                      {label:'O 2.5', sel:'Over 2.5',  odd:match.odds.over||1.85},
                      {label:'U 2.5', sel:'Under 2.5', odd:match.odds.under||1.95},
                    ]" :key="i"
                      @click="toggleBet(match, btn.sel, btn.odd)"
                      :class="isSelectionActive(match.id,btn.sel) ? 'bg-amber-500 text-black border-amber-400':'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'"
                      class="border rounded-lg w-14 h-12 flex flex-col items-center justify-center transition flex-shrink-0 cursor-pointer">
                      <span class="text-[9px] font-black uppercase" :class="isSelectionActive(match.id,btn.sel)?'text-black':'text-slate-500'">{{ btn.label }}</span>
                      <span class="font-black text-sm leading-none">{{ btn.odd.toFixed(2) }}</span>
                    </button>
                  </div>
                </template>

                <!-- BTTS odds -->
                <template v-else-if="selectedMarket==='btts'">
                  <div class="flex gap-1.5 items-center">
                    <button v-for="(btn,i) in [
                      {label:'Yes', sel:'BTTS - Yes', odd:match.odds.bttsYes||1.75},
                      {label:'No',  sel:'BTTS - No',  odd:match.odds.bttsNo||2.05},
                    ]" :key="i"
                      @click="toggleBet(match, btn.sel, btn.odd)"
                      :class="isSelectionActive(match.id,btn.sel) ? 'bg-amber-500 text-black border-amber-400':'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'"
                      class="border rounded-lg w-14 h-12 flex flex-col items-center justify-center transition flex-shrink-0 cursor-pointer">
                      <span class="text-[9px] font-black uppercase" :class="isSelectionActive(match.id,btn.sel)?'text-black':'text-slate-500'">{{ btn.label }}</span>
                      <span class="font-black text-sm leading-none">{{ btn.odd.toFixed(2) }}</span>
                    </button>
                  </div>
                </template>

                <!-- N+ markets button — count fetched lazily on click -->
                <button @click="openMatchDetail(match)"
                  class="flex flex-col items-center justify-center w-14 h-12 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/50 transition flex-shrink-0 group"
                  :title="getMarketCount(match.id) !== null ? getMarketCount(match.id) + ' markets available' : 'View all markets'">
                  <template v-if="getMarketCount(match.id) !== null && getMarketCount(match.id) > 0">
                    <!-- Real count shown after user has visited the detail once -->
                    <span class="text-amber-400 font-black text-sm leading-none group-hover:text-amber-300">
                      {{ getMarketCount(match.id) }}+
                    </span>
                  </template>
                  <template v-else>
                    <!-- Not yet fetched — show chevron to indicate clickable -->
                    <svg class="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                    </svg>
                  </template>
                  <span class="text-[8px] text-slate-500 uppercase tracking-wide mt-0.5">more</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- ── MATCH DETAIL VIEW (all markets — hulu-sport style) ── -->
        <div v-else-if="currentView==='detail' && detailMatch" class="flex flex-col h-full">

          <!-- Detail header -->
          <div class="bg-slate-900 border-b border-slate-800 px-4 py-3 flex-shrink-0">
            <!-- Back + search row -->
            <div class="flex items-center gap-3 mb-3">
              <button @click="currentView = detailBackView"
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div class="flex-1 relative">
                <input v-model="detailSearch" placeholder="Search market…"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"/>
                <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                </svg>
              </div>
              <button class="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-lg transition">Search</button>
            </div>
            <!-- Match info -->
            <div class="bg-slate-800/60 rounded-xl px-4 py-3">
              <div class="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                <span class="flex items-center gap-1 font-bold uppercase tracking-wider">
                  {{ leagueFlag(detailMatch.sport_key) }} {{ detailMatch.sport_title }}
                </span>
                <span v-if="detailMatch.isLive" class="text-red-400 font-black flex items-center gap-1 animate-pulse">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> LIVE
                </span>
                <span v-else class="text-slate-500">{{ formatDate(detailMatch.commenceTime) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-black text-white text-base">{{ detailMatch.homeTeam }}</p>
                  <p class="text-slate-500 text-xs my-0.5">vs</p>
                  <p class="font-black text-white text-base">{{ detailMatch.awayTeam }}</p>
                </div>
                <!-- Quick 1X2 in detail header -->
                <div v-if="detailMatch.odds" class="flex gap-1.5">
                  <button v-for="(btn,i) in [
                    {label:'1', sel:'Home Win (1)', odd:detailMatch.odds.home},
                    {label:'X', sel:'Draw (X)',     odd:detailMatch.odds.draw},
                    {label:'2', sel:'Away Win (2)', odd:detailMatch.odds.away},
                  ]" :key="i"
                    v-if="btn.odd"
                    @click="toggleBet(detailMatch, btn.sel, btn.odd)"
                    :class="isSelectionActive(detailMatch.id,btn.sel) ? 'bg-amber-500 text-black border-amber-400':'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'"
                    class="border rounded-lg w-12 h-10 flex flex-col items-center justify-center transition">
                    <span class="text-[8px] font-black uppercase" :class="isSelectionActive(detailMatch.id,btn.sel)?'text-black':'text-slate-500'">{{ btn.label }}</span>
                    <span class="font-black text-xs leading-none">{{ btn.odd.toFixed(2) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Market groups — scrollable -->
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <!-- Loading -->
            <div v-if="loadingDetail" class="space-y-2">
              <div v-for="n in 6" :key="n" class="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
                <div class="h-3 bg-slate-800 rounded w-40 mb-3"></div>
                <div class="grid grid-cols-2 gap-2">
                  <div class="h-9 bg-slate-800 rounded-lg"></div>
                  <div class="h-9 bg-slate-800 rounded-lg"></div>
                </div>
              </div>
            </div>

            <!-- No markets -->
            <div v-else-if="filteredDetailMarkets.length===0"
              class="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <p class="text-slate-400 text-sm">No markets found{{ detailSearch ? ' matching "'+detailSearch+'"' : '' }}.</p>
              <p class="text-slate-600 text-xs mt-1">{{ detailSearch ? 'Try a different search term.' : 'This event may not have additional markets available.' }}</p>
            </div>

            <!-- Market group cards (collapsible) -->
            <div v-for="group in filteredDetailMarkets" :key="group.key"
              class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <!-- Group header (click to collapse) -->
              <button @click="toggleMarketGroup(group.key)"
                class="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/60 transition">
                <div class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  <span class="text-sm font-bold text-slate-200">{{ group.label }}</span>
                </div>
                <svg class="w-4 h-4 text-slate-500 transition-transform duration-200"
                  :class="openMarketGroups[group.key] ? 'rotate-180':''"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <!-- Outcomes grid -->
              <div v-if="openMarketGroups[group.key]" class="px-4 pb-4">
                <div :class="group.outcomes.length <= 2 ? 'grid grid-cols-2 gap-2' : group.outcomes.length === 3 ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2'">
                  <button v-for="(outcome, oi) in group.outcomes" :key="oi"
                    @click="toggleBet(detailMatch, outcome.name + (outcome.point ? ' '+outcome.point : ''), outcome.price)"
                    :class="isSelectionActive(detailMatch.id, outcome.name + (outcome.point ? ' '+outcome.point : ''))
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'"
                    class="border rounded-lg px-3 py-2.5 flex items-center justify-between transition">
                    <span class="text-xs font-semibold truncate pr-2" :class="isSelectionActive(detailMatch.id, outcome.name+(outcome.point?' '+outcome.point:''))?'text-black':'text-slate-300'">
                      {{ outcome.name }}{{ outcome.point ? ' ' + outcome.point : '' }}
                    </span>
                    <span class="font-black text-sm flex-shrink-0" :class="isSelectionActive(detailMatch.id, outcome.name+(outcome.point?' '+outcome.point:''))?'text-black':'text-amber-400'">
                      {{ outcome.price.toFixed(2) }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      <!-- ════ RIGHT BET SLIP ════ -->
      <aside class="w-80 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col flex-shrink-0" style="height:calc(100vh - 56px);position:sticky;top:56px;">
        <div class="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h3 class="font-black text-sm uppercase tracking-wide text-amber-400">📋 Bet Slip</h3>
          <div class="flex items-center gap-2">
            <span class="bg-amber-500 text-black font-black text-xs px-2 py-0.5 rounded-full">{{ betSlip.length }}</span>
            <button v-if="betSlip.length>0" @click="betSlip=[]"
              class="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wide transition">Clear</button>
          </div>
        </div>
        <div v-if="betSlip.length===0" class="flex-1 flex flex-col justify-center items-center p-6 text-center text-slate-600">
          <svg class="w-14 h-14 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="text-sm font-bold text-slate-500">No selections yet</p>
          <p class="text-xs text-slate-600 mt-1">Click any odds to add</p>
        </div>
        <div v-else class="flex-1 overflow-y-auto p-3 space-y-2">
          <div v-for="(item,idx) in betSlip" :key="idx"
            class="bg-slate-950 border border-slate-800 rounded-lg p-3 relative">
            <button @click="removeBet(idx)"
              class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-red-400 hover:bg-slate-800 transition text-xs font-black">✕</button>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate pr-5">{{ item.matchTitle }}</p>
            <p class="text-amber-400 font-black text-sm mt-1 truncate">{{ item.selection }}</p>
            <div class="flex justify-between items-center mt-1.5">
              <span class="text-[10px] text-slate-500">Odds</span>
              <span class="text-white font-black text-sm">{{ item.odd.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div v-if="betSlip.length>0" class="p-4 bg-slate-950 border-t border-slate-800 space-y-3 flex-shrink-0">
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-bold uppercase tracking-wide">Total Odds</span>
            <span class="text-amber-400 font-black text-base">{{ totalOdds.toFixed(2) }}</span>
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1.5">Stake (ETB)</label>
            <div class="relative">
              <input v-model.number="stakeAmount" type="number" min="10" step="10"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500 transition pr-12"/>
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">ETB</span>
            </div>
            <div class="flex gap-1.5 mt-2">
              <button v-for="q in [50,100,200,500]" :key="q" @click="stakeAmount=q"
                class="flex-1 text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded py-1 transition">{{ q }}</button>
            </div>
          </div>
          <div class="bg-slate-900 rounded-lg px-3 py-2.5 flex justify-between items-center border border-slate-800">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wide">Payout</span>
            <span class="text-emerald-400 font-black text-lg">{{ potentialPayout.toFixed(2) }} <span class="text-xs font-bold">ETB</span></span>
          </div>
          <button @click="placeBet" :disabled="stakeAmount<=0||isSubmitting"
            class="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-black font-black py-3 rounded-xl text-sm transition uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
            <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {{ isSubmitting ? 'Placing…' : '🎲 Book Bet →' }}
          </button>
        </div>
      </aside>
    </div>

    <!-- ════ MOBILE BOTTOM NAV ════ -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-14 z-40">
      <button @click="resetToHome" :class="currentView==='home'?'text-amber-400':'text-slate-500'"
        class="flex flex-col items-center gap-0.5 text-[10px] font-bold transition">
        <span class="text-lg">🏠</span><span>Home</span>
      </button>
      <button @click="mobileDrawer='categories'" class="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-500 hover:text-amber-400 transition">
        <span class="text-lg">⚽</span><span>Sports</span>
      </button>
      <button @click="goToLive()" :class="currentView==='live'?'text-red-400':'text-slate-500'"
        class="flex flex-col items-center gap-0.5 text-[10px] font-bold transition">
        <span class="text-lg">🔴</span><span>Live</span>
      </button>
      <button @click="mobileDrawer='betslip'" class="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-500 hover:text-amber-400 transition relative">
        <span class="text-lg">📋</span><span>Slip</span>
        <span v-if="betSlip.length>0" class="absolute -top-1 right-1 bg-amber-500 text-black font-black rounded-full w-4 h-4 text-[9px] flex items-center justify-center">{{ betSlip.length }}</span>
      </button>
    </nav>

    <!-- ════ MOBILE DRAWER — CATEGORIES ════ -->
    <transition enter-active-class="transition-transform duration-300 ease-out" enter-from-class="translate-y-full"
      enter-to-class="translate-y-0" leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-y-0" leave-to-class="translate-y-full">
      <div v-if="mobileDrawer==='categories'" class="lg:hidden fixed inset-0 z-50 flex flex-col">
        <div class="flex-1 bg-black/60" @click="mobileDrawer=null"></div>
        <div class="bg-slate-900 rounded-t-2xl max-h-[82vh] flex flex-col">
          <div class="px-4 py-3 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
            <h3 class="font-black text-amber-400 text-sm uppercase tracking-wide">Select Sport / League</h3>
            <button @click="mobileDrawer=null" class="text-slate-400 hover:text-white text-xl font-bold">✕</button>
          </div>
          <div class="overflow-y-auto p-4 space-y-4">
            <div>
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Top Leagues</p>
              <div class="space-y-1">
                <button v-for="lg in topLeagues" :key="lg.key"
                  @click="selectLeague(lg.key); mobileDrawer=null"
                  class="w-full text-left p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-200 flex items-center gap-2 hover:border-amber-500/40 transition">
                  {{ leagueFlag(lg.key) }} {{ lg.title }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">All Sports</p>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="type in sportTypes" :key="type.key"
                  @click="toggleSportType(type); mobileDrawer=null"
                  class="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-200 text-center hover:border-amber-500/40 transition">
                  {{ sportTypeIcon(type.key) }} {{ type.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ════ MOBILE DRAWER — BET SLIP ════ -->
    <transition enter-active-class="transition-transform duration-300 ease-out" enter-from-class="translate-y-full"
      enter-to-class="translate-y-0" leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-y-0" leave-to-class="translate-y-full">
      <div v-if="mobileDrawer==='betslip'" class="lg:hidden fixed inset-0 z-50 flex flex-col">
        <div class="flex-1 bg-black/60" @click="mobileDrawer=null"></div>
        <div class="bg-slate-900 rounded-t-2xl max-h-[85vh] flex flex-col">
          <div class="px-4 py-3 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
            <h3 class="font-black text-amber-400 text-sm uppercase tracking-wide">Bet Slip ({{ betSlip.length }})</h3>
            <button @click="mobileDrawer=null" class="text-slate-400 hover:text-white text-xl font-bold">✕</button>
          </div>
          <div v-if="betSlip.length===0" class="flex-1 flex items-center justify-center text-slate-600 p-8 text-sm font-bold text-center">
            No selections yet. Tap any odds to add.
          </div>
          <div v-else class="flex-1 overflow-y-auto p-4 space-y-2">
            <div v-for="(item,idx) in betSlip" :key="idx"
              class="bg-slate-950 border border-slate-800 rounded-lg p-3 relative">
              <button @click="removeBet(idx)" class="absolute top-2 right-2 text-slate-500 hover:text-red-400 font-black">✕</button>
              <p class="text-[10px] text-slate-500 font-bold uppercase truncate pr-4">{{ item.matchTitle }}</p>
              <p class="text-amber-400 font-black text-sm mt-1 truncate">{{ item.selection }}</p>
              <div class="flex justify-between mt-1.5">
                <span class="text-[10px] text-slate-500">Odds</span>
                <span class="text-white font-black">{{ item.odd.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div v-if="betSlip.length>0" class="p-4 bg-slate-950 border-t border-slate-800 space-y-3 flex-shrink-0">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400 font-bold">Total Odds</span>
              <span class="text-amber-400 font-black text-base">{{ totalOdds.toFixed(2) }}</span>
            </div>
            <input v-model.number="stakeAmount" type="number" min="10"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"/>
            <div class="flex gap-1.5">
              <button v-for="q in [50,100,200,500]" :key="q" @click="stakeAmount=q"
                class="flex-1 text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded py-1.5 transition">{{ q }}</button>
            </div>
            <div class="bg-slate-900 rounded-lg px-3 py-2.5 flex justify-between border border-slate-800">
              <span class="text-xs text-slate-400 font-bold">Payout</span>
              <span class="text-emerald-400 font-black text-base">{{ potentialPayout.toFixed(2) }} ETB</span>
            </div>
            <button @click="placeBet();mobileDrawer=null" :disabled="stakeAmount<=0||isSubmitting"
              class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black py-3.5 rounded-xl text-sm uppercase tracking-wider transition flex items-center justify-center gap-2">
              🎲 {{ isSubmitting ? 'Placing…' : 'Book Bet →' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ════ TOAST ════ -->
    <transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
      <div v-if="toast.show"
        :class="toast.type==='success' ? 'bg-emerald-600 border-emerald-500':'bg-red-700 border-red-600'"
        class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl border shadow-2xl text-white font-bold text-sm flex items-center gap-2 max-w-sm w-full">
        <span>{{ toast.type==='success'?'✅':'❌' }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Payment proof modal: shown after a successful bet booking -->
    <div v-if="showPaymentProofModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <button @click="showPaymentProofModal=false" class="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>
        <h3 class="text-lg font-bold text-white mb-1">💳 Deposit for Your Bet</h3>
        <p class="text-xs text-slate-400 mb-4">
          Your bet has been booked. Please send <span class="text-amber-400 font-black">{{ pendingBetAmount.toFixed(2) }} ETB</span>
          and upload the payment screenshot so it can be reviewed.
        </p>

        <form @submit.prevent="submitPaymentProof" class="space-y-3">
          <div>
            <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Payment Method</label>
            <select v-model="paymentProof.method" required
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
              <option value="telebirr">Telebirr</option>
              <option value="cbe">CBE</option>
              <option value="other">Other / Bank Transfer</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Transaction Reference</label>
            <input v-model.trim="paymentProof.txReference" type="text"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="Transaction / receipt number"/>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <input v-model.trim="paymentProof.senderName" type="text"
              class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="Sender name"/>
            <input v-model.trim="paymentProof.senderPhone" type="tel"
              class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="Sender phone"/>
          </div>

          <div>
            <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Payment Screenshot *</label>
            <input @change="handlePaymentScreenshot" type="file" accept="image/*" required
              class="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-amber-400 hover:file:bg-slate-700"/>
            <p class="text-[9px] text-slate-600 mt-1">Upload the Telebirr/CBE receipt screenshot.</p>
          </div>

          <button type="submit" :disabled="isSubmittingProof || !paymentProof.screenshotUrl"
            class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black py-3 rounded-xl text-sm uppercase tracking-wider transition">
            {{ isSubmittingProof ? 'Submitting…' : 'Submit Payment Proof →' }}
          </button>
        </form>
      </div>
    </div>

    <BetHistoryModal
      :is-open="showBetHistoryModal"
      :user-id="currentUserId"
      :api="api"
      @close="showBetHistoryModal=false"
    />
    <AuthModal :is-open="showAuthModal" :initial-mode="authMode" @close="showAuthModal=false" @success="handleAuthSuccess"/>
    <DepositModal :is-open="showDepositModal" @close="showDepositModal=false" @depositSuccess="handleDepositSuccess"/>
  </div>
</template>

<script>
import AuthModal    from '../../../components/AuthModal.vue';
import DepositModal from '../../../components/DepositModal.vue';
import BetHistoryModal from './BetHistoryModal.vue';

export default {
  name: 'HomeView',
  components: { AuthModal, DepositModal, BetHistoryModal },

  data() {
    return {
      api: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api',

      // UI
      currentView:      'home',   // 'home' | 'sports' | 'live' | 'detail'
      detailBackView:   'sports', // where the back button in detail returns to
      mobileMenuOpen:   false,
      mobileDrawer:     null,
      filterLive:       false,
      selectedMarket:   '1x2',
      sidebarSearch:    '',

      // Auth / user
      isLoggedIn:       false,
      userBalance:      null,
      showAuthModal:    false,
      authMode:         'login',
      showDepositModal: false,
      showBetHistoryModal: false,
      profileMenuOpen: false,

      // Sidebar navigation state
      sportTypes:          [],
      expandedSportType:   null,   // key of currently expanded sport type
      countries:           [],     // countries under expandedSportType
      expandedCountry:     null,   // code of currently expanded country
      leagues:             [],     // leagues under expandedCountry
      topLeagues:          [],
      selectedSportKey:    'soccer_epl',
      currentLeagueTitle:  '',

      // Matches
      matches:          [],
      topMatches:       [],

      // Match detail
      detailMatch:        null,
      detailMarkets:      [],
      detailSearch:       '',
      loadingDetail:      false,
      openMarketGroups:   {},

      // Market counts map: { [matchId]: number }
      // Populated lazily on click via fetchOneMarketCount()
      marketCounts:       {},

      // Loading
      loadingSportTypes:  false,
      loadingCountries:   false,
      loadingLeagues:     false,
      loadingTopLeagues:  false,
      loadingTopMatches:  false,
      loadingOdds:        false,

      // Bet slip
      betSlip:       [],
      stakeAmount:   100,
      isSubmitting:  false,

      // Payment proof — opened after the bet is successfully booked
      showPaymentProofModal: false,
      pendingBetId:      null,
      pendingBetAmount:  0,
      isSubmittingProof: false,
      paymentProof: {
        method: 'telebirr',
        txReference: '',
        senderName: '',
        senderPhone: '',
        screenshotUrl: '',
        imageHash: '',
      },

      // Toast
      toast: { show: false, message: '', type: 'success' },
    };
  },

  computed: {
    filteredMatches() {
      return this.filterLive ? this.matches.filter(m => m.isLive) : this.matches;
    },
    totalOdds() {
      return this.betSlip.length ? this.betSlip.reduce((a, b) => a * b.odd, 1) : 0;
    },
    potentialPayout() {
      return this.stakeAmount > 0 ? this.totalOdds * this.stakeAmount : 0;
    },
    filteredDetailMarkets() {
      if (!this.detailSearch.trim()) return this.detailMarkets;
      const q = this.detailSearch.toLowerCase();
      return this.detailMarkets.filter(m => m.label.toLowerCase().includes(q));
    },
    currentUser() {
      try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    },
    userInitial() {
      const name = this.currentUser?.fullName || this.currentUser?.phoneNumber || 'U';
      return name.charAt(0).toUpperCase();
    },
    currentUserId() {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null')?.userId || '';
      } catch {
        return '';
      }
    },
  },

  mounted() { this.restoreSession(); this.init(); },

  methods: {
    // ── Init ──────────────────────────────────────────────────────────────
    restoreSession() {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('token');
        this.isLoggedIn = !!(user?.userId && token);
      } catch {
        this.isLoggedIn = false;
      }
    },

    async init() {
      await Promise.all([
        this.fetchBalance(),
        this.fetchSportTypes(),
        this.fetchTopLeagues(),
        this.fetchTopMatches(),
      ]);
      await this.fetchOdds(this.selectedSportKey);
    },

    showToast(message, type = 'success', ms = 3500) {
      this.toast = { show: true, message, type };
      setTimeout(() => { this.toast.show = false; }, ms);
    },

    // ── Navigation helpers ─────────────────────────────────────────────────
    resetToHome() {
      this.currentView  = 'home';
      this.detailMatch  = null;
      this.filterLive   = false;
    },

    goToSports() {
      this.currentView = 'sports';
      this.filterLive  = false;
      this.detailMatch = null;
      if (!this.matches.length) this.fetchOdds(this.selectedSportKey);
    },

    goToLive() {
      this.currentView = 'live';
      this.filterLive  = true;
      this.detailMatch = null;
      if (!this.matches.length) this.fetchOdds(this.selectedSportKey);
    },

    // ── Sidebar: expand sport type (accordion) ────────────────────────────
    async toggleSportType(type) {
      if (this.expandedSportType === type.key) {
        this.expandedSportType = null;
        this.countries         = [];
        this.expandedCountry   = null;
        this.leagues           = [];
        return;
      }
      this.expandedSportType = type.key;
      this.expandedCountry   = null;
      this.leagues           = [];
      this.countries         = [];
      this.loadingCountries  = true;
      try {
        const r = await fetch(`${this.api}/sports/${type.key}/countries`);
        const d = await r.json();
        if (d.success) this.countries = d.data;
      } catch (e) { console.error('toggleSportType', e); }
      finally { this.loadingCountries = false; }
    },

    // ── Sidebar: expand country (accordion) ──────────────────────────────
    async toggleCountry(country) {
      if (this.expandedCountry === country.code) {
        this.expandedCountry = null;
        this.leagues         = [];
        return;
      }
      this.expandedCountry = country.code;
      this.leagues         = [];
      this.loadingLeagues  = true;
      try {
        const r = await fetch(`${this.api}/sports/${this.expandedSportType}/countries/${country.code}/leagues`);
        const d = await r.json();
        if (d.success) this.leagues = d.data;
      } catch (e) { console.error('toggleCountry', e); }
      finally { this.loadingLeagues = false; }
    },

    // ── Select a league → fetch odds → navigate to sports view ───────────
    async selectLeague(sportKey, title = '') {
      this.selectedSportKey   = sportKey;
      this.currentLeagueTitle = title;
      this.currentView        = this.filterLive ? 'live' : 'sports';
      this.detailMatch        = null;
      await this.fetchOdds(sportKey);
    },

    // ── API: balance ──────────────────────────────────────────────────────
    async fetchBalance() {
      try {
        const r = await fetch(`${this.api}/user/balance`);
        const d = await r.json();
        if (d.balance !== undefined) this.userBalance = d.balance;
      } catch { this.userBalance = 2500; }
    },

    // ── API: sport types ──────────────────────────────────────────────────
    async fetchSportTypes() {
      this.loadingSportTypes = true;
      try {
        const r = await fetch(`${this.api}/sports/types`);
        const d = await r.json();
        if (d.success) this.sportTypes = d.data;
      } catch (e) { console.error('fetchSportTypes', e); }
      finally { this.loadingSportTypes = false; }
    },

    // ── API: top leagues ──────────────────────────────────────────────────
    async fetchTopLeagues() {
      this.loadingTopLeagues = true;
      try {
        const r = await fetch(`${this.api}/sports/top-leagues`);
        const d = await r.json();
        if (d.success) this.topLeagues = d.data.map(lg => ({ ...lg, key: lg.sportKey }));
      } catch (e) { console.error('fetchTopLeagues', e); }
      finally { this.loadingTopLeagues = false; }
    },

    // ── API: top matches (home hero strip) ────────────────────────────────
    async fetchTopMatches() {
      this.loadingTopMatches = true;
      try {
        const r = await fetch(`${this.api}/sports/top-matches?markets=h2h&regions=eu`);
        const d = await r.json();
        if (d.success) this.topMatches = d.data;
      } catch (e) { console.error('fetchTopMatches', e); }
      finally { this.loadingTopMatches = false; }
    },

    // ── API: odds for a league ────────────────────────────────────────────
    async fetchOdds(sportKey) {
      this.loadingOdds  = true;
      this.matches      = [];
      this.marketCounts = {};   // reset counts for the new league
      try {
        // Sport/league events come from the backend event endpoint.
        // Example: GET /api/events/soccer_epl
        const r = await fetch(`${this.api}/events/${encodeURIComponent(sportKey)}`);
        const d = await r.json();
        if (d.success) this.matches = d.data.map(ev => this.transformEvent(ev));
      } catch (e) { console.error('fetchOdds/events', e); }
      finally { this.loadingOdds = false; }
      // Additional markets are intentionally still fetched lazily from
      // their existing endpoints when a match is opened.
    },

    // ── Fetch market count for ONE match (lazy, on-demand) ────────────────
    // Called by openMatchDetail before navigating to the detail view.
    // Returns the count so it can be shown immediately in the badge if needed.
    async fetchOneMarketCount(sportKey, matchId) {
      try {
        const r = await fetch(`${this.api}/events/${sportKey}/${matchId}/market-count?regions=eu`);
        const d = await r.json();
        const count = d.marketCount ?? 0;
        // Store in reactive map so badge updates if user returns to list
        this.marketCounts = { ...this.marketCounts, [matchId]: count };
        return count;
      } catch {
        return 0;
      }
    },

    // ── Event transformer ─────────────────────────────────────────────────
    transformEvent(ev) {
      // /api/events/:sportKey returns DB events in camelCase and includes
      // current odds as ev.odds. The h2h market supplies 1X2 prices.
      const homeTeam = ev.homeTeam ?? '';
      const awayTeam = ev.awayTeam ?? '';
      const home = Number.isFinite(Number(ev.odds?.home)) ? Number(ev.odds.home) : null;
      const draw = Number.isFinite(Number(ev.odds?.draw)) ? Number(ev.odds.draw) : null;
      const away = Number.isFinite(Number(ev.odds?.away)) ? Number(ev.odds.away) : null;

      return {
        id:           ev.eventId,
        sport_key:    ev.sportKey,
        sport_title:  ev.Sport?.title || ev.sportKey,
        homeTeam,
        awayTeam,
        commenceTime: ev.commenceTime,
        status:       ev.status,
        isLive:       ev.status === 'live',
        homeScore:    null,
        awayScore:    null,
        odds: { home, draw, away, over:null, under:null, bttsYes:null, bttsNo:null },
      };
    },

    // ── H2H helper for raw top-matches objects ────────────────────────────
    getH2HOdds(ev) {
      if (!ev.bookmakers?.length) return null;
      const h2h = ev.bookmakers[0].markets?.find(m => m.key==='h2h');
      if (!h2h) return null;
      return {
        home: h2h.outcomes.find(o => o.name===ev.home_team)?.price ?? null,
        draw: h2h.outcomes.find(o => o.name==='Draw')?.price       ?? null,
        away: h2h.outcomes.find(o => o.name===ev.away_team)?.price ?? null,
      };
    },

    // Helper for home-strip 1X2 buttons
    h2hBtns(match) {
      const o = this.getH2HOdds(match);
      if (!o) return [];
      return [
        { label:'1', sel:'Home Win (1)', odd: o.home },
        { label:'X', sel:'Draw (X)',     odd: o.draw },
        { label:'2', sel:'Away Win (2)', odd: o.away },
      ];
    },

    // ── Market count badge — reads from the reactive counts map ──────────
    // Returns null while loading (shows spinner), the real number once fetched.
    getMarketCount(matchId) {
      const n = this.marketCounts[matchId];
      return (n === undefined) ? null : n;
    },

    // ── Open match detail view ────────────────────────────────────────────
    async openMatchDetail(match) {
      this.detailBackView   = this.currentView;
      this.detailMatch      = match;
      this.detailSearch     = '';
      this.detailMarkets    = [];
      this.openMarketGroups = {};
      this.currentView      = 'detail';
      this.loadingDetail    = true;

      const sportKey = match.sport_key || this.selectedSportKey;

      // Fetch real market count (lazy — only fired on click) and
      // full event odds in parallel. Both update the UI reactively.
      const [, eventData] = await Promise.all([
        this.fetchOneMarketCount(sportKey, match.id),
        fetch(`${this.api}/odds/${sportKey}/events/${match.id}?regions=eu`)
          .then(r => r.json())
          .catch(() => null),
      ]);

      try {
        if (eventData?.success && eventData?.data) {
          this.detailMarkets = this.buildMarketGroups(eventData.data);
        } else {
          this.detailMarkets = this.buildFallbackMarkets(match);
        }
      } catch (e) {
        console.error('openMatchDetail build', e);
        this.detailMarkets = this.buildFallbackMarkets(match);
      } finally {
        this.loadingDetail = false;
        // Open first 3 groups by default
        this.detailMarkets.slice(0, 3).forEach(m => {
          this.openMarketGroups[m.key] = true;
        });
      }
    },

    buildMarketGroups(eventData) {
      const groups = {};
      (eventData.bookmakers || []).forEach(bm => {
        (bm.markets || []).forEach(mkt => {
          const key   = mkt.key;
          const label = this.marketLabel(key);
          if (!groups[key]) groups[key] = { key, label, outcomes: [] };
          (mkt.outcomes || []).forEach(o => {
            const existing = groups[key].outcomes.find(
              ex => ex.name === o.name && ex.point === o.point
            );
            if (!existing) groups[key].outcomes.push({ name: o.name, price: o.price, point: o.point });
            else if (o.price > existing.price) existing.price = o.price;
          });
        });
      });
      const priority = { h2h:0, totals:1, spreads:2, outrights:3 };
      return Object.values(groups).sort((a,b) => (priority[a.key]??99) - (priority[b.key]??99));
    },

    buildFallbackMarkets(match) {
      const groups = [];
      if (match.odds) {
        if (match.odds.home || match.odds.draw || match.odds.away) {
          groups.push({
            key: 'h2h', label: '1X2 — Match Result',
            outcomes: [
              { name: '1 — ' + match.homeTeam, price: match.odds.home },
              { name: 'X — Draw',               price: match.odds.draw },
              { name: '2 — ' + match.awayTeam, price: match.odds.away },
            ].filter(o => o.price),
          });
        }
        groups.push({
          key: 'totals', label: 'Over/Under 2.5 Goals',
          outcomes: [
            { name: 'Over 2.5',  price: match.odds.over  || 1.85 },
            { name: 'Under 2.5', price: match.odds.under || 1.95 },
          ],
        });
        groups.push({
          key: 'btts', label: 'Both Teams to Score',
          outcomes: [
            { name: 'Yes', price: match.odds.bttsYes || 1.75 },
            { name: 'No',  price: match.odds.bttsNo  || 2.05 },
          ],
        });
      }
      return groups;
    },

    marketLabel(key) {
      const map = {
        h2h:'1X2 — Match Result', totals:'Over/Under', spreads:'Handicap/Spreads',
        outrights:'Outright Winner', h2h_lay:'Lay — 1X2', outrights_lay:'Lay — Outrights',
      };
      return map[key] || key.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
    },

    toggleMarketGroup(key) {
      this.openMarketGroups = { ...this.openMarketGroups, [key]: !this.openMarketGroups[key] };
    },

    // ── Bet slip ──────────────────────────────────────────────────────────
    toggleBet(match, selection, odd) {
      const id    = match.id;
      const title = `${match.homeTeam ?? match.home_team} vs ${match.awayTeam ?? match.away_team}`;
      const idx   = this.betSlip.findIndex(b => b.matchId===id && b.selection===selection);
      if (idx > -1) { this.betSlip.splice(idx, 1); return; }
      const existing = this.betSlip.findIndex(b => b.matchId===id);
      if (existing > -1) this.betSlip.splice(existing, 1);

      // Keep the UI selection label, but also retain the exact backend outcome name.
      let outcomeName = selection;
      if (selection === 'Home Win (1)') outcomeName = match.homeTeam ?? match.home_team;
      else if (selection === 'Draw (X)') outcomeName = 'Draw';
      else if (selection === 'Away Win (2)') outcomeName = match.awayTeam ?? match.away_team;

      this.betSlip.push({ matchId:id, matchTitle:title, selection, outcomeName, odd });
    },

    isSelectionActive(matchId, selection) {
      return this.betSlip.some(b => b.matchId===matchId && b.selection===selection);
    },

    removeBet(idx) { this.betSlip.splice(idx, 1); },

    async placeBet() {
      if (!this.betSlip.length) { this.showToast('Select at least one outcome', 'error'); return; }
      if (!this.stakeAmount || this.stakeAmount <= 0) { this.showToast('Enter a valid stake', 'error'); return; }

      const sessionUser = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = sessionUser?.userId;
      if (!userId) {
        this.openAuth('login');
        this.showToast('Please login before booking a bet', 'error');
        return;
      }

      this.isSubmitting = true;
      try {
        const selections = this.betSlip.map(item => ({
          eventId: item.matchId,
          marketKey: 'h2h',
          outcomeName: item.outcomeName || item.selection,
          point: null,
        }));

        const res = await fetch(`${this.api}/bets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            stake: this.stakeAmount,
            selections,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const bookedBet = data.data || data.ticket || {};
          this.pendingBetId = bookedBet.betId || bookedBet.id || null;
          this.pendingBetAmount = Number(this.stakeAmount);

          this.betSlip = [];
          this.showPaymentProofModal = true;
          this.showToast('✅ Bet saved as pending. No wallet balance was required.', 'success');
        } else {
          this.showToast(data.error || 'Bet booking failed', 'error');
        }
      } catch (e) {
        console.error('placeBet', e);
        this.showToast('Network error — could not book bet', 'error');
      } finally {
        this.isSubmitting = false;
      }
    },

    handlePaymentScreenshot(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      // PaymentProof stores screenshotUrl as a string. Use a compressed data URL
      // so Home.vue can submit the screenshot directly without another upload service.
      const reader = new FileReader();
      reader.onload = () => {
        this.paymentProof.screenshotUrl = reader.result;
      };
      reader.readAsDataURL(file);
    },

    async submitPaymentProof() {
      const sessionUser = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = sessionUser?.userId;
      if (!userId) {
        this.openAuth('login');
        return;
      }
      if (!this.paymentProof.screenshotUrl) {
        this.showToast('Please upload the payment screenshot', 'error');
        return;
      }

      this.isSubmittingProof = true;
      try {
        const res = await fetch(`${this.api}/payments/deposit-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            method: this.paymentProof.method,
            amount: this.pendingBetAmount,
            txReference: this.paymentProof.txReference || null,
            senderName: this.paymentProof.senderName || null,
            senderPhone: this.paymentProof.senderPhone || null,
            screenshotUrl: this.paymentProof.screenshotUrl,
            imageHash: this.paymentProof.imageHash || null,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          this.showPaymentProofModal = false;
          this.paymentProof = {
            method: 'telebirr',
            txReference: '',
            senderName: '',
            senderPhone: '',
            screenshotUrl: '',
            imageHash: '',
          };
          this.showToast('✅ Payment proof submitted. It is now pending review.', 'success', 5000);
        } else {
          this.showToast(data.error || 'Could not submit payment proof', 'error');
        }
      } catch (e) {
        console.error('submitPaymentProof', e);
        this.showToast('Network error — could not submit payment proof', 'error');
      } finally {
        this.isSubmittingProof = false;
      }
    },

    // ── Auth / deposit ────────────────────────────────────────────────────
    openAuth(mode) { this.authMode = mode; this.showAuthModal = true; },
    handleAuthSuccess(data) {
      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data?.isAdmin ? 'admin' : 'user');
      this.isLoggedIn = !!data?.user?.userId;
      this.profileMenuOpen = false;
      this.showToast(`Welcome! ${data.mode==='login'?'Logged in':'Registered'} successfully`, 'success');
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      this.isLoggedIn = false;
      this.userBalance = null;
      this.showBetHistoryModal = false;
      this.profileMenuOpen = false;
      this.showToast('Logged out successfully', 'success');
    },

    handleDepositSuccess(amount) {
      this.userBalance += amount;
      this.showToast(`Deposited ${amount.toFixed(2)} ETB`, 'success');
    },

    // ── Utility ───────────────────────────────────────────────────────────
    isLive(t) { return new Date(t) <= new Date(); },
    formatDate(iso) {
      return new Date(iso).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    },

    // Sport type name lookup
    sportTypeName(key) {
      return this.sportTypes.find(t => t.key === key)?.name || key;
    },

    // Country name lookup from expanded list
    countryNameFor(code) {
      return this.countries.find(c => c.code === code)?.name || code;
    },

    leagueFlag(key = '') {
      const map = {
        soccer_epl:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', soccer_spain_la_liga:'🇪🇸', soccer_germany_bundesliga:'🇩🇪',
        soccer_italy_serie_a:'🇮🇹', soccer_france_ligue_one:'🇫🇷', soccer_uefa_champs_league:'🏆',
        basketball_nba:'🏀', americanfootball_nfl:'🏈', tennis_atp_french_open:'🎾', cricket_ipl:'🏏',
      };
      if (map[key]) return map[key];
      if (key.startsWith('soccer'))            return '⚽';
      if (key.startsWith('basketball'))        return '🏀';
      if (key.startsWith('americanfootball'))  return '🏈';
      if (key.startsWith('baseball'))          return '⚾';
      if (key.startsWith('icehockey'))         return '🏒';
      if (key.startsWith('tennis'))            return '🎾';
      if (key.startsWith('cricket'))           return '🏏';
      if (key.startsWith('rugby'))             return '🏉';
      if (key.startsWith('golf'))              return '⛳';
      if (key.startsWith('mma'))               return '🥊';
      return '🌐';
    },

    sportTypeIcon(key = '') {
      const map = {
        soccer:'⚽', football:'⚽', basketball:'🏀', americanfootball:'🏈',
        baseball:'⚾', icehockey:'🏒', tennis:'🎾', cricket:'🏏',
        rugby:'🏉', golf:'⛳', mma:'🥊', boxing:'🥊', aussierules:'🏉',
      };
      return map[key.toLowerCase()] || '🏅';
    },

    countryFlag(name = '') {
      const map = {
        'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Spain':'🇪🇸', 'Germany':'🇩🇪', 'Italy':'🇮🇹',
        'France':'🇫🇷', 'USA':'🇺🇸', 'Australia':'🇦🇺', 'Brazil':'🇧🇷',
        'Portugal':'🇵🇹', 'Netherlands':'🇳🇱', 'UEFA':'🏆', 'International':'🌐',
        'Argentina':'🇦🇷', 'Mexico':'🇲🇽', 'Turkey':'🇹🇷', 'Russia':'🇷🇺',
      };
      return map[name] || '🌐';
    },
  },
};
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
</style>
