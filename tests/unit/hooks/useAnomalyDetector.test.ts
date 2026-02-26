import { describe, it, expect } from 'vitest';
import { analyzeShipments } from '../../../hooks/useAnomalyDetector';

describe('Anomaly Detector Heuristics', () => {
    it('should detect a ROUTE_MISMATCH when origin and destination hubs match', () => {
        const now = new Date('2026-02-21T12:00:00Z');

        // @ts-ignore (mocking minimal required fields)
        const mockShipment = {
            id: 'shp-123',
            status: 'IN_TRANSIT',
            created_at: '2026-02-20T12:00:00Z',
            origin_hub_id: 'hub_delhi_1',
            destination_hub_id: 'hub_delhi_1' // Match!
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anomalies = analyzeShipments([mockShipment as any], now);

        expect(anomalies).toHaveLength(1);
        expect(anomalies[0].type).toBe('ROUTE_MISMATCH');
        expect(anomalies[0].severity).toBe('CRITICAL');
    });

    it('should detect DELAY anomaly when pending shipment has not moved for 48+ hours', () => {
        // 3 days ago from "now"
        const now = new Date('2026-02-21T12:00:00Z');
        const created = new Date('2026-02-18T12:00:00Z');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const mockShipment = {
            id: 'shp-delay',
            status: 'PENDING',
            created_at: created.toISOString(),
            origin_hub_id: 'hub_delhi_1',
            destination_hub_id: 'hub_imphal_1'
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anomalies = analyzeShipments([mockShipment as any], now);

        expect(anomalies).toHaveLength(1);
        expect(anomalies[0].type).toBe('DELAY');
        expect(anomalies[0].severity).toBe('MEDIUM');
    });

    it('should detect STALLED anomaly when IN_TRANSIT shipment has no updates for 3+ days', () => {
        // 6 days ago from "now"
        const now = new Date('2026-02-21T12:00:00Z');
        const created = new Date('2026-02-15T12:00:00Z');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const mockShipment = {
            id: 'shp-stalled',
            status: 'IN_TRANSIT',
            created_at: created.toISOString(),
            origin_hub_id: 'hub_delhi_1',
            destination_hub_id: 'hub_imphal_1'
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anomalies = analyzeShipments([mockShipment as any], now);

        expect(anomalies).toHaveLength(1);
        expect(anomalies[0].type).toBe('STALLED');
        expect(anomalies[0].severity).toBe('CRITICAL'); // Since > 5 days it escalates to CRITICAL
    });

    it('should sort anomalies by severity properly', () => {
        const now = new Date('2026-02-21T12:00:00Z');

        const mockShipments = [
            {
                id: 'shp-delay',
                status: 'PENDING',
                created_at: '2026-02-18T12:00:00Z', // DELAY -> MEDIUM
                origin_hub_id: 'hub_delhi_1',
                destination_hub_id: 'hub_imphal_1'
            },
            {
                id: 'shp-mismatch',
                status: 'IN_TRANSIT',
                created_at: '2026-02-20T12:00:00Z',
                origin_hub_id: 'hub_delhi_1',
                destination_hub_id: 'hub_delhi_1' // ROUTE_MISMATCH -> CRITICAL
            }
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anomalies = analyzeShipments(mockShipments as any, now);

        expect(anomalies).toHaveLength(2);
        // Highest severity first
        expect(anomalies[0].type).toBe('ROUTE_MISMATCH');
        expect(anomalies[1].type).toBe('DELAY');
    });
});
