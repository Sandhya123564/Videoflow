import { forwardRef } from "react";
import { mediaUrl } from "../../utils/media";

const VideoPlayer = forwardRef(function VideoPlayer({ version, onTime }, ref) {
  if (!version) {
    return (
      <div className="grid aspect-video place-items-center rounded-2xl border border-white/10 bg-black/40 text-sm text-slate-400">
        No video version yet
      </div>
    );
  }

  if (version.sourceType === "gdrive") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <iframe
          title={`Version ${version.versionNumber}`}
          src={version.embedUrl || version.url}
          className="aspect-video w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        <p className="bg-black/60 px-3 py-2 text-xs text-slate-400">
          Drive preview cannot report the playhead. Type a timestamp in seconds when commenting.
        </p>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      className="aspect-video w-full rounded-2xl border border-white/10 bg-black"
      src={mediaUrl(version.url)}
      controls
      preload="metadata"
      onTimeUpdate={(e) => onTime?.(e.currentTarget.currentTime)}
    />
  );
});

export default VideoPlayer;
