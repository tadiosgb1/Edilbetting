import AuthPage from "@/components/auth/auth-page";

type LoginSearchParams = { next?: string | string[]; role?: string | string[] };

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  const requestedRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const roleFromNext = next?.startsWith("/admin") ? "admin" : next?.startsWith("/agent") ? "agent" : undefined;
  const roleFromQuery = requestedRole === "admin" || requestedRole === "agent" || requestedRole === "player" ? requestedRole : undefined;
  const role = roleFromNext ?? roleFromQuery;
  return <AuthPage mode="login" role={role} />;
}
