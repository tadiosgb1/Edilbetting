import { SectionPage } from "@/components/dashboard/section-page";

export function generateStaticParams() {
  return ["agents", "bets", "transactions", "reports", "users", "settings", "roles", "permissions"].map((section) => ({ section }));
}


export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SectionPage role="admin" section={section} />;
}
