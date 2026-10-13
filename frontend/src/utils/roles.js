export const ROLE_HOME = {
  editor: "/editor",
  reviewer: "/reviewer",
  head: "/head",
  admin: "/admin",
};

export function homeFor(role) {
  return ROLE_HOME[role] || "/login";
}
