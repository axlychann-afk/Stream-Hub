import { useGetOngoing } from "@workspace/api-client-react";
import { DonghuaCard, DonghuaCardSkeleton } from "@/components/DonghuaCard";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Ongoing() {
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState<any[]>([]);
  const { data, isLoading, isFetching } = useGetOngoing(
    { page },
    { query: { keepPreviousData: true } as any }
  );

  useEffect(() => {
    if (!data?.results) return;
    const newResults = data.results;
    if (page === 1) {
      setAllResults(newResults);
    } else {
      setAllResults(prev => {
        const existingSlugs = new Set(prev.map(r => r.slug));
        const toAdd = newResults.filter((r: any) => !existingSlugs.has(r.slug));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }
  }, [data, page]);

  const results = allResults.length > 0 ? allResults : (data?.results || []);
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 min-h-screen">
      <Helmet>
        <title>Ongoing Donghua | DonghuaStream</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <Flame className="text-primary w-8 h-8" />
          Ongoing Series
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Catch up on the latest airing donghua episodes.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {isLoading && page === 1 ? (
          Array(12).fill(0).map((_, i) => <DonghuaCardSkeleton key={i} />)
        ) : (
          results.map((item: any) => <DonghuaCard key={item.slug} item={item} />)
        )}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={isFetching}
            className={cn(
              "px-8 py-3 rounded-full bg-secondary hover:bg-secondary/80 font-medium transition-all",
              isFetching && "opacity-70 cursor-not-allowed"
            )}
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
