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
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted/50">
            <span className="text-muted-foreground text-xs">No Image</span>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 card-mask opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {item.type && (
            <span className="rounded bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-medium text-white border border-white/10 uppercase tracking-wider">
              {item.type}
            </span>
          )}
          {item.sub && (
            <span className="rounded bg-primary/80 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-medium text-white border border-white/10">
              {item.sub}
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          {item.status && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm border border-white/10",
              isOngoing ? "bg-emerald-500/80" : isCompleted ? "bg-blue-500/80" : "bg-amber-500/80"
            )}>
              {item.status}
            </span>
          )}
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
          <div className="bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/30 backdrop-blur-sm">
            <PlayCircle className="w-8 h-8" fill="currentColor" />
          </div>
        </div>

        {/* Content Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-semibold text-white line-clamp-2 text-sm leading-tight shadow-sm">
            {item.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export function DonghuaCardSkeleton() {
  return (
    <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-muted border border-border/50"></div>
  );
}
