export type TenantRole = 'player' | 'agent' | 'admin'

const hostRoles: Record<string, TenantRole> = {
  'edilbet.com': 'player',
  'www.edilbet.com': 'player',
  'agent.edilbet.com': 'agent',
  'admin.edilbet.com': 'admin',
}

export function resolveTenant(): TenantRole {
  const host = window.location.hostname.toLowerCase()
  if (hostRoles[host]) return hostRoles[host]
  const portRoles: Record<string, TenantRole> = { '5173': 'player', '5174': 'agent', '5175': 'admin' }
  if (portRoles[window.location.port]) return portRoles[window.location.port]
  const mode = import.meta.env.MODE
  if (mode === 'agent' || mode === 'admin' || mode === 'player') return mode
  const configured = import.meta.env.VITE_APP_TENANT
  return configured === 'agent' || configured === 'admin' ? configured : 'player'
}

export const tenantConfig = {
  player: { name: 'EdilBet', label: 'Player', subtitle: 'Sportsbook', accent: 'Player experience' },
  agent: { name: 'EdilBet', label: 'Agent', subtitle: 'Partner workspace', accent: 'Agent operations' },
  admin: { name: 'EdilBet', label: 'Admin', subtitle: 'Control center', accent: 'Platform administration' },
} as const
