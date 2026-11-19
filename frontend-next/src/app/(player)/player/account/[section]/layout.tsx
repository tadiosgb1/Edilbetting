export function generateStaticParams() {
  return ["bonus-points", "main-account", "unsettled-bets", "deposit", "withdraw", "invite-friends", "profile", "bet-history", "settings", "messages"].map((section) => ({ section }));
}


export default function AccountSectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
