export type ManifestBuilderPhase = 'settings' | 'build';

export type ManifestScanMode = 'manual' | 'scanner' | 'camera';

export interface HubOption {
  id: string;
  code: string;
  name: string;
}

export interface ManifestRules {
  onlyReady: boolean;
  matchDestination: boolean;
  excludeCod: boolean;
}
