const { User, Project, PublishingRecord, Approval, VideoVersion } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");
const { loadVisibleProject } = require("../utils/projectAccess");
const { notify } = require("../services/notify");
const yt = require("../services/youtubeService");

function assertHead(user) {
  if (!user || user.role !== "head") {
    throw new ApiError(
      403,
      "Only a Head can connect YouTube or publish videos"
    );
  }
}

const status = asyncHandler(async (req, res) => {
  const fresh = await User.findById(req.user._id);

  res.json({
    configured: yt.isConfigured(),
    demoMode: yt.isDemoMode(),
    connected: Boolean(
      fresh.youtube && fresh.youtube.refreshToken
    ),
    channelTitle: fresh.youtube?.channelTitle || "",
    channelId:
      fresh.youtube?.channelId && yt.isDemoMode()
        ? "demo-channel"
        : fresh.youtube?.channelId || "",
  });
});

const connect = asyncHandler(async (req, res) => {
  assertHead(req.user);

  if (yt.isDemoMode()) {
    await yt.connectDemo(req.user);

    return res.json({
      demoMode: true,
      connected: true,
      channelTitle: "VideoFlow Demo Channel",
      message:
        "Demo mode: no Google OAuth ran. This is not a real YouTube channel.",
    });
  }

  res.json({
    demoMode: false,
    url: yt.authUrl(req.user._id),
  });
});

const disconnect = asyncHandler(async (req, res) => {
  assertHead(req.user);

  req.user.youtube = undefined;
  await req.user.save();

  res.json({ connected: false });
});

const callback = asyncHandler(async (req, res) => {
  const frontend = env.clientOrigin;

  try {
    if (req.query.error) {
      throw new ApiError(400, String(req.query.error));
    }

    const state = yt.readState(req.query.state);

    const user = await User.findById(state.sub);

    if (!user || user.role !== "head") {
      throw new ApiError(
        403,
        "OAuth user is not a Head"
      );
    }

    const tokens = await yt.exchangeCode(req.query.code);

    await yt.saveTokens(user, tokens);

    res.redirect(
      `${frontend}/head?youtube=connected`
    );
  } catch (err) {
    const msg = encodeURIComponent(
      err.message || "YouTube connect failed"
    );
res.redirect(
      `${frontend}/head?youtube=error&message=${msg}`
    );
  }
});

/*
 * Get playlists from the connected YouTube channel.
 */
const playlists = asyncHandler(async (req, res) => {
  assertHead(req.user);

  if (yt.isDemoMode()) {
    return res.json({
      playlists: [],
      demoMode: true,
    });
  }

  const freshHead = await User.findById(req.user._id);

  if (
    !freshHead.youtube ||
    !freshHead.youtube.refreshToken
  ) {
    throw new ApiError(
      400,
      "Connect a YouTube channel before loading playlists"
    );
  }

  const items = await yt.listPlaylists(freshHead);

  res.json({
    playlists: items,
    demoMode: false,
  });
});

const publish = asyncHandler(async (req, res) => {
  assertHead(req.user);

  const project = await loadVisibleProject(req);

  if (project.status !== "approved") {
    throw new ApiError(
      400,
      "Publish is allowed only after final Head approval"
    );
  }

  const version = await VideoVersion.findById(
    project.currentVersion?._id ||
      project.currentVersion
  );

  if (!version) {
    throw new ApiError(
      400,
      "No current video version to publish"
    );
  }

  const title = (
    req.body.title ||
    project.youtubeTitle ||
    project.title ||
    ""
  ).trim();

  const description = (
    req.body.description ||
    project.youtubeDescription ||
    project.description ||
    ""
  ).trim();

  const privacyStatus =
    req.body.privacyStatus ||
    project.youtubePrivacy ||
    "private";

  const tags = String(req.body.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  /*
   * Playlist selection.
   */
  const youtubePlaylistId = String(
    req.body.playlistId || ""
  ).trim();

  const youtubePlaylistTitle = String(
    req.body.playlistTitle || ""
  ).trim();

  if (title.length < 2) {
    throw new ApiError(
      400,
      "A YouTube title is required"
    );
  }

  if (
    !["private", "unlisted", "public"].includes(
      privacyStatus
    )
  ) {
    throw new ApiError(
      400,
      "privacyStatus must be private, unlisted, or public"
    );
  }

  const freshHead = await User.findById(
    req.user._id
  );

  if (
    !freshHead.youtube ||
    !freshHead.youtube.refreshToken
  ) {
    throw new ApiError(
      400,
      "Connect a YouTube channel before publishing"
    );
  }

  const record = await PublishingRecord.create({
    project: project._id,
    version: version._id,
    publishedBy: req.user._id,

    title,
    description,
    privacyStatus,
    tags,

    youtubePlaylistId,
    youtubePlaylistTitle,

    status: "uploading",
    mode: yt.isDemoMode() ? "demo" : "youtube",
  });

  yt.setProgress(record._id, {
    percent: 5,
    status: "uploading",
  });

  res.status(202).json({
    publishing: record,
    demoMode: yt.isDemoMode(),
  });

  setImmediate(() =>
    runPublish({
      recordId: record._id,
      userId: freshHead._id,
      project,
      version,
      title,
      description,
      tags,
      privacyStatus,
      youtubePlaylistId,
      youtubePlaylistTitle,
    })
  );
});
async function runPublish({
  recordId,
  userId,
  project,
  version,
  title,
  description,
  tags,
  privacyStatus,
  youtubePlaylistId,
  youtubePlaylistTitle,
}) {
  const record = await PublishingRecord.findById(
    recordId
  );

  const user = await User.findById(userId);

  try {
    if (yt.isDemoMode()) {
      for (const pct of [20, 45, 70, 90]) {
        yt.setProgress(recordId, {
          percent: pct,
          status: "uploading",
        });

        await new Promise((r) =>
          setTimeout(r, 400)
        );
      }

      const fakeId = `DEMO_${String(recordId).slice(
        -8
      )}`;

      record.status = "succeeded";
      record.youtubeVideoId = fakeId;
      record.youtubeUrl = `https://www.youtube.com/watch?v=${fakeId}`;
      record.error = "";

      await record.save();

      yt.setProgress(recordId, {
        percent: 100,
        status: "succeeded",
        youtubeVideoId: fakeId,
        youtubeUrl: record.youtubeUrl,
      });
    } else {
      const prepared = await yt.prepareUploadFile(version);

      let uploaded;

      try {
        yt.setProgress(recordId, {
          percent: 15,
          status: "uploading",
        });

        uploaded = await yt.uploadVideo({
        user,
        filePath: prepared.filePath,
        title,
        description,
        tags,
        privacyStatus,
        onProgress: (percent) =>
          yt.setProgress(recordId, {
            percent,
            status: "uploading",
          }),
        });
} finally {
  await prepared.cleanup();
}

      record.status = "succeeded";
      record.youtubeVideoId =
        uploaded.youtubeVideoId;
      record.youtubeUrl = uploaded.youtubeUrl;
      record.error = "";

      /*
       * If a playlist was selected, add the
       * uploaded YouTube video to that playlist.
       */
      if (youtubePlaylistId) {
        try {
          await yt.addVideoToPlaylist(
            user,
            youtubePlaylistId,
            uploaded.youtubeVideoId
          );
        } catch (playlistError) {
          /*
           * Video upload succeeded, but playlist
           * addition failed. Keep the publish record
           * successful and store the playlist error.
           */
          record.error = `Video uploaded successfully, but it could not be added to the selected playlist: ${playlistError.message}`;
        }
      }

      await record.save();

      yt.setProgress(recordId, {
        percent: 100,
        status: "succeeded",
        youtubeVideoId:
          uploaded.youtubeVideoId,
        youtubeUrl: uploaded.youtubeUrl,
        youtubePlaylistId:
          youtubePlaylistId || "",
        youtubePlaylistTitle:
          youtubePlaylistTitle || "",
      });
    }

    const liveProject = await Project.findById(
      project._id
    );

    liveProject.status = "published";
    liveProject.youtubeTitle = title;
    liveProject.youtubeDescription =
      description;
    liveProject.youtubePrivacy =
      privacyStatus;

    await liveProject.save();

    await Approval.create({
      project: project._id,
      version: version._id,
      actor: user._id,
      actorEmail: user.email,
      actorRole: "head",
      action: "publish",
      note: yt.isDemoMode()
        ? "Demo publish (not a real YouTube upload)"
        : record.youtubeUrl,
    });
const editor = await User.findById(
      project.editor
    );

    if (editor) {
      await notify({
        user: editor,
        email: editor.email,
        type: "published",
        title: yt.isDemoMode()
          ? `Demo publish: ${project.title}`
          : `Published to YouTube: ${project.title}`,
        body: yt.isDemoMode()
          ? `Head ran a DEMO publish. No real YouTube video was created.\nDemo id: ${record.youtubeVideoId}`
          : `Your video is on YouTube:\n${record.youtubeUrl}`,
        project,
        reviewPath: `/projects/${project._id}`,
      });
    }
  } catch (err) {
    record.status = "failed";
    record.error =
      err.message || "Publish failed";

    await record.save();

    yt.setProgress(recordId, {
      percent: 0,
      status: "failed",
      error: record.error,
    });
  }
}

const publishStatus = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);

  const record = await PublishingRecord.findOne({
    _id: req.params.recordId,
    project: project._id,
  });

  if (!record) {
    throw new ApiError(
      404,
      "Publish record not found"
    );
  }

  const live =
    yt.getProgress(record._id) || {};

  res.json({
    publishing: record,
    percent:
      live.percent ??
      (record.status === "succeeded"
        ? 100
        : record.status === "failed"
        ? 0
        : 10),
    demoMode:
      record.mode === "demo" ||
      yt.isDemoMode(),
  });
});

const listPublishing = asyncHandler(async (req, res) => {
  const project =
    await loadVisibleProject(req);

  const records =
    await PublishingRecord.find({
      project: project._id,
    }).sort({ createdAt: -1 });

  res.json({
    records,
    demoMode: yt.isDemoMode(),
  });
});

module.exports = {
  status,
  connect,
  disconnect,
  callback,
  playlists,
  publish,
  publishStatus,
  listPublishing,
};