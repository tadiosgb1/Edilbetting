import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const role = process.argv[2] || "player";
const ports = { player: 3000, admin: 3001, agent: 3002 };

if (!(role in ports)) {
  console.error("Unknown role. Use player, admin, or agent.");
  process.exit(1);
}

const nextBin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../node_modules/next/dist/bin/next");
const port = ports[role];
const child = spawn(process.execPath, [nextBin, "dev", "--turbo", "--hostname", "0.0.0.0", "-p", String(port)], {
  stdio: "inherit",
  env: {
    ...process.env,
    EDILBET_ROLE: role,
    NEXT_PUBLIC_APP_ROLE: role,
  },
});

child.on("error", (error) => {
  console.error("Could not start Next.js:", error.message);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
