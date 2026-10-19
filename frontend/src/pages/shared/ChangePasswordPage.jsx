import { useState } from "react";
import api from "../../services/api";

export default function ChangePasswordPage() {
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function onSubmit(e) {
e.preventDefault();
setMessage("");
setError("");

if (newPassword !== confirmPassword) {
  setError("New passwords do not match.");
  return;
}

if (newPassword.length < 8) {
  setError("Password must be at least 8 characters.");
  return;
}

try {
  const { data } = await api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  setMessage(data.message || "Password changed successfully.");
  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");
} catch (err) {
  setError(err.response?.data?.message || "Could not change password.");
}

}

return (
<div className="mx-auto max-w-md">
<h1 className="font-display text-2xl font-semibold">
Change Password
</h1>

  <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-6">
    {error && <p className="text-sm text-rose-300">{error}</p>}
    {message && <p className="text-sm text-emerald-200">{message}</p>}

    <input
      className="input w-full"
      type="password"
      placeholder="Current password"
      autoComplete="current-password"
      required
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
    />

    <input
      className="input w-full"
      type="password"
      placeholder="New password (minimum 8 characters)"
      autoComplete="new-password"
      minLength={8}
      required
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
    />

    <input
      className="input w-full"
      type="password"
      placeholder="Confirm new password"
      autoComplete="new-password"
      minLength={8}
      required
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
    />

    <button className="btn-primary w-full" type="submit">
      Update Password
    </button>
  </form>
</div>

);
}