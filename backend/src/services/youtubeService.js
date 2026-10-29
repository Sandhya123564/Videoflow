const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const env = require("../config/env");
const { User } = require("../models");
const ApiError = require("../utils/apiError");
const os = require("os");
const { pipeline } = require("stream/promises");

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

const progressStore = new Map();

function isConfigured() {
  return Boolean(env.youtube.clientId && env.youtube.clientSecret);
}

function isDemoMode() {
  return !isConfigured();
}

function setProgress(id, payload) {
  progressStore.set(String(id), { ...payload, updatedAt: Date.now() });
}

function getProgress(id) {
  return progressStore.get(String(id)) || null;
}

function signState(userId) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: String(userId),
      n: crypto.randomBytes(8).toString("hex"),
    })
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

function readState(state) {
  const [payload, sig] = String(state || "").split(".");

  if (!payload || !sig) {
    throw new ApiError(400, "Invalid OAuth state");
  }

  const expected = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(payload)
    .digest("base64url");

  if (expected !== sig) {
    throw new ApiError(400, "Invalid OAuth state");
  }

  return JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8")
  );
}

function authUrl(userId) {
  if (!isConfigured()) {
    throw new ApiError(
      400,
      "YouTube OAuth is not configured. Use demo mode or set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET."
    );
  }

  const params = new URLSearchParams({
    client_id: env.youtube.clientId,
    redirect_uri: env.youtube.redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: signState(userId),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: env.youtube.clientId,
      client_secret: env.youtube.clientSecret,
      redirect_uri: env.youtube.redirectUri,
      grant_type: "authorization_code",
    }),
  });
const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      400,
      data.error_description ||
        data.error ||
        "YouTube token exchange failed"
    );
  }

  return data;
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.youtube.clientId,
      client_secret: env.youtube.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      401,
      "YouTube session expired. Reconnect the channel."
    );
  }

  return data;
}

async function getValidAccessToken(user) {
  if (!user.youtube || !user.youtube.refreshToken) {
    throw new ApiError(400, "Connect a YouTube channel first");
  }

  const expiry = user.youtube.expiryDate
    ? new Date(user.youtube.expiryDate).getTime()
    : 0;

  if (
    user.youtube.accessToken &&
    expiry > Date.now() + 60_000
  ) {
    return user.youtube.accessToken;
  }

  const tokens = await refreshAccessToken(
    user.youtube.refreshToken
  );

  user.youtube.accessToken = tokens.access_token;

  if (tokens.refresh_token) {
    user.youtube.refreshToken = tokens.refresh_token;
  }

  user.youtube.expiryDate = new Date(
    Date.now() + (tokens.expires_in || 3600) * 1000
  );

  await user.save();

  return user.youtube.accessToken;
}

async function fetchChannel(accessToken) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();

  const item = data.items && data.items[0];

  if (!item) {
    return {
      channelId: "",
      channelTitle: "YouTube channel",
    };
  }
return {
    channelId: item.id,
    channelTitle:
      item.snippet?.title || "YouTube channel",
  };
}

async function saveTokens(user, tokens) {
  const expiryDate = new Date(
    Date.now() + (tokens.expires_in || 3600) * 1000
  );

  let channel = {
    channelId: "",
    channelTitle: "YouTube channel",
  };

  try {
    channel = await fetchChannel(tokens.access_token);
  } catch {
    /* channel lookup is optional */
  }

  user.youtube = {
    channelId: channel.channelId,
    channelTitle: channel.channelTitle,
    accessToken: tokens.access_token,
    refreshToken:
      tokens.refresh_token ||
      user.youtube?.refreshToken,
    expiryDate,
  };

  if (!user.youtube.refreshToken) {
    throw new ApiError(
      400,
      "Google did not return a refresh token. Disconnect the app in Google Account permissions and connect again."
    );
  }

  await user.save();

  return user;
}

/*
 * Get playlists owned by the connected YouTube channel.
 */
async function listPlaylists(user) {
  const accessToken = await getValidAccessToken(user);

  const playlists = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      mine: "true",
      maxResults: "50",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await res.json();

    if (res.status === 401) {
      throw new ApiError(
        401,
        "YouTube authorization expired. Reconnect the channel."
      );
    }

    if (!res.ok) {
      throw new ApiError(
        400,
        data.error?.message || "Unable to load YouTube playlists"
      );
    }

    for (const item of data.items || []) {
      playlists.push({
        id: item.id,
        title: item.snippet?.title || "Untitled playlist",
        description: item.snippet?.description || "",
        itemCount: item.contentDetails?.itemCount || 0,
      });
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return playlists;
}

/*
 * Add an uploaded YouTube video to a selected playlist.
 */
async function addVideoToPlaylist(user, playlistId, videoId) {
  if (!playlistId || !videoId) {
    throw new ApiError(
      400,
      "Playlist ID and YouTube video ID are required"
    );
  }

  const accessToken = await getValidAccessToken(user);

  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId,
          },
        },
      }),
    }
  );
const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw new ApiError(
      401,
      "YouTube authorization expired. Reconnect the channel."
    );
  }

  if (!res.ok) {
    throw new ApiError(
      400,
      data.error?.message ||
        "Unable to add video to YouTube playlist"
    );
  }

  return {
    playlistItemId: data.id || "",
    playlistId,
    videoId,
  };
}

function resolveLocalFile(version) {
  if (!version) return null;

  if (
    version.storageProvider === "local" &&
    version.url
  ) {
    const name = path.basename(version.url);

    const full = path.join(
      __dirname,
      "../../uploads",
      name
    );

    if (fs.existsSync(full)) {
      return full;
    }
  }

  return null;
}
async function prepareUploadFile(version) {
  const localFile = resolveLocalFile(version);

  if (localFile) {
    return {
      filePath: localFile,
      cleanup: async () => {},
    };
  }

  if (!version || !version.url) {
    throw new ApiError(400, "No video URL found for this version.");
  }

  let url;

  try {
    url = new URL(version.url);
  } catch {
    throw new ApiError(400, "Invalid video URL.");
  }

  const isCloudinary =
    version.storageProvider === "cloudinary" &&
    url.protocol === "https:" &&
    url.hostname === "res.cloudinary.com";

  const isGoogleDrive =
    version.storageProvider === "gdrive" &&
    url.protocol === "https:" &&
    (url.hostname === "drive.google.com" ||
      url.hostname === "drive.usercontent.google.com");

  if (!isCloudinary && !isGoogleDrive) {
    throw new ApiError(
      400,
      "Video must be a local, Cloudinary, or Google Drive video."
    );
  }

  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "videoflow-")
  );

  const filePath = path.join(tempDir, "video.mp4");

  try {
    let downloadUrl = url;

    if (isGoogleDrive) {
      const match = url.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = match?.[1] || url.searchParams.get("id");

      if (!fileId) {
        throw new ApiError(400, "Could not identify Google Drive file ID.");
      }

      downloadUrl = new URL(
      "https://drive.usercontent.google.com/download"
      );

      downloadUrl.searchParams.set("id", fileId);
      downloadUrl.searchParams.set("export", "download");
      downloadUrl.searchParams.set("confirm", "t");
    }

    let response = await fetch(downloadUrl, {
      redirect: "follow",
    });

    if (!response.ok || !response.body) {
      throw new ApiError(
        400,
        "Could not download the video. Check Google Drive sharing permissions."
      );
    }

    let contentType =
      response.headers.get("content-type") || "";

    if (isGoogleDrive && contentType.includes("text/html")) {
      const html = await response.text();

      const cookie = response.headers.get("set-cookie") || "";

      const token =
        cookie.match(/download_warning[^=]*=([^;]+)/)?.[1] ||
        html.match(/[?&]confirm=([0-9A-Za-z_-]+)/)?.[1] ||
        html.match(/name="confirm"\s+value="([^"]+)"/)?.[1] ||
        html.match(/name='confirm'\s+value='([^']+)'/)?.[1];

      if (!token) {
        throw new ApiError(
          400,
          "Google Drive returned a confirmation page, but no download token was found. Try downloading the video through Google Drive or use another file host."
        );
      }

      downloadUrl.searchParams.set("confirm", token);

      response = await fetch(downloadUrl, {
        redirect: "follow",
        headers: cookie ? { Cookie: cookie.split(",").map((part) => part.trim().split(";")[0]).join("; ") } : {},
      });

      if (!response.ok || !response.body) {
        throw new ApiError(
          400,
          "Google Drive confirmation download failed."
        );
      }

      contentType =
        response.headers.get("content-type") || "";
    }

    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json")
    ) {
      throw new ApiError(
        400,
        "Google Drive still returned a webpage instead of the video. The file may require a Google Drive API download."
      );
    }

    await pipeline(
      response.body,
      fs.createWriteStream(filePath)
    );

    const stat = await fs.promises.stat(filePath);

    if (!stat.size) {
      throw new ApiError(400, "Downloaded video file is empty.");
    }

    return {
      filePath,
      cleanup: async () => {
        await fs.promises.rm(tempDir, {
          recursive: true,
          force: true,
        });
      },
    };
  } catch (error) {
    await fs.promises.rm(tempDir, {
      recursive: true,
      force: true,
    });

    throw error;
  }
}
async function uploadVideo({
  user,
  filePath,
  title,
  description,
  tags,
  privacyStatus,
  onProgress,
}) {
  const accessToken = await getValidAccessToken(user);
  const fileSize = fs.statSync(filePath).size;

  if (!fileSize) {
    throw new ApiError(400, "Video file is empty.");
  }

  const snippet = {
    title: title.slice(0, 100),
    description: description || "",
    tags: tags || [],
  };

  const status = {
    privacyStatus: privacyStatus || "private",
  };

  const init = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/*",
        "X-Upload-Content-Length": String(fileSize),
      },
      body: JSON.stringify({ snippet, status }),
    }
  );

  if (init.status === 401) {
    throw new ApiError(
      401,
      "YouTube authorization expired. Reconnect the channel."
    );
  }

  if (!init.ok) {
    const body = await init.text();
    throw new ApiError(
      400,
      `YouTube upload session failed: ${body.slice(0, 300)}`
    );
  }

  const sessionUrl = init.headers.get("location");

  if (!sessionUrl) {
    throw new ApiError(
      400,
      "YouTube did not return an upload session URL."
    );
  }

  const chunkSize = 8 * 1024 * 1024;
  const file = await fs.promises.open(filePath, "r");
  let videoId;

  try {
    for (let start = 0; start < fileSize; start += chunkSize) {
      const end = Math.min(start + chunkSize, fileSize) - 1;
      const length = end - start + 1;
      const buffer = Buffer.alloc(length);

      const { bytesRead } = await file.read(
        buffer, 0, length, start
      );

      if (bytesRead !== length) {
        throw new ApiError(400, "Could not read the complete video chunk.");
      }

      const put = await fetch(sessionUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken},
          "Content-Type": "video/*",
          "Content-Length": String(length),
          "Content-Range": bytes ${start}-${end}/${fileSize}`,
        },
        body: buffer,
      });
      const isLast = end === fileSize - 1;

      if (!isLast && put.status === 308) {
        onProgress?.(
          Math.min(99, Math.round(((end + 1) / fileSize) * 100))
        );
        continue;
      }

      if (!put.ok) {
        const body = await put.text();
        throw new ApiError(
          400,
          `YouTube chunk upload failed (${put.status}): ${body.slice(0, 300)}`
        );
      }

      if (isLast) {
        const result = await put.json().catch(() => ({}));
        videoId = result.id;

        if (!videoId) {
          throw new ApiError(
            400,
            "YouTube did not return a video ID."
          );
        }
      }

      onProgress?.(
        Math.min(99, Math.round(((end + 1) / fileSize) * 100))
      );
    }
  } finally {
    await file.close();
  }

  onProgress?.(100);

  return {
    youtubeVideoId: videoId,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

async function connectDemo(user) {
  user.youtube = {
    channelId: "demo-channel",
    channelTitle: "VideoFlow Demo Channel",
    accessToken: "demo-access",
    refreshToken: "demo-refresh",
    expiryDate: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ),
  };

  await user.save();

  return user;
}

module.exports = {
  isConfigured,
  isDemoMode,
  authUrl,
  readState,
  exchangeCode,
  saveTokens,
  getValidAccessToken,
  listPlaylists,
  addVideoToPlaylist,
  resolveLocalFile,
  prepareUploadFile,
  uploadVideo,
  connectDemo,
  setProgress,
  getProgress,
};