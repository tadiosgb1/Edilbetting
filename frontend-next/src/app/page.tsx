import { redirect } from "next/navigation";

// Single cPanel deployment: the public root always opens the Player homepage.
// Admin/Agent destinations are selected only after authentication from API roles.
export default function HomePage() {
  redirect("/player");
}
