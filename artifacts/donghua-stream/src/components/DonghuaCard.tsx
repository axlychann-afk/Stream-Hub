import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { DonghuaItem } from "@workspace/api-client-react";
import { PlayCircle } from "lucide-react";

interface DonghuaCardProps {
  item: DonghuaItem;
  className?: string;
}

export function DonghuaCard({ item, className }: DonghuaCardProps) {
  const isOngoing = item.status?.toLowerCase().includes("ongoing");
  const isCompleted = item.status?.toLowerCase().includes("completed");

  // Shorten status label so it fits on small cards
  const statusLabel = isOngoing ? "Ongoing" : isCompleted ? "Selesai" : item.status ?? "";

  return (
    <Link
      href={`/donghua/${item.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(225,29,72,0.15)] hover:-translate-y-1",
        className
      )}
      data-testid={`card-donghua-${item.slug}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted/50">
            <span className="text-muted-foreground text-xs">No Image</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 card-mask opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Sub badge — top-left only, small */}
        {item.sub && (
          <div className="absolute top-1.5 left-1.5">
            <span className="rounded bg-primary/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
              {item.sub}
            </span>
          </div>
        )}

        {/* Status badge — top-right, color dot + short text */}
        {item.status && (
          <div className="absolute top-1.5 right-1.5">
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white leading-none",
                isOngoing
                  ? "bg-emerald-600/90"
                  : isCompleted
                  ? "bg-blue-600/90"
                  : "bg-amber-500/90"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  isOngoing ? "bg-emerald-300" : isCompleted ? "bg-blue-300" : "bg-amber-300"
                )}
              />
              {statusLabel}
            </span>
          </div>
        )}

        {/* Play overlay — desktop hover only */}
        <div className="absolute inset-0 hidden md:flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
          <div className="bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/30 backdrop-blur-sm">
            <PlayCircle className="w-8 h-8" fill="currentColor" />
          </div>
        </div>

        {/* Title — always visible at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="font-semibold text-white line-clamp-2 text-[11px] leading-tight drop-shadow">
            {item.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export function DonghuaCardSkeleton() {
  return (
    <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-muted border border-border/50" />
  );
}
