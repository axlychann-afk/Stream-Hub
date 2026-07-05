import { useGetTrending } from "@workspace/api-client-react";
import { DonghuaCard, DonghuaCardSkeleton } from "@/components/DonghuaCard";
import { Link } from "wouter";
import { ChevronRight, Play, Flame, CalendarClock, History } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const { data: trending, isLoading, error } = useGetTrending();

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <p className="text-destructive font-medium mb-2">Failed to load content</p>
        <p className="text-muted-foreground text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  // Use the first ongoing item as the hero banner if available
  const heroItem = trending?.ongoing?.[0];
  const featuredOngoing = trending?.ongoing?.slice(1, 7) || [];
  const completed = trending?.completed?.slice(0, 6) || [];
  const upcoming = trending?.upcoming?.slice(0, 6) || [];

  return (
    <div className="pb-12">
      <Helmet>
        <title>DonghuaStream — Nonton Donghua Sub Indonesia</title>
        <meta name="description" content="Nonton streaming anime China (Donghua) subtitle Indonesia terlengkap dan terbaru." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[80vh] min-h-[500px] bg-background overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full animate-pulse bg-muted" />
        ) : heroItem ? (
          <>
            <div className="absolute inset-0">
              <img 
                src={heroItem.thumbnail || ''} 
                alt={heroItem.title}
                className="w-full h-full object-cover opacity-50 scale-105"
              />
              <div className="absolute inset-0 poster-mask" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            </div>
            
            <div className="container relative h-full flex flex-col justify-center px-4">
              <div className="max-w-2xl mt-16 animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded bg-primary/20 text-primary font-semibold text-xs tracking-wider uppercase border border-primary/20">
                    Trending
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">{heroItem.type}</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                  {heroItem.title}
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-xl line-clamp-2">
                  Catch the latest episode of {heroItem.title}. Stream it now with high quality Indonesian subtitles.
                </p>
                
                <div className="flex items-center gap-4">
                  <Link 
                    href={`/donghua/${heroItem.slug}`}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Watch Now
                  </Link>
                  <Link 
                    href={`/donghua/${heroItem.slug}`}
                    className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-semibold transition-all backdrop-blur-sm"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <div className="container mx-auto px-4 mt-8 md:-mt-12 relative z-10 space-y-16">
        
        {/* Ongoing Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="text-primary w-6 h-6" />
              Latest Ongoing
            </h2>
            <Link href="/ongoing" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <DonghuaCardSkeleton key={i} />)
              : featuredOngoing.map((item) => (
                  <DonghuaCard key={item.slug} item={item} />
                ))}
          </div>
        </section>

        {/* Completed Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="text-blue-500 w-6 h-6" />
              Recently Completed
            </h2>
            <Link href="/completed" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <DonghuaCardSkeleton key={i} />)
              : completed.map((item) => (
                  <DonghuaCard key={item.slug} item={item} />
                ))}
          </div>
        </section>

        {/* Upcoming Teaser Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarClock className="text-amber-500 w-6 h-6" />
              Upcoming Series
            </h2>
            <Link href="/upcoming" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <DonghuaCardSkeleton key={i} />)
              : upcoming.map((item) => (
                  <DonghuaCard key={item.slug} item={item} />
                ))}
          </div>
        </section>

      </div>
    </div>
  );
}
