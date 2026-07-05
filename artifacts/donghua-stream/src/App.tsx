import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// Pages
import Home from '@/pages/home';
import Ongoing from '@/pages/ongoing';
import Completed from '@/pages/completed';
import Upcoming from '@/pages/upcoming';
import Schedule from '@/pages/schedule';
import SearchPage from '@/pages/search';
import Detail from '@/pages/detail';
import Watch from '@/pages/watch';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <a href="/" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors">
        Return Home
      </a>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
            <Navbar />
            <main className="flex-1 w-full">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/ongoing" component={Ongoing} />
                <Route path="/completed" component={Completed} />
                <Route path="/upcoming" component={Upcoming} />
                <Route path="/schedule" component={Schedule} />
                <Route path="/search" component={SearchPage} />
                <Route path="/donghua/:slug" component={Detail} />
                <Route path="/watch/:seriesSlug/:episodeSlug" component={Watch} />
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
          </div>
        </WouterRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
