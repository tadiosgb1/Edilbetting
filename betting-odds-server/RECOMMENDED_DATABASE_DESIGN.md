# Recommended Database Design

> **Purpose:** A concise database blueprint for the betting backend. It identifies the models, relationships, and source endpoint used to prepare the initial sports catalogue.
>
> **Database:** MySQL  
> **ORM:** Sequelize  
> **Odds source:** The Odds API

## 1. Start with the sports endpoint

First request the Odds API sports catalogue:

```http
GET https://api.the-odds-api.com/v4/sports
```

To include inactive entries when needed:

```http
GET https://api.the-odds-api.com/v4/sports?all=true
```

A response item contains fields similar to:

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

## 2. Models prepared from the sports response

Use the response as the starting point for the sport catalogue. **Do not treat every response item as a competition.** Use `group` to identify the sport family, and classify each `key` before creating or linking a competition.

| Model | Purpose | How it is prepared |
|---|---|---|
| `sports` | Canonical sport families, e.g. Soccer, Basketball, Cricket | Create one record per distinct response `group` |
| `competitions` | Actual leagues, cups, tours, and tournaments | Create only for entries classified as real competitions |
| `odds_api_sports_competition_mappings` | One row per Odds API sport key | Store source fields, original item JSON, classification, and internal links |
| `countries` | Application country reference list | Prepare independently; it is not returned by this endpoint |
| `competition_seasons` | Seasons belonging to competitions | Prepare separately; the sports response does not provide seasons |

### Mapping table

`odds_api_sports_competition_mappings` stores one row for every unique Odds API `key`, including formats and categories.

Core fields:
- `odds_api_sport_key` — unique Odds API key.
- `odds_api_group`, `odds_api_title`, `odds_api_description`, `odds_api_active`, `has_outrights` — source fields.
- `entry_type` — `competition`, `format`, `category`, or `unknown`.
- `sport_id` — required link to `sports`.
- `country_id` — nullable link to `countries`.
- `competition_id` — nullable link to `competitions`.
- `original_response` — JSON for this individual response item, not the full response array.
- `classification_status` and `classification_reason` — classification/review information.
- `first_seen_at`, `last_seen_at`, `last_synced_at`, `verified_at` — sync/audit timestamps.

Examples:
- `soccer_epl` → `entry_type = competition`; link to the English Premier League.
- `cricket_odi` → `entry_type = format`; keep `competition_id = NULL`.

Do not create a separate Odds API catalogue table.

## 3. Prepare countries and seasons separately

The sports endpoint does not return a country list or an authoritative season catalogue.

- **Countries:** populate `countries` from a maintained country reference dataset (ISO 3166 codes are recommended). Resolve competition countries using reviewed mappings. Do not guess from a title or sport group. Leave `country_id` NULL when unresolved.
- **International competitions:** UEFA, FIFA, and similar bodies are regions/organizers, not sovereign countries. Represent their scope/region separately.
- **Seasons:** create `competition_seasons` from administrator-managed rules or trusted competition calendar data. Assign events using their start time; do not claim the sports response supplies official season boundaries.

See [Country, Competition, and Season Preparation](./RECOMMENDED_DATABASE_DESIGN_DETAILS.md#building-the-countries-list-without-a-countries-endpoint) for detailed rules and examples.

## 4. Remaining backend models

Create the remaining models after the foundational catalogue:

| Model | Purpose |
|---|---|
| `teams` | Canonical teams/competitors |
| `event_participants` | Teams or participants in an event |
| `events` | Scheduled or completed fixtures/events |
| `market_catalog` | Canonical market definitions |
| `odds_api_market_mappings` | Maps Odds API market keys to canonical markets |
| `sport_market_capabilities` | Markets supported/displayed for each sport |
| `event_markets` | Markets available for a particular event |
| `bookmakers` | Bookmaker identities returned by the Odds API |
| `odds_current` | Latest prices by event, market, outcome, and bookmaker |
| `odds_history` | Historical price snapshots |
| `event_results` | Recorded event results and result evidence |
| `bets` | Customer bet slips |
| `bet_selections` | Individual selections in a bet |
| `selection_settlements` | Settlement outcome for each selection |
| `bet_settlements` | Final bet settlement and payout |
| `settlement_runs` | Auditable settlement processing runs |

## 5. Data flow

```text
Odds API /sports
      |
      v
sports
      |
      v
odds_api_sports_competition_mappings
      |
      +----> competitions ----> competition_seasons
      |                              |
      +----> countries               |
                                     v
teams ----> event_participants ----> events
                                     |
market_catalog --> odds_api_market_mappings
       |                             |
       +--> sport_market_capabilities
                                     v
                               event_markets
                                     |
bookmakers --------------------------+
                                     v
                         odds_current / odds_history

events --> event_results --> selection_settlements
bets --> bet_selections --> bet_settlements
```

## 6. API and frontend boundary

The backend fetches and normalizes Odds API data. The frontend reads the backend's API and must not call The Odds API directly or receive its API key.

Keep source keys and raw response data for synchronization and troubleshooting, but use internal database IDs in application relationships.

## 7. Detailed reference

For full field definitions, endpoint notes, classification rules, market explanations, synchronization workflows, and implementation examples, see [RECOMMENDED_DATABASE_DESIGN_DETAILS.md](./RECOMMENDED_DATABASE_DESIGN_DETAILS.md).
