import { useGetTrending } from "@workspace/api-client-react";
import { HeroBanner } from "@/components/HeroBanner";
import { HorizontalRow } from "@/components/HorizontalRow";
import { Helmet } from "react-helmet-async";
import { Flame, History, CalendarClock, TrendingUp } from "lucide-react";

export default function Home() {
  const { data: trending, isLoading, error } = useGetTrending();

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <p className="text-destructive font-medium mb-2">Gagal memuat konten</p>
        <p className="text-muted-foreground text-sm">Coba refresh halaman.</p>
      </div>
    );
  }

  // Hero uses first 5 ongoing items as rotating slides
  const heroItems = trending?.ongoing?.slice(0, 5) ?? [];

  // Sections
  const popularToday = trending?.ongoing?.slice(0, 12) ?? [];
  const latestRelease = trending?.completed?.slice(0, 12) ?? [];
  const upcoming = trending?.upcoming ?? [];
  const moreSeries = trending?.ongoing?.slice(5, 17) ?? [];

  return (
    <div className="pb-16 overflow-x-hidden">
      <Helmet>
        <title>DonghuaStream — Nonton Donghua Sub Indonesia</title>
        <meta
          name="description"
          content="Nonton streaming anime China (Donghua) subtitle Indonesia terlengkap dan terbaru."
        />
      </Helmet>

      {/* Auto-rotating hero banner */}
      <HeroBanner items={heroItems} isLoading={isLoading} />

      {/* Content sections */}
      <div className="mt-6 space-y-8 md:container md:mx-auto md:px-4">

        {/* Popular Today */}
        <HorizontalRow
          title="Popular Today"
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          items={popularToday}
          viewAllHref="/ongoing"
          isLoading={isLoading}
          skeletonCount={8}
        />

        {/* Latest Release */}
        <HorizontalRow
          title="Latest Release"
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          items={latestRelease}
          viewAllHref="/completed"
          isLoading={isLoading}
          skeletonCount={8}
        />

        {/* More Ongoing */}
        {(isLoading || moreSeries.length > 0) && (
          <HorizontalRow
            title="Ongoing Series"
            icon={<History className="w-5 h-5 text-blue-400" />}
            items={moreSeries}
            viewAllHref="/ongoing"
            isLoading={isLoading}
            skeletonCount={6}
          />
        )}

        {/* Upcoming */}
        {(isLoading || upcoming.length > 0) && (
          <HorizontalRow
            title="Coming Soon"
            icon={<CalendarClock className="w-5 h-5 text-amber-400" />}
            items={upcoming}
            viewAllHref="/upcoming"
            isLoading={isLoading}
            skeletonCount={4}
          />
        )}
      </div>
    </div>
  );
}
