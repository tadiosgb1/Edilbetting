import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const roleRoutes: Record<string, string> = {
  player: "/player",
  admin: "/admin",
  agent: "/agent",
};

export default function HomePage() {
  const role = process.env.EDILBET_ROLE || "player";
  redirect(roleRoutes[role] || "/player");
}
