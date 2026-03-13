/**
 * GlobalScanListener - The SINGLE authoritative scan router
 *
 * This is the ONLY component that handles scan-to-navigation routing.
 * All other components (Header, QuickActions, etc.) may subscribe for
 * display-only purposes but MUST NOT navigate on scan events.
 *
 * Routing Rules:
 * 1. Context is NOT GLOBAL → Skip (local handler owns scanning)
 * 2. CN format (TAC...) → Preview dialog with shipment details
 * 3. Manifest format (MAN...) → Preview dialog with manifest details
 * 4. Unknown format → Preview dialog with copy option
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useScanner } from '@/context/useScanner';
import { useScanContext } from '@/context/ScanContext';
import { ScanSource } from '@/types';
import { parseScanInput } from '@/lib/scanParser';
import { ScanPreviewDialog, type ScanPreviewType } from './ScanPreviewDialog';

export const GlobalScanListener: React.FC = () => {
  const { subscribe } = useScanner();
  const { canNavigate, activeContext } = useScanContext();
  const location = useLocation();

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<ScanPreviewType>('unknown');

  // Use refs to avoid stale closures in the subscription callback
  const canNavigateRef = useRef(canNavigate);
  const activeContextRef = useRef(activeContext);
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    canNavigateRef.current = canNavigate;
    activeContextRef.current = activeContext;
    pathnameRef.current = location.pathname;
  }, [canNavigate, activeContext, location.pathname]);

  const handleScan = useCallback((data: string, source: ScanSource) => {
    const cleanData = data.trim().toUpperCase();
    const currentContext = activeContextRef.current;
    const currentCanNavigate = canNavigateRef.current();
    const currentPath = pathnameRef.current;

    // eslint-disable-next-line no-console
    console.debug('[GlobalScanListener] Scan received:', {
      data: cleanData,
      source,
      activeContext: currentContext,
      canNavigate: currentCanNavigate,
      pathname: pathnameRef.current,
    });

    // Rule 1: Dedicated scanning page always handles scans locally
    if (currentPath?.startsWith('/scanning')) {
      // eslint-disable-next-line no-console
      console.debug('[GlobalScanListener] Skipping - /scanning handles locally');
      return;
    }

    // Rule 2: If a local handler owns scanning, skip entirely
    if (!currentCanNavigate) {
      // eslint-disable-next-line no-console
      console.debug(`[GlobalScanListener] Skipping - local context active: ${currentContext}`);
      return;
    }

    // Use the canonical scan parser for type detection
    try {
      const parsed = parseScanInput(cleanData);

      switch (parsed.type) {
        case 'shipment':
          setPreviewType('shipment');
          break;
        case 'manifest':
          setPreviewType('manifest');
          break;
        case 'package':
          setPreviewType('shipment'); // packages resolve to shipment preview
          break;
        default:
          setPreviewType('unknown');
      }

      setPreviewData(cleanData);
      setPreviewOpen(true);
    } catch {
      // parseScanInput threw ValidationError — treat as unknown
      setPreviewType('unknown');
      setPreviewData(cleanData);
      setPreviewOpen(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(handleScan);
    return () => {
      unsubscribe();
    };
  }, [subscribe, handleScan]);

  return (
    <ScanPreviewDialog
      open={previewOpen}
      onOpenChange={setPreviewOpen}
      scannedData={previewData}
      scanType={previewType}
    />
  );
};
