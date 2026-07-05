import { useGetUpcoming } from "@workspace/api-client-react";
import { DonghuaCard, DonghuaCardSkeleton } from "@/components/DonghuaCard";
import { Helmet } from "react-helmet-async";
import { CalendarClock } from "lucide-react";

export default function Upcoming() {
  const { data, isLoading } = useGetUpcoming();
  const results = data?.results || [];

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 min-h-screen">
      <Helmet>
        <title>Upcoming Donghua | DonghuaStream</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <CalendarClock className="text-amber-500 w-8 h-8" />
          Upcoming Series
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Announced series that are coming soon.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {isLoading ? (
          Array(12).fill(0).map((_, i) => <DonghuaCardSkeleton key={i} />)
        ) : (
          results.map((item) => <DonghuaCard key={item.slug} item={item} />)
        )}
      </div>
      
      {!isLoading && results.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          No upcoming series found.
        </div>
      )}
    </div>
  );
}
