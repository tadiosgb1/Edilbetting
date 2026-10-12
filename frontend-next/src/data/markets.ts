import type { Market } from '../types/sportsbook'

// Demonstration fixtures only. Replace with the live odds API before production.
export const initialMarkets: Market[] = [
  { id: 'm1', home: 'Arsenal', away: 'Chelsea', league: 'ENGLAND · PREMIER LEAGUE', time: 'Today, 20:00', sport: 'Football', odds: ['2.05', '3.40', '3.55'] },
  { id: 'm2', home: 'Real Madrid', away: 'Barcelona', league: 'SPAIN · LA LIGA', time: 'Today, 21:00', sport: 'Football', odds: ['2.45', '3.60', '2.60'] },
  { id: 'm3', home: 'Liverpool', away: 'Manchester City', league: 'ENGLAND · PREMIER LEAGUE', time: 'Today, 18:30', sport: 'Football', odds: ['2.80', '3.25', '2.30'], live: true, score: '1 - 1' },
  { id: 'm4', home: 'Bayern Munich', away: 'Dortmund', league: 'GERMANY · BUNDESLIGA', time: 'Today, 19:30', sport: 'Football', odds: ['1.75', '3.90', '4.20'] },
  { id: 'm5', home: 'Lakers', away: 'Golden State Warriors', league: 'USA · NBA', time: 'Tomorrow, 02:30', sport: 'Basketball', odds: ['1.88', '—', '1.94'] },
  { id: 'm6', home: 'Inter Milan', away: 'AC Milan', league: 'ITALY · SERIE A', time: 'Tomorrow, 20:45', sport: 'Football', odds: ['2.15', '3.10', '3.20'] },
]

export const sports = [
  { name: 'Football', icon: '⚽' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Tennis', icon: '🎾' },
  { name: 'Volleyball', icon: '🏐' },
  { name: 'Esports', icon: '🎮' },
]

export const categories = ['All matches', 'Live', 'Upcoming', 'Football', 'Basketball']
