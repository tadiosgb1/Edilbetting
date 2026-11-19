import AuthPage from "@/components/auth/auth-page";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  const role = next?.startsWith("/admin") ? "admin" : next?.startsWith("/agent") ? "agent" : undefined;
  return <AuthPage mode="login" role={role} />;
}
