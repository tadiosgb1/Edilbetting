# Edilbetting — Odds API Server: Complete Integration Guide

> **Server base URL:** `http://localhost:3000/api`  
> **Upstream API:** `https://api.the-odds-api.com/v4`  
> **API Key location:** `betting-odds-server/.env` → `ODDS_API_KEY`  
> **Source docs:** https://the-odds-api.com/liveapi/guides/v4/

---

## 🚀 How to Start the Server

```bash
# From the betting-odds-server folder:
cd D:\Edilbetting\betting-odds-server

# Install dependencies (first time only)
npm install

# Start server
node server.js

# Or with auto-restart on file changes (install nodemon first: npm i -g nodemon)
nodemon server.js
```

You should see:
```
🎲  Edilbetting Odds Server
   Running  → http://localhost:3000/api
   Health   → http://localhost:3000/api/health
   API key  → ✅ set
```

---

## 🔧 .env File Reference

```env
# betting-odds-server/.env
PORT=3000
ODDS_API_KEY=84e3b6d9ee5415f4587b5ebe7aa18134
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
DEFAULT_REGIONS=eu
DEFAULT_MARKETS=h2h
DEFAULT_ODDS_FORMAT=decimal
```

```env
# front-end/.env
VITE_BACKEND_URL=http://localhost:3000/api
```

---

## 📮 How to Use Postman

### One-time Setup
1. Download Postman from https://www.postman.com/downloads/
2. Open Postman → click **"New"** → **"Collection"** → name it `Edilbetting`
3. For each endpoint below, click **"New Request"**, set method + URL, click **Send**

### Setting a Base URL Variable (optional but recommended)
1. In your collection → click **"Variables"** tab
2. Add variable: `base_url` = `http://localhost:3000/api`
3. Use `{{base_url}}` in all URLs below instead of the full URL

---

## 📡 All Endpoints — Postman Ready

---

### ✅ 1. Health Check
> Verify the server is running and the API key is set.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/health` |
| **Quota Cost** | Free |

**Postman Steps:**
1. New Request → GET
2. URL: `http://localhost:3000/api/health`
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "status": "OK",
  "server": "Edilbetting Odds Proxy v1.0",
  "upstreamBase": "https://api.the-odds-api.com/v4",
  "apiKeySet": true,
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

---

### ✅ 2. All Active Sports (Raw List)
> Get every sport currently in season.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/sports` |
| **Quota Cost** | **FREE** |

**Optional Query Params:**
| Param | Value | Description |
|---|---|---|
| `all` | `true` | Include out-of-season sports too |

**Postman Steps:**
1. New Request → GET
2. URL: `http://localhost:3000/api/sports`
3. To include all sports: add Query Param `all` = `true`
4. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "key": "soccer_epl",
      "group": "Soccer",
      "title": "EPL",
      "description": "English Premier League",
      "active": true,
      "has_outrights": false
    }
  ]
}
```

---

### ✅ 3. Sport Types (Unique Groups)
> Get unique top-level sport categories: Soccer, Basketball, Tennis, etc.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/sports/types` |
| **Quota Cost** | **FREE** |
| **Used by Home.vue** | ✅ Sidebar top level |

**Postman Steps:**
1. New Request → GET
2. URL: `http://localhost:3000/api/sports/types`
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    { "key": "soccer", "name": "Soccer", "leagueCount": 18 },
    { "key": "basketball", "name": "Basketball", "leagueCount": 6 },
    { "key": "americanfootball", "name": "American Football", "leagueCount": 4 }
  ]
}
```

---

### ✅ 4. Top Leagues (Featured)
> Curated list of the most popular leagues across all sports.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/sports/top-leagues` |
| **Quota Cost** | **FREE** |
| **Used by Home.vue** | ✅ Sidebar quick links + home page grid |

**Postman Steps:**
1. New Request → GET
2. URL: `http://localhost:3000/api/sports/top-leagues`
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    { "key": "soccer_epl",   "group": "Soccer", "title": "EPL",          "active": true },
    { "key": "basketball_nba","group": "Basketball","title": "NBA",       "active": true },
    { "key": "soccer_spain_la_liga","group": "Soccer","title": "La Liga", "active": true }
  ]
}
```

---

### ✅ 5. Featured Top Matches (Home Hero Strip)
> EPL odds for the homepage featured matches section — first 6 results.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/sports/top-matches` |
| **Quota Cost** | **1 credit** |
| **Used by Home.vue** | ✅ Hero featured matches cards |

**Optional Query Params:**
| Param | Default | Options | Description |
|---|---|---|---|
| `sport` | `soccer_epl` | any sport key | Which sport to feature |
| `markets` | `h2h` | `h2h`, `totals`, `spreads` | Odds markets to include |
| `regions` | `eu` | `eu`, `uk`, `us`, `au` | Bookmaker regions |

**Postman Steps:**
1. New Request → GET
2. URL: `http://localhost:3000/api/sports/top-matches`
3. Optional — add Query Params:
   - `sport` = `basketball_nba`
   - `markets` = `h2h`
   - `regions` = `eu`
4. Click **Send**

**Example URLs:**
```
http://localhost:3000/api/sports/top-matches
http://localhost:3000/api/sports/top-matches?sport=basketball_nba&markets=h2h
http://localhost:3000/api/sports/top-matches?sport=soccer_spain_la_liga&regions=eu
```

**Expected Response:**
```json
{
  "success": true,
  "sport": "soccer_epl",
  "count": 6,
  "data": [
    {
      "id": "a512a48a58c4329048174217b2cc7ce0",
      "sport_key": "soccer_epl",
      "sport_title": "EPL",
      "commence_time": "2024-01-20T15:00:00Z",
      "home_team": "Arsenal",
      "away_team": "Chelsea",
      "bookmakers": [
        {
          "key": "bet365",
          "title": "Bet365",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                { "name": "Arsenal", "price": 2.10 },
                { "name": "Chelsea", "price": 3.50 },
                { "name": "Draw",    "price": 3.20 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

### ✅ 6. Countries by Sport Type
> All countries/regions that have leagues for a given sport type.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/sports/:sportType/countries` |
| **Quota Cost** | **FREE** |
| **Used by Home.vue** | ✅ Sidebar second level (after clicking a sport type) |

**URL Parameters:**
| Param | Description | Examples |
|---|---|---|
| `:sportType` | Sport type key from `/api/sports/types` | `soccer`, `basketball`, `tennis`, `cricket`, `americanfootball` |

**Postman Steps:**
1. New Request → GET
2. URL examples:
   ```
   http://localhost:3000/api/sports/soccer/countries
   http://localhost:3000/api/sports/basketball/countries
   http://localhost:3000/api/sports/tennis/countries
   http://localhost:3000/api/sports/americanfootball/countries
   http://localhost:3000/api/sports/cricket/countries
   ```
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "sportType": "soccer",
  "count": 8,
  "data": [
    {
      "code": "england",
      "name": "England",
      "leagueCount": 3,
      "leagues": [
        { "key": "soccer_epl",           "title": "EPL" },
        { "key": "soccer_england_league1","title": "League 1" }
      ]
    },
    {
      "code": "UEFA",
      "name": "UEFA",
      "leagueCount": 2,
      "leagues": [
        { "key": "soccer_uefa_champs_league", "title": "UEFA Champions League" }
      ]
    }
  ]
}
```

---

### ✅ 7. Leagues by Country
> All leagues for a specific country within a sport type.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/sports/:sportType/countries/:countryCode/leagues` |
| **Quota Cost** | **FREE** |
| **Used by Home.vue** | ✅ Sidebar third level (after clicking a country) |

**URL Parameters:**
| Param | Description |
|---|---|
| `:sportType` | Sport type: `soccer`, `basketball`, etc. |
| `:countryCode` | Country `code` field from the countries response above |

**Postman Steps:**
1. New Request → GET
2. URL examples:
   ```
   http://localhost:3000/api/sports/soccer/countries/england/leagues
   http://localhost:3000/api/sports/soccer/countries/UEFA/leagues
   http://localhost:3000/api/sports/basketball/countries/USA/leagues
   http://localhost:3000/api/sports/soccer/countries/Germany/leagues
   http://localhost:3000/api/sports/soccer/countries/Spain/leagues
   ```
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "sportType": "soccer",
  "countryCode": "england",
  "count": 3,
  "data": [
    {
      "sportKey":     "soccer_epl",
      "title":        "EPL",
      "description":  "English Premier League",
      "active":       true,
      "hasOutrights": false
    },
    {
      "sportKey":     "soccer_england_league1",
      "title":        "League 1",
      "description":  "English Football League One",
      "active":       true,
      "hasOutrights": false
    }
  ]
}
```

---

### ✅ 8. Odds for a Sport/League
> Live & upcoming odds for a specific league. This is the main betting feed.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/odds/:sportKey` |
| **Quota Cost** | **1 per region per market** |
| **Used by Home.vue** | ✅ Match cards in Sports/Live view |

**URL Parameters:**
| Param | Description |
|---|---|
| `:sportKey` | Sport key from `/api/sports` e.g. `soccer_epl` |

**Optional Query Params:**
| Param | Default | Options | Description |
|---|---|---|---|
| `markets` | `h2h` | `h2h`, `totals`, `spreads`, `outrights` | Comma-separated |
| `regions` | `eu` | `eu`, `uk`, `us`, `us2`, `au` | Comma-separated |
| `oddsFormat` | `decimal` | `decimal`, `american` | Odds format |

**Postman Steps:**
1. New Request → GET
2. URL examples:
   ```
   http://localhost:3000/api/odds/soccer_epl
   http://localhost:3000/api/odds/soccer_epl?markets=h2h,totals&regions=eu
   http://localhost:3000/api/odds/basketball_nba?markets=h2h,spreads&regions=us
   http://localhost:3000/api/odds/soccer_spain_la_liga?markets=h2h&regions=eu,uk
   http://localhost:3000/api/odds/upcoming
   ```
3. Click **Send**

> 💡 Use `upcoming` as the sportKey to get the next 8 games across ALL sports (great for a homepage feed).

**Expected Response:**
```json
{
  "success": true,
  "sportKey": "soccer_epl",
  "count": 10,
  "data": [
    {
      "id": "a512a48a58c4329048174217b2cc7ce0",
      "sport_key": "soccer_epl",
      "sport_title": "EPL",
      "commence_time": "2024-01-20T15:00:00Z",
      "home_team": "Arsenal",
      "away_team": "Chelsea",
      "bookmakers": [
        {
          "key": "bet365",
          "title": "Bet365",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                { "name": "Arsenal", "price": 2.10 },
                { "name": "Chelsea", "price": 3.50 },
                { "name": "Draw",    "price": 3.20 }
              ]
            },
            {
              "key": "totals",
              "outcomes": [
                { "name": "Over",  "point": 2.5, "price": 1.85 },
                { "name": "Under", "point": 2.5, "price": 1.95 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Quota Cost Examples:**
| Request | Cost |
|---|---|
| `?markets=h2h&regions=eu` | **1 credit** |
| `?markets=h2h,totals&regions=eu` | **2 credits** |
| `?markets=h2h&regions=eu,uk` | **2 credits** |
| `?markets=h2h,totals,spreads&regions=eu,uk,us` | **9 credits** |

---

### ✅ 9. Single Event Odds (All Markets)
> Full odds for one specific event — all available markets.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/odds/:sportKey/events/:eventId` |
| **Quota Cost** | **1 per region per market** |

> 💡 Get `eventId` first from endpoint #10 (Events list) — it's the `id` field.

**Postman Steps:**
1. First call endpoint #10 to get event IDs:
   ```
   GET http://localhost:3000/api/events/soccer_epl
   ```
2. Copy an `id` from the response (e.g. `a512a48a58c4329048174217b2cc7ce0`)
3. New Request → GET:
   ```
   http://localhost:3000/api/odds/soccer_epl/events/a512a48a58c4329048174217b2cc7ce0
   http://localhost:3000/api/odds/soccer_epl/events/EVENT_ID?markets=h2h,totals&regions=eu
   ```
4. Click **Send**

---

### ✅ 10. Events List (No Odds — Free)
> Upcoming & live events without odds. Use this to get event IDs cheaply before fetching odds.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/events/:sportKey` |
| **Quota Cost** | **FREE** |

**Postman Steps:**
1. New Request → GET
2. URL examples:
   ```
   http://localhost:3000/api/events/soccer_epl
   http://localhost:3000/api/events/basketball_nba
   http://localhost:3000/api/events/soccer_epl?commenceTimeFrom=2024-01-20T00:00:00Z
   ```
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "sportKey": "soccer_epl",
  "count": 10,
  "data": [
    {
      "id":            "a512a48a58c4329048174217b2cc7ce0",
      "sport_key":     "soccer_epl",
      "sport_title":   "EPL",
      "commence_time": "2024-01-20T15:00:00Z",
      "home_team":     "Arsenal",
      "away_team":     "Chelsea"
    }
  ]
}
```

---

### ✅ 11. Available Markets for an Event
> See which bet markets a bookmaker is offering for a specific event.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/events/:sportKey/:eventId/markets` |
| **Quota Cost** | **1 credit** |

**Postman Steps:**
1. Get an event ID from endpoint #10
2. New Request → GET:
   ```
   http://localhost:3000/api/events/soccer_epl/EVENT_ID/markets?regions=eu
   ```
3. Click **Send**

---

### ✅ 12. Live Scores
> Live scores + recently completed results.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/scores/:sportKey` |
| **Quota Cost** | **1 credit** (live only) · **2 credits** (with history) |

**Optional Query Params:**
| Param | Description |
|---|---|
| `daysFrom` | Integer 1–3. Include results from N days ago |

**Postman Steps:**
1. New Request → GET
2. URL examples:
   ```
   http://localhost:3000/api/scores/soccer_epl
   http://localhost:3000/api/scores/soccer_epl?daysFrom=1
   http://localhost:3000/api/scores/soccer_epl?daysFrom=3
   http://localhost:3000/api/scores/basketball_nba?daysFrom=2
   ```
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "sportKey": "soccer_epl",
  "count": 5,
  "data": [
    {
      "id":            "a512a48a58c4329048174217b2cc7ce0",
      "sport_key":     "soccer_epl",
      "commence_time": "2024-01-20T15:00:00Z",
      "completed":     false,
      "home_team":     "Arsenal",
      "away_team":     "Chelsea",
      "scores": [
        { "name": "Arsenal", "score": "1" },
        { "name": "Chelsea", "score": "0" }
      ],
      "last_update": "2024-01-20T15:52:00Z"
    }
  ]
}
```

> 💡 The `id` matches the `id` in the odds response — use this to sync live scores onto your match cards.

---

### ✅ 13. Participants (Teams / Players)
> Full list of teams or players for a sport.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/participants/:sportKey` |
| **Quota Cost** | **1 credit** |

**Postman Steps:**
1. New Request → GET
2. URL examples:
   ```
   http://localhost:3000/api/participants/soccer_epl
   http://localhost:3000/api/participants/basketball_nba
   ```
3. Click **Send**

---

### ✅ 14. User Wallet Balance
> Get current wallet balance.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/user/balance` |
| **Quota Cost** | Free (local mock) |
| **Used by Home.vue** | ✅ Header balance display |

**Postman Steps:**
1. New Request → GET
2. URL: `http://localhost:3000/api/user/balance`
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "balance": 2500.00,
  "currency": "ETB"
}
```

---

### ✅ 15. Deposit Funds
> Top up the wallet (mock).

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/user/deposit` |
| **Quota Cost** | Free (local mock) |

**Postman Steps:**
1. New Request → **POST**
2. URL: `http://localhost:3000/api/user/deposit`
3. Click **Body** tab → select **raw** → select **JSON** from dropdown
4. Paste body:
   ```json
   {
     "amount": 500,
     "method": "telebirr"
   }
   ```
5. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "message": "Deposited 500 ETB",
  "newBalance": 3000.00,
  "currency": "ETB"
}
```

---

### ✅ 16. Place a Bet
> Submit a bet ticket with one or more selections.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/bets` |
| **Quota Cost** | Free (local mock) |
| **Used by Home.vue** | ✅ Bet slip "Place Bet" button |

**Postman Steps:**
1. New Request → **POST**
2. URL: `http://localhost:3000/api/bets`
3. Click **Body** tab → select **raw** → select **JSON**
4. Paste body:
   ```json
   {
     "bets": [
       {
         "matchId":    "a512a48a58c4329048174217b2cc7ce0",
         "matchTitle": "Arsenal vs Chelsea",
         "selection":  "Home Win (1)",
         "odd":        2.10
       },
       {
         "matchId":    "b7c39d2f91a4518b37296518b3dd8de1",
         "matchTitle": "Man City vs Liverpool",
         "selection":  "Over 2.5",
         "odd":        1.85
       }
     ],
     "stake":          200,
     "totalOdds":      3.885,
     "potentialPayout":777.00
   }
   ```
5. Click **Send**

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Bet placed successfully.",
  "newBalance": 2300.00,
  "ticket": {
    "ticketId":       "ETB-482931",
    "bets": [...],
    "stake":          200,
    "totalOdds":      3.885,
    "potentialPayout":777.00,
    "status":         "PENDING",
    "currency":       "ETB",
    "createdAt":      "2024-01-20T15:05:00.000Z"
  }
}
```

**Error Responses:**
```json
{ "success": false, "error": "Bet slip is empty." }
{ "success": false, "error": "Invalid stake amount." }
{ "success": false, "error": "Insufficient wallet balance." }
```

---

### ✅ 17. Bet History
> List all placed bet tickets.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/bets` |

**Postman Steps:**
1. New Request → GET
2. URL: `http://localhost:3000/api/bets`
3. Click **Send**

---

## 🔁 Response Headers (Quota Tracking)

Every odds endpoint returns these headers — check them in Postman's **Headers** tab:

| Header | Description |
|---|---|
| `x-requests-remaining` | Credits left until quota resets |
| `x-requests-used` | Credits consumed so far |
| `x-requests-last` | Credits used by this specific call |

---

## 📊 Markets Reference

| Market Key | Name | Available For |
|---|---|---|
| `h2h` | Head to Head / Moneyline | All sports |
| `totals` | Over / Under | All sports |
| `spreads` | Points Handicap | Mainly US sports |
| `outrights` | Futures / Winner | Tournaments, Golf |
| `h2h_lay` | Lay H2H | Betfair exchange only |
| `outrights_lay` | Lay Outrights | Betfair exchange only |

## 🌍 Regions Reference

| Code | Bookmakers |
|---|---|
| `eu` | Bet365, Pinnacle, Unibet, Betfair EU |
| `uk` | Ladbrokes, Sky Bet, William Hill, Paddy Power |
| `us` | DraftKings, FanDuel, BetMGM |
| `us2` | PointsBet, Caesars, more US books |
| `au` | Sportsbet, TAB, Neds |

---

## 🏗️ Frontend → Server → Upstream Flow

```
Home.vue (Vue 3)                server.js (Express)              The Odds API
─────────────────                ───────────────────              ────────────
init() {
  fetchBalance()        ──► GET /api/user/balance        (local mock)
  fetchSportTypes()     ──► GET /api/sports/types   ──► GET /v4/sports
  fetchTopLeagues()     ──► GET /api/sports/top-leagues ► GET /v4/sports
  fetchTopMatches()     ──► GET /api/sports/top-matches ► GET /v4/sports/soccer_epl/odds
  fetchOdds(key)        ──► GET /api/odds/:sportKey ──► GET /v4/sports/{key}/odds
}

Sidebar: click sport type
  selectSportType(type) ──► GET /api/sports/:type/countries ► GET /v4/sports

Sidebar: click country
  selectCountry(c)      ──► GET /api/sports/:type/countries/:code/leagues ► /v4/sports

Sidebar: click league
  selectLeague(key)     ──► GET /api/odds/:sportKey        ► GET /v4/sports/{key}/odds

Bet slip: Place Bet
  placeBet()            ──► POST /api/bets                 (local mock)

Deposit modal
  handleDeposit()       ──► POST /api/user/deposit         (local mock)
```

---

## 💡 Quota Saving Strategy

| Tip | Credits Saved |
|---|---|
| Use `/api/events/:sportKey` (free) to get IDs before fetching odds | Avoids bulk odds calls |
| Cache `/api/sports` and `/api/sports/types` — refresh every 1 hour | Saves repeated free calls |
| Default to `regions=eu` only, not `eu,uk,us` | 1 credit vs 3 per call |
| Use `markets=h2h` for list view, add `totals` only on match detail | Saves 1 credit per call |
| Only fetch scores (`/api/scores`) when `commence_time <= now` | Avoids unnecessary 1–2 credit calls |
| Use `upcoming` as sportKey to get cross-sport preview cheaply | 1 call instead of 10+ |

---

## ⚡ Quick Test Sequence in Postman

Run these in order to verify the full integration is working:

```
1. GET  http://localhost:3000/api/health
   → Should return apiKeySet: true

2. GET  http://localhost:3000/api/sports/types
   → Should return list of sport groups

3. GET  http://localhost:3000/api/sports/top-leagues
   → Should return EPL, NBA, La Liga etc.

4. GET  http://localhost:3000/api/sports/top-matches
   → Should return 6 matches with odds from Bet365 etc.

5. GET  http://localhost:3000/api/sports/soccer/countries
   → Should return England, Spain, Germany etc.

6. GET  http://localhost:3000/api/sports/soccer/countries/england/leagues
   → Should return EPL, Championship etc.

7. GET  http://localhost:3000/api/odds/soccer_epl?markets=h2h,totals&regions=eu
   → Should return full odds feed with bookmakers

8. GET  http://localhost:3000/api/scores/soccer_epl
   → Should return live/upcoming scores

9. GET  http://localhost:3000/api/user/balance
   → Should return { balance: 2500, currency: "ETB" }

10. POST http://localhost:3000/api/bets
    Body: { "bets": [{ "matchId":"test","matchTitle":"A vs B","selection":"Home Win (1)","odd":2.1 }], "stake": 100 }
    → Should return ticket with ETB- ticket ID
```

All 10 passing = full stack is working. 🎉
