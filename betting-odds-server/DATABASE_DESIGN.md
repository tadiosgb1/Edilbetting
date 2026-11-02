# Edilbetting — Complete Database Design
> Version 2.0 | MySQL / Sequelize ORM
> Single source of truth for every table. Read before touching any model file.

---

## Table of Contents

1. [Architecture & Key Decisions](#1-architecture--key-decisions)
2. [Domain Map](#2-domain-map)
3. [Core Identity & Auth](#3-core-identity--auth)
   - users
   - user_preferences  *(timezone & odds_format live here only)*
   - user_sessions
   - kyc_documents
4. [Platform Staff](#4-platform-staff)
   - platform_staff
5. [Agents](#5-agents)
   - agents  *(profile only)*
   - agent_accounts  *(CBE / Awash / Telebirr … bank accounts)*
   - agent_account_managers  *(who manages which accounts — the hierarchy)*
   - agent_employees  *(cashiers / operators with shift schedules)*
6. [Player Profiles](#6-player-profiles)
   - player_profiles
7. [Wallets & Transactions](#7-wallets--transactions)
   - wallets
   - wallet_transactions
8. [Deposit & Withdrawal Workflow](#8-deposit--withdrawal-workflow)
   - agent_account_assignments  *(fair-routing algorithm output)*
   - payment_proofs
9. [Agent Assignment Algorithm](#9-agent-assignment-algorithm)
10. [Commission & Payout System](#10-commission--payout-system)
    - agent_commission_log
    - agent_payout_requests
11. [Betting Core](#11-betting-core)
    - sports, events, market_catalog
    - odds_current, odds_history, results
    - bets, bet_selections
12. [Odds API Sync & Analytics](#12-odds-api-sync--analytics)
    - api_usage_log
    - sync_run_log
13. [Promotions & Bonuses](#13-promotions--bonuses)
    - promotions
    - player_promotions
14. [Notifications & Messaging](#14-notifications--messaging)
    - notification_templates
    - notifications
    - email_queue
15. [Platform Configuration](#15-platform-configuration)
    - platform_config
16. [Audit & Compliance](#16-audit--compliance)
    - audit_log
17. [Entity Relationship Summary](#17-entity-relationship-summary)
18. [Index Strategy](#18-index-strategy)
19. [New Models Checklist](#19-new-models-checklist)

---

## 1. Architecture & Key Decisions

```
┌──────────────────────────────────────────────────────────────────────┐
│                        EDILBETTING PLATFORM                          │
│                                                                      │
│  Player  │  Agent  │  Agent Employee  │  Platform Staff  │  System  │
│      ↓        ↓             ↓                  ↓              ↓      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   Express API Layer                            │  │
│  └─────────────────────────────┬──────────────────────────────────┘  │
│                                ↓                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      MySQL Database                            │  │
│  │  Identity │ Agents │ Accounts │ Wallet │ Bets │ Odds │ Config  │  │
│  └─────────────────────────────┬──────────────────────────────────┘  │
│                                ↓                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │         Cron Jobs  ←→  The Odds API (external)                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Clarified Design Principles

| Principle | Detail |
|---|---|
| **One login table** | `users` is the single login identity for **all** roles: player, agent, agent_employee, platform_staff. Each role has its own profile table for role-specific data. |
| **No duplicated preferences** | `timezone` and `odds_format` live **only** in `user_preferences`. `users` does not store them. |
| **Agents ≠ Agent hierarchy** | Agents do not manage other agents. An agent manages **accounts** (bank/Telebirr entries). Account managers are employees assigned to oversee a set of those accounts. |
| **Agent accounts are separate** | `agents` is the agent's profile. `agent_accounts` is the list of CBE/Awash/Telebirr/… accounts they own. One agent → many accounts. |
| **Account manager hierarchy** | `agent_account_managers` links an employee to one or more accounts with a manager role. An employee can manage multiple accounts; an account can have one active manager. |
| **Employees have shift schedules** | `agent_employees` stores `shift_start`, `shift_end`, `shift_days` so the system knows who is on duty right now for assignment routing. |
| **No groups table** | Groups removed — the shift/schedule on employee rows replaces the need. |
| **Wallets for everyone** | Every user (player, agent, employee) gets a `wallets` row. Commissions credit agent wallets. |
| **Config-driven** | All business rules (commission %, thresholds, limits) live in `platform_config` — no code deploy needed to change them. |

---

## 2. Domain Map

| Domain | Tables |
|---|---|
| Identity | `users`, `user_preferences`, `user_sessions`, `kyc_documents` |
| Platform Staff | `platform_staff` |
| Agents | `agents`, `agent_accounts`, `agent_account_managers`, `agent_employees` |
| Players | `player_profiles` |
| Wallets | `wallets`, `wallet_transactions` |
| Payments | `agent_account_assignments`, `payment_proofs` |
| Commissions | `agent_commission_log`, `agent_payout_requests` |
| Betting | `sports`, `events`, `market_catalog`, `odds_current`, `odds_history`, `results`, `bets`, `bet_selections` |
| API Analytics | `api_usage_log`, `sync_run_log` |
| Promotions | `promotions`, `player_promotions` |
| Notifications | `notification_templates`, `notifications`, `email_queue` |
| Config | `platform_config` |
| Audit | `audit_log` |

---

## 3. Core Identity & Auth

### `users`
The single login identity for every human on the platform.
**Role-specific data lives in separate tables** — this table holds only what is needed for authentication and routing.

| Column | Type | Notes |
|---|---|---|
| `user_id` | CHAR(36) PK | UUID v4, generated at registration |
| `phone_number` | VARCHAR(20) UNIQUE NOT NULL | Primary identifier — Ethiopian market is phone-first |
| `email` | VARCHAR(255) UNIQUE | Optional; used for promo and notification emails |
| `full_name` | VARCHAR(150) NOT NULL | |
| `date_of_birth` | DATE | Enforce 18+ check in controller |
| `role` | ENUM('player','agent','agent_employee','platform_staff') NOT NULL DEFAULT 'player' | |
| `kyc_status` | ENUM('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified' | Agents must reach 'verified' before activation |
| `status` | ENUM('active','blocked','self_excluded','suspended') NOT NULL DEFAULT 'active' | |
| `password_hash` | VARCHAR(255) NOT NULL | bcrypt, min 10 rounds |
| `referral_code` | VARCHAR(20) UNIQUE | Auto-generated on registration |
| `referred_by` | CHAR(36) FK → users.user_id NULL | |
| `last_login_at` | DATETIME | |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

> **Not here:** `timezone`, `odds_format` — those are in `user_preferences` only.

**Indexes:** `phone_number`, `email`, `(role, status)`, `referral_code`

---

### `user_preferences`
All display/UX preferences for any user. 1:1 with `users`. Created lazily on first access.

| Column | Type | Notes |
|---|---|---|
| `user_id` | CHAR(36) PK FK → users | |
| `language` | VARCHAR(10) NOT NULL DEFAULT 'en' | BCP-47 code: 'en', 'am' (Amharic), etc. |
| `timezone` | VARCHAR(50) NOT NULL DEFAULT 'Africa/Addis_Ababa' | IANA timezone string |
| `odds_format` | ENUM('decimal','american','fractional') NOT NULL DEFAULT 'decimal' | |
| `sms_notifications` | BOOLEAN NOT NULL DEFAULT true | |
| `email_notifications` | BOOLEAN NOT NULL DEFAULT true | |
| `marketing_emails` | BOOLEAN NOT NULL DEFAULT false | |
| `dark_mode` | BOOLEAN NOT NULL DEFAULT false | |
| `updated_at` | DATETIME | |

---

### `user_sessions`
Refresh-token store — enables token revocation without a full logout-all.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `user_id` | CHAR(36) FK → users NOT NULL | |
| `refresh_token_hash` | VARCHAR(255) UNIQUE NOT NULL | bcrypt of the opaque refresh token |
| `ip_address` | VARCHAR(45) | IPv4 or IPv6 |
| `user_agent` | VARCHAR(500) | |
| `expires_at` | DATETIME NOT NULL | |
| `revoked` | BOOLEAN NOT NULL DEFAULT false | |
| `created_at` | DATETIME | |

**Index:** `(user_id, revoked)`, `expires_at`

---

### `kyc_documents`
Required for agents (national ID + selfie). Triggered for players above the withdrawal threshold defined in `platform_config`.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `user_id` | CHAR(36) FK → users NOT NULL | |
| `document_type` | ENUM('national_id','passport','drivers_license','selfie','utility_bill') NOT NULL | |
| `document_number` | VARCHAR(100) | ID card number |
| `front_image_url` | VARCHAR(500) NOT NULL | |
| `back_image_url` | VARCHAR(500) | |
| `selfie_url` | VARCHAR(500) | Required for agent activation |
| `status` | ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' | |
| `reviewed_by` | CHAR(36) FK → users NULL | Platform staff member |
| `reviewed_at` | DATETIME | |
| `rejection_reason` | VARCHAR(255) | |
| `expires_at` | DATE | National ID expiry date |
| `created_at` | DATETIME | |

**Indexes:** `(user_id, document_type)`, `(status, created_at)`

---

## 4. Platform Staff

### `platform_staff`
Internal operators, admins, and superadmins. They are users with `role = 'platform_staff'`; this table holds their operational profile.

| Column | Type | Notes |
|---|---|---|
| `user_id` | CHAR(36) PK FK → users | Same UUID as their users row |
| `staff_role` | ENUM('superadmin','admin','finance_officer','kyc_reviewer','support') NOT NULL | Fine-grained role within the platform team |
| `department` | VARCHAR(100) | e.g. 'Finance', 'KYC', 'Support' |
| `can_approve_payments` | BOOLEAN NOT NULL DEFAULT false | |
| `can_manage_agents` | BOOLEAN NOT NULL DEFAULT false | |
| `can_view_audit_log` | BOOLEAN NOT NULL DEFAULT false | |
| `can_edit_config` | BOOLEAN NOT NULL DEFAULT false | Only superadmin should have this true |
| `hired_at` | DATETIME | |
| `terminated_at` | DATETIME | NULL = still active |
| `created_by` | CHAR(36) FK → users | Who created this staff account |
| `updated_at` | DATETIME | |

---

## 5. Agents

### Conceptual Model

```
users  (role='agent')
  └── agents              ← Agent profile (KYC, business info, commission settings)
        └── agent_accounts       ← Bank / Telebirr accounts owned by this agent
              └── agent_account_managers  ← Which employee manages which account(s)
        └── agent_employees      ← Cashiers / operators on this agent's payroll
```

**What "manager" means here:**
An agent registers multiple payment accounts (one Telebirr, one CBE, one Awash…).
They can assign one of their employees as the **account manager** for one or more of those accounts — that employee is then responsible for approving/rejecting screenshots on those accounts.
This is NOT a hierarchy of agents managing agents. It is an employee managing a set of accounts.

---

### `agents`
Profile extension for users with `role = 'agent'`.

| Column | Type | Notes |
|---|---|---|
| `agent_id` | CHAR(36) PK FK → users.user_id | Same UUID as users row |
| `business_name` | VARCHAR(200) | Trading name displayed to players |
| `national_id_number` | VARCHAR(50) UNIQUE NOT NULL | Required for full KYC |
| `address` | VARCHAR(500) | Physical shop/office address |
| `city` | VARCHAR(100) | |
| `region` | VARCHAR(100) | e.g. 'Addis Ababa', 'Oromia' |
| `kyc_verified` | BOOLEAN NOT NULL DEFAULT false | Set true only after all kyc_documents approved |
| `initial_deposit_paid` | DECIMAL(14,2) NOT NULL DEFAULT 0 | Platform setup fee paid (from platform_config) |
| `is_active` | BOOLEAN NOT NULL DEFAULT false | Admin activates after KYC passes |
| `activated_at` | DATETIME | |
| `commission_deposit_override` | DECIMAL(5,2) NULL | If set, overrides platform_config for this agent |
| `commission_withdrawal_override` | DECIMAL(5,2) NULL | |
| `notes` | TEXT | Internal admin notes |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

**Indexes:** `is_active`, `city`, `kyc_verified`

---

### `agent_accounts`
The actual bank/mobile-money accounts an agent registers. These are what get shown to players.
**Completely separate from `agents`** — one agent can have many accounts across different banks/methods.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `agent_id` | CHAR(36) FK → agents NOT NULL | Owning agent |
| `method` | ENUM('telebirr','cbe','awash','abyssinia','wegagen','dashen','ebirr','other') NOT NULL | Payment channel |
| `account_number` | VARCHAR(100) NOT NULL | Phone number for Telebirr/eBirr; account number for banks |
| `account_name` | VARCHAR(150) NOT NULL | Name shown to player exactly as it appears in the bank app |
| `bank_branch` | VARCHAR(150) | For bank transfers |
| `is_active` | BOOLEAN NOT NULL DEFAULT true | Agent or admin can deactivate |
| `daily_limit` | DECIMAL(14,2) NOT NULL DEFAULT 0 | 0 = no limit; max daily receiving volume |
| `daily_received` | DECIMAL(14,2) NOT NULL DEFAULT 0 | Resets to 0 at midnight by cron |
| `performance_score` | DECIMAL(5,2) NOT NULL DEFAULT 100 | 0–100; drives assignment algorithm (see §9) |
| `avg_response_minutes` | DECIMAL(8,2) NULL | Rolling average from payment_proofs |
| `total_approved` | INT NOT NULL DEFAULT 0 | Lifetime count |
| `total_rejected` | INT NOT NULL DEFAULT 0 | Lifetime count |
| `last_assigned_at` | DATETIME | Timestamp of most recent player assignment |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

**Indexes:** `(agent_id, is_active)`, `(method, is_active)`, `(performance_score DESC)`, `last_assigned_at`

---

### `agent_account_managers`
An agent can assign one of their employees to manage one or more accounts.
This is the "manager" concept — an employee who oversees a specific account or set of accounts.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `agent_account_id` | BIGINT FK → agent_accounts NOT NULL | The account being managed |
| `employee_user_id` | CHAR(36) FK → users NOT NULL | The employee assigned as manager |
| `agent_id` | CHAR(36) FK → agents NOT NULL | Denormalised — both must belong to same agent |
| `can_approve_deposits` | BOOLEAN NOT NULL DEFAULT true | |
| `can_approve_withdrawals` | BOOLEAN NOT NULL DEFAULT false | Typically restricted to the agent owner |
| `is_active` | BOOLEAN NOT NULL DEFAULT true | Agent can swap managers anytime |
| `assigned_at` | DATETIME NOT NULL | |
| `removed_at` | DATETIME NULL | |

**Unique:** `(agent_account_id)` WHERE `is_active = true` — only one active manager per account at a time
**Index:** `(employee_user_id, is_active)`, `(agent_id)`

---

### `agent_employees`
Staff hired by an agent to handle payment operations. Each employee has a defined **shift schedule** so the system knows who is currently on duty when routing a new assignment.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `employee_user_id` | CHAR(36) FK → users UNIQUE NOT NULL | The employee's login account |
| `agent_id` | CHAR(36) FK → agents NOT NULL | The employing agent |
| `job_title` | VARCHAR(100) NOT NULL DEFAULT 'cashier' | e.g. 'cashier', 'shift_supervisor', 'night_operator' |
| `shift_start` | TIME NOT NULL | Start of scheduled working hours (agent's local time) |
| `shift_end` | TIME NOT NULL | End of scheduled working hours |
| `shift_days` | SET('mon','tue','wed','thu','fri','sat','sun') NOT NULL DEFAULT 'mon,tue,wed,thu,fri' | Days of the week this shift applies |
| `shift_timezone` | VARCHAR(50) NOT NULL DEFAULT 'Africa/Addis_Ababa' | Timezone for interpreting shift_start/shift_end |
| `can_approve_deposits` | BOOLEAN NOT NULL DEFAULT true | |
| `can_approve_withdrawals` | BOOLEAN NOT NULL DEFAULT false | |
| `is_active` | BOOLEAN NOT NULL DEFAULT true | Agent can deactivate/reactivate at any time |
| `temp_password_hash` | VARCHAR(255) NULL | Agent generates a temporary password; cleared after first login |
| `must_change_password` | BOOLEAN NOT NULL DEFAULT true | Force change on first login |
| `hired_at` | DATETIME NOT NULL DEFAULT NOW() | |
| `terminated_at` | DATETIME NULL | Set when agent fires the employee |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

**Indexes:** `(agent_id, is_active)`, `employee_user_id`

> **Shift Duty Check (used in assignment routing):**
> ```sql
> -- Is this employee currently on shift?
> SELECT * FROM agent_employees
> WHERE agent_id = ?
>   AND is_active = true
>   AND FIND_IN_SET(LOWER(DAYNAME(NOW())), shift_days) > 0
>   AND CONVERT_TZ(NOW(), 'UTC', shift_timezone) BETWEEN
>       CONCAT(DATE(CONVERT_TZ(NOW(),'UTC',shift_timezone)), ' ', shift_start)
>       AND
>       CONCAT(DATE(CONVERT_TZ(NOW(),'UTC',shift_timezone)), ' ', shift_end);
> ```

---

## 6. Player Profiles

Players are users with `role = 'player'`. Extended stats live here.

### `player_profiles`

| Column | Type | Notes |
|---|---|---|
| `user_id` | CHAR(36) PK FK → users | 1:1 with users |
| `favourite_sport` | VARCHAR(100) | |
| `marketing_source` | VARCHAR(100) | 'google', 'referral', 'facebook', 'sms' |
| `deposit_count` | INT NOT NULL DEFAULT 0 | Incremented by walletService |
| `total_deposited` | DECIMAL(14,2) NOT NULL DEFAULT 0 | Running lifetime total |
| `total_withdrawn` | DECIMAL(14,2) NOT NULL DEFAULT 0 | |
| `total_wagered` | DECIMAL(14,2) NOT NULL DEFAULT 0 | |
| `responsible_gambling_limit` | DECIMAL(14,2) NULL | Self-set daily deposit cap |
| `vip_level` | TINYINT NOT NULL DEFAULT 0 | 0=standard, 1=bronze, 2=silver, 3=gold |
| `updated_at` | DATETIME | |

---

## 7. Wallets & Transactions

> **Rule:** `wallets.balance` is NEVER changed directly by a route. Always call `walletService.adjustBalance()` which writes both the wallet update and the ledger row inside a single DB transaction with a row-level lock.

### `wallets`
One row per user — players, agents, and employees all have one.

| Column | Type | Notes |
|---|---|---|
| `user_id` | CHAR(36) PK FK → users | |
| `balance` | DECIMAL(14,2) NOT NULL DEFAULT 0 | Real-money balance in ETB |
| `bonus_balance` | DECIMAL(14,2) NOT NULL DEFAULT 0 | Bonus funds — tracked separately |
| `locked_balance` | DECIMAL(14,2) NOT NULL DEFAULT 0 | Held while bets are pending; released on settle |
| `currency` | VARCHAR(6) NOT NULL DEFAULT 'ETB' | |
| `updated_at` | DATETIME | |

---

### `wallet_transactions`
Append-only financial ledger. Every balance change — deposit, withdrawal, bet, commission, bonus — has a row here. Never delete or update rows in this table.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `user_id` | CHAR(36) FK → users NOT NULL | |
| `type` | ENUM('deposit','withdrawal','bet_stake','bet_payout','bet_refund','commission','commission_payout','bonus_credit','bonus_debit','adjustment','initial_deposit') NOT NULL | |
| `amount` | DECIMAL(14,2) NOT NULL | Positive = credit, negative = debit |
| `balance_after` | DECIMAL(14,2) NOT NULL | Snapshot of real balance after this tx |
| `bonus_amount` | DECIMAL(14,2) NOT NULL DEFAULT 0 | Bonus portion of this tx, if any |
| `reference_type` | VARCHAR(30) | 'payment_proof' \| 'bet' \| 'commission_log' \| 'admin' \| 'promotion' |
| `reference_id` | VARCHAR(64) | PK of the referenced row |
| `note` | VARCHAR(255) | Human-readable description |
| `created_at` | DATETIME | |

**Indexes:** `(user_id, created_at)`, `(reference_type, reference_id)`

---

## 8. Deposit & Withdrawal Workflow

### Full Flow

```
Player selects "Deposit" → chooses method (e.g. CBE)
    ↓
System runs assignment algorithm (§9)
    ↓
Writes agent_account_assignments row (status = pending_payment)
    ↓
Player sees: "Send 500 ETB to CBE account 1000XXXXXXX (Agent Name)"
    ↓
Player sends money via their bank app, uploads screenshot
    ↓
payment_proofs row created (status = pending)
    ↓
Assigned agent employee (on shift) sees it in their queue
    ↓
Employee approves or rejects
    ↓
On APPROVE:
  - walletService.adjustBalance(player, +amount, 'deposit', 'payment_proof', id)
  - walletService.adjustBalance(agent,  +commission, 'commission', 'commission_log', id)
  - agent_commission_log row written
  - agent_accounts.daily_received += amount
  - agent_accounts.performance_score recalculated
  - notification sent to player
```

---

### `agent_account_assignments`
Records which account was shown to which player. Critical for routing audit and dispute resolution.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `player_user_id` | CHAR(36) FK → users NOT NULL | The player initiating the deposit |
| `agent_account_id` | BIGINT FK → agent_accounts NOT NULL | The account they were assigned |
| `agent_id` | CHAR(36) FK → agents NOT NULL | Denormalised for fast queries |
| `method` | VARCHAR(30) NOT NULL | Denormalised from agent_accounts.method |
| `requested_amount` | DECIMAL(14,2) | Amount the player said they want to deposit |
| `assigned_at` | DATETIME NOT NULL | |
| `expires_at` | DATETIME NOT NULL | `assigned_at + platform_config[assignment_expiry_minutes]` |
| `payment_proof_id` | BIGINT FK → payment_proofs NULL | Set when player uploads screenshot |
| `status` | ENUM('pending_payment','proof_submitted','approved','rejected','expired') NOT NULL DEFAULT 'pending_payment' | |

**Indexes:** `(player_user_id, status)`, `(agent_account_id, assigned_at)`, `expires_at`

---

### `payment_proofs`
The screenshot + reference submitted by the player after sending money.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `assignment_id` | BIGINT FK → agent_account_assignments NULL | Link back |
| `player_user_id` | CHAR(36) FK → users NOT NULL | |
| `agent_id` | CHAR(36) FK → agents NOT NULL | Denormalised |
| `agent_account_id` | BIGINT FK → agent_accounts NOT NULL | |
| `direction` | ENUM('deposit','withdrawal') NOT NULL | |
| `method` | ENUM('telebirr','cbe','awash','abyssinia','wegagen','dashen','ebirr','other') NOT NULL | |
| `amount` | DECIMAL(14,2) NOT NULL | |
| `tx_reference` | VARCHAR(100) | Transaction ID from SMS/bank receipt |
| `sender_name` | VARCHAR(150) | |
| `sender_phone` | VARCHAR(20) | |
| `screenshot_url` | VARCHAR(500) NOT NULL | Stored in object storage (S3/MinIO) |
| `image_hash` | VARCHAR(64) | Perceptual hash — catches reused screenshots |
| `status` | ENUM('pending','approved','rejected','escalated') NOT NULL DEFAULT 'pending' | |
| `reviewed_by` | CHAR(36) FK → users NULL | Employee or agent who acted |
| `reviewed_at` | DATETIME | |
| `response_minutes` | DECIMAL(8,2) NULL | `(reviewed_at - created_at)` in minutes |
| `rejection_reason` | VARCHAR(255) | |
| `escalated_to` | CHAR(36) FK → users NULL | Platform staff / agent owner |
| `created_at` | DATETIME | |

**Indexes:** `(status, created_at)`, `(agent_id, status)`, `(player_user_id, direction)`
**Unique:** `(method, tx_reference)` — prevents double-crediting the same bank transaction

---

## 9. Agent Assignment Algorithm

> **Goal:** Show the player an account that is active, not overloaded, and handled by someone currently on shift — while distributing load fairly and rewarding fast approvers.

### Step 1 — Filter (hard constraints)
```
SELECT a.*
FROM   agent_accounts a
  JOIN agent_account_managers m ON m.agent_account_id = a.id AND m.is_active = true
  JOIN agent_employees e        ON e.employee_user_id = m.employee_user_id
WHERE  a.method       = :player_chosen_method
  AND  a.is_active    = true
  AND  (a.daily_limit = 0 OR a.daily_received < a.daily_limit)
  AND  e.is_active    = true
  AND  e.is_on_shift_now = true   -- computed from shift_start/shift_end/shift_days/shift_timezone
```
If no results → return "method unavailable, try another".

### Step 2 — Score each candidate account
```
score(account) =
    (account.performance_score  × 0.40)   // historical approval quality
  + (availability_score         × 0.30)   // how far below daily_limit
  + (fairness_score             × 0.30)   // time since last assignment

availability_score:
  = 100                                   if daily_limit = 0 (unlimited)
  = 100 × (1 - daily_received/daily_limit)  otherwise, linear falloff

fairness_score:
  = min(100, minutes_since_last_assigned / 60 × 100)
  -- saturates at 100 after 60 min without an assignment (full round-robin weight)
```

### Step 3 — Add jitter and pick
```
score += RAND() × 10     -- prevents deterministic always-same winner
SORT BY score DESC
PICK TOP 1
```

### Step 4 — Write and lock
```
INSERT agent_account_assignments (player_user_id, agent_account_id, ...)
UPDATE agent_accounts SET last_assigned_at = NOW() WHERE id = picked_id
```
Lock duration: `platform_config[assignment_expiry_minutes]` (default 30 min).
After expiry, the assignment row moves to `status = expired` and the account is freed.

### Step 5 — Update performance score after review
```
outcome_score:
  approved within  5 min  → 100
  approved within 15 min  →  80
  approved within 60 min  →  60
  approved after  60 min  →  40
  rejected                →   0

new_score = old_score × 0.85 + outcome_score × 0.15
```

### Nightly reset cron
```sql
UPDATE agent_accounts
SET    daily_received = 0,
       updated_at     = NOW()
WHERE  DATE(updated_at) < CURDATE();
```

---

## 10. Commission & Payout System

### Commission rates come from `platform_config`
- `agent_deposit_commission_pct`   (default 5.00)
- `agent_withdrawal_commission_pct` (default 2.00)

### `agent_commission_log`
Written the instant a payment is approved. The wallet credit happens in the same DB transaction.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `agent_id` | CHAR(36) FK → agents NOT NULL | |
| `payment_proof_id` | BIGINT FK → payment_proofs NOT NULL | |
| `player_user_id` | CHAR(36) FK → users NOT NULL | |
| `commission_type` | ENUM('deposit','withdrawal') NOT NULL | |
| `transaction_amount` | DECIMAL(14,2) NOT NULL | Original deposit/withdrawal value |
| `commission_pct` | DECIMAL(5,2) NOT NULL | Snapshot of rate at transaction time |
| `commission_amount` | DECIMAL(14,2) NOT NULL | `transaction_amount × commission_pct / 100` |
| `wallet_tx_id` | BIGINT FK → wallet_transactions NOT NULL | The ledger row that credited agent's wallet |
| `created_at` | DATETIME | |

**Indexes:** `(agent_id, created_at)`, `payment_proof_id`

---

### `agent_payout_requests`
Agents cash out their accumulated commission balance.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `agent_id` | CHAR(36) FK → agents NOT NULL | |
| `amount` | DECIMAL(14,2) NOT NULL | |
| `method` | ENUM('telebirr','cbe','awash','abyssinia','wegagen','dashen','bank_transfer','other') NOT NULL | |
| `account_number` | VARCHAR(100) NOT NULL | |
| `account_name` | VARCHAR(150) NOT NULL | |
| `status` | ENUM('pending','approved','rejected','processing','completed') NOT NULL DEFAULT 'pending' | |
| `reviewed_by` | CHAR(36) FK → users NULL | Platform staff |
| `reviewed_at` | DATETIME | |
| `processed_at` | DATETIME | |
| `rejection_reason` | VARCHAR(255) | |
| `wallet_tx_id` | BIGINT FK → wallet_transactions NULL | Set when deducted from agent wallet |
| `created_at` | DATETIME | |

---

## 11. Betting Core

### `sports`
| Column | Type | Notes |
|---|---|---|
| `sport_key` | VARCHAR(100) PK | The Odds API key, e.g. `soccer_epl` |
| `title` | VARCHAR(150) NOT NULL | |
| `group_name` | VARCHAR(100) | API's category, e.g. 'Soccer' |
| `country` | VARCHAR(100) | Resolved by `countryResolver.js` |
| `active` | BOOLEAN DEFAULT true | Is this sport currently in-season per the API? |
| `enabled` | BOOLEAN DEFAULT false | Do WE offer it on the platform? |
| `has_outrights` | BOOLEAN DEFAULT false | |
| `sort_order` | INT DEFAULT 0 | |
| `created_at` / `updated_at` | DATETIME | |

---

### `events`
| Column | Type | Notes |
|---|---|---|
| `event_id` | VARCHAR(64) PK | The Odds API's own ID |
| `sport_key` | VARCHAR(100) FK → sports | |
| `home_team` | VARCHAR(150) NOT NULL | |
| `away_team` | VARCHAR(150) NOT NULL | |
| `commence_time` | DATETIME NOT NULL | UTC |
| `status` | ENUM('upcoming','live','finished','cancelled','postponed') DEFAULT 'upcoming' | |
| `last_synced_at` | DATETIME | |
| `created_at` / `updated_at` | DATETIME | |

**Indexes:** `(sport_key, commence_time)`, `status`

---

### `market_catalog`
| Column | Type |
|---|---|
| `market_key` | VARCHAR(100) PK |
| `display_name` | VARCHAR(150) NOT NULL |
| `category` | ENUM('featured','additional','game_period','other_soccer','player_props') |
| `tab_label` | VARCHAR(100) |
| `sort_order` | INT DEFAULT 0 |
| `enabled` | BOOLEAN DEFAULT true |

---

### `odds_current`
Live, non-suspended odds. Front-end always reads from here — never calls The Odds API directly.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `event_id` | VARCHAR(64) FK → events NOT NULL | |
| `market_key` | VARCHAR(100) NOT NULL | |
| `outcome_name` | VARCHAR(150) NOT NULL | |
| `point` | DECIMAL(6,2) NULL | Spread/total line, e.g. 2.5 |
| `description` | VARCHAR(150) NULL | Player/team scoping |
| `source_price` | DECIMAL(8,3) NOT NULL | Raw bookmaker price |
| `display_price` | DECIMAL(8,3) NOT NULL | After house margin |
| `bookmaker_key` | VARCHAR(60) NOT NULL | |
| `suspended` | BOOLEAN DEFAULT false | |
| `last_update` | DATETIME | Upstream's own timestamp |
| `fetched_at` | DATETIME DEFAULT NOW() | |

**Unique:** `(event_id, market_key, outcome_name, point, description)` — `uniq_odds_selection`
**Indexes:** `(event_id, market_key)`, `suspended`

---

### `odds_history`
Append-only. Written only when `display_price` changes value — not on every sync.

| Column | Type |
|---|---|
| `id` | BIGINT PK AI |
| `event_id` | VARCHAR(64) FK → events |
| `market_key` | VARCHAR(100) |
| `outcome_name` | VARCHAR(150) |
| `point` | DECIMAL(6,2) |
| `price` | DECIMAL(8,3) NOT NULL |
| `bookmaker_key` | VARCHAR(60) |
| `recorded_at` | DATETIME DEFAULT NOW() |

**Index:** `(event_id, market_key, recorded_at)`

---

### `results`
Final match scores. `is_final = true` triggers bet settlement cron.

| Column | Type |
|---|---|
| `event_id` | VARCHAR(64) PK FK → events |
| `home_score` | INT |
| `away_score` | INT |
| `home_score_h1` | INT |
| `away_score_h1` | INT |
| `total_corners` | INT |
| `total_cards` | INT |
| `is_final` | BOOLEAN DEFAULT false |
| `source` | VARCHAR(30) DEFAULT 'odds_api_scores' |
| `settled_at` | DATETIME |
| `created_at` | DATETIME |

---

### `bets`
| Column | Type | Notes |
|---|---|---|
| `bet_id` | CHAR(36) PK | UUID |
| `user_id` | CHAR(36) FK → users | Player |
| `stake` | DECIMAL(14,2) NOT NULL | Real money staked |
| `bonus_stake` | DECIMAL(14,2) DEFAULT 0 | Portion from bonus_balance |
| `total_odds` | DECIMAL(10,4) NOT NULL | |
| `potential_payout` | DECIMAL(14,2) NOT NULL | |
| `status` | ENUM('pending','won','lost','void','cancelled') DEFAULT 'pending' | |
| `promotion_id` | BIGINT FK → promotions NULL | If a promo was applied |
| `placed_at` | DATETIME NOT NULL | |
| `settled_at` | DATETIME | |

**Indexes:** `(user_id, placed_at)`, `status`

---

### `bet_selections`
One row per leg in a single/accumulator.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `bet_id` | CHAR(36) FK → bets | |
| `event_id` | VARCHAR(64) FK → events | |
| `market_key` | VARCHAR(100) NOT NULL | |
| `outcome_name` | VARCHAR(150) NOT NULL | |
| `point` | DECIMAL(6,2) NULL | |
| `odds_at_bet` | DECIMAL(10,4) NOT NULL | Locked at placement time — never changes |
| `result` | ENUM('pending','won','lost','void') DEFAULT 'pending' | |

**Index:** `event_id`

---

## 12. Odds API Sync & Analytics

### `api_usage_log`
Every upstream call. Extends the original model with latency, record counts, and error tracking.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `endpoint` | VARCHAR(255) NOT NULL | e.g. `/sports/soccer_epl/odds` |
| `params_json` | JSON | Sanitised params (no API key) |
| `http_status` | SMALLINT | 200, 422, 429, 500 |
| `credits_used` | INT | `x-requests-used` delta |
| `requests_remaining` | INT | `x-requests-remaining` header |
| `response_ms` | INT | Round-trip latency |
| `records_returned` | INT | Events/sports in response |
| `records_updated` | INT | How many `odds_current` rows actually changed |
| `error_code` | VARCHAR(50) | e.g. `EXCEEDED_FREQ_LIMIT` |
| `called_at` | DATETIME NOT NULL | |

**Indexes:** `(endpoint, called_at)`, `called_at`

---

### `sync_run_log`
One row per cron job execution. Use this to monitor drift, failures, quota consumption.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `job_name` | VARCHAR(100) NOT NULL | 'syncSports', 'syncEvents', 'syncOdds_soon', 'syncScores' |
| `started_at` | DATETIME NOT NULL | |
| `finished_at` | DATETIME | |
| `duration_ms` | INT | |
| `events_processed` | INT DEFAULT 0 | |
| `odds_rows_updated` | INT DEFAULT 0 | |
| `credits_spent` | INT DEFAULT 0 | Sum from api_usage_log rows in this run |
| `errors` | INT DEFAULT 0 | |
| `status` | ENUM('running','success','partial','failed') DEFAULT 'running' | |
| `notes` | TEXT | Error messages or summary |

---

## 13. Promotions & Bonuses

### `promotions`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `code` | VARCHAR(50) UNIQUE | NULL = auto-applied; set = player enters code |
| `name` | VARCHAR(200) NOT NULL | |
| `description` | TEXT | |
| `type` | ENUM('welcome_bonus','deposit_bonus','free_bet','cashback','odds_boost','referral','loyalty') NOT NULL | |
| `trigger` | ENUM('first_deposit','any_deposit','registration','manual','referral') NOT NULL | |
| `bonus_type` | ENUM('percentage','fixed_amount','free_bet_credit') NOT NULL | |
| `bonus_value` | DECIMAL(10,2) NOT NULL | % or fixed ETB depending on bonus_type |
| `max_bonus_amount` | DECIMAL(14,2) | Cap — e.g. max 5,000 ETB even on 100% bonus |
| `min_deposit` | DECIMAL(14,2) DEFAULT 0 | |
| `wagering_requirement` | DECIMAL(5,2) DEFAULT 1 | Rollover multiplier |
| `min_odds` | DECIMAL(6,3) DEFAULT 1 | Minimum odds for bets to count toward rollover |
| `valid_from` | DATETIME | |
| `valid_to` | DATETIME | |
| `max_claims` | INT NULL | NULL = unlimited |
| `claims_count` | INT DEFAULT 0 | |
| `is_active` | BOOLEAN DEFAULT true | |
| `applicable_sports` | JSON | NULL = all sports; array of sport_keys to restrict |
| `created_by` | CHAR(36) FK → users | Admin who created it |
| `created_at` / `updated_at` | DATETIME | |

---

### `player_promotions`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `user_id` | CHAR(36) FK → users | |
| `promotion_id` | BIGINT FK → promotions | |
| `status` | ENUM('active','completed','expired','forfeited') DEFAULT 'active' | |
| `bonus_credited` | DECIMAL(14,2) | Amount added to bonus_balance |
| `wagering_required` | DECIMAL(14,2) | Rollover target in ETB |
| `wagering_completed` | DECIMAL(14,2) DEFAULT 0 | Running total |
| `activated_at` | DATETIME | |
| `expires_at` | DATETIME | |
| `completed_at` | DATETIME | When wagering_completed ≥ wagering_required |
| `wallet_tx_id` | BIGINT FK → wallet_transactions | |

**Unique:** `(user_id, promotion_id)`

---

## 14. Notifications & Messaging

### `notification_templates`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `key` | VARCHAR(100) UNIQUE NOT NULL | e.g. `deposit_approved`, `bet_won`, `kyc_rejected` |
| `channel` | ENUM('sms','email','push','in_app') NOT NULL | |
| `subject` | VARCHAR(255) | Email subject — supports `{{variable}}` |
| `body` | TEXT NOT NULL | Template body — supports `{{variable}}` |
| `language` | VARCHAR(10) DEFAULT 'en' | |
| `is_active` | BOOLEAN DEFAULT true | |
| `updated_at` | DATETIME | |

---

### `notifications`
In-app inbox for any user.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `user_id` | CHAR(36) FK → users NOT NULL | |
| `type` | VARCHAR(100) NOT NULL | Matches a notification_templates.key |
| `title` | VARCHAR(255) | |
| `body` | TEXT | Rendered template |
| `data_json` | JSON | Extra context: `{ "bet_id": "...", "amount": 500 }` |
| `read_at` | DATETIME NULL | NULL = unread |
| `created_at` | DATETIME | |

**Indexes:** `(user_id, read_at)`, `created_at`

---

### `email_queue`
Outgoing emails queued for a background worker (nodemailer / SendGrid / AWS SES).

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `to_email` | VARCHAR(255) NOT NULL | |
| `to_name` | VARCHAR(150) | |
| `subject` | VARCHAR(255) NOT NULL | |
| `body_html` | TEXT NOT NULL | |
| `body_text` | TEXT | |
| `status` | ENUM('queued','sent','failed') DEFAULT 'queued' | |
| `attempts` | TINYINT DEFAULT 0 | |
| `sent_at` | DATETIME | |
| `error_message` | VARCHAR(500) | |
| `created_at` | DATETIME | |

**Index:** `(status, created_at)` — worker polls `WHERE status='queued' ORDER BY created_at`

---

## 15. Platform Configuration

One table, key-value, cast via `data_type`. All business rules live here.

```sql
CREATE TABLE platform_config (
  `key`        VARCHAR(100) NOT NULL PRIMARY KEY,
  `value`      TEXT NOT NULL,
  `data_type`  ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
  `description`VARCHAR(500),
  `updated_by` CHAR(36),
  `updated_at` DATETIME
);
```

| Key | data_type | Default | Description |
|---|---|---|---|
| `agent_deposit_commission_pct` | number | `5` | % agents earn on player deposits |
| `agent_withdrawal_commission_pct` | number | `2` | % agents earn on player withdrawals |
| `agent_registration_threshold` | number | `0` | Setup deposit required to activate (0 = free) |
| `assignment_expiry_minutes` | number | `30` | How long an account assignment is held for a player |
| `min_bet_amount` | number | `10` | Minimum stake in ETB |
| `max_bet_amount` | number | `50000` | Maximum stake per ticket |
| `max_payout` | number | `500000` | Maximum single-ticket payout |
| `max_bet_slip_selections` | number | `20` | Max legs in one accumulator |
| `kyc_withdrawal_threshold` | number | `5000` | Above this, withdrawal requires KYC |
| `max_daily_deposit_player` | number | `100000` | Per-player daily deposit cap |
| `max_daily_withdrawal_player` | number | `50000` | Per-player daily withdrawal cap |
| `welcome_bonus_enabled` | boolean | `true` | |
| `smtp_host` | string | `''` | Email server hostname |
| `smtp_port` | number | `587` | |
| `smtp_user` | string | `''` | |
| `smtp_from` | string | `''` | |
| `sms_provider` | string | `''` | e.g. `africastalking` |
| `sms_api_key` | string | `''` | Stored encrypted at rest |
| `maintenance_mode` | boolean | `false` | Blocks all player actions when true |
| `default_odds_format` | string | `decimal` | Platform-wide default (overridden per user in preferences) |

---

## 16. Audit & Compliance

### `audit_log`
Every financial and administrative action that changes money or status.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AI | |
| `actor_user_id` | CHAR(36) FK → users | Who performed the action |
| `actor_role` | VARCHAR(50) | Snapshot of role at action time |
| `action` | VARCHAR(100) NOT NULL | e.g. `approve_deposit`, `reject_withdrawal`, `block_user`, `edit_config` |
| `target_type` | VARCHAR(50) | `payment_proof`, `user`, `bet`, `agent`, `platform_config` |
| `target_id` | VARCHAR(64) | PK of the target row |
| `before_json` | JSON | Snapshot of relevant fields before the change |
| `after_json` | JSON | Snapshot after |
| `ip_address` | VARCHAR(45) | |
| `created_at` | DATETIME | |

**Index:** `(actor_user_id, created_at)`, `(target_type, target_id)`

---

## 17. Entity Relationship Summary

```
users  (all roles share this for login)
  │
  ├─ role=player        → player_profiles
  │                     → wallets
  │
  ├─ role=agent         → agents
  │                           └── agent_accounts  (CBE, Telebirr, Awash…)
  │                                 └── agent_account_managers  (employee → account)
  │                           └── agent_employees  (with shift schedules)
  │                     → wallets
  │
  ├─ role=agent_employee → agent_employees (hired_by agent)
  │                     → wallets
  │
  └─ role=platform_staff → platform_staff
                        → wallets

user_preferences  (1:1 all users — timezone, odds_format, notifications)
kyc_documents     (agents mandatory; players above threshold)
user_sessions     (refresh tokens for all roles)

agent_account_assignments  (assignment algorithm output)
  └── payment_proofs  (screenshot + tx reference)
        └── agent_commission_log  (commission earned by agent)
              └── wallet_transactions  (credits agent wallet)

bets  → bet_selections → events → sports
bets  → promotions (optional)
bets  → wallet_transactions (bet_stake debit, bet_payout credit)

events → odds_current  (upserted by cron)
events → odds_history  (price changes only)
events → results       (final scores → triggers settlement)

api_usage_log    (every upstream call)
sync_run_log     (every cron execution)

promotions       → player_promotions → wallet_transactions
notifications    (in-app inbox)
email_queue      (outgoing email worker)
platform_config  (all business rules)
audit_log        (every admin/financial action)
```

---

## 18. Index Strategy

| Table | Index | Purpose |
|---|---|---|
| `users` | `(role, status)` | List active agents/players |
| `user_sessions` | `(user_id, revoked)`, `expires_at` | Token lookup and cleanup |
| `agent_accounts` | `(method, is_active)`, `performance_score DESC`, `last_assigned_at` | Assignment algorithm |
| `agent_employees` | `(agent_id, is_active)` | On-shift employee lookup |
| `agent_account_managers` | `(agent_account_id)` WHERE active | One active manager per account |
| `payment_proofs` | `(status, created_at)`, `(agent_id, status)` | Agent queue load |
| `agent_account_assignments` | `(agent_account_id, assigned_at)`, `expires_at` | Active lock check |
| `wallet_transactions` | `(user_id, created_at)` | Statement pagination |
| `events` | `(sport_key, commence_time)`, `status` | Cron odds-fetch filter |
| `odds_current` | `(event_id, market_key)`, unique selection | Bet-placement lock |
| `bets` | `(user_id, placed_at)`, `status` | Settlement + user history |
| `notifications` | `(user_id, read_at)` | Unread count badge |
| `api_usage_log` | `called_at` | Admin usage graph |
| `sync_run_log` | `(job_name, started_at)` | Job history chart |

---

## 19. New Models Checklist

Models that need to be **created** (do not exist yet):

| Model file | Table | Status |
|---|---|---|
| `models/Agent.js` | `agents` | ⬜ TODO |
| `models/AgentAccount.js` | `agent_accounts` | ⬜ TODO |
| `models/AgentAccountManager.js` | `agent_account_managers` | ⬜ TODO |
| `models/AgentEmployee.js` | `agent_employees` | ⬜ TODO |
| `models/AgentCommissionLog.js` | `agent_commission_log` | ⬜ TODO |
| `models/AgentPayoutRequest.js` | `agent_payout_requests` | ⬜ TODO |
| `models/KycDocument.js` | `kyc_documents` | ⬜ TODO |
| `models/PlatformStaff.js` | `platform_staff` | ⬜ TODO |
| `models/PlayerProfile.js` | `player_profiles` | ⬜ TODO |
| `models/UserPreference.js` | `user_preferences` | ⬜ TODO |
| `models/UserSession.js` | `user_sessions` | ⬜ TODO |
| `models/AgentAccountAssignment.js` | `agent_account_assignments` | ⬜ TODO |
| `models/Promotion.js` | `promotions` | ⬜ TODO |
| `models/PlayerPromotion.js` | `player_promotions` | ⬜ TODO |
| `models/SyncRunLog.js` | `sync_run_log` | ⬜ TODO |
| `models/NotificationTemplate.js` | `notification_templates` | ⬜ TODO |
| `models/Notification.js` | `notifications` | ⬜ TODO |
| `models/EmailQueue.js` | `email_queue` | ⬜ TODO |
| `models/PlatformConfig.js` | `platform_config` | ⬜ TODO |

Models that need **column additions**:

| Model | Columns to add |
|---|---|
| `models/User.js` | Remove `timezone`, `odds_format` if present; add `email`, `referral_code`, `referred_by`, `last_login_at` |
| `models/Wallet.js` | Add `bonus_balance`, `locked_balance` |
| `models/WalletTransaction.js` | Add `bonus_amount`, `note` |
| `models/PaymentProof.js` | Add `assignment_id`, `agent_id`, `agent_account_id`, `response_minutes`, `escalated_to` |
| `models/ApiUsageLog.js` | Add `http_status`, `response_ms`, `records_returned`, `records_updated`, `error_code` |
| `models/AuditLog.js` | Add `actor_role`, `before_json`, `after_json`, `ip_address` |
| `models/Bet.js` | Add `bonus_stake`, `promotion_id` |

---

*Last updated: October 2026 — Edilbetting Platform v2.0*
