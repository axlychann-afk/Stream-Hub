import {
  useGetStream,
  useGetDonghuaDetail,
  useGetServers,
  useGetDownload,
  getGetStreamQueryKey,
  getGetDonghuaDetailQueryKey,
  getGetServersQueryKey,
  getGetDownloadQueryKey,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  ListVideo,
  Server,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export default function Watch() {
  const params = useParams<{ seriesSlug: string; episodeSlug: string }>();
  const { seriesSlug = "", episodeSlug = "" } = params;

  const { data: streamData, isLoading: streamLoading, error: streamError, refetch } = useGetStream(
    { slug: episodeSlug },
    { query: { enabled: !!episodeSlug, queryKey: getGetStreamQueryKey({ slug: episodeSlug }) } }
  );

  const { data: detailData } = useGetDonghuaDetail(
    { slug: seriesSlug },
    { query: { enabled: !!seriesSlug, queryKey: getGetDonghuaDetailQueryKey({ slug: seriesSlug }) } }
  );

  const { data: serversData } = useGetServers(
    { slug: episodeSlug },
    { query: { enabled: !!episodeSlug, queryKey: getGetServersQueryKey({ slug: episodeSlug }) } }
  );

  const { data: downloadData } = useGetDownload(
    { slug: episodeSlug },
    { query: { enabled: !!episodeSlug, queryKey: getGetDownloadQueryKey({ slug: episodeSlug }) } }
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedServer, setSelectedServer] = useState(0);
  const [openQuality, setOpenQuality] = useState<string | null>(null);

  // Reset selections when episode changes
  useEffect(() => {
    setSelectedServer(0);
    setOpenQuality(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [episodeSlug]);

  const series = detailData?.result;
  const episodes = series?.episodes || [];

  const getEpisodeSlug = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split("/").filter(Boolean).pop() || "";
    } catch {
      const parts = url.split("/").filter(Boolean);
      return parts[parts.length - 1] || url;
    }
  };

  const currentIndex = episodes.findIndex((ep) => getEpisodeSlug(ep.url) === episodeSlug);
  const nextEpisode = currentIndex !== -1 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const currentEpInfo = currentIndex !== -1 ? episodes[currentIndex] : null;
  const stream = streamData?.result;

  // Axly API uses "label" field; our Express API transforms it to "name".
  // Handle both so this works whether the frontend calls our Express API or Axly directly.
  type AnyServer = { name?: string; label?: string; embed_url: string };
  const getServerName = (s: AnyServer) => s.name || s.label || "Server";

  // Use dedicated /servers endpoint (includes Vidio), fall back to stream servers
  const rawServers = (serversData?.result?.servers ?? stream?.servers ?? []) as AnyServer[];
  const servers = rawServers;
  const activeEmbedUrl = servers[selectedServer]?.embed_url || stream?.embed_url || "";

  const downloads = downloadData?.result?.downloads ?? [];

  return (
    <div className="min-h-screen bg-background pt-16 pb-12 flex flex-col">
      <Helmet>
        <title>
          {stream?.title || `Episode ${currentEpInfo?.number || ""}`} |{" "}
          {series?.title || "Watch"} | DonghuaStream
        </title>
      </Helmet>

      {/* Main Player Area */}
      <div className="bg-black border-b border-border">
        <div className="container mx-auto px-0 lg:px-4 flex flex-col lg:flex-row">

          {/* Player Column */}
          <div className="flex-1 w-full min-w-0 relative group">
            {/* Video Player */}
            <div className="aspect-video w-full bg-zinc-950 relative flex items-center justify-center overflow-hidden lg:rounded-b-none lg:rounded-tl-lg">
              {streamLoading ? (
                <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                  <p>Loading stream...</p>
                </div>
              ) : streamError || !activeEmbedUrl ? (
                <div className="flex flex-col items-center text-center p-6 text-muted-foreground max-w-md">
                  <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Stream Unavailable</h3>
                  <p className="mb-6">The video source could not be loaded or is no longer available.</p>
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-6 py-2.5 rounded-full transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry Connection
                  </button>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  key={activeEmbedUrl}
                  src={activeEmbedUrl}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
                />
              )}
            </div>

            {/* Server Selector — right below the video */}
            {!streamLoading && servers.length > 0 && (
              <div className="bg-muted/20 border-t border-border px-3 py-2.5 flex flex-wrap gap-1.5 items-center">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0 mr-1">
                  <Server className="w-3.5 h-3.5" />
                  <span>Pilihan Server:</span>
                </div>
                {servers.map((server, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedServer(idx)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0",
                      selectedServer === idx
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary hover:bg-secondary/70 text-foreground"
                    )}
                  >
                    {getServerName(server)}
                  </button>
                ))}
              </div>
            )}

            {/* Player Controls Bar */}
            <div className="bg-card/90 border-t border-border p-3 flex flex-col gap-2.5 min-w-0">
              {/* Top row: title + prev/next nav */}
              <div className="flex flex-row items-center justify-between gap-3 min-w-0">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h1
                    className="text-base md:text-lg font-bold text-white truncate leading-tight"
                    title={stream?.title || currentEpInfo?.title}
                  >
                    {stream?.title || currentEpInfo?.title || "Loading Episode..."}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5 min-w-0 overflow-hidden">
                    <Link
                      href={`/donghua/${seriesSlug}`}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors truncate min-w-0"
                    >
                      {series?.title || "Loading Series..."}
                    </Link>
                    {stream?.source && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-primary/20 text-primary border border-primary/20 shrink-0">
                        {stream.source}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={prevEpisode ? `/watch/${seriesSlug}/${getEpisodeSlug(prevEpisode.url)}` : "#"}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors",
                      !prevEpisode && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                    title="Previous Episode"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                  <Link
                    href={nextEpisode ? `/watch/${seriesSlug}/${getEpisodeSlug(nextEpisode.url)}` : "#"}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-primary",
                      !nextEpisode && "opacity-50 cursor-not-allowed pointer-events-none text-foreground"
                    )}
                    title="Next Episode"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Download Section — below the title */}
              {downloads.length > 0 && (
                <div className="border-t border-border/50 pt-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Episode:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {downloads.map((q) => (
                      <div key={q.quality} className="relative">
                        <button
                          onClick={() => setOpenQuality(openQuality === q.quality ? null : q.quality)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all",
                            openQuality === q.quality
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary hover:bg-secondary/70 text-foreground border-border"
                          )}
                        >
                          {q.quality}
                          {q.size && (
                            <span className={cn(
                              "text-[10px] font-normal",
                              openQuality === q.quality ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {q.size}
                            </span>
                          )}
                        </button>

                        {/* Dropdown links */}
                        {openQuality === q.quality && q.links.length > 0 && (
                          <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg min-w-[160px] overflow-hidden">
                            {q.links.map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors text-foreground"
                                onClick={() => setOpenQuality(null)}
                              >
                                <span>{link.label}</span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Playlist */}
          <div className="w-full lg:w-80 xl:w-96 bg-card border-l border-border flex flex-col h-[360px] lg:h-auto lg:min-h-[500px]">
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <ListVideo className="w-4 h-4 text-primary" /> Playlist
              </h3>
              <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded shrink-0">
                {episodes.length} Eps
              </span>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-2 space-y-1 bg-muted/10 min-h-0">
              {!series ? (
                <div className="p-4 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                episodes.map((ep) => {
                  const epSlug = getEpisodeSlug(ep.url);
                  const isActive = epSlug === episodeSlug;

                  return (
                    <Link
                      key={epSlug}
                      href={`/watch/${seriesSlug}/${epSlug}`}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-secondary border border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-bold font-mono text-xs",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/40"
                            : "bg-muted text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {ep.number}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div
                          className={cn(
                            "font-medium text-xs truncate",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                          )}
                        >
                          {ep.title || `Episode ${ep.number}`}
                        </div>
                        {ep.date && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {ep.date}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
