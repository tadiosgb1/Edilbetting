export type TenantRole = "player" | "agent" | "admin";

// Multi-tenant hostname and port detection is intentionally disabled for the
// single cPanel deployment. Role-specific routes remain available and are
// selected after login using the backend user's role.
export function resolveTenant(): TenantRole {
  return "player";
}

export const tenantConfig = {
  player: { name: "EdilBet", label: "Player", subtitle: "Sportsbook", accent: "Player experience" },
  agent: { name: "EdilBet", label: "Agent", subtitle: "Partner workspace", accent: "Agent operations" },
  admin: { name: "EdilBet", label: "Admin", subtitle: "Control center", accent: "Platform administration" },
} as const;
