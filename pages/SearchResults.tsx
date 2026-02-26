import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, FileText, Truck, Box } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { data: results, isLoading, error } = useGlobalSearch(query);
  const isAuto = searchParams.get('auto') === 'true';

  // Auto-redirect if only one result found and auto mode is on
  React.useEffect(() => {
    if (isAuto && !isLoading && results?.length === 1) {
      const result = results[0];
      // Route shipments to the invoice/finance page (not shipment detail)
      if (result.entity_type === 'shipment' && result.title) {
        navigate(`/finance?awb=${encodeURIComponent(result.title)}`, { replace: true });
        toast.success(`Opening invoice for: ${result.title}`);
      } else {
        navigate(result.link, { replace: true });
        toast.success(`Found ${result.entity_type}: ${result.title}`);
      }
    }
  }, [isAuto, isLoading, results, navigate]);

  if (!query) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          title="Search Results"
          description="Enter a query to search across the platform."
        />
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
          <div className="mb-4 p-4 rounded-none bg-muted/50">
            <Box className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-lg font-medium">Start typing to search</p>
          <p className="text-sm">Search by CN, Name, Phone, Invoice No, etc.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={`Search Results for "${query}"`}
        description={isLoading ? 'Searching...' : `Found ${results?.length || 0} matches.`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-destructive border-destructive/20 bg-destructive/5">
          <p>Failed to load search results. Please try again.</p>
        </Card>
      ) : results?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
          <div className="mb-4 p-4 rounded-none bg-muted/50">
            <Box className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm">Try using different keywords or verify the spelling.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-1">
          {results?.map((result) => (
            <div
              key={`${result.entity_type}-${result.id}`}
              onClick={() => navigate(result.link)}
              className="group cursor-pointer"
            >
              <Card className="hover:shadow-md transition-shadow dark:hover:bg-primary/5">
                <CardContent className="p-4">
                  {result.entity_type === 'shipment' && (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground">{result.title}</div>
                        <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.origin} → {result.metadata.destination}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {result.entity_type === 'customer' && (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground">{result.title}</div>
                        <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                        <div className="mt-1 text-xs text-muted-foreground font-mono">
                          {result.metadata.code}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {result.entity_type === 'invoice' && (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {result.title}
                        </div>
                        <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              result.metadata.status === 'paid'
                                ? 'text-status-success bg-status-success/10 border-status-success/30'
                                : 'text-status-warning bg-status-warning/10 border-status-warning/30'
                            )}
                          >
                            {result.metadata.status}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {result.entity_type === 'manifest' && (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          {result.title}
                        </div>
                        <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {result.metadata.vehicle}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {(result.entity_type === 'staff' || result.entity_type === 'hub') && (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground">{result.title}</div>
                        <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
