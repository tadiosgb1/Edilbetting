<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col pb-16 lg:pb-0">
    <!-- ── Top Header ─────────────────────────────────────────────────── -->
    <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <!-- Main header row -->
      <div class="flex items-center justify-between px-3 sm:px-5 h-14">

        <!-- Left: Logo + hamburger toggle on mobile -->
        <div class="flex items-center gap-3">
          <!-- Mobile menu toggle -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            :aria-expanded="mobileMenuOpen"
            aria-label="Toggle menu"
          >
            <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Logo -->
          <div class="flex items-center gap-1.5">
            <span class="bg-amber-500 text-black font-black text-base sm:text-xl px-2 py-0.5 rounded tracking-wider leading-tight">BET</span>
            <span class="font-bold text-base sm:text-xl tracking-wide text-white hidden xs:inline">PLATFORM</span>
          </div>

          <!-- Desktop nav tabs -->
          <nav class="hidden lg:flex items-center gap-1 ml-4">
            <button
              @click="activeTab = 'sports'"
              :class="activeTab === 'sports' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
              class="px-3 py-1.5 rounded text-sm font-semibold transition"
            >Sports</button>
            <button
              @click="activeTab = 'live'"
              :class="activeTab === 'live' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
              class="px-3 py-1.5 rounded text-sm font-semibold transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
              Live
            </button>
          </nav>
        </div>

        <!-- Right: Balance + actions -->
        <div class="flex items-center gap-1.5 sm:gap-2.5">
          <!-- Balance pill — compact on small screens -->
          <div
            v-if="userBalance !== null"
            class="bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1"
          >
            <span class="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wide hidden sm:inline">Balance</span>
            <span class="text-amber-400 font-black text-xs sm:text-sm">{{ userBalance.toFixed(2) }}</span>
            <span class="text-slate-500 text-[10px] hidden sm:inline">ETB</span>
          </div>

          <!-- Deposit button -->
          <button
            @click="showDepositModal = true"
            class="bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition shadow-md shadow-amber-500/20 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="hidden sm:inline">Deposit</span>
            <span class="sm:hidden font-black text-sm leading-none">+</span>
          </button>

          <!-- Auth buttons — desktop -->
          <template v-if="!isLoggedIn">
            <button
              @click="openAuth('login')"
              class="hidden sm:inline-flex text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >Login</button>
            <button
              @click="openAuth('register')"
              class="hidden sm:inline-flex bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-sm font-bold px-3 py-1.5 rounded-lg transition"
            >Register</button>

            <!-- Mobile: single avatar/login icon -->
            <button
              @click="openAuth('login')"
              class="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-amber-400 border border-slate-700 hover:bg-slate-700 transition"
              aria-label="Login"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </button>
          </template>

          <!-- Logged in user avatar -->
          <div v-else class="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-sm cursor-pointer">
            U
          </div>
        </div>
      </div>

      <!-- Mobile dropdown nav (Sports / Live tabs) -->
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="mobileMenuOpen" class="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-sm">
          <div class="px-3 py-3 flex flex-col gap-1">
            <button
              @click="activeTab = 'sports'; mobileMenuOpen = false"
              :class="activeTab === 'sports' ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500' : 'text-slate-300 hover:bg-slate-800'"
              class="w-full text-left px-4 py-2.5 rounded text-sm font-semibold transition"
            >⚽ Sports</button>
            <button
              @click="activeTab = 'live'; mobileMenuOpen = false; filterLive = true"
              :class="activeTab === 'live' ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500' : 'text-slate-300 hover:bg-slate-800'"
              class="w-full text-left px-4 py-2.5 rounded text-sm font-semibold transition flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Matches
            </button>

            <!-- Auth links for mobile (inside menu) -->
            <template v-if="!isLoggedIn">
              <div class="border-t border-slate-800 mt-1 pt-2 flex gap-2">
                <button
                  @click="openAuth('login'); mobileMenuOpen = false"
                  class="flex-1 py-2.5 text-sm font-bold text-slate-300 hover:text-white border border-slate-700 rounded-lg transition hover:bg-slate-800"
                >Login</button>
                <button
                  @click="openAuth('register'); mobileMenuOpen = false"
                  class="flex-1 py-2.5 text-sm font-bold text-amber-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                >Register</button>
              </div>
            </template>
          </div>
        </div>
      </transition>
    </header>

    <!-- Main Workspace -->
    <div class="flex-1 flex overflow-hidden relative">
      
      <!-- Left Sidebar: Sports Categories & Country Matches (Desktop) -->
      <aside class="w-64 bg-slate-900/60 border-r border-slate-800 hidden lg:flex flex-col p-3 overflow-y-auto">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sports Categories</h3>
        <ul class="space-y-1 mb-6">
          <li v-for="sport in sportsList" :key="sport.key">
            <button 
              @click="selectSportCategory(sport.key)"
              :class="selectedSportKey === sport.key ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500' : 'text-slate-300 hover:bg-slate-800'"
              class="w-full text-left px-3 py-2 rounded text-xs font-medium flex justify-between items-center transition"
            >
              <span class="truncate pr-2">{{ sport.title }}</span>
              <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{{ sport.group }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Center Content: Match Odds Feed -->
      <main class="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
        <!-- Banner Promo -->
        <div class="bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg p-4 flex justify-between items-center shadow-lg">
          <div>
            <span class="bg-black/30 text-xs px-2 py-0.5 rounded uppercase font-bold text-amber-200">Welcome Bonus</span>
            <h2 class="text-base md:text-xl font-bold text-white mt-1">100% First Deposit Bonus up to 5,000 ETB</h2>
          </div>
          <button @click="openAuth('register')" class="bg-black hover:bg-slate-900 text-amber-400 font-bold px-3 md:px-4 py-2 rounded text-xs md:text-sm transition shrink-0 ml-2">Claim Now</button>
        </div>

        <!-- Matches Header Controls -->
        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
          <h2 class="text-sm md:text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <span>Matches Feed</span>
            <span v-if="isLoading" class="text-xs text-amber-400 font-normal animate-pulse">Loading odds...</span>
          </h2>
          <div class="flex gap-2">
            <button @click="filterLive = false" :class="!filterLive ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'" class="text-xs font-bold px-3 py-1 rounded">All Matches</button>
            <button @click="filterLive = true" :class="filterLive ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'" class="text-xs font-bold px-3 py-1 rounded">Live</button>
          </div>
        </div>

        <!-- Empty / Error States -->
        <div v-if="!isLoading && matches.length === 0" class="bg-slate-900 p-8 rounded text-center text-slate-400 border border-slate-800">
          No matches or odds available for this category currently. Select another category.
        </div>

        <!-- Match Cards -->
        <div class="space-y-3" v-else>
          <div 
            v-for="match in filteredMatches" 
            :key="match.id" 
            class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded p-3 transition space-y-3"
          >
            <!-- League Info, Country & Time -->
            <div class="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800/60 pb-2">
              <div class="flex items-center gap-1.5 font-semibold text-slate-300">
                <span class="text-sm">{{ getCountryFlag(match.group) }}</span>
                <span>{{ match.sportTitle }}</span>
              </div>
              <span v-if="match.isLive" class="text-red-400 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Live
              </span>
              <span v-else>{{ formatDate(match.commenceTime) }}</span>
            </div>

            <!-- Teams & Scores -->
            <div class="flex justify-between items-center font-bold text-sm text-slate-100">
              <div class="flex-1 pr-2">
                <div>{{ match.homeTeam }}</div>
                <div>{{ match.awayTeam }}</div>
              </div>
              <div v-if="match.homeScore !== null" class="text-right text-amber-400 font-mono">
                <div>{{ match.homeScore }}</div>
                <div>{{ match.awayScore }}</div>
              </div>
            </div>

            <!-- Betting Market Tabs (1X2, Over/Under, BTTS) -->
            <div class="pt-1">
              <div class="flex gap-2 text-[11px] mb-2 font-bold text-slate-400">
                <button @click="match.selectedMarket = '1x2'" :class="match.selectedMarket === '1x2' ? 'text-amber-400 underline' : ''">1X2</button>
                <button @click="match.selectedMarket = 'ou'" :class="match.selectedMarket === 'ou' ? 'text-amber-400 underline' : ''">Over/Under 2.5</button>
                <button @click="match.selectedMarket = 'btts'" :class="match.selectedMarket === 'btts' ? 'text-amber-400 underline' : ''">Both Teams to Score</button>
              </div>

              <!-- 1X2 Market Buttons -->
              <div v-if="match.selectedMarket === '1x2'" class="grid grid-cols-3 gap-2">
                <button 
                  v-if="match.odds.home" 
                  @click="toggleBet(match, 'Home Win (1)', match.odds.home)" 
                  :class="isSelectionActive(match.id, 'Home Win (1)') ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'" 
                  class="border rounded p-2 text-center transition flex flex-col justify-center items-center"
                >
                  <span class="text-[10px] text-slate-400 uppercase font-bold">1</span>
                  <span class="font-bold text-xs md:text-sm">{{ match.odds.home.toFixed(2) }}</span>
                </button>
                <div v-else class="bg-slate-900 border border-slate-800 rounded p-2 text-center text-xs text-slate-600 flex items-center justify-center">N/A</div>

                <button 
                  v-if="match.odds.draw" 
                  @click="toggleBet(match, 'Draw (X)', match.odds.draw)" 
                  :class="isSelectionActive(match.id, 'Draw (X)') ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'" 
                  class="border rounded p-2 text-center transition flex flex-col justify-center items-center"
                >
                  <span class="text-[10px] text-slate-400 uppercase font-bold">X</span>
                  <span class="font-bold text-xs md:text-sm">{{ match.odds.draw.toFixed(2) }}</span>
                </button>
                <div v-else class="bg-slate-900 border border-slate-800 rounded p-2 text-center text-xs text-slate-600 flex items-center justify-center">N/A</div>

                <button 
                  v-if="match.odds.away" 
                  @click="toggleBet(match, 'Away Win (2)', match.odds.away)" 
                  :class="isSelectionActive(match.id, 'Away Win (2)') ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'" 
                  class="border rounded p-2 text-center transition flex flex-col justify-center items-center"
                >
                  <span class="text-[10px] text-slate-400 uppercase font-bold">2</span>
                  <span class="font-bold text-xs md:text-sm">{{ match.odds.away.toFixed(2) }}</span>
                </button>
                <div v-else class="bg-slate-900 border border-slate-800 rounded p-2 text-center text-xs text-slate-600 flex items-center justify-center">N/A</div>
              </div>

              <!-- Over/Under Market Buttons -->
              <div v-else-if="match.selectedMarket === 'ou'" class="grid grid-cols-2 gap-2">
                <button 
                  @click="toggleBet(match, 'Over 2.5', match.odds.over || 1.85)" 
                  :class="isSelectionActive(match.id, 'Over 2.5') ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'" 
                  class="border rounded p-2 text-center transition flex flex-col justify-center items-center"
                >
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Over 2.5</span>
                  <span class="font-bold text-xs md:text-sm">{{ (match.odds.over || 1.85).toFixed(2) }}</span>
                </button>

                <button 
                  @click="toggleBet(match, 'Under 2.5', match.odds.under || 1.95)" 
                  :class="isSelectionActive(match.id, 'Under 2.5') ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'" 
                  class="border rounded p-2 text-center transition flex flex-col justify-center items-center"
                >
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Under 2.5</span>
                  <span class="font-bold text-xs md:text-sm">{{ (match.odds.under || 1.95).toFixed(2) }}</span>
                </button>
              </div>

              <!-- Both Teams to Score (BTTS) Market Buttons -->
              <div v-else-if="match.selectedMarket === 'btts'" class="grid grid-cols-2 gap-2">
                <button 
                  @click="toggleBet(match, 'BTTS - Yes', match.odds.bttsYes || 1.75)" 
                  :class="isSelectionActive(match.id, 'BTTS - Yes') ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'" 
                  class="border rounded p-2 text-center transition flex flex-col justify-center items-center"
                >
                  <span class="text-[10px] text-slate-400 uppercase font-bold">BTTS Yes</span>
                  <span class="font-bold text-xs md:text-sm">{{ (match.odds.bttsYes || 1.75).toFixed(2) }}</span>
                </button>

                <button 
                  @click="toggleBet(match, 'BTTS - No', match.odds.bttsNo || 2.05)" 
                  :class="isSelectionActive(match.id, 'BTTS - No') ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'" 
                  class="border rounded p-2 text-center transition flex flex-col justify-center items-center"
                >
                  <span class="text-[10px] text-slate-400 uppercase font-bold">BTTS No</span>
                  <span class="font-bold text-xs md:text-sm">{{ (match.odds.bttsNo || 2.05).toFixed(2) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar: Interactive Bet Slip (Desktop View) -->
      <aside class="w-80 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col h-full">
        <div class="p-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
          <h3 class="font-bold text-sm uppercase tracking-wide text-amber-400">Bet Slip</h3>
          <span class="text-xs bg-amber-500 text-black font-bold px-2 py-0.5 rounded-full">{{ betSlip.length }}</span>
        </div>

        <div v-if="betSlip.length === 0" class="flex-1 flex flex-col justify-center items-center p-6 text-center text-slate-500">
          <svg class="w-12 h-12 mb-2 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <p class="text-sm">Your bet slip is empty.</p>
        </div>

        <div v-else class="flex-1 overflow-y-auto p-3 space-y-2">
          <div v-for="(item, index) in betSlip" :key="index" class="bg-slate-950 border border-slate-800 p-2.5 rounded relative text-xs">
            <button @click="removeBet(index)" class="absolute top-2 right-2 text-slate-500 hover:text-red-400 font-bold">✕</button>
            <div class="font-semibold text-slate-300 pr-4">{{ item.matchTitle }}</div>
            <div class="text-amber-400 font-bold mt-1">{{ item.selection }} @ {{ item.odd.toFixed(2) }}</div>
          </div>
        </div>

        <div v-if="betSlip.length > 0" class="p-3 bg-slate-950 border-t border-slate-800 space-y-3">
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400">Total Odds:</span>
            <span class="text-amber-400 font-bold text-sm">{{ totalOdds.toFixed(2) }}</span>
          </div>

          <div>
            <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Stake (ETB)</label>
            <input v-model.number="stakeAmount" type="number" min="10" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400" />
          </div>

          <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
            <span class="text-slate-400">Potential Payout:</span>
            <span class="text-emerald-400 font-bold text-sm">{{ potentialPayout.toFixed(2) }} ETB</span>
          </div>

          <button @click="placeBet" :disabled="stakeAmount <= 0 || isSubmitting" class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-2.5 rounded text-sm transition uppercase tracking-wide">
            {{ isSubmitting ? 'Placing Bet...' : 'Place Bet' }}
          </button>
        </div>
      </aside>
    </div>

    <!-- Mobile Navigation Bar -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center p-2 z-40 text-xs">
      <button @click="mobileDrawer = 'categories'" class="flex flex-col items-center text-slate-300 hover:text-amber-400">
        <span>⚽</span>
        <span>Sports</span>
      </button>
      <button @click="filterLive = !filterLive" :class="filterLive ? 'text-amber-400' : 'text-slate-300'" class="flex flex-col items-center">
        <span class="relative flex h-3 w-3 mb-1">
          <span v-if="filterLive" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span>Live</span>
      </button>
      <button @click="mobileDrawer = 'betslip'" class="flex flex-col items-center text-slate-300 hover:text-amber-400 relative">
        <span>📋</span>
        <span>Bet Slip</span>
        <span v-if="betSlip.length > 0" class="absolute -top-1 -right-2 bg-amber-500 text-black font-bold rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
          {{ betSlip.length }}
        </span>
      </button>
    </nav>

    <!-- Mobile Slide-over Drawer for Sports Categories -->
    <div v-if="mobileDrawer === 'categories'" class="lg:hidden fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div class="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <h3 class="font-bold text-amber-400 text-sm uppercase">Select Sport Category</h3>
        <button @click="mobileDrawer = null" class="text-slate-400 hover:text-white font-bold text-lg">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <button 
          v-for="sport in sportsList" 
          :key="sport.key" 
          @click="selectSportCategory(sport.key); mobileDrawer = null"
          class="w-full text-left p-3 rounded bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-200 flex justify-between items-center"
        >
          <span>{{ sport.title }}</span>
          <span class="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{{ sport.group }}</span>
        </button>
      </div>
    </div>

    <!-- Mobile Slide-over Drawer for Bet Slip -->
    <div v-if="mobileDrawer === 'betslip'" class="lg:hidden fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div class="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <h3 class="font-bold text-amber-400 text-sm uppercase">Your Bet Slip ({{ betSlip.length }})</h3>
        <button @click="mobileDrawer = null" class="text-slate-400 hover:text-white font-bold text-lg">✕</button>
      </div>

      <div v-if="betSlip.length === 0" class="flex-1 flex items-center justify-center text-slate-500">
        Your bet slip is empty.
      </div>

      <div v-else class="flex-1 overflow-y-auto p-4 space-y-2">
        <div v-for="(item, index) in betSlip" :key="index" class="bg-slate-950 border border-slate-800 p-3 rounded relative text-xs">
          <button @click="removeBet(index)" class="absolute top-2 right-2 text-slate-500 hover:text-red-400 font-bold">✕</button>
          <div class="font-semibold text-slate-300 pr-4">{{ item.matchTitle }}</div>
          <div class="text-amber-400 font-bold mt-1">{{ item.selection }} @ {{ item.odd.toFixed(2) }}</div>
        </div>
      </div>

      <div v-if="betSlip.length > 0" class="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-400">Total Odds:</span>
          <span class="text-amber-400 font-bold text-sm">{{ totalOdds.toFixed(2) }}</span>
        </div>
        <div>
          <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Stake (ETB)</label>
          <input v-model.number="stakeAmount" type="number" min="10" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white" />
        </div>
        <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
          <span class="text-slate-400">Potential Payout:</span>
          <span class="text-emerald-400 font-bold text-sm">{{ potentialPayout.toFixed(2) }} ETB</span>
        </div>
        <button @click="placeBet(); mobileDrawer = null" :disabled="stakeAmount <= 0 || isSubmitting" class="w-full bg-amber-500 text-black font-bold py-3 rounded text-sm uppercase">
          {{ isSubmitting ? 'Placing Bet...' : 'Place Bet' }}
        </button>
      </div>
    </div>

    <!-- Modals -->
    <AuthModal :is-open="showAuthModal" :initial-mode="authMode" @close="showAuthModal = false" @success="handleAuthSuccess" />
    <DepositModal :is-open="showDepositModal" @close="showDepositModal = false" @depositSuccess="handleDepositSuccess" />

  </div>
</template>

<script>
import AuthModal from '../../../components/AuthModal.vue';
import DepositModal from '../../../components/DepositModal.vue';

export default {
  name: 'HomeView',
  components: {
    AuthModal,
    DepositModal
  },
  data() {
    return {
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api',
      activeTab: 'sports',
      selectedSportKey: 'soccer_epl',
      filterLive: false,
      isLoading: false,
      isSubmitting: false,
      isLoggedIn: false,
      userBalance: 2500.00,
      stakeAmount: 100,
      
      showAuthModal: false,
      authMode: 'login',
      showDepositModal: false,
      mobileDrawer: null,
      mobileMenuOpen: false,

      sportsList: [],
      matches: [],
      betSlip: []
    };
  },
  computed: {
    filteredMatches() {
      if (this.filterLive) {
        return this.matches.filter(m => m.isLive);
      }
      return this.matches;
    },
    totalOdds() {
      if (this.betSlip.length === 0) return 0;
      return this.betSlip.reduce((acc, curr) => acc * curr.odd, 1);
    },
    potentialPayout() {
      if (!this.stakeAmount || this.stakeAmount <= 0) return 0;
      return this.totalOdds * this.stakeAmount;
    }
  },
  mounted() {
    this.fetchUserBalance();
    this.fetchSports();
    this.fetchOddsForSport(this.selectedSportKey);
  },
  methods: {
    openAuth(mode) {
      this.authMode = mode;
      this.showAuthModal = true;
    },

    handleAuthSuccess(data) {
      this.isLoggedIn = true;
      alert(`Successfully ${data.mode === 'login' ? 'logged in' : 'registered'}!`);
    },

    handleDepositSuccess(amount) {
      this.userBalance += amount;
      alert(`Successfully deposited ${amount.toFixed(2)} ETB`);
    },

    getCountryFlag(group) {
      const flags = {
        'EPL': '🇬🇧',
        'La Liga': '🇪🇸',
        'Bundesliga': '🇩🇪',
        'Serie A': '🇮🇹',
        'Ligue 1': '🇫🇷',
        'UEFA Champions League': '🇪🇺'
      };
      return flags[group] || '🌐';
    },

    async fetchUserBalance() {
      try {
        const res = await fetch(`${this.backendUrl}/user/balance`);
        const data = await res.json();
        if (data.balance !== undefined) {
          this.userBalance = data.balance;
        }
      } catch (err) {
        console.error('Failed to fetch user balance:', err);
      }
    },

    async fetchSports() {
      try {
        const res = await fetch(`${this.backendUrl}/sports`);
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          this.sportsList = json.data.filter(s => s.active).slice(0, 15);
        }
      } catch (err) {
        console.error('Failed to load sports list:', err);
      }
    },

    async selectSportCategory(sportKey) {
      this.selectedSportKey = sportKey;
      await this.fetchOddsForSport(sportKey);
    },

    async fetchOddsForSport(sportKey) {
      this.isLoading = true;
      try {
        const res = await fetch(`${this.backendUrl}/odds/${sportKey}`);
        const json = await res.json();

        if (json.data && Array.isArray(json.data)) {
          this.matches = json.data.map(event => this.transformEventToMatch(event));
        } else {
          this.matches = [];
        }
      } catch (err) {
        console.error('Failed to load odds feed:', err);
        this.matches = [];
      } finally {
        this.isLoading = false;
      }
    },

    transformEventToMatch(event) {
      const now = new Date();
      const commenceDate = new Date(event.commence_time);
      const isLive = commenceDate <= now;

      let homeOdds = null;
      let drawOdds = null;
      let awayOdds = null;

      if (event.bookmakers && event.bookmakers.length > 0) {
        const bookmaker = event.bookmakers[0];
        const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');

        if (h2hMarket && h2hMarket.outcomes) {
          const homeOutcome = h2hMarket.outcomes.find(o => o.name === event.home_team);
          const awayOutcome = h2hMarket.outcomes.find(o => o.name === event.away_team);
          const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');

          if (homeOutcome) homeOdds = homeOutcome.price;
          if (awayOutcome) awayOdds = awayOutcome.price;
          if (drawOutcome) drawOdds = drawOutcome.price;
        }
      }

      return {
        id: event.id,
        group: event.sport_key.includes('epl') ? 'EPL' : event.sport_title,
        sportTitle: event.sport_title,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: event.commence_time,
        isLive,
        homeScore: null,
        awayScore: null,
        selectedMarket: '1x2',
        odds: {
          home: homeOdds,
          draw: drawOdds,
          away: awayOdds,
          over: 1.85,
          under: 1.95,
          bttsYes: 1.75,
          bttsNo: 2.05
        }
      };
    },

    formatDate(isoString) {
      const date = new Date(isoString);
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    toggleBet(match, selection, odd) {
      const matchTitle = `${match.homeTeam} vs ${match.awayTeam}`;
      const existingIndex = this.betSlip.findIndex(
        b => b.matchId === match.id && b.selection === selection
      );

      if (existingIndex > -1) {
        this.betSlip.splice(existingIndex, 1);
      } else {
        const otherPickIndex = this.betSlip.findIndex(b => b.matchId === match.id);
        if (otherPickIndex > -1) {
          this.betSlip.splice(otherPickIndex, 1);
        }

        this.betSlip.push({
          matchId: match.id,
          matchTitle,
          selection,
          odd
        });
      }
    },

    isSelectionActive(matchId, selection) {
      return this.betSlip.some(
        b => b.matchId === matchId && b.selection === selection
      );
    },

    removeBet(index) {
      this.betSlip.splice(index, 1);
    },

    async placeBet() {
      if (this.stakeAmount > this.userBalance) {
        alert('Insufficient wallet balance.');
        return;
      }

      this.isSubmitting = true;

      try {
        const res = await fetch(`${this.backendUrl}/bets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bets: this.betSlip,
            stake: this.stakeAmount,
            totalOdds: this.totalOdds,
            potentialPayout: this.potentialPayout
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          this.userBalance = data.newBalance;
          alert(`Bet placed successfully! Ticket ID: ${data.ticket.ticketId}`);
          this.betSlip = [];
        } else {
          alert(data.error || 'Failed to place bet ticket.');
        }
      } catch (err) {
        console.error('Error submitting bet:', err);
        alert('Server network error while placing bet.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>