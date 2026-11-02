# Recommended Database Design

> **Purpose:** Define the database tables required for the betting backend, what each table stores, and how the tables relate. This is the primary database design document.
>
> **Database:** MySQL · **ORM:** Sequelize · **Odds source:** The Odds API

## 1. Start with the Odds API sports response

First request the available sports catalogue:

```http
GET https://api.the-odds-api.com/v4/sports
GET https://api.the-odds-api.com/v4/sports?all=true
```

Example response item:

```json
{
  "key": "soccer_epl",
  "group": "Soccer",
  "title": "EPL",
  "description": "English Premier League",
  "active": true,
  "has_outrights": false
}
```

The response gives us the starting information for the database. From it, we can identify sport families and possible competition entries. We then prepare the internal catalogue tables below. **Not every response item is a competition:** `soccer_epl` is a competition entry, while `cricket_odi` is a format.

## 2. Foundational catalogue tables

Create the internal catalogue first. The Odds API mapping table is added after these internal records exist, so it can reference their IDs.

### Model 1 — `sports`

One row per sport family. Create or match a sport using each distinct response `group`, such as Soccer, Basketball, Tennis, or Cricket.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal sport ID |
| `name` | VARCHAR(100) | Display name, e.g. Soccer |
| `slug` | VARCHAR(100) UNIQUE | URL-friendly name, e.g. soccer |
| `code` | VARCHAR(50) UNIQUE | Stable internal code |
| `is_active` | BOOLEAN | Whether the platform displays this sport |
| `sort_order` | INT | Frontend display order |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

**Example:** The response group `Soccer` creates or matches one `sports` row. Multiple soccer competitions use the same `sport_id`.

### Model 2 — `countries`

A reference list of countries used to group domestic competitions. The Odds API sports response does not contain a country list, so prepare this table independently using ISO country codes.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal country ID |
| `name` | VARCHAR(100) UNIQUE | Country name, e.g. England |
| `iso2` | CHAR(2) UNIQUE NULL | ISO alpha-2 code |
| `iso3` | CHAR(3) UNIQUE NULL | ISO alpha-3 code |
| `is_active` | BOOLEAN | Whether the country is available in the platform |

**Example:** England is stored once and linked to domestic competitions. UEFA and FIFA are not countries; international competitions should have no country or use a separate region classification.

Country preparation reference: [ISO 3166 country codes](https://www.iso.org/iso-3166-country-codes.html). See the [extended country-resolution notes](./RECOMMENDED_DATABASE_DESIGN_DETAILS.md#country-reference-data).

### Model 3 — `competitions`

One row per actual league, cup, tournament, or championship. Create a competition only after classifying an Odds API sport-key entry as a real competition.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal competition ID |
| `sport_id` | BIGINT FK | References `sports.id` |
| `country_id` | BIGINT FK NULL | Domestic country; NULL for international or unresolved |
| `name` | VARCHAR(180) | Full name, e.g. English Premier League |
| `short_name` | VARCHAR(80) NULL | Short display name, e.g. EPL |
| `slug` | VARCHAR(180) UNIQUE | URL-friendly name |
| `competition_type` | VARCHAR(30) | league, cup, tournament, championship |
| `scope` | VARCHAR(30) | domestic, continental, international |
| `region_code` | VARCHAR(30) NULL | Optional organizer/region, e.g. UEFA |
| `is_active` | BOOLEAN | Whether the platform offers this competition |
| `sort_order` | INT | Frontend display order |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

**Example:** `soccer_epl` can map to an internal competition named English Premier League, with sport = Soccer and country = England. Do not create a competition for a format such as One Day Internationals.

### Model 4 — `competition_seasons`

Stores the seasons belonging to a competition. The sports endpoint does not provide an authoritative season list or official season boundaries.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal season ID |
| `competition_id` | BIGINT FK | References `competitions.id` |
| `name` | VARCHAR(80) | Season label, e.g. 2026/2027 |
| `start_date` | DATE NULL | Season start, when confirmed |
| `end_date` | DATE NULL | Season end, when confirmed |
| `is_current` | BOOLEAN | Current season flag |
| `status` | VARCHAR(30) | provisional, confirmed, completed |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

**Constraint:** unique `(competition_id, name)`.

**Example:** A Premier League season belongs to the Premier League competition. Use administrator-managed rules or trusted calendar information; do not invent official dates from the sports response.

### Model 5 — `odds_api_sports_competition_mappings`

Stores the original Odds API sports-catalogue item and connects its sport key to the internal catalogue. Create one row per unique response `key`. This is the single table for Odds API sports entries; do not add a separate catalogue table.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal mapping row ID |
| `odds_api_sport_key` | VARCHAR(150) UNIQUE | Exact source key, e.g. `soccer_epl` |
| `odds_api_group` | VARCHAR(150) | Exact source group |
| `odds_api_title` | VARCHAR(200) | Exact source title |
| `odds_api_description` | VARCHAR(500) NULL | Source description |
| `odds_api_active` | BOOLEAN NULL | Active status reported by Odds API |
| `has_outrights` | BOOLEAN NULL | Source outright capability hint |
| `entry_type` | ENUM | competition, format, category, unknown |
| `classification_status` | ENUM | pending_review, auto_classified, verified, rejected |
| `classification_reason` | TEXT NULL | Why this classification was chosen |
| `sport_id` | BIGINT FK | References `sports.id` |
| `country_id` | BIGINT FK NULL | Resolved country, when applicable |
| `competition_id` | BIGINT FK NULL | Internal competition, when applicable |
| `mapping_status` | VARCHAR(30) NULL | pending_review, verified, disabled, rejected |
| `match_method` | VARCHAR(40) NULL | How the internal competition was matched |
| `is_primary` | BOOLEAN | Primary Odds API key for the competition |
| `original_response` | JSON NULL | Original JSON object for this one sport key |
| `first_seen_at`, `last_seen_at` | DATETIME(3) | First and most recent discovery |
| `last_synced_at`, `verified_at` | DATETIME(3) NULL | Sync and review timestamps |
| `created_at`, `updated_at` | DATETIME(3) | Record timestamps |

**Examples:**
- `soccer_epl`: `entry_type = competition`; link to Soccer, England, and English Premier League.
- `cricket_odi`: `entry_type = format`; link to Cricket, but leave `competition_id` and `country_id` NULL.

The `original_response` field stores the individual object for the key, not the entire response array. Country resolution must be reviewed; never infer a country solely from an unverified title or group.

## 3. Event participants

### Model 6 — `event_participants`

Stores the teams or individual competitors taking part in one specific event. Each row belongs to an event. This is enough for the current odds workflow; a separate permanent `teams` table and an `odds_api_teams` mapping table are not required.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Participant row ID |
| `event_id` | BIGINT FK | References `events.id` |
| `participant_name` | VARCHAR(180) | Name received for this event |
| `role` | VARCHAR(20) | home, away, competitor, player |
| `odds_api_participant_id` | VARCHAR(150) NULL | Source participant ID, only if supplied |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

**Example — Arsenal vs Chelsea:** create one event, then add two participant rows: `Arsenal / home` and `Chelsea / away`. For an individual-player market, a participant row can instead identify the relevant player. Keep the event's participant name even if no external participant ID is provided.

A participant is **not** a permanent team profile. It records who is involved in this particular event. A separate team directory would only be useful later if the platform needs reusable team profiles, team statistics, or team-level search across many events.

## 4. Events

### Model 9 — `events`

One row per fixture or sporting event.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal event ID |
| `competition_id` | BIGINT FK | Competition hosting the event |
| `season_id` | BIGINT FK NULL | Season, when known |
| `start_time` | DATETIME(3) | Scheduled start time in UTC |
| `status` | VARCHAR(30) | scheduled, live, completed, postponed, cancelled, abandoned |
| `neutral_venue` | BOOLEAN NULL | Whether the venue is neutral |
| `venue_name` | VARCHAR(180) NULL | Venue, if supplied reliably |
| `last_synced_at` | DATETIME(3) NULL | Last successful sync |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

Useful indexes: `(competition_id, start_time)`, `(status, start_time)`, and `(start_time)`.

### Model 10 — `odds_api_events`

Stores the Odds API event ID separately from the internal event.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Mapping ID |
| `event_id` | BIGINT FK | References `events.id` |
| `odds_api_event_id` | VARCHAR(150) UNIQUE | Exact source event ID |
| `odds_api_sport_key` | VARCHAR(150) | Sport key used for the request |
| `last_seen_at` | DATETIME | Last time the event was returned |
| `raw_metadata` | JSON NULL | Optional source metadata |

The internal `events.id` is used by the application. The Odds API ID is retained for source lookups and synchronization.

## 5. Market catalogue and market availability

These tables have different jobs: the catalogue defines a market, sport capabilities say where it is applicable, and event markets record whether it is offered for a particular event.

### Model 11 — `market_catalog`

Canonical market definitions used by the application.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal market ID |
| `market_key` | VARCHAR(120) UNIQUE | Stable internal key |
| `display_name` | VARCHAR(180) | Name shown to customers |
| `category` | VARCHAR(60) | featured, goals, player_props, corners, periods, etc. |
| `settlement_rule_key` | VARCHAR(120) | Rule used to settle this market |
| `market_scope` | VARCHAR(30) | pre_match, in_play, both |
| `is_enabled` | BOOLEAN | Whether the platform supports it |
| `sort_order` | INT | Display order |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

**Example:** `match_winner_1x2` is the internal key for a full-time match result market. It is separate from the Odds API market key.

### Model 12 — `odds_api_market_mappings`

Maps an Odds API market key to an internal market definition.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Mapping ID |
| `sport_id` | BIGINT FK NULL | Optional sport-specific mapping |
| `odds_api_market_key` | VARCHAR(150) | Exact source market key |
| `market_catalog_id` | BIGINT FK NULL | Internal market; NULL if not mapped |
| `odds_api_market_name` | VARCHAR(180) NULL | Source market name |
| `mapping_status` | VARCHAR(20) | mapped, review, unsupported |
| `mapping_version` | INT | Mapping revision |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

Unknown market keys should be marked for review, not assigned a guessed settlement meaning.

### Model 13 — `sport_market_capabilities`

Defines which canonical markets are applicable and visible for each sport.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Row ID |
| `sport_id` | BIGINT FK | References `sports.id` |
| `market_catalog_id` | BIGINT FK | References `market_catalog.id` |
| `is_enabled` | BOOLEAN | Market is available for this sport |
| `is_featured` | BOOLEAN | Show in featured group |
| `display_order` | INT | Display order for this sport |
| `applicability_note` | TEXT NULL | Explanation or sport-specific condition |
| `validation_status` | VARCHAR(20) | pending, verified, unsupported |

Unique: `(sport_id, market_catalog_id)`.

**Example:** Both-teams-to-score may be enabled for Soccer but not automatically enabled for Tennis.

### Model 14 — `event_markets`

Records a market's availability for a particular event. It does not store the market's price.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Event-market ID |
| `event_id` | BIGINT FK | References `events.id` |
| `market_catalog_id` | BIGINT FK NULL | Canonical market, if mapped |
| `odds_api_market_key` | VARCHAR(150) | Exact source market key |
| `is_available` | BOOLEAN | Whether the market is currently offered |
| `is_suspended` | BOOLEAN | Whether selections are temporarily disabled |
| `last_seen_at` | DATETIME(3) | Last source observation |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

A market can be supported by a sport but absent from a particular event. Only create/update availability from actual endpoint responses.

## 6. Bookmakers and odds

A bookmaker is the company offering the price (for example, a sportsbook). The Odds API is the data source that reports bookmaker prices; it is not itself a bookmaker.

### Model 15 — `bookmakers`

One row per bookmaker identity returned by the Odds API.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Internal bookmaker ID |
| `odds_api_bookmaker_key` | VARCHAR(100) UNIQUE | Exact source key |
| `name` | VARCHAR(180) | Display name |
| `is_active` | BOOLEAN | Whether the platform uses this bookmaker |
| `sort_order` | INT | Display or preference order |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

### Model 16 — `odds_current`

Stores the latest price for each event, bookmaker, market, and outcome/line.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Quote ID |
| `event_id` | BIGINT FK | Event |
| `event_market_id` | BIGINT FK NULL | Event-market availability row |
| `market_catalog_id` | BIGINT FK NULL | Canonical market |
| `odds_api_market_key` | VARCHAR(150) | Original source market key |
| `bookmaker_id` | BIGINT FK | Bookmaker offering the price |
| `outcome_key` | VARCHAR(150) NULL | Source outcome ID, if supplied |
| `outcome_name` | VARCHAR(180) | e.g. Arsenal, Draw, Over |
| `participant_id` | BIGINT FK NULL | References `event_participants.id` for participant markets |
| `line_value` | DECIMAL(10,3) NULL | Handicap or total line |
| `period_key` | VARCHAR(40) NULL | Full time, first half, set, quarter, etc. |
| `description` | VARCHAR(255) NULL | Additional source selection description |
| `source_price` | DECIMAL(12,5) | Price received from source |
| `display_price` | DECIMAL(12,5) | Price offered to customer |
| `is_suspended` | BOOLEAN | Whether the quote is selectable |
| `source_updated_at` | DATETIME(3) NULL | Source update time |
| `fetched_at` | DATETIME(3) | Time received by our backend |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

A quote is identified by its event, bookmaker, market, outcome, line, and period—not by its price. Keep source and display prices separate if the platform applies a margin.

### Model 17 — `odds_history`

Append-only record of price changes for historical analysis and auditing.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | History row ID |
| `odds_current_id` | BIGINT FK NULL | Current quote reference, if retained |
| `event_id` | BIGINT FK | Event |
| `bookmaker_id` | BIGINT FK | Bookmaker |
| `odds_api_market_key` | VARCHAR(150) | Source market key |
| `outcome_name` | VARCHAR(180) | Outcome |
| `line_value` | DECIMAL(10,3) NULL | Handicap/total line |
| `period_key` | VARCHAR(40) NULL | Market period |
| `source_price` | DECIMAL(12,5) | Source price |
| `display_price` | DECIMAL(12,5) | Customer-facing price |
| `is_suspended` | BOOLEAN | Suspension state |
| `source_updated_at` | DATETIME(3) NULL | Source update time |
| `recorded_at` | DATETIME(3) | Time saved in history |

Store a history row when a meaningful quote value or selectable state changes. Keep this table append-only.

## 7. Results

### Model 18 — `event_results`

Stores the latest accepted result summary for an event.

| Column | Type | Description |
|---|---|---|
| `event_id` | BIGINT PK/FK | References `events.id` |
| `status` | VARCHAR(30) | pending, provisional, final, corrected, abandoned |
| `home_score` | INT NULL | Home score where applicable |
| `away_score` | INT NULL | Away score where applicable |
| `is_final` | BOOLEAN | Whether result is final |
| `odds_api_event_id` | VARCHAR(150) NULL | Source event ID |
| `source_updated_at` | DATETIME(3) NULL | Source update time |
| `received_at` | DATETIME(3) | Time received |
| `revision` | INT | Incremented when a correction is accepted |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

### Model 19 — `event_result_facts`

Stores additional normalized result facts needed for specific markets, beyond the main score.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Fact ID |
| `event_id` | BIGINT FK | Event |
| `fact_key` | VARCHAR(100) | e.g. total_corners, home_score_h1 |
| `participant_id` | BIGINT FK NULL | References `event_participants.id`, when related to a participant |
| `period_key` | VARCHAR(40) NULL | Half, quarter, set, etc. |
| `numeric_value` | DECIMAL(12,3) NULL | Numeric result |
| `text_value` | VARCHAR(255) NULL | Text result |
| `source_updated_at` | DATETIME(3) NULL | Source update time |
| `received_at` | DATETIME(3) | Time received |

Only store validated facts that are needed by supported settlement rules.

## 8. Bets and settlement

A bet stores the customer's ticket. Each selection stores exactly what the customer accepted, including the odds at placement time. This snapshot must not change when live odds later move.

### Model 20 — `bets`

| Column | Type | Description |
|---|---|---|
| `bet_id` | CHAR(36) PK | Ticket UUID |
| `user_id` | CHAR(36) FK | Customer |
| `bet_type` | VARCHAR(20) | single, accumulator, system |
| `stake` | DECIMAL(14,2) | Cash stake |
| `bonus_stake` | DECIMAL(14,2) | Bonus-funded stake, if supported |
| `currency` | CHAR(3) | e.g. ETB |
| `total_odds` | DECIMAL(14,5) | Combined odds accepted |
| `potential_payout` | DECIMAL(14,2) | Calculated potential return |
| `status` | VARCHAR(30) | pending, accepted, partially_settled, won, lost, void, cancelled |
| `placed_at` | DATETIME(3) | Placement time |
| `settled_at` | DATETIME(3) NULL | Final settlement time |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

### Model 21 — `bet_selections`

One row per selection/leg in a bet.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Selection ID |
| `bet_id` | CHAR(36) FK | References `bets.bet_id` |
| `event_id` | BIGINT FK | Selected event |
| `market_catalog_id` | BIGINT FK NULL | Canonical market |
| `odds_api_market_key` | VARCHAR(150) NULL | Source market key |
| `bookmaker_id` | BIGINT FK NULL | Bookmaker quote source |
| `outcome_key` | VARCHAR(150) NULL | Source outcome ID |
| `outcome_name` | VARCHAR(180) | Selected outcome |
| `line_value` | DECIMAL(10,3) NULL | Handicap/total |
| `period_key` | VARCHAR(40) NULL | Market period |
| `participant_name_snapshot` | VARCHAR(180) NULL | Participant name when selected |
| `description_snapshot` | VARCHAR(255) NULL | Additional selection description |
| `odds_at_bet` | DECIMAL(12,5) | Immutable accepted odds |
| `selection_status` | VARCHAR(30) | pending, won, lost, void, half_won, half_lost |
| `settled_at` | DATETIME(3) NULL | Settlement time |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

### Model 22 — `market_settlement_rules`

Defines how a supported market is settled. Keep rules versioned because rule changes must not silently change old bet outcomes.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Rule ID |
| `rule_key` | VARCHAR(120) | Stable rule identifier |
| `version` | INT | Rule version |
| `sport_id` | BIGINT FK NULL | Optional sport-specific rule |
| `market_catalog_id` | BIGINT FK | Market using this rule |
| `rule_definition` | JSON | Structured settlement conditions |
| `is_active` | BOOLEAN | Available for new settlements |
| `created_at`, `updated_at` | DATETIME | Record timestamps |

Unique: `(rule_key, version)`.

### Model 23 — `selection_settlements`

Stores each settlement decision for a bet selection, including the result revision and rule used.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Settlement decision ID |
| `bet_selection_id` | BIGINT FK | Selection being settled |
| `result_revision` | INT | Event-result revision used |
| `rule_key` | VARCHAR(120) | Rule applied |
| `rule_version` | INT | Rule version applied |
| `outcome` | VARCHAR(30) | won, lost, void, half_won, half_lost |
| `calculation_json` | JSON | Calculation inputs and explanation |
| `settled_by` | VARCHAR(30) | system or admin |
| `settled_at` | DATETIME(3) | Decision time |
| `created_at` | DATETIME | Record timestamp |

### Model 24 — `bet_settlements`

Stores the final ticket-level payout calculation.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Settlement ID |
| `bet_id` | CHAR(36) FK | References `bets.bet_id` |
| `settlement_revision` | INT | Revision number |
| `status` | VARCHAR(30) | won, lost, void, partially_settled |
| `stake_returned` | DECIMAL(14,2) | Returned stake |
| `payout_amount` | DECIMAL(14,2) | Amount payable |
| `currency` | CHAR(3) | Settlement currency |
| `calculation_json` | JSON | Calculation audit |
| `settled_at` | DATETIME(3) | Settlement time |
| `created_at` | DATETIME | Record timestamp |

Unique: `(bet_id, settlement_revision)`.

### Model 25 — `settlement_runs`

Audit log for each automatic or administrator-triggered settlement run.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Run ID |
| `event_id` | BIGINT FK NULL | Event processed, if event-specific |
| `started_at` | DATETIME(3) | Start time |
| `finished_at` | DATETIME(3) NULL | Finish time |
| `status` | VARCHAR(20) | running, succeeded, partial, failed |
| `records_checked` | INT | Records examined |
| `records_settled` | INT | Records settled |
| `error_summary` | TEXT NULL | Error details |

Settlement must be idempotent: retrying a run must not pay the same bet twice. Financial payouts should also use a unique idempotency key in the wallet/ledger transaction.

## 9. Table relationships at a glance

```text
sports
  └── competitions
        ├── competition_seasons
        ├── events
        │     ├── event_participants
        │     ├── odds_api_events
        │     ├── event_markets
        │     │     └── odds_current ── bookmakers
        │     │           └── odds_history
        │     └── event_results
        │           └── event_result_facts
        └── odds_api_sports_competition_mappings

countries ── competitions
sports ── sport_market_capabilities ── market_catalog
market_catalog ── odds_api_market_mappings
bets ── bet_selections ── events
bet_selections ── selection_settlements
bets ── bet_settlements
market_catalog ── market_settlement_rules
settlement_runs
```

## 10. Backend and frontend responsibilities

- The backend fetches Odds API data, validates it, and saves normalized records.
- The frontend reads the backend's API; it does not call The Odds API directly or receive the Odds API key.
- Use internal database IDs for relationships. Keep Odds API keys and IDs in the relevant mapping tables.
- Keep bookmaker identity separate from the Odds API source.
- Do not show a market just because it exists in `market_catalog`: check sport capability and event-market availability.
- Keep raw source JSON for traceability, but use relational columns for normal queries and business rules.

For extended explanations of country classification, seasons, market types, synchronization, and API examples, see [RECOMMENDED_DATABASE_DESIGN_DETAILS.md](./RECOMMENDED_DATABASE_DESIGN_DETAILS.md).
