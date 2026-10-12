import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminAgentLayout } from "@/components/layout/admin-agent-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="admin"><AdminAgentLayout role="admin">{children}</AdminAgentLayout></AuthGuard>;
}
