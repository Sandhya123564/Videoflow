import { useEffect, useState } from "react";
import api from "../../services/api";

export default function YouTubePublishPanel({
  project,
  publishing,
  onChanged,
  role,
}) {
  const [yt, setYt] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const [form, setForm] = useState({
    title: project.youtubeTitle || project.title || "",
    description:
      project.youtubeDescription || project.description || "",
    tags: "",
    privacyStatus:
      project.youtubePrivacy || "private",
    playlistId: "",
    playlistTitle: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [percent, setPercent] = useState(0);

  const latest = publishing?.[0];

  useEffect(() => {
    api
      .get("/youtube/status")
      .then((res) => setYt(res.data))
      .catch(() => {});
  }, []);

  async function loadPlaylists() {
    setLoadingPlaylists(true);

    try {
      const { data } = await api.get(
        "/youtube/playlists"
      );

      setPlaylists(data.playlists || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load YouTube playlists"
      );
    } finally {
      setLoadingPlaylists(false);
    }
  }

  useEffect(() => {
    if (
      yt?.connected &&
      !yt?.demoMode &&
      role === "head"
    ) {
      loadPlaylists();
    }
  }, [yt?.connected, yt?.demoMode, role]);

  useEffect(() => {
    if (!activeId) return undefined;

    const timer = setInterval(async () => {
      try {
        const { data } = await api.get(
          `/projects/${project._id}/publish/${activeId}`
        );

        setPercent(data.percent || 0);

        if (
          data.publishing.status === "succeeded" ||
          data.publishing.status === "failed"
        ) {
          setActiveId(null);
          onChanged?.();
        }
      } catch {
        setActiveId(null);
      }
    }, 700);

    return () => clearInterval(timer);
  }, [activeId, project._id, onChanged]);

  async function connect() {
    setError("");
    setBusy(true);

    try {
      const { data } = await api.post(
        "/youtube/connect"
      );

      if (data.demoMode) {
        setYt({
          ...data,
          configured: false,
          demoMode: true,
        });
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not connect YouTube"
      );
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    try {
      await api.post("/youtube/disconnect");

      const { data } = await api.get(
        "/youtube/status"
      );

      setYt(data);
      setPlaylists([]);

      setForm((prev) => ({
        ...prev,
        playlistId: "",
        playlistTitle: "",
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not disconnect YouTube"
      );
    }
  }

  function handlePlaylistChange(e) {
    const playlistId = e.target.value;

    const selected = playlists.find(
      (playlist) => playlist.id === playlistId
    );

    setForm((prev) => ({
      ...prev,
      playlistId,
      playlistTitle: selected?.title || "",
    }));
  }

  async function publish() {
    setError("");
    setBusy(true);

    try {
      const { data } = await api.post(
        `/projects/${project._id}/publish`,
        form
      );

      setActiveId(data.publishing._id);
      setPercent(5);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Publish failed"
      );
    } finally {
      setBusy(false);
    }
  }

  if (
    project.status !== "approved" &&
    project.status !== "published"
  ) {
    return null;
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            YouTube publishing
          </h2>

          <p className="text-sm text-slate-400">
            Only the Head can publish after final approval.
          </p>
        </div>

        {yt?.demoMode && (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
            Demo mode — not a real upload
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {role === "head" &&
        yt &&
        !yt.connected &&
        project.status === "approved" && (
          <button
            className="btn-primary"
            type="button"
            disabled={busy}
            onClick={connect}
          >
            {yt.demoMode
              ? "Connect demo channel"
              : "Connect YouTube account"}
          </button>
        )}

      {role === "head" && yt?.connected && (
        <p className="text-sm text-slate-300">
          Connected:{" "}
          {yt.channelTitle || "YouTube"}

          <button
            className="ml-3 text-xs text-slate-500 underline"
            type="button"
            onClick={disconnect}
          >
            Disconnect
          </button>
        </p>
      )}

      {role === "head" &&
        project.status === "approved" &&
        yt?.connected && (
          <div className="grid gap-3">
            <div>
              <label className="label">
                Title
              </label>

              <input
                className="input"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Description
              </label>

              <textarea
                className="input min-h-24"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Tags (comma separated)
              </label>

              <input
                className="input"
                value={form.tags}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tags: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Privacy
              </label>

              <select
                className="input"
                value={form.privacyStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    privacyStatus: e.target.value,
                  })
                }
              >
                <option value="private">
                  Private
                </option>

                <option value="unlisted">
                  Unlisted
                </option>

                <option value="public">
                  Public
                </option>
              </select>
            </div>

            {!yt.demoMode && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">
                    YouTube Playlist
                  </label>

                  <button
                    type="button"
                    className="text-xs text-accent-400 underline"
                    disabled={loadingPlaylists}
                    onClick={loadPlaylists}
                  >
                    {loadingPlaylists
                      ? "Loading..."
                      : "Refresh"}
                  </button>
                </div>

                <select
                  className="input"
                  value={form.playlistId}
                  onChange={handlePlaylistChange}
                  disabled={loadingPlaylists}
                >
                  <option value="">
                    No playlist
                  </option>

                  {playlists.map((playlist) => (
                    <option
                      key={playlist.id}
                      value={playlist.id}
                    >
                      {playlist.title}
                    </option>
                  ))}
                </select>

                {form.playlistId && (
                  <p className="mt-1 text-xs text-slate-500">
                    Video will be added to:{" "}
                    {form.playlistTitle}
                  </p>
                )}

                {!loadingPlaylists &&
                  playlists.length === 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      No playlists found on this YouTube
                      channel.
                    </p>
                  )}
              </div>
            )}

            <button
              className="btn-primary"
              type="button"
              disabled={
                busy || Boolean(activeId)
              }
              onClick={publish}
            >
              {yt.demoMode
                ? "Run demo publish"
                : "Publish to YouTube"}
            </button>
          </div>
        )}

      {(activeId || latest) && (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-accent-500 transition-all"
              style={{
                width: `${
                  activeId
                    ? percent
                    : latest?.status ===
                      "succeeded"
                    ? 100
                    : latest?.status ===
                      "failed"
                    ? 0
                    : 10
                }%`,
              }}
            />
          </div>

          <p className="text-xs text-slate-400">
            {activeId
              ? `Uploading… ${percent}%`
              : `${latest.status}${
                  latest.mode === "demo"
                    ? " (demo)"
                    : ""
                }`}
          </p>

          {latest?.status === "succeeded" &&
            latest.youtubeUrl && (
              <p className="text-sm">
                Video ID:{" "}
                <span className="text-slate-200">
                  {latest.youtubeVideoId}
                </span>

                <br />

                {latest.mode === "demo" ? (
                  <span className="text-amber-200">
                    Demo URL only — this video does
                    not exist on YouTube.{" "}
                    {latest.youtubeUrl}
                  </span>
                ) : (
                  <a
                    className="text-accent-400 underline"
                    href={latest.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {latest.youtubeUrl}
                  </a>
                )}

                {latest.youtubePlaylistTitle && (
                  <span className="mt-1 block text-xs text-slate-400">
                    Playlist:{" "}
                    {latest.youtubePlaylistTitle}
                  </span>
                )}
              </p>
            )}

          {latest?.status === "failed" && (
            <p className="text-sm text-rose-300">
              {latest.error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}