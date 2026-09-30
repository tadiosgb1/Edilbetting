export function checkRole() {
  const role = localStorage.getItem("role");
  if (!role) return null;
  return String(role).trim().toLowerCase();
}

export default checkRole;
