const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const env = require("../config/env");
const { User } = require("../models");
const ApiError = require("../utils/apiError");

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

  const snippet = {
    title: title.slice(0, 100),
    description: description || "",
    tags: tags || [],
  };

  const status = {
    privacyStatus: privacyStatus || "private",
  };

  onProgress?.(10);

  const init = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/*",
        "X-Upload-Content-Length": String(
          fs.statSync(filePath).size
        ),
      },
      body: JSON.stringify({
        snippet,
        status,
      }),
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
      `YouTube did not accept the upload session: ${body.slice(
        0,
        300
      )}`
    );
  }

  const sessionUrl = init.headers.get("location");

  if (!sessionUrl) {
    throw new ApiError(
      400,
      "YouTube did not return an upload session URL"
    );
  }

  onProgress?.(25);

  const buf = fs.readFileSync(filePath);

  const put = await fetch(sessionUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "video/*",
      "Content-Length": String(buf.length),
    },
    body: buf,
  });

  const result = await put.json().catch(() => ({}));

  if (!put.ok) {
    throw new ApiError(
      400,
      result.error?.message || "YouTube upload failed"
    );
  }

  onProgress?.(100);

  const videoId = result.id;

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
  uploadVideo,
  connectDemo,
  setProgress,
  getProgress,
};