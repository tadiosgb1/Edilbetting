import { SectionPage } from "@/components/dashboard/section-page";

export function generateStaticParams() {
  return ["bets", "wallet", "commissions", "users", "settings", "roles", "permissions", "bank-accounts", "employees"].map((section) => ({ section }));
}


export default async function AgentSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SectionPage role="agent" section={section} />;
}
