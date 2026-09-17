"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { Play, User } from "lucide-react";
import Image from "next/image";
import { fetchArtist } from "@/utils/api";
import SongList from "../components/SongList";
import AlbumList from "../components/AlbumList";
import Loading from "../components/Loading";
import Link from "next/link";
import SingleList from "../components/SingleList";

function ArtistResultInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [playingId, setPlayingId] = useState(null);
  const [artistResult, setArtistResult] = useState([]);
  const [progress, setProgress] = useState("w-[0%]");
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = async () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnd = () => {
      setPlayingId(null);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [playingId]);

  useEffect(() => {
    setProgress("w-[60%]");
    const fetch = async () => {
      if (query?.trim() === "") return;

      const data = await fetchArtist(query);

      setArtistResult(data);
      setProgress("w-full");
    };

    fetch();
  }, [query]);

  const thumbnailUrl = artistResult?.thumbnails?.[3 || 2 || 1 || 0]?.url;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {progress !== "w-full" ? (
        <Loading progress={progress} />
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-9 sm:px-10 lg:max-w-5xl lg:px-14 lg:py-14 xl:max-w-6xl">
          {/* Header: artist identity only */}
          <header className="mb-8 flex flex-col items-center text-center lg:mb-12 lg:flex-row lg:items-end lg:gap-8 lg:text-left">
            <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36 lg:h-48 lg:w-48">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  fill
                  sizes="(min-width: 1024px) 192px, 144px"
                  alt={artistResult?.name || "artist"}
                  className="rounded-full object-cover"
                />
              ) : (
                <User size={120} className="text-zinc-500 bg-zinc-800 rounded-full p-6 object-cover w-full h-full" />
              )}
            </div>

            <div className="lg:pb-2">
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:mt-0 lg:text-6xl">
                {artistResult?.name}
              </h1>
              <button className="mt-5 flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 lg:mt-6 lg:px-8 lg:py-3 lg:text-base">
                <Play size={16} fill="black" />
                Shuffle play
              </button>
            </div>
          </header>

          <div className="space-y-10 lg:space-y-12">
            {/* Similar Artists — its own section, horizontal scroll on mobile */}
            {artistResult?.similarArtists?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 text-zinc-200">
                  Similar Artists
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible">
                  {artistResult.similarArtists.map((artist, idx) => (
                    <Link
                      href={`/artist?q=${artist?.artistId}`}
                      key={artist?.artistId || idx}
                      className="shrink-0 w-28 sm:w-auto"
                    >
                      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-2 hover:bg-zinc-900 rounded-xl group cursor-pointer">
                        <div className="relative w-16 h-16 sm:w-14 sm:h-14 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                          {artist?.thumbnails ? (
                            <Image
                              src={artist.thumbnails[1 || 0]?.url}
                              fill
                              sizes="64px"
                              alt={artist?.name || "artist"}
                              className="object-cover rounded-full"
                            />
                          ) : (
                            <User size={32} className="text-zinc-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold truncate text-center sm:text-left max-w-full">
                          {artist?.name}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Singles + Songs side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8">
              <section>
                <h2 className="text-xl font-bold mb-6 text-zinc-200">Singles</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {artistResult?.topSingles?.map((single, idx) => (
                    <SingleList 
                      single={single}
                      key={idx}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4 text-zinc-200">Songs</h2>
                <div className="flex flex-col">
                  {artistResult?.topSongs?.map((item, idx) => (
                    <SongList song={item} key={item?.id || idx} />
                  ))}
                </div>
              </section>
            </div>

            {/* Albums */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-zinc-200">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {artistResult?.topAlbums?.map((al, idx) => (
                  <AlbumList al={al} key={al?.id || idx} />
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArtistResult() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <ArtistResultInner />
    </Suspense>
  );
}
