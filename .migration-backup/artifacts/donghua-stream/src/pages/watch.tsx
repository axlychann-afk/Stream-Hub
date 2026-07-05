import { useGetStream, useGetDonghuaDetail, getGetStreamQueryKey, getGetDonghuaDetailQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

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

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto scroll to top when episode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [episodeSlug]);

  const series = detailData?.result;
  const episodes = series?.episodes || [];
  
  // Helper to extract slug
  const getEpisodeSlug = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').filter(Boolean).pop() || '';
    } catch {
      const parts = url.split('/').filter(Boolean);
      return parts[parts.length - 1] || url;
    }
  };

  // Find current episode index in the list
  const currentIndex = episodes.findIndex(ep => getEpisodeSlug(ep.url) === episodeSlug);

  // Episodes are sorted ascending (ep 1, 2, 3 ...) from the backend
  // Next = higher index = higher episode number; Prev = lower index
  const nextEpisode = currentIndex !== -1 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;

  const currentEpInfo = currentIndex !== -1 ? episodes[currentIndex] : null;
  const stream = streamData?.result;

  return (
    <div className="min-h-screen bg-background pt-16 pb-12 flex flex-col">
      <Helmet>
        <title>{stream?.title || `Episode ${currentEpInfo?.number || ''}`} | {series?.title || 'Watch'} | DonghuaStream</title>
      </Helmet>

      {/* Main Player Area */}
      <div className="bg-black border-b border-border">
        <div className="container mx-auto px-0 lg:px-4 flex flex-col lg:flex-row">
          
          {/* Player Column */}
          <div className="flex-1 w-full relative group">
            <div className="aspect-video w-full bg-zinc-950 relative flex items-center justify-center overflow-hidden lg:rounded-b-none lg:rounded-tl-lg">
              {streamLoading ? (
                <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                  <p>Loading stream...</p>
                </div>
              ) : streamError || !stream?.embed_url ? (
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
                  src={stream.embed_url}
                  className="w-full h-full border-0 absolute inset-0"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              )}
            </div>

            {/* Player Controls Bar */}
            <div className="bg-card/90 border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-white truncate" title={stream?.title || currentEpInfo?.title}>
                  {stream?.title || currentEpInfo?.title || "Loading Episode..."}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <Link href={`/donghua/${seriesSlug}`} className="hover:text-primary transition-colors truncate max-w-[200px] md:max-w-md">
                    {series?.title || "Loading Series..."}
                  </Link>
                  {stream?.source && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-primary/20 text-primary border border-primary/20">
                        {stream.source}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link 
                  href={prevEpisode ? `/watch/${seriesSlug}/${getEpisodeSlug(prevEpisode.url)}` : "#"}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors tooltip-trigger",
                    !prevEpisode && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Link>
                <Link 
                  href={nextEpisode ? `/watch/${seriesSlug}/${getEpisodeSlug(nextEpisode.url)}` : "#"}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors tooltip-trigger text-primary",
                    !nextEpisode && "opacity-50 cursor-not-allowed pointer-events-none text-foreground"
                  )}
                  title="Next Episode"
                >
                  <ChevronRight className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Playlist */}
          <div className="w-full lg:w-80 xl:w-96 bg-card border-l border-border flex flex-col h-[400px] lg:h-auto lg:min-h-[500px]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-bold flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-primary" /> Playlist
              </h3>
              <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded">
                {episodes.length} Eps
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar p-2 space-y-1 bg-muted/10">
              {!series ? (
                <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : episodes.map((ep) => {
                const epSlug = getEpisodeSlug(ep.url);
                const isActive = epSlug === episodeSlug;
                
                return (
                  <Link
                    key={epSlug}
                    href={`/watch/${seriesSlug}/${epSlug}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-secondary border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold font-mono text-sm",
                      isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/40" : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}>
                      {ep.number}
                    </div>
                    <div className="min-w-0">
                      <div className={cn(
                        "font-medium text-sm truncate",
                        isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {ep.title || `Episode ${ep.number}`}
                      </div>
                      {ep.date && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {ep.date}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
