import { Search, Menu, X, Play } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/ongoing", label: "Ongoing" },
  { href: "/completed", label: "Completed" },
  { href: "/schedule", label: "Schedule" },
  { href: "/upcoming", label: "Upcoming" },
];

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update search query when URL changes
  useEffect(() => {
    if (location.startsWith("/search")) {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get("q") || "");
    } else {
      setSearchQuery("");
    }
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/90 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-gradient-to-b from-background/90 to-transparent pt-2"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 z-50">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            Donghua<span className="text-primary">Stream</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-secondary/50 border border-border/50 rounded-full px-2 py-1 backdrop-blur-md">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors hover:text-foreground",
                location === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <form
            onSubmit={handleSearch}
            className="relative hidden sm:flex items-center"
          >
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search donghua..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary/50 border border-border/50 rounded-full pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all backdrop-blur-md"
            />
          </form>

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-xl transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "translate-y-0 opacity-100 h-screen sm:h-auto" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="pt-20 pb-6 px-4 flex flex-col gap-4 h-full">
          <form onSubmit={handleSearch} className="relative sm:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search donghua..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary/80 border border-border rounded-xl pl-10 pr-4 py-3 text-base w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </form>
          
          <div className="flex flex-col gap-2 mt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-lg font-medium transition-colors",
                  location === link.href
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
