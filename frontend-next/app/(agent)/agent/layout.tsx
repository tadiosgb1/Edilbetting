import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminAgentLayout } from "@/components/layout/admin-agent-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="agent"><AdminAgentLayout role="agent">{children}</AdminAgentLayout></AuthGuard>;
}
