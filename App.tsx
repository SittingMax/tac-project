import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useStore } from './store';
import { useAuthStore } from './store/authStore';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { queryClient } from './lib/query-client';
import { PageSkeleton } from './components/ui/skeleton';
import { ErrorBoundary } from './components/ui/error-boundary';
import { PageTransition } from './components/ui/page-transition';
import { ScanningProvider } from './context/ScanningProvider';
import { ScanContextProvider } from './context/ScanContext';
import { GlobalScanListener } from './components/scanning/GlobalScanListener';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { routes, AppRoute } from './routes/index';
import { Login } from './components/auth/Login';

const App: React.FC = () => {
  const { theme } = useStore();
  const { initialize } = useAuthStore();
  useIdleTimeout();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    initialize()
      .then((cleanupFn) => {
        if (mounted) cleanup = cleanupFn;
        else cleanupFn();
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('[App] Auth initialization failed:', error);
      });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ScanningProvider>
        <ScanContextProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <GlobalScanListener />
            <div className="min-h-screen">
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="w-full max-w-7xl p-6">
                      <PageSkeleton />
                    </div>
                  </div>
                }
              >
                <ErrorBoundary>
                  <PageTransition>
                    <main id="main-content" tabIndex={-1} className="outline-none">
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        {routes.map((route: AppRoute) => {
                          const {
                            path,
                            element: Element,
                            protected: isProtected,
                            layout: hasLayout,
                            allowedRoles,
                          } = route;
                          let routeElement = <Element />;

                          if (hasLayout) {
                            routeElement = <DashboardLayout>{routeElement}</DashboardLayout>;
                          }

                          if (isProtected) {
                            routeElement = (
                              <ProtectedRoute allowedRoles={allowedRoles}>
                                {routeElement}
                              </ProtectedRoute>
                            );
                          }

                          return <Route key={path} path={path} element={routeElement} />;
                        })}
                      </Routes>
                    </main>
                  </PageTransition>
                </ErrorBoundary>
              </Suspense>
              <Toaster
                position="top-right"
                richColors
                toastOptions={{ className: '!rounded-none' }}
              />
            </div>
          </Router>
        </ScanContextProvider>
      </ScanningProvider>
    </QueryClientProvider>
  );
};

export default App;
