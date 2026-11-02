# Betting Database Architecture and Implementation Guide

> **Purpose:** Define a professional, extensible data architecture for sports betting, from sports and competitions through odds, results, bet placement, and settlement.
>
> **Scope:** Sports, countries, competitions, seasons, participants, events, market definitions, Odds API mappings, event-market availability, odds, results, bets, bet selections, and settlement.
>
> **Database and ORM:** MySQL and Sequelize.
>
> **Odds data source:** The database design and model examples are based on The Odds API data contract. Odds API sport keys, event IDs, market keys, bookmaker keys, and source timestamps are retained where needed, while betting business logic uses stable internal IDs and normalized records.

---

## 1. Architecture overview

A sports betting platform should distinguish the sport itself from the competition in which an event takes place:

- **Sport:** football, basketball, tennis, cricket.
- **Competition:** Premier League, La Liga, NBA, Wimbledon.

The platform stores Odds API keys in dedicated mapping tables rather than using them as internal entity identities:

```text
sports
  └── competitions
        ├── competition_seasons
        └── odds_api_competitions
              └── events
                    ├── event_participants
                    ├── event_markets
                    │     └── odds_current
                    │           └── odds_history
                    ├── event_results
                    └── bet_selections
                          └── selection_settlements

market_catalog
  ├── odds_api_market_mappings
  └── sport_market_capabilities

bets
  ├── bet_selections
  └── bet_settlements

settlement_runs
```

The key rules are:

1. Internal IDs identify platform records. Odds API IDs and keys identify the corresponding records in the Odds API.
2. Odds API payloads are translated into a stable internal representation before they reach betting business logic.
3. An Odds API market key is not automatically a universal market definition. It must be mapped to our canonical market key.
4. An event's availability of a market is different from the definition of that market, and both are different from its prices.
5. A bet selection stores an immutable snapshot of what the customer accepted at placement time.
6. Results are evidence used by settlement; a final score alone does not prove every market outcome.
7. Settlement must be repeatable safely: retrying a job must not pay a bet twice.
8. Keep raw Odds API payloads and sync/audit records for troubleshooting, but do not make raw JSON the primary relational model.

---

## 2. Sports, countries, competitions, and seasons

### 2.0 How these records are populated from The Odds API

The Odds API does not provide a dedicated countries endpoint or a general-purpose season endpoint in the sports discovery flow. The backend therefore builds the platform's navigation hierarchy from the sports response and its own classification data.

#### Upstream endpoint: list sports and competitions

~~~http
GET https://api.the-odds-api.com/v4/sports
GET https://api.the-odds-api.com/v4/sports?all=true
~~~

The response is an array. A representative item is:

~~~json
{
  "key": "soccer_epl",
  "group": "Soccer",
  "title": "EPL",
  "description": "English Premier League",
  "active": true,
  "has_outrights": false
}
~~~

Interpret the fields as follows:

| Odds API field | Meaning | Backend use |
|---|---|---|
| key | Unique Odds API sport/competition key | Store unchanged in odds_api_competitions.odds_api_sport_key |
| group | Broad sport family | Normalize into sports, for example Soccer → Football (or retain Soccer as the display name) |
| title | Competition/league label | Competition display name, for example EPL |
| description | Human-readable competition description, when present | Competition description |
| active | Whether the competition is currently active/in season | Source status; do not confuse with our platform enabled flag |
| has_outrights | Whether outright markets are available for this competition | Competition capability hint; still check actual event/market availability |

**Important hierarchy:** one Odds API item such as soccer_epl represents a competition within the Soccer group. It is not a separate sport. Therefore:
- sports contains one canonical row for Soccer/Football.
- competitions contains one row for the Premier League.
- odds_api_competitions connects the internal competition to soccer_epl.
- sport types for the frontend are distinct normalized sports groups, not every Odds API key.

#### Building the countries list without a countries endpoint

For every Odds API sports item, the backend should resolve its competition country in this order:

1. Exact reviewed mapping: for example, soccer_epl → England, soccer_spain_la_liga → Spain, basketball_nba → United States.
2. A conservative key parser for predictable domestic keys, such as soccer_germany_bundesliga → Germany.
3. A reviewed international/continental mapping: soccer_uefa_champs_league → International / UEFA, not a country.
4. If no safe classification exists, set country_id to NULL and classification_status to review. Do not guess.

Store this resolution in competitions.country_id and retain the reason/source in fields such as country_resolution_method (manual, parsed, reviewed_international, unresolved) and classification_status. The countries table is a curated backend reference table populated from the mappings and standard country codes; it is not fetched from a non-existent Odds API countries endpoint.

Examples:

| Odds API key | Sport group | Competition | Country/region classification |
|---|---|---|---|
| soccer_epl | Soccer | Premier League | England |
| soccer_spain_la_liga | Soccer | La Liga | Spain |
| soccer_germany_bundesliga | Soccer | Bundesliga | Germany |
| basketball_nba | Basketball | NBA | United States |
| soccer_uefa_champs_league | Soccer | UEFA Champions League | International / UEFA |
| soccer_fifa_world_cup | Soccer | FIFA World Cup | International / FIFA |

A region such as UEFA is not a country. If the UI needs a country-navigation level, return it as a separate region group or place international competitions in an International group. Do not insert UEFA or FIFA into countries as if either were a sovereign country.

#### Recommended country classification fields

Add these fields to competitions (or to a dedicated competition_classifications table if classifications need history):

| Field | Example | Purpose |
|---|---|---|
| country_id | England row ID | Nullable FK to countries |
| region_code | UEFA | Optional continental/organizing region |
| scope | domestic, continental, international | Explains the competition's geographic scope |
| country_resolution_method | manual | Explains how country was assigned |
| classification_status | confirmed, review, unresolved | Prevents guessed classifications being treated as facts |

The backend should expose only confirmed country classifications in the country navigation by default. International and unresolved competitions should be discoverable through their own groups or filters.

#### How to implement sports synchronization

1. Call GET /v4/sports (and use all=true when the synchronization job needs inactive/out-of-season competitions too).
2. Upsert one sports row for each normalized group value.
3. Upsert one competitions row for each distinct Odds API sport key, using the group's internal sport_id.
4. Upsert odds_api_competitions with the exact key, group, title, active and has_outrights values.
5. Resolve the competition country/region using the classification procedure above.
6. Mark source records not seen in a complete successful response as inactive only after the complete response has been validated. Never deactivate everything because a request failed.
7. Keep platform visibility (enabled, featured, sort_order) separate from the Odds API active flag.

Pseudo-code:

~~~js
for (const item of oddsApiSports) {
  const sport = await Sport.findOrCreate({
    where: { slug: normalizeSportGroup(item.group) },
    defaults: { name: normalizeSportGroup(item.group), isActive: true }
  });

  const classification = resolveCompetitionClassification(item.key, item.group, item.title);

  const competition = await Competition.upsert({
    sportId: sport.id,
    countryId: classification.countryId,
    name: item.title,
    slug: makeStableCompetitionSlug(item.key),
    scope: classification.scope,
    regionCode: classification.regionCode,
    countryResolutionMethod: classification.method,
    classificationStatus: classification.status
  });

  await OddsApiCompetition.upsert({
    competitionId: competition.id,
    oddsApiSportKey: item.key,
    oddsApiGroup: item.group,
    oddsApiTitle: item.title,
    oddsApiActive: item.active,
    hasOutrights: item.has_outrights,
    lastSyncedAt: new Date()
  });
}
~~~

This is a synchronization outline. Implement the upsert and association operations in a transaction and use the actual Sequelize instance-return conventions in the service.

#### Seasons: what data is available and how to create them

The sports discovery response above does not contain a season name, season ID, start date or end date. The standard event-list response also does not provide a dependable competition-season identifier. Do not invent an Odds API season ID.

Create competition_seasons from a controlled season calendar. For example:

~~~json
{
  "competition": "Premier League",
  "season": {
    "name": "2026/2027",
    "start_date": "2026-08-01",
    "end_date": "2027-05-31",
    "is_current": true,
    "odds_api_season_ref": null
  }
}
~~~

A season record would look like:

| id | competition_id | name | start_date | end_date | is_current |
|---:|---:|---|---|---|---|
| 31 | 7 | 2025/2026 | 2025-08-01 | 2026-05-31 | false |
| 32 | 7 | 2026/2027 | 2026-08-01 | 2027-05-31 | true |

When an event is synchronized, assign season_id by checking which configured season window contains the event's start_time. If no season window matches, leave season_id NULL and queue the event/competition for classification. Cup competitions and tournaments may use calendar-year names such as 2026 rather than 2026/2027.

A season is a competition's time-bounded edition. For example, the Premier League 2026/2027 is one season; the Premier League 2027/2028 is another. It is not a separate competition and it is not a sport.

#### Frontend navigation examples from these models

- GET /api/sports/types returns normalized sport families.
- GET /api/sports returns competitions with their sport and classification summary.
- GET /api/sports/:sportType/countries returns confirmed domestic countries plus an optional International group.
- GET /api/sports/:sportType/countries/:countryCode/competitions returns competitions in that country.
- GET /api/competitions/:competitionId/seasons returns configured seasons for that competition.

The full response contracts are specified in the frontend API section near the end of this document.


### 2.1 `sports`

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

### 2.2 `countries`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `name` | VARCHAR(100) UNIQUE | England |
| `iso2` | CHAR(2) UNIQUE NULL | GB |
| `iso3` | CHAR(3) UNIQUE NULL | GBR |
| `is_active` | BOOLEAN | |

Use ISO codes where available. A competition may have no country (for example, an international competition). Do not force an invented country value such as `International` into the countries table.

### 2.3 `competitions`

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

### 2.4 `competition_seasons`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `competition_id` | BIGINT FK | |
| `name` | VARCHAR(80) | 2026/2027 |
| `start_date` | DATE NULL | |
| `end_date` | DATE NULL | |
| `is_current` | BOOLEAN | |
| `odds_api_season_ref` | VARCHAR(150) NULL | Only if supplied by the Odds API |
| `created_at`, `updated_at` | DATETIME | |

Unique: `(competition_id, name)`.

Season information is Odds API-dependent. Treat season assignment as optional until a trusted source supplies it; do not manufacture Odds API season identifiers.

### 2.5 `odds_api_competitions`

This table connects an internal competition to the corresponding sport key returned by The Odds API. It belongs after the internal sport, country, competition, and season records because it maps an external competition identifier to an already-defined internal competition.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Internal mapping ID |
| `competition_id` | BIGINT FK | References `competitions.id` |
| `odds_api_sport_key` | VARCHAR(150) UNIQUE | Exact Odds API key, e.g. `soccer_epl` |
| `odds_api_group` | VARCHAR(150) NULL | Group returned by The Odds API, e.g. Soccer |
| `odds_api_title` | VARCHAR(200) NULL | Competition title returned by The Odds API |
| `odds_api_active` | BOOLEAN NULL | Last known active state from The Odds API |
| `last_synced_at` | DATETIME NULL | Last successful synchronization |
| `raw_metadata` | JSON NULL | Optional source metadata |

**Relationship:** many Odds API sport keys should not be forced into the `sports` table. Each mapping points to one internal competition, and that competition belongs to one internal sport.

**Unique constraint:** `odds_api_sport_key`.

**Why:** `sports` stores Football or Basketball; `competitions` stores Premier League or NBA; `odds_api_competitions` stores the exact Odds API key used to retrieve that competition's data. This keeps the three concepts clear.

### 2.6 Example

```text
Sport: Football
  Competition: Premier League
    Country: England
    Odds API sport key: `soccer_epl`
    Season: 2026/2027
      Events: Arsenal vs Chelsea, ...
  Competition: UEFA Champions League
    Country: NULL
    Scope: continental
    Odds API sport key: `soccer_uefa_champs_league`

Sport: Basketball
  Competition: NBA
    Country: USA (competition identity)
    Odds API sport key: `basketball_nba`
```

**Why this structure:** the application can organize by sport, then country, then competition without confusing a league with a sport. It also lets the internal competition name remain stable if The Odds API changes its title or key.

---

## 3. Teams and event participants

The Odds API event data may supply participant names, stable participant IDs, or both. Preserve the supplied identifiers when available, and retain participant-name snapshots even when canonical team matching is unresolved.

Recommended:

### 3.1 `teams` (optional canonical directory)

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `sport_id` | BIGINT FK | A team belongs to a sport |
| `name` | VARCHAR(180) | Canonical display name |
| `slug` | VARCHAR(180) NULL | |
| `country_id` | BIGINT FK NULL | Team country, not competition country |
| `is_active` | BOOLEAN | |
| `created_at`, `updated_at` | DATETIME | |

### 3.2 `odds_api_teams`

Map a canonical team to an Odds API team ID only when the Odds API supplies a reliable ID. Do not use a name string as a guaranteed identity.

### 3.3 `event_participants`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `event_id` | BIGINT FK | |
| `team_id` | BIGINT FK NULL | Nullable if not confidently matched |
| `participant_name` | VARCHAR(180) | Snapshot of name received |
| `role` | VARCHAR(20) | home, away, competitor, player |
| `odds_api_participant_id` | VARCHAR(150) NULL | Participant ID if supplied by the Odds API |
| `created_at`, `updated_at` | DATETIME | |

Unique: `(event_id, role)` for two-team fixtures, with sport-specific validation for other formats.

**Why keep a participant snapshot?** Team names can change, aliases can differ, and canonical matching can be imperfect. The event and a bet placed on it must retain the names shown at that time. A nullable canonical team link avoids false matches.

---

## 4. Events

An event is a fixture or contest within a competition.

### 4.1 `events`

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

**Indexes:**
- `(competition_id, start_time)`
- `(status, start_time)`
- `(start_time)`

### 4.2 `odds_api_events`

This table stores the Odds API event identifier separately from the internal event record.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Internal mapping ID |
| `event_id` | BIGINT FK | References `events.id` |
| `odds_api_event_id` | VARCHAR(150) UNIQUE | Exact event ID returned by The Odds API |
| `odds_api_sport_key` | VARCHAR(150) | Sport key used in Odds API endpoints |
| `last_seen_at` | DATETIME | Last time this event was returned |
| `raw_metadata` | JSON NULL | Optional source metadata |

**Unique constraint:** `odds_api_event_id`.

**Why:** the internal event is the platform's event. The Odds API event ID is an external reference used to retrieve and synchronize its data; it is not the primary key of `events`.

Keep Odds API event identity in `odds_api_events`. Keep participant names in `event_participants`, rather than making Odds API strings the event's permanent domain structure.

### 4.3 Event synchronization

Odds API endpoint reference:

```http
GET /v4/sports/{sport_key}/events?dateFormat=iso
```

For each returned event:

1. Find the internal competition through `odds_api_competitions`.
2. Find or create `odds_api_events` using `odds_api_event_id`.
3. Create or update the internal event.
4. Upsert participant snapshots.
5. Update the event's Odds API last-seen/sync timestamps.
6. Do not reset an event from completed to scheduled just because an event-list response contains it again. Apply a documented status transition policy.

**Important:** If an Odds API event cannot be mapped to a known competition, log it for review or place it in a controlled unmatched queue. Do not silently create a duplicate sport/competition based on an untrusted title.

---

## 5. Market definitions and Odds API market mappings

Keep three concepts separate:

1. **Market definition:** what a market means in our platform.
2. **Event market availability:** whether a market is currently offered for a particular event by an Odds API/bookmaker.
3. **Odds quote:** the price for one outcome/line.

### 5.1 `market_catalog` — canonical market definitions

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

These are illustrative internal names, not a claim that every Odds API offers every market.

### 5.2 `odds_api_market_mappings`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `sport_id` | BIGINT FK NULL | Optional sport-specific mapping |
| `odds_api_market_key` | VARCHAR(150) | Exact Odds API market key |
| `market_catalog_id` | BIGINT FK NULL | Canonical mapping; NULL means not mapped |
| `odds_api_market_name` | VARCHAR(180) NULL | Name returned by Odds API |
| `mapping_status` | VARCHAR(20) | mapped, review, unsupported |
| `mapping_version` | INT | |
| `created_at`, `updated_at` | DATETIME | |

Unique: `(sport_id, odds_api_market_key)` (handle nullable sport-specific mappings deliberately; MySQL nullable unique columns need care).

Unknown Odds API markets should be recorded as `review` or `unsupported`; do not guess their settlement meaning from their names.

### 5.3 Market catalogue guidance

#### Market groups, meanings, and examples

A category is a navigation/display group. It is not a promise that every market in that category is offered for every sport or every event.

| Group | Meaning | Examples | Typical frontend use |
|---|---|---|---|
| featured | Main, commonly requested markets suitable for the primary match card | h2h, spreads, totals; outright markets where relevant | Compact match card and quick bet panel |
| additional | Other standard markets that add choice beyond the main three | btts, draw_no_bet, h2h_3_way, team_totals, alternate_totals | Expanded market list |
| game_period | Markets limited to a part of a contest | h2h_h1, totals_q1, spreads_h2, h2h_s1, totals_p1 | Half/quarter/period/set tabs |
| sport_specific | Markets whose meaning depends on the sport | corners, cards, innings, sets, player props | Sport-aware market sections |
| player_props | Markets about an individual player's statistical performance | anytime goalscorer, shots on target, assists, player points | Player selection/prop builder |
| outrights | Futures markets on the eventual winner or final position in a competition | Premier League winner, NBA champion, tournament winner | Competition-level futures page |

The exact Odds API keys are stored separately from canonical market keys. For example, Odds API h2h can map to the canonical market match_winner, while an internal label can vary by sport (Match Result for soccer, Match Winner for basketball, Match Winner for tennis). Do not infer a settlement rule from a category or display label.

#### What the main Odds API market keys mean

| Odds API key | Meaning | Example outcomes |
|---|---|---|
| h2h | Head-to-head / winner market for the event | Arsenal, Draw, Chelsea; or Lakers, Celtics |
| spreads | Handicap market; a team/side is assigned a positive or negative line | Arsenal -0.5; Chelsea +0.5 |
| totals | Total-statistic line for the event | Over 2.5 goals; Under 2.5 goals |
| outrights | Future winner/placement market for a competition | Manchester City to win the league |
| h2h_lay | Exchange-style lay version of a head-to-head selection, where supported | Lay Arsenal |
| outrights_lay | Exchange-style lay version of an outright selection, where supported | Lay Manchester City |
| alternate_spreads | Multiple handicap lines rather than one main line | Arsenal -0.5, -1.0, -1.5 |
| alternate_totals | Multiple total lines rather than one main total | Over/Under 1.5, 2.5, 3.5 |
| btts | Both Teams To Score | Yes / No |
| draw_no_bet | A team selection where a draw returns the stake | Arsenal / Chelsea |
| h2h_3_way | Three-outcome head-to-head market | Home / Draw / Away |
| team_totals | Total statistic for one team | Arsenal over 1.5 goals |
| alternate_team_totals | Several team-specific total lines | Arsenal over 0.5 / 1.5 / 2.5 |
| correct_score | Exact final score | 1-0, 1-1, 2-1 |
| double_chance | Covers two of the three 1X2 outcomes | Home or Draw (1X) |
| halftime_fulltime | Combined half-time and full-time result | Home/Home, Draw/Home |
| to_qualify | Which side advances from a tie | Arsenal to qualify |
| player_* | A player-specific proposition | Player to score, player shots, player assists |

**Terms made simple:**
- **Outright:** a bet on a future competition outcome, not the result of one scheduled match. Example: “Arsenal to win the Premier League 2026/2027.”
- **Handicap/spread:** a virtual head start or deficit applied to a team/player. Example: Arsenal -1.0 means Arsenal must win by more than one for a full win; exact settlement depends on the line type and rules.
- **Total:** a bet on whether a combined statistic is above or below a line. Example: Over 2.5 goals wins if at least three goals are scored.
- **Both Teams To Score (BTTS):** whether each team scores at least once.
- **Alternate line:** another available handicap or total line, usually with a different price.
- **Period market:** a market settled using only the specified half, quarter, inning, period or set, not the whole event.
- **Player prop:** a market settled using an individual player's recorded performance.
- **Bookmaker:** the betting operator whose quote is shown. It is not the odds data source; The Odds API aggregates the bookmaker's prices.

#### Sport-specific market applicability

Do not assume that a market key applies to every sport. Use a reviewed sport-market capability matrix and validate actual event availability from The Odds API before presenting a market as selectable.

| Sport | Typical primary markets | Sport-specific examples | Important interpretation |
|---|---|---|---|
| Soccer / Football | h2h, totals, spreads where offered | btts, draw_no_bet, h2h_3_way, corners, cards, correct_score, halftime_fulltime, player goal props | h2h commonly has three outcomes: home, draw, away. |
| Basketball | h2h, spreads, totals | quarter/half markets, team totals, player points/rebounds/assists props when offered | h2h is normally a two-side winner market; draw is not a normal outcome. |
| Tennis | h2h, spreads, totals | set winner, set handicap, set totals, player props where offered | Periods may mean sets, not halves or quarters. |
| Cricket | h2h and outrights where offered | innings-related markets and player/batter/bowler props only when the feed supports them | Do not automatically show soccer BTTS, corners or card markets. Match/tournament formats change settlement meaning. |
| American Football | h2h, spreads, totals | quarter/half markets, team totals, player passing/rushing/receiving props | Period markets are quarters/halves; player props need player-stat settlement data. |
| Baseball | h2h, spreads/run lines, totals where offered | inning markets, batter/pitcher props | A run line is not a soccer goal handicap; model the sport-specific settlement rule. |
| Ice Hockey | h2h, spreads, totals | period markets, team totals, player props where offered | Decide whether the market includes overtime/shootout; the settlement rule must say so. |
| Golf / MMA / Boxing | outrights and/or h2h depending on event | tournament winner, placement, fight winner, method of victory if supplied | Some events are tournament/futures-style rather than ordinary home/away fixtures. |

This table is a product-design starting point, not a guarantee of live availability. Actual availability depends on the sport key, event, bookmaker region, Odds API subscription and market response. Persist a capability such as supported_by_product separately from currently_available_for_event.

Recommended additional table: sport_market_capabilities.

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| sport_id | BIGINT FK | |
| market_catalog_id | BIGINT FK | |
| is_enabled | BOOLEAN | Product decision: show this market family for this sport |
| is_featured | BOOLEAN | Whether it appears in the sport's featured list |
| display_order | INT | |
| applicability_note | VARCHAR(500) NULL | Human-readable qualification |
| validation_status | VARCHAR(20) | reviewed, provisional, disabled |

Unique: (sport_id, market_catalog_id). Keep Odds API key mapping in odds_api_market_mappings. Keep actual event availability in event_markets. These three records answer different questions: is it a known market, should this sport offer it in our product, and is it actually available for this event right now?

#### Example sport-market capability rows

| Sport | Canonical market | Enabled | Featured | Note |
|---|---|---:|---:|---|
| Soccer | Match winner (1X2) | true | true | Home/draw/away where the feed supplies three outcomes |
| Soccer | Both teams to score | true | false | Only show when the event returns this market |
| Soccer | Total corners | true | false | Separate corners statistic and settlement rule |
| Basketball | Match winner | true | true | Usually two team outcomes |
| Basketball | Point spread | true | true | Handicap expressed in points |
| Basketball | Total points | true | true | Combined points |
| Cricket | Match winner | true | true | Verify format and draw/tie handling |
| Cricket | Both teams to score | false | false | Not a generic cricket market |
| Tennis | Match winner | true | true | Competitor A / competitor B |
| Tennis | Set handicap | true | false | Only where supplied and supported by settlement facts |


The market catalogue may organize markets into display groups such as featured, additional, game periods, sport-specific markets, and player props.

Use explicit canonical market keys and settlement-rule references. A professional catalogue should use reviewed human-readable labels, with localized labels stored separately when needed.

---

## 6. Event market availability

Recommended `event_markets` represents the latest known availability of a market for a particular event and bookmaker.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `event_id` | BIGINT FK | Internal event |
| `market_catalog_id` | BIGINT FK NULL | Canonical market, if mapped |
| `odds_api_market_key` | VARCHAR(150) | Exact Odds API market key |
| `bookmaker_key` | VARCHAR(100) NULL | Bookmaker offered by The Odds API |
| `odds_api_market_ref` | VARCHAR(180) NULL | If the Odds API supplies a distinct market ID |
| `is_available` | BOOLEAN | |
| `last_update_at` | DATETIME(3) NULL | Source market update |
| `last_seen_at` | DATETIME(3) | Last confirmed in a successful snapshot |
| `created_at`, `updated_at` | DATETIME | |

A useful unique key is `(event_id, odds_api_market_key, bookmaker_key)`, with a deliberate policy for NULL bookmaker keys.

**Important distinction:** `market_catalog` says what the market is; `event_markets` says it was seen for this event/bookmaker. A market can exist in the catalogue but not be offered on a particular event.

### Odds API endpoint reference

```http
GET /v4/sports/{sport_key}/events/{event_id}/markets?regions=eu&dateFormat=iso
```

Normalize the response's bookmaker and market lists into `event_markets` after validating the Odds API snapshot.

### Safer availability update procedure

Do not mark all markets unavailable before knowing that the Odds API request and response have succeeded and been validated. Recommended sequence:

1. Fetch the complete response.
2. Validate the response and record successful fetch time.
3. Upsert every observed market/bookmaker pair as available.
4. Only after a complete successful snapshot, mark previously known pairs not present in that snapshot as unavailable.
5. If the request fails, preserve the last known availability and record the failed sync.

This avoids a transient API failure making every market appear unavailable.

---

## 7. Odds quotes: latest prices and history

A quote is a price for one outcome/selection of one market on one event, from a bookmaker reported by the Odds API, at a particular time.

Do not confuse:
- **Bookmaker:** the betting operator whose price is being reported (for example, Pinnacle).

### 7.1 `odds_current`

Recommended fields:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `event_id` | BIGINT FK | |
| `event_market_id` | BIGINT FK NULL | Availability record if applicable |
| `market_catalog_id` | BIGINT FK NULL | Canonical market |
| `odds_api_market_key` | VARCHAR(150) | Original Odds API key |
| `bookmaker_key` | VARCHAR(100) | Bookmaker |
| `outcome_key` | VARCHAR(150) NULL | Stable source outcome ID if supplied |
| `outcome_name` | VARCHAR(180) | Display/source outcome name |
| `participant_id` | BIGINT NULL | For player/team props if resolved |
| `line_value` | DECIMAL(10,3) NULL | Handicap/total line |
| `period_key` | VARCHAR(40) NULL | Full time, first half, quarter, set, etc. |
| `description` | VARCHAR(255) NULL | extra selection description returned by the Odds API |
| `source_price` | DECIMAL(12,5) | Raw decimal price |
| `display_price` | DECIMAL(12,5) | Price offered to customer |
| `is_suspended` | BOOLEAN | Not selectable |
| `source_updated_at` | DATETIME(3) NULL | Source's update timestamp |
| `fetched_at` | DATETIME(3) | Our receipt timestamp |
| `created_at`, `updated_at` | DATETIME | |

Define a deterministic quote identity. A candidate natural key is:

```text
(event_id, bookmaker_key, odds_api_market_key,
 outcome identity, line_value, period_key, description)
```

Use a generated stable `selection_identity_hash` if nullable/multi-column identity makes MySQL uniqueness awkward. Build the hash from normalized identity fields—not the price or fetch time. Keep the original fields for inspection.

### 7.2 `odds_history`

Append-only history for each quote identity:

- `id`
- `odds_current_id` or stable quote identity
- `event_id`
- `bookmaker_key`
- `odds_api_market_key`
- `outcome identity`, `line_value`, `period_key`
- `source_price`
- `display_price`
- `is_suspended`
- `source_updated_at`
- `recorded_at`

Index: `(event_id, bookmaker_key, odds_api_market_key, recorded_at)`.

Record history on meaningful quote changes (price, suspension, or other selectable-state changes). If a full audit trail is required, record every snapshot in a separate ingestion table; do not make high-volume odds history unnecessarily huge.

### 7.3 Bookmaker selection policy

A bookmaker selection policy may choose a configured priority bookmaker, the best available price, or another approved rule. Keep this policy separate from quote storage.

Recommended:
- Preserve each bookmaker's quote separately.
- Decide the customer-facing price through a separate, explicit price-selection policy.
- Store which bookmaker quote was used when a bet was placed.
- Do not overwrite one bookmaker's quote with another bookmaker's quote under the same identity.

### 7.4 Odds API endpoint reference

```http
GET /v4/sports/{sport_key}/events/{event_id}/odds
  ?markets={comma_separated_odds_api_market_keys}
  &regions=eu
  &oddsFormat=decimal
  &dateFormat=iso
```

A common integration flow is to discover the markets available for an event and then request prices for those markets. The adapter should follow the Odds API's documented endpoint and quota model.

---

## 8. Results and score facts

A result is not just two numbers. Different markets require different facts:

- Full-time winner and score.
- Half-time score.
- Period/quarter/set scores.
- Total corners and cards.
- Player goals, assists, shots, cards, and other player statistics.
- Abandonment, postponement, walkover, or other exceptional outcomes.

### 8.1 `event_results`

One current result summary per event:

| Column | Type | Notes |
|---|---|---|
| `event_id` | BIGINT PK/FK | |
| `status` | VARCHAR(30) | pending, provisional, final, corrected, abandoned |
| `home_score` | INT NULL | Sport-specific meaning must be documented |
| `away_score` | INT NULL | |
| `is_final` | BOOLEAN | Final according to the source/validated rules |
| `odds_api_event_id` | VARCHAR(150) NULL | |
| `source_updated_at` | DATETIME(3) NULL | |
| `received_at` | DATETIME(3) | |
| `revision` | INT | Increment on accepted correction |
| `created_at`, `updated_at` | DATETIME | |

### 8.2 `event_result_facts`

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
| `source_updated_at` | DATETIME(3) NULL | |
| `received_at` | DATETIME(3) | |

Store validated normalized facts needed by settlement. Preserve source payload separately if useful.

### 8.3 Odds API score endpoint reference

```http
GET /v4/sports/{sport_key}/scores?dateFormat=iso&daysFrom={n}
```

Normalize all available score and statistic fields into result facts. Populate only facts actually supplied and validated by the Odds API; leave unavailable facts unknown.

**Settlement warning:** A full-time score is sufficient for some full-time result and goal-total markets, but not for player props, corners, cards, half-time markets, or every sport-specific market. If the Odds API does not return the facts required by a market's rule, that selection must remain awaiting a valid result or be handled by a documented manual/void process. Never guess.

---

## 9. Bets and immutable selection snapshots

A bet is the customer's ticket. A selection is one leg on that ticket.

### 9.1 `bets`

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

Choose one status vocabulary and use it consistently in model, migrations, services, API responses, and documentation. Choose one status vocabulary and apply it consistently across models, migrations, services, API responses, and documentation. Document the meaning and allowed transitions of every status.

### 9.2 `bet_selections`

Each leg stores what the customer actually selected and accepted.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `bet_id` | CHAR(36) FK | Ticket |
| `event_id` | BIGINT FK | Internal event |
| `market_catalog_id` | BIGINT FK NULL | Canonical market |
| `odds_api_market_key` | VARCHAR(150) NULL | Odds API market key |
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

The selection snapshot must remain meaningful even if the live market catalogue, Odds API mapping, event participants, or odds quote changes later.

**Placement transaction:** validate that the quote is still active and selectable; calculate ticket price/payout; create bet and all selections; debit/lock funds in the wallet ledger; commit all writes in one database transaction. Use row locks/idempotency so a retry cannot create a duplicate ticket or debit twice.

### 9.3 Selection result states

Support only states the product actually implements. For professional settlement, consider:
- pending
- won
- lost
- void
- half_won
- half_lost

A void leg in an accumulator generally has its odds treated as 1.0, but confirm the platform's published rules and calculate from locked ticket terms. Do not assume all bet types use the same payout calculation.

---

## 10. Market settlement rules

Never settle a market using only its display category or a string comparison against an Odds API outcome name.

Create a versioned rules registry, for example `settlement_rule_key` on `market_catalog`:

| Canonical market | Example rule key | Required facts |
|---|---|---|
| Full-time 1X2 | `football_1x2_ft_v1` | Final home/away score |
| Full-time total goals | `football_total_goals_ft_v1` | Final total score + line |
| Both teams to score | `football_btts_ft_v1` | Final home and away scores |
| First-half result | `football_1x2_h1_v1` | Half-time score |
| Total corners | `football_total_corners_ft_v1` | Validated corner total |
| Anytime goalscorer | `football_player_goal_v1` | Player goal fact and participant identity |

These are examples of rule identifiers and required facts. The Odds API adapter must establish which facts its endpoints supply and their reliability before a market is enabled for settlement.

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

Use deterministic, unit-tested pure functions for rule evaluation. Keep Odds API parsing separate from market evaluation.

---

## 11. Settlement records, idempotency, and audit

### 11.1 `selection_settlements`

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

### 11.2 `bet_settlements`

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

### 11.3 `settlement_runs`

Track each worker/manual settlement run:

- `id`
- `event_id` nullable
- `started_at`
- `finished_at`
- `status` (running, succeeded, partial, failed)
- `records_checked`
- `records_settled`
- `error_summary`

### 11.4 Safe settlement sequence

1. A result sync receives a score/stat update.
2. Validate and normalize the result; increment its revision if a correction is accepted.
3. Find pending selections for the event.
4. Resolve each selection's canonical market and versioned settlement rule.
5. Check that every required result fact exists and is final/valid.
6. Evaluate each selection with a deterministic rule function.
7. In one DB transaction, lock affected selections and tickets; write settlement decisions; update selection states; calculate ticket outcome; write ticket settlement.
8. Credit/refund the wallet through the wallet ledger service, using a unique idempotency key linked to the settlement.
9. Commit; record the settlement run and audit data.
10. If any step fails, roll back the financial transaction and retry safely.

Do not mark a bet paid merely because `event_results.is_final = true`. Finality is an input to settlement, not the settlement itself.

### 11.5 Corrections and resettlement

Sports results can be corrected. Define a policy before launch:
- Do not silently overwrite settlement evidence.
- Preserve prior settlement decisions.
- Store the new result revision and the reason/source.
- Determine whether the platform rules permit resettlement.
- If a financial adjustment is needed, write a compensating wallet ledger transaction; never edit or delete the original ledger entry.
- Require controlled admin review for exceptional/manual corrections.

---

## 12. Odds API endpoint reference

The following endpoints document the Odds API contract and its request parameters.

| Data/model | Odds API endpoint | How the endpoint contributes |
|---|---|---|
| Odds API sport and competition catalogue | `GET /v4/sports` | `syncSports()`; discover Odds API keys and metadata |
| Events | `GET /v4/sports/{sport_key}/events` | `syncEvents()`; retrieve fixtures for an Odds API sport key |
| Event market availability | `GET /v4/sports/{sport_key}/events/{event_id}/markets` | `discoverEventMarkets()`; identify offered market/bookmaker pairs |
| Event odds | `GET /v4/sports/{sport_key}/events/{event_id}/odds` | `syncOddsForEvent()`; retrieve prices for discovered market keys |
| Scores | `GET /v4/sports/{sport_key}/scores` | `syncScores()`; retrieve score/completion data |

Depending on the request, parameters can include `regions`, `oddsFormat`, `dateFormat`, `markets`, and `daysFrom`. Validate supported parameters against the Odds API's documentation.

The Odds API supplies sports data, prices, and results according to its API contract. Customer bet settlement remains an internal platform responsibility based on validated result facts and the platform's published rules.

---

## 13. Sequelize model layout

A possible Sequelize model file organization:

```text
Models/
  Sport.js
  Country.js
  Competition.js
  CompetitionSeason.js
  OddsApiCompetition.js
  OddsApiEvent.js
  Team.js
  OddsApiTeam.js
  Event.js
  EventParticipant.js
  MarketCatalog.js
  OddsApiMarketMapping.js
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

## 14. Odds API adapter and synchronization service design

Keep Odds API HTTP requests and response parsing outside betting domain services.

For operational support, use an `odds_api_sync_records` table to retain controlled synchronization evidence:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `resource_type` | VARCHAR(40) | sports, events, markets, odds, scores |
| `external_id` | VARCHAR(150) NULL | Related Odds API identifier, when available |
| `request_key` | VARCHAR(255) NULL | Safe request fingerprint; never store API secrets |
| `response_payload` | JSON NULL | Sanitized response payload, subject to retention policy |
| `received_at` | DATETIME(3) | |
| `http_status` | SMALLINT NULL | |
| `processing_status` | VARCHAR(30) | received, processed, failed |
| `error_message` | TEXT NULL | Sanitized error details |

Do not store API keys, authorization headers, or secrets in this table. Apply a retention policy and avoid storing unnecessary personal data.

Suggested structure:

```text
Services/
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

The adapter translates the Odds API's response into internal DTOs, for example:

```js
// Internal event DTO; values are mapped from the Odds API response.
{
    oddsApiEventId: 'odds-api-event-id',
  oddsApiSportKey: 'soccer_epl',
  startTime: '2026-08-15T14:00:00.000Z',
  participants: [
    { role: 'home', name: 'Arsenal' },
    { role: 'away', name: 'Chelsea' }
  ]
}
```

The DTO is the normalized internal shape; it is not a literal Odds API response.

The Odds API adapter should:
- Make Odds API HTTP requests and handle its parameters.
- Validate required response fields.
- Normalize timestamps to UTC.
- Preserve original Odds API IDs and keys.
- Map Odds API markets/outcomes only through reviewed mappings.
- Return internal DTOs or a typed unsupported/unmapped result.
- Never decide whether a customer bet wins or loses.

The domain sync service should:
- Upsert internal records and Odds API mappings.
- Apply transactional snapshot rules.
- Track sync status and errors.
- Pass normalized internal data to betting-domain services.

---

## 15. Implementation and rollout plan

Do this in stages. Do not replace tables in one deployment.

### Phase 0 — safeguards

1. Back up the database.
2. Use explicit Sequelize migrations for production schema changes.
3. Record baseline row counts and unique keys.
4. Add tests for Odds API synchronization, bet placement, and settlement before changing relationships.

### Phase 1 — sports and competitions

1. Create `countries`, `competitions`, `competition_seasons`, and `odds_api_competitions`.
2. Create canonical sport rows (Football, Basketball, Tennis, etc.).
3. Create an Odds API competition mapping for each sport key, using reviewed competition metadata.
4. Preserve the original Odds API key exactly in `odds_api_competitions.odds_api_sport_key`.
5. Add `competition_id` to events and backfill it using the Odds API mapping.
6. Keep any transitional compatibility columns only for the duration of the migration.
7. Update event sync to write the new relationship.
8. Verify counts and sample fixtures before switching application reads.
9. Remove transitional columns only after application reads and writes have migrated and rollback is no longer required.

### Phase 2 — events and participants

1. Add `odds_api_events`.
2. Populate `odds_api_events` with the Odds API event IDs associated with internal events.
3. Add `event_participants` and backfill home/away name snapshots.
4. Update event sync to upsert using Odds API event identity.
5. Add canonical teams only when matching is reliable.

### Phase 3 — markets and odds

1. Store the Odds API market key on event-market and odds quote records.
2. Create canonical market definitions and Odds API market mappings.
3. Map known Odds API market keys using reviewed rules.
4. Mark unknown keys for review rather than guessing.
5. Preserve odds history when migrating quote identities.
6. Change quote unique keys to include the bookmaker and complete selection identity.
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

Remove temporary compatibility columns and paths only after production reads/writes no longer depend on them.

---

## 16. Indexes, constraints, and data integrity

At minimum:

- Unique `sports.slug` and `sports.code`.
- Unique `competitions.slug`.
- Index `competitions(sport_id, country_id, is_active, sort_order)`.
- Unique `odds_api_competitions(odds_api_sport_key)`. 
- Unique `odds_api_events(odds_api_event_id)`. 
- Index `events(competition_id, start_time)` and `events(status, start_time)`.
- Unique `odds_api_market_mappings(sport_id, odds_api_market_key)`. 
- Unique event-market identity including bookmaker.
- Unique odds quote identity including bookmaker, market and selection identity.
- Index `odds_current(event_id, market_catalog_id, is_suspended)`.
- Index `odds_history(event_id, recorded_at)`. 
- Index `bet_selections(event_id, selection_status)`.
- Index `bets(user_id, placed_at)` and `bets(status, placed_at)`.
- Unique settlement idempotency key for each payout.
- Foreign keys for internal relationships; choose deletion policies deliberately.

Use DECIMAL for money and odds, never floating point. Store timestamps in UTC. Define nullability and uniqueness deliberately, especially for line values and descriptions.

---

## 17. Operational and security requirements

- API keys and secrets belong in environment/secret management, never in source control or raw logs.
- Record endpoint, response status, duration, quota/usage headers where available, record counts, and errors.
- Use bounded retries with backoff for transient Odds API errors; do not retry permanent validation errors forever.
- Use request timeouts and concurrency limits.
- Make each sync idempotent.
- Distinguish a successful empty snapshot from a failed or malformed response.
- Do not mark all odds unavailable on a failed request.
- Use database transactions for bet placement and settlement.
- Lock relevant rows when changing wallet balances or settling a ticket.
- Use immutable financial ledger entries and compensating entries for corrections.
- Add unit tests for market mappings, result normalization, and each settlement rule.
- Add integration tests using recorded/sanitized Odds API fixtures.
- Monitor stale odds, stale events, unmapped markets, missing result facts, and failed settlement runs.

---

## 18. Implementation order

Implement the architecture in this order:

1. **Sports and competitions:** establish internal sport IDs and map Odds API sport keys to competitions.
2. **Events and participants:** make events normalized around internal IDs while retaining Odds API IDs and names.
3. **Market catalogue and Odds API mappings:** canonical market identity, display category, and explicit rule key.
4. **Event-market availability:** accurately track what is offered per event/Odds API/bookmaker.
5. **Odds latest prices/history:** preserve quote identity and Odds API market keys; select customer prices through a separate policy.
6. **Results:** normalize the facts required by the markets the platform actually offers.
7. **Bet placement snapshots:** preserve all terms the customer accepted.
8. **Settlement rules and records:** deterministic, versioned, auditable and idempotent.
9. **Wallet integration:** pay/refund through the immutable ledger in the same controlled transaction.

Do not build every sport and every market at once. Start with one supported sport (for example football), a small reviewed set of markets, and only the result facts needed to settle those markets correctly. Expand after tests and operational monitoring are in place.

---

## 19. Decisions to confirm before implementation

These product and engineering decisions should be confirmed before implementation:

1. Which sports and competitions should be enabled initially?
2. Which country/competition ordering should the frontend use?
3. Which bookmaker quote policy should determine the customer price: priority bookmaker, best available price, or a configured source?
4. Which markets are supported at launch, and what are their official settlement rules?
5. What is the policy for abandoned, postponed, corrected, and manually reviewed events?
6. Which bet types are supported: singles only initially, or accumulators as well?
7. What is the accepted policy for result corrections after a ticket has been paid?

**Architecture principle:** use stable internal IDs for sports, competitions, events, and markets; retain Odds API identifiers in clearly named mapping tables and columns; and normalize Odds API data before it is used by betting and settlement logic.



## 20. Odds API ingestion examples and frontend API contract

This section connects the source payloads to the internal records and defines the JSON contract the frontend should consume. The frontend should call our backend only; it should never need the Odds API key, upstream URL, or raw provider-specific payload structure.

### 20.1 Odds API endpoint: sports discovery

~~~http
GET /v4/sports
GET /v4/sports?all=true
~~~

Representative response item:

~~~json
{
  "key": "soccer_epl",
  "group": "Soccer",
  "title": "EPL",
  "description": "English Premier League",
  "active": true,
  "has_outrights": false
}
~~~

Maps to:
- sports: Soccer.
- competitions: Premier League.
- odds_api_competitions: exact key soccer_epl, source title/group/status and last_synced_at.
- countries: resolved by backend classification, not by this response.
- competition_seasons: created from the maintained season calendar, not from this response.

### 20.2 Odds API endpoint: event list

~~~http
GET /v4/sports/{sport_key}/events?dateFormat=iso
~~~

Representative response:

~~~json
[
  {
    "id": "a512a48a58c4329048174217b2cc7ce0",
    "sport_key": "soccer_epl",
    "sport_title": "EPL",
    "commence_time": "2026-11-08T16:30:00Z",
    "home_team": "Arsenal",
    "away_team": "Chelsea"
  }
]
~~~

Maps to:
- odds_api_events: source event ID and source sport key.
- events: internal event ID, competition_id, optional season_id, start_time and status.
- event_participants: home and away participant-name snapshots; optionally link to canonical teams.
- Do not assume the payload contains a season ID, country, venue or canonical team ID.

### 20.3 Odds API endpoint: event market discovery

~~~http
GET /v4/sports/{sport_key}/events/{event_id}/markets?regions=eu&dateFormat=iso
~~~

This endpoint is used to discover which market keys are offered for the requested event and region. The normalized result should be treated as an availability snapshot, not as prices. The response structure identifies bookmaker/market availability; preserve the exact returned bookmaker key, market key and source update time where supplied.

Representative normalized data after ingestion:

~~~json
{
  "eventId": 501,
  "markets": [
    {
      "marketKey": "h2h",
      "bookmakerKey": "pinnacle",
      "isAvailable": true,
      "lastUpdateAt": "2026-11-02T10:15:00Z"
    },
    {
      "marketKey": "totals",
      "bookmakerKey": "pinnacle",
      "isAvailable": true,
      "lastUpdateAt": "2026-11-02T10:15:00Z"
    }
  ]
}
~~~

Maps to event_markets. Do not create odds_current rows from a discovery-only response because it does not provide outcome prices.

### 20.4 Odds API endpoint: event odds

~~~http
GET /v4/sports/{sport_key}/events/{event_id}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&dateFormat=iso
~~~

Representative response:

~~~json
{
  "id": "a512a48a58c4329048174217b2cc7ce0",
  "sport_key": "soccer_epl",
  "sport_title": "EPL",
  "commence_time": "2026-11-08T16:30:00Z",
  "home_team": "Arsenal",
  "away_team": "Chelsea",
  "bookmakers": [
    {
      "key": "pinnacle",
      "title": "Pinnacle",
      "last_update": "2026-11-02T10:15:00Z",
      "markets": [
        {
          "key": "h2h",
          "last_update": "2026-11-02T10:15:00Z",
          "outcomes": [
            { "name": "Arsenal", "price": 2.10 },
            { "name": "Draw", "price": 3.30 },
            { "name": "Chelsea", "price": 3.60 }
          ]
        },
        {
          "key": "totals",
          "last_update": "2026-11-02T10:15:00Z",
          "outcomes": [
            { "name": "Over", "point": 2.5, "price": 1.90 },
            { "name": "Under", "point": 2.5, "price": 1.95 }
          ]
        }
      ]
    }
  ]
}
~~~

Maps to:
- event_markets: event + bookmaker + market.
- odds_current: one row per bookmaker + market + outcome + line identity.
- odds_history: append a history row when the quote or selectable state changes.
- bookmaker identity is the bookmaker key (Pinnacle in this example); The Odds API is the data source.

Never use a quote's price as part of its unique identity. If the price changes from 2.10 to 2.05, update the same current quote and append a history record.

### 20.5 Odds API endpoint: sport-level bulk odds

~~~http
GET /v4/sports/{sport_key}/odds?regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso
~~~

This returns event odds for a sport/competition in one response. It is useful for a compact list feed when the selected market combination is supported by the endpoint and the account's product. The backend should still normalize each event, bookmaker, market and outcome into the same internal tables used by event-specific odds. Do not create a separate frontend data model for bulk odds.

### 20.6 Odds API endpoint: scores

~~~http
GET /v4/sports/{sport_key}/scores?daysFrom=1&dateFormat=iso
~~~

Representative response:

~~~json
[
  {
    "id": "a512a48a58c4329048174217b2cc7ce0",
    "sport_key": "soccer_epl",
    "sport_title": "EPL",
    "commence_time": "2026-11-08T16:30:00Z",
    "completed": false,
    "home_team": "Arsenal",
    "away_team": "Chelsea",
    "scores": [
      { "name": "Arsenal", "score": "1" },
      { "name": "Chelsea", "score": "0" }
    ],
    "last_update": "2026-11-08T17:20:00Z"
  }
]
~~~

Maps to event_results for the current score/final state and event_result_facts for additional sport-specific facts. Match the source event ID through odds_api_events; do not match events by team names alone when a source event ID is available. Scores may be absent while a match has not started. A final score is not enough to settle every market (for example, corners, cards, player props or period markets require their own facts).

### 20.7 Endpoint availability and quota behavior

| Upstream endpoint | Purpose | Typical use in backend |
|---|---|---|
| GET /v4/sports | Discover sport groups and competitions | Scheduled catalogue sync; cache locally |
| GET /v4/sports?all=true | Include inactive/out-of-season competitions | Less frequent full catalogue sync |
| GET /v4/sports/{sport_key}/events | Event IDs and fixture participants | Scheduled event sync |
| GET /v4/sports/{sport_key}/events/{event_id}/markets | Event market availability | Discover before requesting selected event markets |
| GET /v4/sports/{sport_key}/events/{event_id}/odds | Odds for one event and selected markets | Event detail/market refresh |
| GET /v4/sports/{sport_key}/odds | Bulk event odds for selected markets | List feed where supported |
| GET /v4/sports/{sport_key}/scores | Live and recent scores | Score polling and result ingestion |

Sports discovery and event-list calls are used to build/cache catalogue data. Odds and score calls consume quota according to the Odds API plan, regions, markets and endpoint rules. Cache and schedule requests; do not call upstream once per frontend render. Store usage headers/logs and handle quota exhaustion without deleting the last successful data.

Do not make the platform depend on a generic participant-directory endpoint unless that endpoint is explicitly available in the subscribed Odds API product. The event response's home_team and away_team values are sufficient to create event_participants snapshots. Canonical team directories can be built incrementally from those snapshots and reviewed matching.

### 20.8 Frontend API design principles

All frontend endpoints below are recommended application endpoints. They are served from our database/cache and normalized services, not forwarded directly to The Odds API.

Use one consistent envelope:

~~~json
{
  "success": true,
  "data": [],
  "meta": {
    "count": 0,
    "page": 1,
    "limit": 20,
    "generatedAt": "2026-11-02T10:20:00Z"
  }
}
~~~

For a single resource, data is an object. For a collection, data is an array. Use stable internal IDs in frontend routes; include Odds API keys as read-only source metadata only when the frontend genuinely needs them. Never expose the Odds API secret.

### 20.9 Frontend sports and competition endpoints

#### GET /api/sports

Purpose: list normalized sport families and/or competitions. Support query parameters such as include=competitions and enabled=true.

Example response:

~~~json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Soccer",
      "slug": "soccer",
      "displayName": "Football",
      "competitionCount": 18,
      "isActive": true
    },
    {
      "id": 2,
      "name": "Basketball",
      "slug": "basketball",
      "displayName": "Basketball",
      "competitionCount": 6,
      "isActive": true
    }
  ],
  "meta": { "count": 2, "generatedAt": "2026-11-02T10:20:00Z" }
}
~~~

#### GET /api/sports/types

Purpose: return distinct sport families for navigation. This is a normalized view of sports, not a list of league keys.

~~~json
{
  "success": true,
  "data": [
    { "key": "soccer", "name": "Soccer", "displayName": "Football", "competitionCount": 18 },
    { "key": "basketball", "name": "Basketball", "competitionCount": 6 },
    { "key": "cricket", "name": "Cricket", "competitionCount": 3 }
  ],
  "meta": { "count": 3 }
}
~~~

#### GET /api/sports/top-leagues

Purpose: return manually curated featured competitions. Store is_featured and sort_order on competitions (or a dedicated featured_competitions table); do not rely on array position or hardcoded controller logic.

~~~json
{
  "success": true,
  "data": [
    {
      "competitionId": 7,
      "sport": { "key": "soccer", "name": "Soccer" },
      "name": "Premier League",
      "slug": "premier-league",
      "country": { "code": "GB", "name": "England" },
      "oddsApiSportKey": "soccer_epl",
      "hasOutrights": false
    }
  ],
  "meta": { "count": 1 }
}
~~~

#### GET /api/sports/:sportType/countries

Purpose: return countries/regions that have competitions in the requested sport family. Countries are generated from our competition classifications.

~~~json
{
  "success": true,
  "sportType": "soccer",
  "data": [
    {
      "code": "GB",
      "name": "England",
      "scope": "domestic",
      "competitionCount": 3
    },
    {
      "code": "ES",
      "name": "Spain",
      "scope": "domestic",
      "competitionCount": 2
    },
    {
      "code": "INT-UEFA",
      "name": "International — UEFA",
      "scope": "continental",
      "competitionCount": 3
    }
  ],
  "meta": { "count": 3 }
}
~~~

For international groups, use a region identifier such as INT-UEFA; do not pretend it is an ISO country code.

#### GET /api/sports/:sportType/countries/:countryCode/competitions

Purpose: list competitions for one sport family and country/region.

~~~json
{
  "success": true,
  "sportType": "soccer",
  "countryCode": "GB",
  "data": [
    {
      "id": 7,
      "name": "Premier League",
      "slug": "premier-league",
      "description": "English Premier League",
      "isActive": true,
      "isEnabled": true,
      "hasOutrights": false,
      "currentSeason": {
        "id": 32,
        "name": "2026/2027"
      }
    }
  ],
  "meta": { "count": 1 }
}
~~~

#### GET /api/competitions/:competitionId

Purpose: competition detail, including sport, country/region and source mapping.

~~~json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Premier League",
    "sport": { "id": 1, "name": "Soccer", "slug": "soccer" },
    "country": { "id": 44, "iso2": "GB", "name": "England" },
    "scope": "domestic",
    "oddsApi": {
      "sportKey": "soccer_epl",
      "active": true,
      "hasOutrights": false
    }
  }
}
~~~

#### GET /api/competitions/:competitionId/seasons

Purpose: show available season editions, including current and historical seasons.

~~~json
{
  "success": true,
  "data": [
    {
      "id": 31,
      "name": "2025/2026",
      "startDate": "2025-08-01",
      "endDate": "2026-05-31",
      "isCurrent": false
    },
    {
      "id": 32,
      "name": "2026/2027",
      "startDate": "2026-08-01",
      "endDate": "2027-05-31",
      "isCurrent": true
    }
  ],
  "meta": { "count": 2 }
}
~~~

### 20.10 Frontend market endpoints

#### GET /api/markets/categories

Purpose: return display groups in a stable order, with a label and description.

~~~json
{
  "success": true,
  "data": [
    { "key": "featured", "name": "Featured", "description": "Main markets for quick access", "sortOrder": 1 },
    { "key": "additional", "name": "Additional", "description": "More standard markets", "sortOrder": 2 },
    { "key": "game_period", "name": "Game Periods", "description": "Markets for halves, quarters, periods or sets", "sortOrder": 3 },
    { "key": "player_props", "name": "Player Props", "description": "Markets based on individual player performance", "sortOrder": 4 }
  ]
}
~~~

#### GET /api/markets/catalog?sportType=soccer

Purpose: return canonical market definitions filtered by sport capability, with exact source keys and explanatory descriptions.

~~~json
{
  "success": true,
  "sportType": "soccer",
  "data": [
    {
      "marketKey": "match_winner_1x2",
      "oddsApiMarketKey": "h2h",
      "name": "Match Result",
      "category": "featured",
      "description": "Predict the home win, draw or away win.",
      "outcomesExample": ["Home", "Draw", "Away"],
      "isEnabledForSport": true,
      "isFeatured": true
    },
    {
      "marketKey": "both_teams_to_score",
      "oddsApiMarketKey": "btts",
      "name": "Both Teams To Score",
      "category": "additional",
      "description": "Predict whether both teams will score at least one goal.",
      "outcomesExample": ["Yes", "No"],
      "isEnabledForSport": true,
      "isFeatured": false
    }
  ],
  "meta": { "count": 2 }
}
~~~

#### GET /api/sports/:sportType/market-capabilities

Purpose: tell the frontend which market groups can be offered for the selected sport. This is product capability, not current event availability.

~~~json
{
  "success": true,
  "sportType": "cricket",
  "data": [
    { "marketKey": "match_winner", "isEnabled": true, "isFeatured": true },
    { "marketKey": "outright_winner", "isEnabled": true, "isFeatured": false },
    { "marketKey": "both_teams_to_score", "isEnabled": false, "isFeatured": false }
  ]
}
~~~

### 20.11 Frontend event and odds endpoints

#### GET /api/events

Purpose: searchable, filterable event list across sports. Support filters such as sportType, competitionId, seasonId, countryCode, status, from, to, and page.

~~~http
GET /api/events?sportType=soccer&competitionId=7&status=scheduled&from=2026-11-02T00:00:00Z&to=2026-11-09T00:00:00Z
~~~

Example response:

~~~json
{
  "success": true,
  "data": [
    {
      "id": 501,
      "competition": { "id": 7, "name": "Premier League" },
      "season": { "id": 32, "name": "2026/2027" },
      "startTime": "2026-11-08T16:30:00Z",
      "status": "scheduled",
      "participants": [
        { "role": "home", "name": "Arsenal" },
        { "role": "away", "name": "Chelsea" }
      ],
      "hasMarkets": true
    }
  ],
  "meta": { "count": 1, "page": 1, "limit": 20 }
}
~~~

#### GET /api/events/upcoming

Purpose: homepage upcoming feed. Support limit and optional sportType filters. Order by startTime ascending.

#### GET /api/events/live

Purpose: live event feed, ordered by start time/status update. Return score summary when available.

#### GET /api/events/:eventId

Purpose: event detail with competition, season, participants and status.

~~~json
{
  "success": true,
  "data": {
    "id": 501,
    "competition": { "id": 7, "name": "Premier League" },
    "season": { "id": 32, "name": "2026/2027" },
    "startTime": "2026-11-08T16:30:00Z",
    "status": "scheduled",
    "participants": [
      { "role": "home", "name": "Arsenal" },
      { "role": "away", "name": "Chelsea" }
    ]
  }
}
~~~

#### GET /api/events/:eventId/markets

Purpose: return only markets currently available for this event, optionally grouped by bookmaker or canonical category. It must combine event_markets with the canonical market catalogue and sport capability settings.

~~~json
{
  "success": true,
  "eventId": 501,
  "data": [
    {
      "marketKey": "match_winner_1x2",
      "oddsApiMarketKey": "h2h",
      "name": "Match Result",
      "category": "featured",
      "bookmakers": ["pinnacle", "bet365"]
    },
    {
      "marketKey": "match_total_goals",
      "oddsApiMarketKey": "totals",
      "name": "Total Goals",
      "category": "featured",
      "bookmakers": ["pinnacle"]
    }
  ],
  "meta": { "count": 2, "asOf": "2026-11-02T10:15:00Z" }
}
~~~

#### GET /api/events/:eventId/odds?marketKey=match_winner_1x2

Purpose: return current selectable prices for one event. Use canonical market keys in frontend filters; source keys remain backend integration details.

~~~json
{
  "success": true,
  "eventId": 501,
  "data": [
    {
      "marketKey": "match_winner_1x2",
      "name": "Match Result",
      "outcomes": [
        { "selectionKey": "home", "name": "Arsenal", "price": 2.10, "line": null },
        { "selectionKey": "draw", "name": "Draw", "price": 3.30, "line": null },
        { "selectionKey": "away", "name": "Chelsea", "price": 3.60, "line": null }
      ],
      "updatedAt": "2026-11-02T10:15:00Z"
    }
  ]
}
~~~

For totals, the same response would contain Over and Under outcomes with line 2.5. Include bookmaker information if the product displays bookmaker choice; otherwise return the selected customer-facing price and retain the source bookmaker internally.

#### GET /api/events/:eventId/results

Purpose: return score and result facts with a clear finality flag.

~~~json
{
  "success": true,
  "eventId": 501,
  "data": {
    "isFinal": false,
    "homeScore": 1,
    "awayScore": 0,
    "facts": [
      { "factType": "full_time_score", "participant": "Arsenal", "value": 1 },
      { "factType": "full_time_score", "participant": "Chelsea", "value": 0 }
    ],
    "lastUpdatedAt": "2026-11-08T17:20:00Z"
  }
}
~~~

### 20.12 How the models work together: complete examples

#### Example A — Create the sport and competition

Odds API returns:

~~~json
{
  "key": "soccer_epl",
  "group": "Soccer",
  "title": "EPL",
  "active": true,
  "has_outrights": false
}
~~~

Internal records:

~~~json
{
  "sports": {
    "id": 1,
    "name": "Soccer",
    "slug": "soccer"
  },
  "countries": {
    "id": 44,
    "name": "England",
    "iso2": "GB"
  },
  "competitions": {
    "id": 7,
    "sport_id": 1,
    "country_id": 44,
    "name": "Premier League",
    "scope": "domestic",
    "country_resolution_method": "manual",
    "classification_status": "confirmed"
  },
  "odds_api_competitions": {
    "competition_id": 7,
    "odds_api_sport_key": "soccer_epl",
    "odds_api_group": "Soccer",
    "odds_api_title": "EPL",
    "odds_api_active": true
  }
}
~~~

#### Example B — Add a season and assign an event

~~~json
{
  "competition_seasons": {
    "id": 32,
    "competition_id": 7,
    "name": "2026/2027",
    "start_date": "2026-08-01",
    "end_date": "2027-05-31",
    "is_current": true,
    "odds_api_season_ref": null
  },
  "events": {
    "id": 501,
    "competition_id": 7,
    "season_id": 32,
    "start_time": "2026-11-08T16:30:00Z",
    "status": "scheduled"
  },
  "odds_api_events": {
    "event_id": 501,
    "odds_api_event_id": "a512a48a58c4329048174217b2cc7ce0",
    "odds_api_sport_key": "soccer_epl"
  },
  "event_participants": [
    { "event_id": 501, "participant_name": "Arsenal", "role": "home" },
    { "event_id": 501, "participant_name": "Chelsea", "role": "away" }
  ]
}
~~~

#### Example C — Catalogue, availability and quotes are three different records

For Arsenal vs Chelsea:
- market_catalog says match_winner_1x2 means Match Result and uses a defined settlement rule.
- odds_api_market_mappings maps that canonical market to Odds API key h2h for Soccer.
- sport_market_capabilities says Match Result is enabled and featured for Soccer.
- event_markets says h2h is currently available from Pinnacle for event 501.
- odds_current stores Arsenal 2.10, Draw 3.30 and Chelsea 3.60 as three distinct outcome quotes.
- odds_history stores later price changes without overwriting the historical record.

This separation lets the frontend display only markets that are both allowed for the sport and available for the event.

#### Example D — Outright competition market

An outright is not an event such as Arsenal vs Chelsea. It is a future selection about the competition winner.

Example customer selection:
- Competition: Premier League 2026/2027.
- Market: Outright Winner.
- Selection: Arsenal.
- Price at placement: 5.50.

Store the competition/season reference on the outright market context, preserve the Odds API market and bookmaker quote, and snapshot the exact selection and price in the bet selection. Do not force an outright into a normal two-participant event with a fake home and away team. The settlement rule should evaluate the final competition winner after the season is officially decided.

### 20.13 Model-to-endpoint responsibility map

| Model | Populated from | Used by frontend |
|---|---|---|
| sports | Normalized group values from GET /v4/sports | /api/sports, /api/sports/types |
| countries | Curated country reference and competition classification rules | /api/sports/:sportType/countries |
| competitions | Each sport item returned by GET /v4/sports | top-leagues, country competitions, competition detail |
| competition_seasons | Maintained competition season calendar | /api/competitions/:id/seasons |
| odds_api_competitions | Exact key/group/title/active/has_outrights from sports response | Usually backend-only metadata |
| teams | Incrementally canonicalized participant snapshots | Event detail and team pages |
| odds_api_teams | Only reliable source participant IDs when available | Backend-only identity mapping |
| event_participants | home_team and away_team from event payload | /api/events/:id |
| events | Event list plus internal competition/season mapping | /api/events, /api/events/:id |
| odds_api_events | id and sport_key from event payload | Backend-only source mapping |
| market_catalog | Reviewed internal market definitions | /api/markets/catalog |
| odds_api_market_mappings | Reviewed mapping from canonical market to exact Odds API market key | Backend-only source mapping |
| sport_market_capabilities | Product configuration reviewed per sport | /api/sports/:sportType/market-capabilities |
| event_markets | Event market discovery response | /api/events/:id/markets |
| odds_current | Event odds response | /api/events/:id/odds |
| odds_history | Changes in current odds quotes | Admin, audit and price-history views |
| event_results | Scores endpoint | /api/events/:id/results |
| event_result_facts | Score and sport-specific statistical facts | Result detail and settlement |
| bets and bet_selections | Authenticated customer placement request and locked quote snapshot | Bet slip/history |
| settlement_rules and settlement records | Versioned business rules applied to verified result facts | Bet status/history and audit |

### 20.14 Frontend API implementation requirements

1. Use internal numeric IDs for database relationships and public routes. Keep Odds API IDs/keys in source mapping tables.
2. Use canonical market keys in frontend requests. Translate to Odds API keys only inside the backend adapter.
3. Return a consistent response envelope, consistent date format (UTC ISO 8601), and predictable error shape.
4. Add pagination to event and history lists; do not return an unbounded season's events in one response.
5. Filter event markets by both sport capability and current event availability.
6. Return current odds from the database/cache. Do not make an upstream request for every frontend request.
7. Include quote updatedAt/asOf timestamps so the UI can indicate stale prices.
8. Validate a price again at bet placement and persist the accepted price, market, line, bookmaker and participant context as an immutable snapshot.
9. Treat unavailable, suspended, stale and unmapped markets as non-selectable.
10. Keep country/season classification reviewable by administrators. An unknown classification must not silently appear under a guessed country.

