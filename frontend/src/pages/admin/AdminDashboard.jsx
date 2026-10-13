import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "reviewer" });
  const [inviteInfo, setInviteInfo] = useState("");

  async function load() {
    const { data } = await api.get("/admin/users");
    setUsers(data.users);
  }

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || "Failed to load users"));
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/admin/users", form);
      setForm({ name: "", email: "", password: "", role: "editor" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create user");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user) {
    await api.patch(`/admin/users/${user.id}/active`, { isActive: !user.isActive });
    await load();
  }

  async function changeRole(user, role) {
    await api.patch(`/admin/users/${user.id}/role`, { role });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
        <h1 className="font-display text-3xl font-semibold">Users and roles</h1>
      </div>

      <form onSubmit={createUser} className="card grid gap-3 p-5 md:grid-cols-5">
        <input className="input md:col-span-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input md:col-span-1" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Password" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="editor">editor</option>
          <option value="reviewer">reviewer</option>
          <option value="head">head</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn-primary" disabled={busy} type="submit">
          Add user
        </button>
      </form>

      <form
        className="card grid gap-3 p-5 md:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setInviteInfo("");
          const { data } = await api.post("/admin/invites", invite);
          setInviteInfo(data.message || (data.registerPath ? `Invite created: ${data.registerPath}` : "Invite sent"));
        }}
      >
        <input className="input" type="email" required placeholder="Invite email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
        <select className="input" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
          <option value="editor">editor</option>
          <option value="reviewer">reviewer</option>
          <option value="head">head</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn-ghost" type="submit">Invite by email</button>
      </form>
      {inviteInfo && <p className="text-sm text-slate-400">{inviteInfo}</p>}

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate-400">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="input py-1"
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                  >
                    <option value="editor">editor</option>
                    <option value="reviewer">reviewer</option>
                    <option value="head">head</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">{u.isActive ? "Active" : "Disabled"}</td>
                <td className="px-4 py-3">
                  <button className="btn-ghost text-xs" type="button" onClick={() => toggleActive(u)}>
                    {u.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
