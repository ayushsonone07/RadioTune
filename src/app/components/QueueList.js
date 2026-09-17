"use client";

import { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Image from "next/image";
import { X, GripVertical, ChevronUp, ChevronDown, Music } from "lucide-react";
import { playTrackAt, removeFromQueue, reorderQueue } from "../lib/features/playerSlice";

// The queue mixes tracks from different sources that don't agree on a
// thumbnails shape: search-result tracks carry `thumbnails` as an array of
// image objects ([{ url }, { url }]), while auto-fetched "up next" tracks
// (normalized in AudioPlayerBar) often carry it as a plain string URL.
// This resolves either shape (plus a bare { url } object, just in case)
// down to a single string, instead of assuming one specific shape.
function resolveThumbnailUrl(thumbnails) {
  if (!thumbnails) return "";
  if (typeof thumbnails === "string") return thumbnails;
  if (Array.isArray(thumbnails)) {
    const pick = thumbnails.length > 1 ? thumbnails[1] : thumbnails[0];
    return typeof pick === "string" ? pick : pick?.url || "";
  }
  return thumbnails?.url || "";
}

// Render as <QueueList /> — no props needed, it reads everything from Redux.
export default function QueueList() {
  const dispatch = useDispatch();
  const { queue, queueIndex, isPlaying } = useSelector((state) => state.player);

  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndexRef = useRef(null);

  // Which row is currently allowed to initiate a drag. A row is only
  // draggable while the mouse is actually pressed on its grip handle —
  // NOT for its whole clickable area. Without this, any ordinary click on
  // the row (title, artwork, etc.) with a hair of mouse movement gets
  // misread by the browser as a drag, which can reorder the queue and then
  // fire onClick's playTrackAt(idx) against the wrong track at that index.
  const [dragEnabledIndex, setDragEnabledIndex] = useState(null);

  if (!queue || queue.length === 0) {
    return (
      <p className="text-xs text-zinc-500 text-center mt-6 px-4">
        Nothing queued yet. Songs you add next will show up here.
      </p>
    );
  }

  // Desktop mouse drag — HTML5 DnD does not fire on touch devices, so this
  // is a progressive enhancement on top of the up/down buttons below, not
  // the only way to reorder.
  const handleDragStart = (idx) => {
    dragIndexRef.current = idx;
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault(); // required to allow dropping
    if (dragOverIndex !== idx) setDragOverIndex(idx);
  };

  const handleDrop = (idx) => {
    const fromIndex = dragIndexRef.current;
    setDragOverIndex(null);
    dragIndexRef.current = null;
    if (fromIndex === null || fromIndex === idx) return;
    dispatch(reorderQueue({ fromIndex, toIndex: idx }));
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setDragEnabledIndex(null);
  };

  const moveTrack = (idx, direction) => {
    const toIndex = idx + direction;
    if (toIndex < 0 || toIndex >= queue.length) return;
    dispatch(reorderQueue({ fromIndex: idx, toIndex }));
  };

  return (
    <div className="flex flex-col gap-1">
      {queue.map((track, idx) => {
        const isActive = idx === queueIndex;
        // FIXED: previously used `track?.thumbnails || currentTrack?.thumbnails?.[1 || 0]?.url`
        // — that assigned the raw array/string as-is (never pulling .url
        // out of an array), AND fell back to the globally *currently
        // playing* track's thumbnail instead of this row's own track.
        // resolveThumbnailUrl always returns a plain string for either
        // shape, using this row's own `track`.
        const thumbnailUrl = resolveThumbnailUrl(track?.thumbnails);

        return (
          <div
            key={`${track.videoId ?? "track"}-${idx}`}
            draggable={dragEnabledIndex === idx}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            onClick={() => dispatch(playTrackAt(idx))}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition ${
              isActive ? "bg-white/10" : "hover:bg-white/5"
            } ${dragOverIndex === idx ? "outline-1 outline-white/30" : ""}`}
          >
            {/* Drag handle: the only place a drag can start from. Hidden on
                touch screens since HTML5 DnD can't fire there anyway — the
                chevrons below take over for reordering on mobile. */}
            <span
              onMouseDown={(e) => {
                e.stopPropagation(); // don't trigger the row's onClick (playTrackAt)
                setDragEnabledIndex(idx);
              }}
              onMouseUp={() => setDragEnabledIndex(null)}
              className="hidden sm:block shrink-0"
            >
              <GripVertical
                size={14}
                className="text-zinc-600 cursor-grab active:cursor-grabbing"
              />
            </span>

            {thumbnailUrl ? (
              <div className="relative w-9 h-9 rounded overflow-hidden shrink-0 bg-zinc-800">
                <Image src={thumbnailUrl} fill sizes="36px" className="object-cover" alt={track?.name} />
              </div>
            ) : (
              <Music size={22} className="text-zinc-500" />
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm truncate ${
                  isActive ? "text-white font-semibold" : "text-zinc-200"
                }`}
              >
                {track.name}
              </p>
              <p className="text-xs text-zinc-400 truncate">{track?.artist?.name}</p>
            </div>

            {isActive && (
              <div className="flex items-end gap-0.5 h-3 w-4 shrink-0">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="eq-bar w-0.75 bg-white rounded-sm"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      animationPlayState: isPlaying ? "running" : "paused",
                      height: isPlaying ? undefined : "30%",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Reorder on touch: always visible (no hover concept on mobile),
                disabled at the ends of the queue instead of hidden so the
                layout doesn't jump. Works alongside drag on desktop too. */}
            <div className="flex flex-col shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveTrack(idx, -1);
                }}
                disabled={idx === 0}
                className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-500"
                aria-label={`Move ${track.name} up`}
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveTrack(idx, 1);
                }}
                disabled={idx === queue.length - 1}
                className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-500"
                aria-label={`Move ${track.name} down`}
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Always visible on mobile (no hover state to rely on);
                hover-revealed on desktop to keep the row visually clean. */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // don't trigger the row's own onClick (playTrackAt)
                dispatch(removeFromQueue(idx));
              }}
              className="text-zinc-500 hover:text-white shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition"
              aria-label={`Remove ${track.name} from queue`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}