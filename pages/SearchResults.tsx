import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { PageContainer, PageHeader, SectionCard } from '@/components/ui-core/layout';
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
      navigate(result.link, { replace: true });
      toast.success(`Found ${result.entity_type}: ${result.title}`);
    }
  }, [isAuto, isLoading, results, navigate]);

  if (!query) {
    return (
      <PageContainer>
        <PageHeader
          title="Search Results"
          description="Enter a query to search across the platform."
        />
        <SectionCard>
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-4 rounded-lg bg-muted/50 p-4">
              <Box size={32} strokeWidth={1.5} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">Start typing to search</p>
            <p className="text-sm">Search by CN, Name, Phone, Invoice No, etc.</p>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Search Results for "${query}"`}
        description={isLoading ? 'Searching...' : `Found ${results?.length || 0} matches.`}
      />

      {isLoading ? (
        <SectionCard>
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-primary" />
          </div>
        </SectionCard>
      ) : error ? (
        <SectionCard>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <p>Failed to load search results. Please try again.</p>
          </div>
        </SectionCard>
      ) : results?.length === 0 ? (
        <SectionCard>
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-4 rounded-lg bg-muted/50 p-4">
              <Box size={32} strokeWidth={1.5} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm">Try using different keywords or verify the spelling.</p>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Matches" description="Select a result to open the related workflow.">
          <div className="grid gap-4">
            {(results ?? []).map((result) => (
              <div
                key={`${result.entity_type}-${result.id}`}
                onClick={() => navigate(result.link)}
                className="group cursor-pointer"
              >
                <Card className="transition-shadow hover:shadow-md dark:hover:bg-primary/5">
                  <CardContent className="p-4">
                    {result.entity_type === 'shipment' && (
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-foreground">{result.title}</div>
                          <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                          <div className="mt-2 flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {result.metadata.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {result.metadata.origin} → {result.metadata.destination}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight size={20} strokeWidth={1.5} className="text-muted-foreground" />
                      </div>
                    )}

                    {result.entity_type === 'customer' && (
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-foreground">{result.title}</div>
                          <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                          <div className="mt-1 font-mono text-xs text-muted-foreground">
                            {result.metadata.code}
                          </div>
                        </div>
                        <ArrowRight size={20} strokeWidth={1.5} className="text-muted-foreground" />
                      </div>
                    )}

                    {result.entity_type === 'invoice' && (
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <FileText size={16} strokeWidth={1.5} className="text-muted-foreground" />
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
                        <ArrowRight size={20} strokeWidth={1.5} className="text-muted-foreground" />
                      </div>
                    )}

                    {result.entity_type === 'manifest' && (
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <Truck size={16} strokeWidth={1.5} className="text-muted-foreground" />
                            {result.title}
                          </div>
                          <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                          <div className="mt-2 flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {result.metadata.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {result.metadata.vehicle}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={20} strokeWidth={1.5} className="text-muted-foreground" />
                      </div>
                    )}

                    {(result.entity_type === 'staff' || result.entity_type === 'hub') && (
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-foreground">{result.title}</div>
                          <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                        </div>
                        <ArrowRight size={20} strokeWidth={1.5} className="text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </PageContainer>
  );
};
