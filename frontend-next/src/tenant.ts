export type TenantRole = 'player' | 'agent' | 'admin'

const hostRoles: Record<string, TenantRole> = {
  'edilbet.com': 'player',
  'www.edilbet.com': 'player',
  'agent.edilbet.com': 'agent',
  'admin.edilbet.com': 'admin',
}

export function resolveTenant(): TenantRole {
  // Hostname selection is available in the browser. During server rendering,
  // use the public role configured by the Next.js runtime instead.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    if (hostRoles[host]) return hostRoles[host]

    const portRoles: Record<string, TenantRole> = {
      '3000': 'player',
      '3001': 'admin',
      '3002': 'agent',
    }
    if (portRoles[window.location.port]) return portRoles[window.location.port]
  }

  const mode = process.env.NEXT_PUBLIC_APP_ROLE
  if (mode === 'agent' || mode === 'admin' || mode === 'player') return mode

  const configured = process.env.NEXT_PUBLIC_TENANT
  return configured === 'agent' || configured === 'admin' ? configured : 'player'
}

export const tenantConfig = {
  player: { name: 'EdilBet', label: 'Player', subtitle: 'Sportsbook', accent: 'Player experience' },
  agent: { name: 'EdilBet', label: 'Agent', subtitle: 'Partner workspace', accent: 'Agent operations' },
  admin: { name: 'EdilBet', label: 'Admin', subtitle: 'Control center', accent: 'Platform administration' },
} as const
