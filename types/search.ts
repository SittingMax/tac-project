export type SearchEntityType = 'shipment' | 'customer' | 'invoice' | 'manifest' | 'staff' | 'hub';

export interface SearchResult {
  id: string;
  entity_type: SearchEntityType;
  title: string;
  subtitle: string;
  link: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}
