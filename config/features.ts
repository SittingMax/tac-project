/**
 * Feature Flags Configuration
 * Control module availability and feature rollout
 */

export interface FeatureFlags {
  modules: {
    shipments: boolean;
    tracking: boolean;
    manifests: boolean;
    scanning: boolean;
    inventory: boolean;
    exceptions: boolean;
    finance: boolean;
    customers: boolean;
    management: boolean;
    analytics: boolean;
  };
  features: {
    offlineScanning: boolean;
    realtimeTracking: boolean;
    emailInvoices: boolean;
    auditLogs: boolean;
    batchLabelPrinting: boolean;
    manifestQRCodes: boolean;
  };
  dataSource: 'mock' | 'supabase';
}

export const FEATURE_FLAGS: FeatureFlags = {
  modules: {
    shipments: true,
    tracking: true,
    manifests: true,
    scanning: true,
    inventory: true,
    exceptions: true,
    finance: true,
    customers: true,
    management: true,
    analytics: true,
  },
  features: {
    offlineScanning: true,
    realtimeTracking: true,
    emailInvoices: false, // Enable when Resend is configured
    auditLogs: true,
    batchLabelPrinting: true,
    manifestQRCodes: true,
  },
  dataSource: 'supabase',
};

export const isModuleEnabled = (module: keyof FeatureFlags['modules']): boolean => {
  return FEATURE_FLAGS.modules[module];
};

export const isFeatureEnabled = (feature: keyof FeatureFlags['features']): boolean => {
  return FEATURE_FLAGS.features[feature];
};

export const getDataSource = (): 'mock' | 'supabase' => {
  return FEATURE_FLAGS.dataSource;
};

/**
 * Usage:
 *
 * import { isModuleEnabled, isFeatureEnabled } from '@/config/features';
 *
 * if (isModuleEnabled('finance')) {
 *   // Show finance module
 * }
 *
 * if (isFeatureEnabled('offlineScanning')) {
 *   // Enable offline scan queue
 * }
 */
