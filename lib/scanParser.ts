/**
 * Scan Parser
 * Parses barcode/QR scan inputs into structured data
 * Supports: raw AWB, JSON payload, manifest QR
 */

import { ValidationError } from '@/lib/errors';

export type ScanType = 'shipment' | 'manifest' | 'package';

export interface ScanResult {
  type: ScanType;
  awb?: string;
  manifestId?: string;
  manifestNo?: string;
  packageId?: string;
  route?: string;
  metadata?: Record<string, unknown>;
  raw: string;
}

export interface ScanPayloadV1 {
  v: 1;
  type?: 'shipment' | 'manifest' | 'package';
  awb?: string;
  id?: string;
  manifestNo?: string;
  packageId?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parse scan input into structured result
 * Supports:
 * 1. Raw awb: TAC123456789 or CN-2026-0001
 * 2. JSON shipment: {"v":1,"awb":"TAC123456789"}
 * 3. JSON manifest: {"v":1,"type":"manifest","id":"uuid","manifestNo":"MNF-2024-000001"}
 * 4. JSON package: {"v":1,"type":"package","packageId":"PKG-001"}
 */
export function parseScanInput(input: string): ScanResult {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new ValidationError('Empty scan input');
  }

  // 1. Try raw CN format (TAC, WGS, or legacy WEE followed by digits)
  if (/^(TAC|WEE|WGS)\d{8,11}$/i.test(trimmed)) {
    return {
      type: 'shipment',
      awb: trimmed.toUpperCase(),
      raw: trimmed,
    };
  }

  // 1b. Try CN- or TAC- format (e.g., CN-2026-0001). Legacy: WEE-
  if (/^(CN|WEE|TAC)-\d{4}-\d{4}$/i.test(trimmed)) {
    return {
      type: 'shipment',
      awb: trimmed.toUpperCase(),
      raw: trimmed,
    };
  }

  // 2. Try JSON payload
  if (trimmed.startsWith('{')) {
    try {
      const payload = JSON.parse(trimmed) as ScanPayloadV1;

      // Validate version
      if (payload.v !== 1) {
        throw new ValidationError('Unsupported scan payload version');
      }

      // Handle manifest scan
      if (payload.type === 'manifest') {
        if (!payload.id && !payload.manifestNo) {
          throw new ValidationError('Manifest scan requires id or manifestNo');
        }
        return {
          type: 'manifest',
          manifestId: payload.id,
          manifestNo: payload.manifestNo,
          route: payload.route,
          metadata: payload.metadata,
          raw: trimmed,
        };
      }

      // Handle package scan
      if (payload.type === 'package') {
        if (!payload.packageId) {
          throw new ValidationError('Package scan requires packageId');
        }
        return {
          type: 'package',
          packageId: payload.packageId,
          awb: payload.awb,
          metadata: payload.metadata,
          raw: trimmed,
        };
      }

      // Handle shipment scan (default)
      if (payload.awb) {
        if (
          !/^(TAC|WEE|WGS)\d{8,11}$/i.test(payload.awb) &&
          !/^(CN|WEE|TAC)-\d{4}-\d{4}$/i.test(payload.awb)
        ) {
          throw new ValidationError('Invalid CN format in payload');
        }
        return {
          type: 'shipment',
          awb: payload.awb.toUpperCase(),
          metadata: payload.metadata,
          raw: trimmed,
        };
      }

      throw new ValidationError('Invalid scan payload structure');
    } catch (e) {
      if (e instanceof ValidationError) throw e;
      throw new ValidationError('Invalid JSON in scan input');
    }
  }

  // 3. Try manifest number format (MNF-YYYY-XXXXXX) or legacy MAN- format
  const legacyManifestMatch = /^MAN-(\d{4})-(\d{5})$/i.exec(trimmed);
  if (legacyManifestMatch) {
    return {
      type: 'manifest',
      manifestNo: trimmed.toUpperCase(),
      raw: trimmed,
    };
  }

  if (/^(MNF|WEE-MNF)-\d{4}-\d{6}$/i.test(trimmed)) {
    return {
      type: 'manifest',
      manifestNo: trimmed.toUpperCase(),
      raw: trimmed,
    };
  }

  // 4. Unknown format — pass through as raw shipment token
  // instead of throwing, allowing the service layer to attempt a lookup
  return {
    type: 'shipment',
    awb: trimmed.toUpperCase(),
    raw: trimmed,
  };
}

/**
 * Validate CN format
 */
export function isValidAWB(awb: string): boolean {
  return /^(TAC|WEE|WGS)\d{8,11}$/i.test(awb) || /^(CN|WEE|TAC)-\d{4}-\d{4}$/i.test(awb);
}

/**
 * Generate QR payload for manifest
 */
export function generateManifestQRPayload(manifest: {
  id: string;
  manifestNo: string;
  fromHubCode: string;
  toHubCode: string;
}): string {
  const payload: ScanPayloadV1 = {
    v: 1,
    type: 'manifest',
    id: manifest.id,
    manifestNo: manifest.manifestNo,
    route: `${manifest.fromHubCode}-${manifest.toHubCode}`,
  };
  return JSON.stringify(payload);
}

/**
 * Generate QR payload for shipment
 */
export function generateShipmentQRPayload(awb: string): string {
  const payload: ScanPayloadV1 = {
    v: 1,
    awb: awb.toUpperCase(),
  };
  return JSON.stringify(payload);
}
