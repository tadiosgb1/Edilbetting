export type Market = {
  id: string
  home: string
  away: string
  league: string
  time: string
  sport: string
  odds: [string, string, string]
  live?: boolean
  score?: string
}

export type Pick = { market: Market; selection: string; odd: string }
