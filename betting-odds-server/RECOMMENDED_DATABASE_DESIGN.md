# Recommended Betting Database Design

> **Status:** Recommended target architecture — documentation only; no application models or migrations are changed by this document.
>
> **Scope:** Sports, competitions, events, market definitions and event-market availability, odds, results, bet tickets, bet selections, and settlement.
>
> **Current integration:** The Odds API is the only provider currently assumed by the implementation examples. The design keeps provider-specific identifiers and payloads at the integration boundary so a second provider can be added later without pretending that all providers share the same API or data model.
>
> **Database:** MySQL with Sequelize (matching the current backend).
>
> **Relationship to existing documentation:** This file supplements `DATABASE_DESIGN.md`; it does not replace or delete it. Where the current code, the existing design document, and this recommendation differ, the difference is called out explicitly.

---

## 1. Executive recommendation

The current backend uses Odds API keys such as `soccer_epl` as rows in `sports`. This works for the current provider integration, but it mixes two concepts:

- **Sport:** football, basketball, tennis, cricket.
- **Competition:** Premier League, La Liga, NBA, Wimbledon.

The recommended model separates those concepts and stores provider keys in a mapping table:

```text
sports
  └── competitions
        ├── competition_seasons
        └── provider_competitions
              └── events
                    ├── event_participants
                    ├── event_markets
                    │     └── odds_current
                    │           └── odds_history
                    ├── event_results
                    └── bet_selections
                          └── selection_settlements

market_catalog
  └── provider_market_mappings

bets
  ├── bet_selections
  └── bet_settlements

settlement_runs
```

The key rules are:

1. Internal IDs identify our records. Provider IDs and keys identify records at an external provider.
2. Provider-specific payloads are translated into a stable internal representation before they reach betting business logic.
3. A provider's market key is not automatically a universal market definition. It must be mapped to our canonical market key.
4. An event's availability of a market is different from the definition of that market, and both are different from its prices.
5. A bet selection stores an immutable snapshot of what the customer accepted at placement time.
6. Results are evidence used by settlement; a final score alone does not prove every market outcome.
7. Settlement must be repeatable safely: retrying a job must not pay a bet twice.
8. Keep raw provider payloads and sync/audit records for troubleshooting, but do not make raw JSON the primary relational model.

---

## 2. What the current code does today

This section records the inspected implementation, not the proposed target.

### 2.1 Sports and events

In `Services/Syncservice.js`:

- `syncSports()` calls `GET /sports`.
- It upserts `Sport` using the provider's `key`, `title`, `group`, `active`, and `has_outrights`.
- It assigns `country` using the local `Countryresolver.js`; the Odds API /sports response is not treated as a source of country data.
- `syncEvents()` calls `GET /sports/{sportKey}/events`.
- Events store the provider event ID, provider sport key, home-team name, away-team name, and commence time.

### 2.2 Markets and odds

For each event:

- `discoverEventMarkets()` calls `GET /sports/{sportKey}/events/{eventId}/markets`.
- It records each market key and bookmaker key in `event_markets`.
- `syncOddsForEvent()` calls `GET /sports/{sportKey}/events/{eventId}/odds` with the discovered market keys.
- `resolveBestOdds()` selects the first eligible bookmaker according to the configured priority, rather than preserving every bookmaker's quote as a separately selectable price.
- Current prices are upserted into `odds_current`; a history row is inserted when the display price changes.
- Rows not returned by the latest odds snapshot are marked suspended.

### 2.3 Scores and settlement

- `syncScores()` calls `GET /sports/{sportKey}/scores`.
- It saves home and away scores, completion state, and updates event status.
- The inspected `syncScores()` code does **not** settle bet selections or pay tickets.
- The inspected model files do not establish a complete, auditable settlement workflow. The settlement design below is a recommendation, not a claim about an existing implementation.

### 2.4 Current model limitations to address

| Current model / behavior | Limitation | Recommendation |
|---|---|---|
| `Sport.sportKey = soccer_epl` | A competition is represented as a sport | Separate `sports` and `competitions`; retain provider key in a mapping |
| `Event.sportKey` | Event is coupled to provider terminology | Store internal `competition_id`; keep provider event identity in a mapping |
| Team names on Event | Names alone are not stable team identities | Add event participant snapshots; add reusable teams where reliable IDs exist |
| `MarketCatalog.category` | Display category could be mistaken for market logic | Keep category for navigation only; use canonical market key and settlement rules for logic |
| `EventMarket` | Unique identity currently omits data-provider identity | Include provider/source identity; keep bookmaker as a separate concept |
| `OddsCurrent` | Unique key does not include provider or bookmaker | Define quote identity explicitly; retain source, bookmaker, and line/outcome identity |
| `OddsHistory` | Does not fully identify the quote source | History must reference the same quote identity as current odds |
| `Result` | One row has a few score/stat columns | Store normalized result facts and their source/version; support period and market-specific facts |
| `BetSelection` | Snapshot is too small for many markets | Store line, description, participant, period, market/outcome labels and source snapshot |
| `Bet.status` | Current model and design document disagree | Adopt one lifecycle and migrate deliberately |
| Settlement | No verified complete workflow in inspected files | Add selection-level outcomes, ticket-level settlement, run/idempotency records |

---

## 3. Provider integration boundary

### 3.1 Do not make provider fields your internal primary keys

Use internal database IDs for the platform's domain entities:

- `sports.id`
- `competitions.id`
- `events.id`
- `market_catalog.id` (or a stable canonical market key)

Keep the external provider's identifiers in mapping tables. For the current Odds API integration, provider name can be a fixed value such as `the_odds_api`; this does not mean another provider must be integrated now.

This boundary is important because providers may disagree on:

- Sport and competition naming.
- Event IDs and participant IDs.
- Market keys and market descriptions.
- Outcome names and outcome identifiers.
- Period/segment notation.
- Handicap and total line representation.
- Result completeness and finality semantics.
- Timestamp formats and update behavior.

Do not assume that a key or payload from one provider can be used directly with another.

### 3.2 Recommended provider identity tables

#### `data_providers`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Internal provider ID |
| `code` | VARCHAR(50) UNIQUE | e.g. `the_odds_api` |
| `display_name` | VARCHAR(120) | Human-readable name |
| `is_active` | BOOLEAN | Whether sync is enabled |
| `created_at`, `updated_at` | DATETIME | |

#### `provider_competitions`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `provider_id` | BIGINT FK | References `data_providers` |
| `competition_id` | BIGINT FK | References internal competition |
| `provider_sport_key` | VARCHAR(150) | Odds API key, e.g. `soccer_epl` |
| `provider_group` | VARCHAR(150) NULL | Provider's group, e.g. Soccer |
| `provider_title` | VARCHAR(200) NULL | Provider's title |
| `provider_active` | BOOLEAN NULL | Last known provider state |
| `last_synced_at` | DATETIME NULL | |
| `raw_metadata` | JSON NULL | Optional source metadata |

Unique: `(provider_id, provider_sport_key)`.

#### `provider_events`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `provider_id` | BIGINT FK | |
| `event_id` | BIGINT FK | Internal event |
| `provider_event_id` | VARCHAR(150) | Provider event ID |
| `provider_sport_key` | VARCHAR(150) | Key required by this provider's endpoints |
| `last_seen_at` | DATETIME | |
| `raw_metadata` | JSON NULL | Optional source metadata |

Unique: `(provider_id, provider_event_id)`.

**Why:** our event remains the platform's event, even if its upstream provider changes or a second source later supplies the same fixture. A provider event ID must never be assumed globally unique across providers.

### 3.3 Preserve raw responses selectively

For operational support, consider a `provider_sync_records` table:

- `id`
- `provider_id`
- `resource_type` (sports, events, markets, odds, scores)
- `external_id` nullable
- `request_key` or safe request fingerprint
- `response_payload` JSON
- `received_at`
- `http_status`
- `processing_status`
- `error_message` nullable

Do not store API keys, authorization headers, or secrets in this table. Apply a retention policy and avoid storing unnecessary personal data.

---

## 4. Sports, countries, competitions, and seasons

### 4.1 `sports`

One row per actual sport.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Internal ID |
| `name` | VARCHAR(100) | Football, Basketball, Tennis |
| `slug` | VARCHAR(100) UNIQUE | `football`, `basketball` |
| `code` | VARCHAR(50) UNIQUE | Internal stable code, e.g. `soccer` |
| `is_active` | BOOLEAN | Platform availability |
| `sort_order` | INT | UI ordering |
| `created_at`, `updated_at` | DATETIME | |

Do not use the Odds API key as the primary key of this table.

### 4.2 `countries`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `name` | VARCHAR(100) UNIQUE | England |
| `iso2` | CHAR(2) UNIQUE NULL | GB |
| `iso3` | CHAR(3) UNIQUE NULL | GBR |
| `is_active` | BOOLEAN | |

Use ISO codes where available. A competition may have no country (for example, an international competition). Do not force an invented country value such as `International` into the countries table.

### 4.3 `competitions`

One row per league, cup, or tournament.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `sport_id` | BIGINT FK | References `sports.id` |
| `country_id` | BIGINT FK NULL | Domestic competition country; NULL for international |
| `name` | VARCHAR(180) | Premier League |
| `slug` | VARCHAR(180) UNIQUE | `england-premier-league` |
| `competition_type` | VARCHAR(30) | league, cup, tournament, championship |
| `scope` | VARCHAR(30) | domestic, continental, international |
| `gender` | VARCHAR(20) NULL | Optional where relevant |
| `is_active` | BOOLEAN | |
| `sort_order` | INT | |
| `created_at`, `updated_at` | DATETIME | |

A competition belongs to one sport. Country describes the competition's organizing identity, not the nationality of every participating team.

### 4.4 `competition_seasons`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `competition_id` | BIGINT FK | |
| `name` | VARCHAR(80) | 2026/2027 |
| `start_date` | DATE NULL | |
| `end_date` | DATE NULL | |
| `is_current` | BOOLEAN | |
| `provider_season_ref` | VARCHAR(150) NULL | Only if provider supplies one |
| `created_at`, `updated_at` | DATETIME | |

Unique: `(competition_id, name)`.

The Odds API sports/events flow inspected here does not provide a dedicated season entity used by the current code. Season assignment should therefore be treated as optional platform metadata until a reliable source is available. Do not manufacture season IDs from assumptions.

### 4.5 Example

```text
Sport: Football
  Competition: Premier League
    Country: England
    Provider mapping: the_odds_api / soccer_epl
    Season: 2026/2027
      Events: Arsenal vs Chelsea, ...
  Competition: UEFA Champions League
    Country: NULL
    Scope: continental
    Provider mapping: the_odds_api / soccer_uefa_champs_league

Sport: Basketball
  Competition: NBA
    Country: USA (competition identity)
    Provider mapping: the_odds_api / basketball_nba
```

**Why this structure:** the application can organize by sport, then country, then competition without confusing a league with a sport. It also lets the internal competition name remain stable if a provider changes its title or key.

---

## 5. Teams and event participants

The current Odds API event response used by the code supplies home and away team names. The current implementation stores those names directly on `events`. Do not assume it supplies stable team IDs in this endpoint.

Recommended:

### 5.1 `teams` (optional canonical directory)

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `sport_id` | BIGINT FK | A team belongs to a sport |
| `name` | VARCHAR(180) | Canonical display name |
| `slug` | VARCHAR(180) NULL | |
| `country_id` | BIGINT FK NULL | Team country, not competition country |
| `is_active` | BOOLEAN | |
| `created_at`, `updated_at` | DATETIME | |

### 5.2 `provider_teams`

Map a canonical team to a provider's team ID only when that provider supplies a reliable ID. Do not use a name string as a guaranteed identity.

### 5.3 `event_participants`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `event_id` | BIGINT FK | |
| `team_id` | BIGINT FK NULL | Nullable if not confidently matched |
| `participant_name` | VARCHAR(180) | Snapshot of name received |
| `role` | VARCHAR(20) | home, away, competitor, player |
| `provider_participant_id` | VARCHAR(150) NULL | Source ID if supplied |
| `created_at`, `updated_at` | DATETIME | |

Unique: `(event_id, role)` for two-team fixtures, with sport-specific validation for other formats.

**Why keep a participant snapshot?** Team names can change, aliases can differ, and canonical matching can be imperfect. The event and a bet placed on it must retain the names shown at that time. A nullable canonical team link avoids false matches.

---

## 6. Events

An event is a fixture or contest within a competition.

### Recommended `events`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Internal event ID |
| `competition_id` | BIGINT FK | Internal competition |
| `season_id` | BIGINT FK NULL | Optional season |
| `start_time` | DATETIME(3) | Store UTC |
| `status` | VARCHAR(30) | scheduled, live, completed, postponed, cancelled, abandoned |
| `neutral_venue` | BOOLEAN NULL | |
| `venue_name` | VARCHAR(180) NULL | If reliably supplied |
| `last_synced_at` | DATETIME(3) NULL | |
| `created_at`, `updated_at` | DATETIME | |

Indexes:
- `(competition_id, start_time)`
- `(status, start_time)`
- `(start_time)`

Keep provider event identity in `provider_events`. Keep participant names in `event_participants`, rather than making provider strings the event's permanent domain structure.

### Event synchronization

Current Odds API endpoint:

```http
GET /v4/sports/{sport_key}/events?dateFormat=iso
```

For each returned event:

1. Find the internal competition through `provider_competitions`.
2. Find or create `provider_events` using `(provider_id, provider_event_id)`.
3. Create or update the internal event.
4. Upsert participant snapshots.
5. Update the event's provider last-seen/sync timestamps.
6. Do not reset an event from completed to scheduled just because an event-list response contains it again. Apply a documented status transition policy.

**Important:** If a provider event cannot be mapped to a known competition, log it for review or place it in a controlled unmatched queue. Do not silently create a duplicate sport/competition based on an untrusted title.

---

## 7. Market definitions and provider market mappings

Keep three concepts separate:

1. **Market definition:** what a market means in our platform.
2. **Event market availability:** whether a market is currently offered for a particular event by a source/bookmaker.
3. **Odds quote:** the price for one outcome/line.

### 7.1 `market_catalog` — canonical market definitions

Recommended fields:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Internal ID |
| `market_key` | VARCHAR(120) UNIQUE | Stable canonical key, e.g. `match_winner_1x2` |
| `display_name` | VARCHAR(180) | Match Result |
| `category` | VARCHAR(60) | featured, goals, player_props, corners, cards, periods |
| `settlement_rule_key` | VARCHAR(120) | e.g. `football_1x2_ft_v1` |
| `market_scope` | VARCHAR(30) | pre_match, in_play, both |
| `is_enabled` | BOOLEAN | |
| `sort_order` | INT | |
| `created_at`, `updated_at` | DATETIME | |

**Category is for grouping and presentation.** It should not decide whether a selection wins. The settlement rule is explicit and versioned.

Examples of canonical keys:
- `match_winner_1x2`
- `match_total_goals`
- `match_handicap`
- `both_teams_to_score`
- `first_half_result`
- `total_corners`
- `player_anytime_goalscorer`

These are illustrative internal names, not a claim that every provider offers every market.

### 7.2 `provider_market_mappings`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `provider_id` | BIGINT FK | |
| `sport_id` | BIGINT FK NULL | Optional sport-specific mapping |
| `provider_market_key` | VARCHAR(150) | Exact provider key |
| `market_catalog_id` | BIGINT FK NULL | Canonical mapping; NULL means not mapped |
| `provider_market_name` | VARCHAR(180) NULL | |
| `mapping_status` | VARCHAR(20) | mapped, review, unsupported |
| `mapping_version` | INT | |
| `created_at`, `updated_at` | DATETIME | |

Unique: `(provider_id, sport_id, provider_market_key)` (handle nullable sport-specific mappings deliberately; MySQL nullable unique columns need care).

Unknown provider markets should be recorded as `review` or `unsupported`; do not guess their settlement meaning from their names.

### 7.3 How to treat the current catalogue

The current `Services/marketCatalog.js` defines groups such as `featured`, `additional`, `gamePeriod`, `otherSoccer`, and `playerPropsSoccer`. `Models/Index.js` seeds these into `market_catalog`.

Keep the useful display grouping, but add explicit canonical keys and settlement-rule references. The current code sets `displayName` to the raw market key; a professional catalogue should use reviewed human-readable labels and localized labels separately if needed.

---

## 8. Event market availability

Recommended `event_markets` represents the latest known availability of a market for a particular event, provider and bookmaker.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `event_id` | BIGINT FK | Internal event |
| `provider_id` | BIGINT FK | Data source |
| `market_catalog_id` | BIGINT FK NULL | Canonical market, if mapped |
| `provider_market_key` | VARCHAR(150) | Exact upstream key |
| `bookmaker_key` | VARCHAR(100) NULL | Bookmaker offered by the data provider |
| `provider_market_ref` | VARCHAR(180) NULL | If source supplies a distinct market ID |
| `is_available` | BOOLEAN | |
| `last_update_at` | DATETIME(3) NULL | Source market update |
| `last_seen_at` | DATETIME(3) | Last confirmed in a successful snapshot |
| `created_at`, `updated_at` | DATETIME | |

A useful unique key is `(event_id, provider_id, provider_market_key, bookmaker_key)`, with a deliberate policy for NULL bookmaker keys.

**Important distinction:** `market_catalog` says what the market is; `event_markets` says it was seen for this event/source/bookmaker. A market can exist in the catalogue but not be offered on a particular event.

### Current Odds API endpoint

```http
GET /v4/sports/{sport_key}/events/{event_id}/markets?regions=eu&dateFormat=iso
```

The current code uses the response's bookmaker and market lists to populate `event_markets`.

### Safer availability update procedure

Do not mark all markets unavailable before knowing that the provider request and response have succeeded and been validated. Recommended sequence:

1. Fetch the complete response.
2. Validate the response and record successful fetch time.
3. Upsert every observed market/bookmaker pair as available.
4. Only after a complete successful snapshot, mark previously known pairs not present in that snapshot as unavailable.
5. If the request fails, preserve the last known availability and record the failed sync.

This avoids a transient API failure making every market appear unavailable.

---

## 9. Odds quotes: current and history

A quote is a price for one outcome/selection of one market on one event, from one source/bookmaker, at a particular time.

Do not confuse:
- **Data provider:** the service delivering the odds data (currently The Odds API).
- **Bookmaker:** the betting operator whose price is being reported (for example, Pinnacle).

### 9.1 `odds_current`

Recommended fields:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `event_id` | BIGINT FK | |
| `provider_id` | BIGINT FK | Data provider |
| `event_market_id` | BIGINT FK NULL | Availability record if applicable |
| `market_catalog_id` | BIGINT FK NULL | Canonical market |
| `provider_market_key` | VARCHAR(150) | Original provider key |
| `bookmaker_key` | VARCHAR(100) | Bookmaker |
| `outcome_key` | VARCHAR(150) NULL | Stable source outcome ID if supplied |
| `outcome_name` | VARCHAR(180) | Display/source outcome name |
| `participant_id` | BIGINT NULL | For player/team props if resolved |
| `line_value` | DECIMAL(10,3) NULL | Handicap/total line |
| `period_key` | VARCHAR(40) NULL | Full time, first half, quarter, set, etc. |
| `description` | VARCHAR(255) NULL | Provider's extra selection description |
| `source_price` | DECIMAL(12,5) | Raw decimal price |
| `display_price` | DECIMAL(12,5) | Price offered to customer |
| `is_suspended` | BOOLEAN | Not selectable |
| `source_updated_at` | DATETIME(3) NULL | Source's update timestamp |
| `fetched_at` | DATETIME(3) | Our receipt timestamp |
| `created_at`, `updated_at` | DATETIME | |

Define a deterministic quote identity. A candidate natural key is:

```text
(event_id, provider_id, bookmaker_key, provider_market_key,
 outcome identity, line_value, period_key, description)
```

Use a generated stable `selection_identity_hash` if nullable/multi-column identity makes MySQL uniqueness awkward. Build the hash from normalized identity fields—not the price or fetch time. Keep the original fields for inspection.

### 9.2 `odds_history`

Append-only history for each quote identity:

- `id`
- `odds_current_id` or stable quote identity
- `event_id`
- `provider_id`
- `bookmaker_key`
- `provider_market_key`
- `outcome identity`, `line_value`, `period_key`
- `source_price`
- `display_price`
- `is_suspended`
- `source_updated_at`
- `recorded_at`

Index: `(event_id, provider_id, bookmaker_key, provider_market_key, recorded_at)`.

Record history on meaningful quote changes (price, suspension, or other selectable-state changes). If a full audit trail is required, record every snapshot in a separate ingestion table; do not make high-volume odds history unnecessarily huge.

### 9.3 Bookmaker selection policy

The current `resolveBestOdds()` chooses the first bookmaker matching the configured priority for each market. This is a product policy, not a universal data-model rule.

Recommended:
- Preserve source quotes by provider and bookmaker.
- Decide the customer-facing price through a separate, explicit price-selection policy.
- Store which bookmaker/source quote was used when a bet was placed.
- Do not overwrite one bookmaker's quote with another bookmaker's quote under the same identity.

### 9.4 Odds endpoint used today

```http
GET /v4/sports/{sport_key}/events/{event_id}/odds
  ?markets={comma_separated_provider_market_keys}
  &regions=eu
  &oddsFormat=decimal
  &dateFormat=iso
```

The current implementation first discovers event markets, then requests odds for those keys. Keep this behavior until quota, coverage, and provider documentation justify a different strategy.

---

## 10. Results and score facts

A result is not just two numbers. Different markets require different facts:

- Full-time winner and score.
- Half-time score.
- Period/quarter/set scores.
- Total corners and cards.
- Player goals, assists, shots, cards, and other player statistics.
- Abandonment, postponement, walkover, or other exceptional outcomes.

### 10.1 `event_results`

One current result summary per event:

| Column | Type | Notes |
|---|---|---|
| `event_id` | BIGINT PK/FK | |
| `status` | VARCHAR(30) | pending, provisional, final, corrected, abandoned |
| `home_score` | INT NULL | Sport-specific meaning must be documented |
| `away_score` | INT NULL | |
| `is_final` | BOOLEAN | Final according to the source/validated rules |
| `provider_id` | BIGINT FK NULL | Source |
| `provider_event_id` | VARCHAR(150) NULL | |
| `source_updated_at` | DATETIME(3) NULL | |
| `received_at` | DATETIME(3) | |
| `revision` | INT | Increment on accepted correction |
| `created_at`, `updated_at` | DATETIME | |

### 10.2 `event_result_facts`

For facts beyond the summary score:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `event_id` | BIGINT FK | |
| `fact_key` | VARCHAR(100) | e.g. home_score_h1, total_corners |
| `participant_id` | BIGINT NULL | Team/player where relevant |
| `period_key` | VARCHAR(40) NULL | h1, h2, q1, set1, etc. |
| `numeric_value` | DECIMAL(12,3) NULL | |
| `text_value` | VARCHAR(255) NULL | |
| `provider_id` | BIGINT FK NULL | |
| `source_updated_at` | DATETIME(3) NULL | |
| `received_at` | DATETIME(3) | |

Store validated normalized facts needed by settlement. Preserve source payload separately if useful.

### 10.3 Odds API score endpoint used today

```http
GET /v4/sports/{sport_key}/scores?dateFormat=iso&daysFrom={n}
```

The current code saves home and away scores and completion state. It does not currently populate all the extra score/stat columns declared in `Result.js`.

**Settlement warning:** A full-time score is sufficient for some full-time result and goal-total markets, but not for player props, corners, cards, half-time markets, or every sport-specific market. If the provider does not return the facts required by a market's rule, that selection must remain awaiting a valid result or be handled by a documented manual/void process. Never guess.

---

## 11. Bets and immutable selection snapshots

A bet is the customer's ticket. A selection is one leg on that ticket.

### 11.1 `bets`

Recommended fields:

| Column | Type | Notes |
|---|---|---|
| `bet_id` | CHAR(36) PK | UUID |
| `user_id` | CHAR(36) FK | Customer |
| `bet_type` | VARCHAR(20) | single, accumulator, system (only if supported) |
| `stake` | DECIMAL(14,2) | Cash stake |
| `bonus_stake` | DECIMAL(14,2) | Optional bonus-funded stake |
| `currency` | CHAR(3) | e.g. ETB |
| `total_odds` | DECIMAL(14,5) | Locked ticket odds |
| `potential_payout` | DECIMAL(14,2) | Calculated at placement |
| `status` | VARCHAR(30) | pending, accepted, partially_settled, won, lost, void, cancelled |
| `placed_at` | DATETIME(3) | |
| `settled_at` | DATETIME(3) NULL | |
| `created_at`, `updated_at` | DATETIME | |

Choose one status vocabulary and use it consistently in model, migrations, services, API responses, and documentation. The current `Bet.js` enum includes `completed`, while the current design document uses `cancelled`; resolve this mismatch in a planned migration rather than silently changing a live enum.

### 11.2 `bet_selections`

Each leg stores what the customer actually selected and accepted.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `bet_id` | CHAR(36) FK | Ticket |
| `event_id` | BIGINT FK | Internal event |
| `market_catalog_id` | BIGINT FK NULL | Canonical market |
| `provider_id` | BIGINT FK NULL | Source at placement |
| `provider_market_key` | VARCHAR(150) NULL | Source market key |
| `bookmaker_key` | VARCHAR(100) NULL | Bookmaker quote source |
| `outcome_key` | VARCHAR(150) NULL | Source outcome ID if supplied |
| `outcome_name` | VARCHAR(180) | |
| `line_value` | DECIMAL(10,3) NULL | Handicap/total |
| `period_key` | VARCHAR(40) NULL | |
| `participant_name_snapshot` | VARCHAR(180) NULL | Player/team name as placed |
| `description_snapshot` | VARCHAR(255) NULL | |
| `odds_at_bet` | DECIMAL(12,5) | Immutable accepted odds |
| `selection_status` | VARCHAR(30) | pending, won, lost, void, half_won, half_lost |
| `settled_at` | DATETIME(3) NULL | |
| `created_at` | DATETIME | |

The selection snapshot must remain meaningful even if the live market catalogue, provider mapping, event participants, or odds quote changes later.

**Placement transaction:** validate that the quote is still active and selectable; calculate ticket price/payout; create bet and all selections; debit/lock funds in the wallet ledger; commit all writes in one database transaction. Use row locks/idempotency so a retry cannot create a duplicate ticket or debit twice.

### 11.3 Selection result states

Support only states the product actually implements. For professional settlement, consider:
- pending
- won
- lost
- void
- half_won
- half_lost

A void leg in an accumulator generally has its odds treated as 1.0, but confirm the platform's published rules and calculate from locked ticket terms. Do not assume all bet types use the same payout calculation.

---

## 12. Market settlement rules

Never settle a market using only its display category or a string comparison against a provider outcome name.

Create a versioned rules registry, for example `settlement_rule_key` on `market_catalog`:

| Canonical market | Example rule key | Required facts |
|---|---|---|
| Full-time 1X2 | `football_1x2_ft_v1` | Final home/away score |
| Full-time total goals | `football_total_goals_ft_v1` | Final total score + line |
| Both teams to score | `football_btts_ft_v1` | Final home and away scores |
| First-half result | `football_1x2_h1_v1` | Half-time score |
| Total corners | `football_total_corners_ft_v1` | Validated corner total |
| Anytime goalscorer | `football_player_goal_v1` | Player goal fact and participant identity |

These are examples of rule identifiers and required facts, not proof that the current Odds API response provides all those facts.

A settlement rule should define:
- Supported sport and market.
- Required result facts.
- Period/segment.
- Outcome interpretation.
- Line/handicap comparison.
- Push/refund behavior.
- Half-win/half-loss behavior where applicable.
- Treatment of abandoned, postponed, or corrected events.
- Rule version and effective date.

Use deterministic, unit-tested pure functions for rule evaluation. Keep provider parsing separate from market evaluation.

---

## 13. Settlement records, idempotency, and audit

### 13.1 `selection_settlements`

Append a record for each settlement decision:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `bet_selection_id` | BIGINT FK | |
| `result_revision` | INT | Which result revision was used |
| `rule_key` | VARCHAR(120) | |
| `rule_version` | INT | |
| `outcome` | VARCHAR(30) | won, lost, void, half_won, half_lost |
| `calculation_json` | JSON | Inputs and explanation for audit |
| `settled_by` | VARCHAR(30) | system, admin |
| `settled_at` | DATETIME(3) | |
| `created_at` | DATETIME | |

### 13.2 `bet_settlements`

One ticket-level settlement record per settlement revision:

- `id`
- `bet_id`
- `settlement_revision`
- `status`
- `stake_returned`
- `payout_amount`
- `currency`
- `calculation_json`
- `settled_at`
- `created_at`

Use a uniqueness rule such as `(bet_id, settlement_revision)`, and a separate unique idempotency key for the financial payout transaction.

### 13.3 `settlement_runs`

Track each worker/manual settlement run:

- `id`
- `provider_id` nullable
- `event_id` nullable
- `started_at`
- `finished_at`
- `status` (running, succeeded, partial, failed)
- `records_checked`
- `records_settled`
- `error_summary`

### 13.4 Safe settlement sequence

1. A result sync receives a score/stat update.
2. Validate and normalize the result; increment its revision if a correction is accepted.
3. Find pending selections for the event.
4. Resolve each selection's canonical market and versioned settlement rule.
5. Check that every required result fact exists and is final/valid.
6. Evaluate each selection with a deterministic rule function.
7. In one DB transaction, lock affected selections and tickets; write settlement decisions; update selection states; calculate ticket outcome; write ticket settlement.
8. Credit/refund the wallet through the existing wallet ledger service, using a unique idempotency key linked to the settlement.
9. Commit; record the settlement run and audit data.
10. If any step fails, roll back the financial transaction and retry safely.

Do not mark a bet paid merely because `event_results.is_final = true`. Finality is an input to settlement, not the settlement itself.

### 13.5 Corrections and resettlement

Sports results can be corrected. Define a policy before launch:
- Do not silently overwrite settlement evidence.
- Preserve prior settlement decisions.
- Store the new result revision and the reason/source.
- Determine whether the platform rules permit resettlement.
- If a financial adjustment is needed, write a compensating wallet ledger transaction; never edit or delete the original ledger entry.
- Require controlled admin review for exceptional/manual corrections.

---

## 14. Odds API endpoint map (current integration)

The following endpoints are the ones used in the inspected current code. They are not generic endpoints for every possible provider.

| Data/model | Current endpoint | How it is used |
|---|---|---|
| Provider competition catalogue | `GET /v4/sports` | `syncSports()`; discover provider keys and metadata |
| Events | `GET /v4/sports/{sport_key}/events` | `syncEvents()`; retrieve fixtures for a provider key |
| Event market availability | `GET /v4/sports/{sport_key}/events/{event_id}/markets` | `discoverEventMarkets()`; identify offered market/bookmaker pairs |
| Event odds | `GET /v4/sports/{sport_key}/events/{event_id}/odds` | `syncOddsForEvent()`; retrieve prices for discovered market keys |
| Scores | `GET /v4/sports/{sport_key}/scores` | `syncScores()`; retrieve score/completion data |

The current code also passes parameters such as `regions`, `oddsFormat`, `dateFormat`, `markets`, and optional `daysFrom` as appropriate.

There is no Odds API endpoint in the inspected code that settles our customer bets. Settlement is an internal platform responsibility based on validated result facts and our own rules.

---

## 15. Recommended Sequelize model layout

A possible file organization (adapt names to the project's existing naming convention):

```text
Models/
  Sport.js
  Country.js
  Competition.js
  CompetitionSeason.js
  DataProvider.js
  ProviderCompetition.js
  ProviderEvent.js
  Team.js
  ProviderTeam.js
  Event.js
  EventParticipant.js
  MarketCatalog.js
  ProviderMarketMapping.js
  EventMarket.js
  OddsCurrent.js
  OddsHistory.js
  EventResult.js
  EventResultFact.js
  Bet.js
  BetSelection.js
  SelectionSettlement.js
  BetSettlement.js
  SettlementRun.js
```

### Sequelize example: Sport

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sport = sequelize.define('Sport', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  },
}, {
  tableName: 'sports',
  underscored: true,
});

module.exports = Sport;
```

### Sequelize example: Competition

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Competition = sequelize.define('Competition', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  sportId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'sport_id',
  },
  countryId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'country_id',
  },
  name: { type: DataTypes.STRING(180), allowNull: false },
  slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  competitionType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'competition_type',
  },
  scope: { type: DataTypes.STRING(30), allowNull: false },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  },
}, {
  tableName: 'competitions',
  underscored: true,
});

module.exports = Competition;
```

### Associations example

```js
Sport.hasMany(Competition, { foreignKey: 'sportId', as: 'competitions' });
Competition.belongsTo(Sport, { foreignKey: 'sportId', as: 'sport' });

Country.hasMany(Competition, { foreignKey: 'countryId', as: 'competitions' });
Competition.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });

Competition.hasMany(Event, { foreignKey: 'competitionId', as: 'events' });
Event.belongsTo(Competition, { foreignKey: 'competitionId', as: 'competition' });
```

The examples show model shape and associations; they are not ready-to-run migrations. Add explicit migrations, foreign keys, indexes, data backfills, and tests before deploying.

---

## 16. Provider adapter and synchronization service design

Keep provider-specific HTTP requests and response parsing outside domain services.

Suggested structure:

```text
Services/
  providers/
    oddsApi/
      OddsApiClient.js
      OddsApiSportsAdapter.js
      OddsApiEventsAdapter.js
      OddsApiMarketsAdapter.js
      OddsApiOddsAdapter.js
      OddsApiScoresAdapter.js
  sports/
    SportSyncService.js
    CompetitionSyncService.js
    EventSyncService.js
  markets/
    MarketMappingService.js
    EventMarketSyncService.js
  odds/
    OddsSyncService.js
    PriceSelectionService.js
  results/
    ResultSyncService.js
  settlement/
    SettlementService.js
    SettlementRules/
      football/
```

The adapter translates the provider's response into internal DTOs, for example:

```js
// Internal event DTO; values are mapped from the provider response.
{
  providerCode: 'the_odds_api',
  providerEventId: 'provider-event-id',
  providerCompetitionKey: 'soccer_epl',
  startTime: '2026-08-15T14:00:00.000Z',
  participants: [
    { role: 'home', name: 'Arsenal' },
    { role: 'away', name: 'Chelsea' }
  ]
}
```

The DTO is an example of our internal shape. It is not a literal Odds API response.

A provider adapter should:
- Make HTTP requests and handle provider-specific parameters.
- Validate required response fields.
- Normalize timestamps to UTC.
- Preserve original provider IDs and keys.
- Map provider markets/outcomes only through reviewed mappings.
- Return internal DTOs or a typed unsupported/unmapped result.
- Never decide whether a customer bet wins or loses.

The domain sync service should:
- Upsert internal records and provider mappings.
- Apply transactional snapshot rules.
- Track sync status and errors.
- Be independent of provider response field names.

---

## 17. Migration plan from the current schema

Do this in stages. Do not replace tables in one deployment.

### Phase 0 — safeguards

1. Back up the database.
2. Add explicit Sequelize migrations; stop relying on `sequelize.sync({ alter: true })` for production schema changes.
3. Record current row counts and unique keys.
4. Add tests for existing odds sync and bet placement before changing relationships.

### Phase 1 — sports and competitions

1. Create `countries`, `competitions`, `competition_seasons`, `data_providers`, and `provider_competitions`.
2. Create canonical sport rows (Football, Basketball, Tennis, etc.).
3. Convert each existing `sports.sport_key` row into a competition mapping, using reviewed metadata.
4. Preserve the original provider key exactly in `provider_competitions.provider_sport_key`.
5. Add `competition_id` to events and backfill it using the provider mapping.
6. Keep the old `sport_key` column temporarily for compatibility.
7. Update event sync to write the new relationship.
8. Verify counts and sample fixtures before switching reads.
9. Only remove old columns after all application code and data have migrated and rollback is no longer required.

### Phase 2 — events and participants

1. Add `provider_events`.
2. Backfill provider event IDs from existing event IDs.
3. Add `event_participants` and backfill home/away name snapshots.
4. Update event sync to upsert by provider identity.
5. Add canonical teams only when matching is reliable.

### Phase 3 — markets and odds

1. Add provider identity to event-market and odds quote records.
2. Create canonical market definitions and provider-market mappings.
3. Map known Odds API market keys using reviewed rules.
4. Mark unknown keys for review rather than guessing.
5. Preserve old prices/history during migration.
6. Change quote unique keys to include provider, bookmaker, and complete selection identity.
7. Separate raw bookmaker quotes from the customer-facing price selection policy.

### Phase 4 — results and settlement

1. Add result revisions and normalized result facts.
2. Add settlement rule registry/version references.
3. Add selection and ticket settlement records.
4. Implement pure rule functions with unit tests.
5. Add idempotent wallet ledger integration.
6. Run settlement in dry-run/report-only mode and compare expected decisions.
7. Enable real settlement only after finance, product rules, and operational review.

### Phase 5 — remove compatibility fields

Remove old columns and legacy paths only after production reads/writes no longer depend on them.

---

## 18. Indexes, constraints, and data integrity

At minimum:

- Unique `sports.slug` and `sports.code`.
- Unique `competitions.slug`.
- Index `competitions(sport_id, country_id, is_active, sort_order)`.
- Unique `provider_competitions(provider_id, provider_sport_key)`.
- Unique `provider_events(provider_id, provider_event_id)`.
- Index `events(competition_id, start_time)` and `events(status, start_time)`.
- Unique provider-market mapping per provider/sport/key.
- Unique event-market identity including provider and bookmaker.
- Unique odds quote identity including provider, bookmaker, market and selection identity.
- Index `odds_current(event_id, market_catalog_id, is_suspended)`.
- Index `odds_history(event_id, provider_id, recorded_at)`.
- Index `bet_selections(event_id, selection_status)`.
- Index `bets(user_id, placed_at)` and `bets(status, placed_at)`.
- Unique settlement idempotency key for each payout.
- Foreign keys for internal relationships; choose deletion policies deliberately.

Use DECIMAL for money and odds, never floating point. Store timestamps in UTC. Define nullability and uniqueness deliberately, especially for line values and descriptions.

---

## 19. Operational and security requirements

- API keys and secrets belong in environment/secret management, never in source control or raw logs.
- Record endpoint, provider, response status, duration, quota/usage headers where available, record counts, and errors.
- Use bounded retries with backoff for transient provider errors; do not retry permanent validation errors forever.
- Use request timeouts and concurrency limits.
- Make each sync idempotent.
- Distinguish a successful empty snapshot from a failed or malformed response.
- Do not mark all odds unavailable on a failed request.
- Use database transactions for bet placement and settlement.
- Lock relevant rows when changing wallet balances or settling a ticket.
- Use immutable financial ledger entries and compensating entries for corrections.
- Add unit tests for market mappings, result normalization, and each settlement rule.
- Add integration tests using recorded/sanitized provider fixtures.
- Monitor stale odds, stale events, unmapped markets, missing result facts, and failed settlement runs.

---

## 20. Recommended implementation order

For this repository, I recommend implementing in this order:

1. **Sports and competitions:** establish internal sport IDs and map Odds API sport keys to competitions.
2. **Events and participants:** make events provider-independent while retaining source IDs and names.
3. **Market catalogue and provider mappings:** canonical market identity, display category, and explicit rule key.
4. **Event-market availability:** accurately track what is offered per event/provider/bookmaker.
5. **Odds current/history:** preserve quote identity and source; select customer prices through a separate policy.
6. **Results:** normalize the facts required by the markets the platform actually offers.
7. **Bet placement snapshots:** preserve all terms the customer accepted.
8. **Settlement rules and records:** deterministic, versioned, auditable and idempotent.
9. **Wallet integration:** pay/refund through the immutable ledger in the same controlled transaction.

Do not build every sport and every market at once. Start with one supported sport (for example football), a small reviewed set of markets, and only the result facts needed to settle those markets correctly. Expand after tests and operational monitoring are in place.

---

## 21. Decisions to confirm before implementation

These are product/engineering decisions, not facts the current code already establishes:

1. Which sports and competitions should be enabled initially?
2. Which country/competition ordering should the frontend use?
3. Which bookmaker quote policy should determine the customer price: priority bookmaker, best available price, or a configured source?
4. Which markets are supported at launch, and what are their official settlement rules?
5. What is the policy for abandoned, postponed, corrected, and manually reviewed events?
6. Which bet types are supported: singles only initially, or accumulators as well?
7. What is the accepted policy for result corrections after a ticket has been paid?

**Final recommendation:** build a provider-independent internal betting domain, but implement and test only the current Odds API adapter first. Provider independence should come from mapping tables and adapters—not from assuming all providers have identical sports, events, markets, outcomes, or scores.
