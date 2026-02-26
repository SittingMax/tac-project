import { useMemo } from 'react';
import { differenceInHours, differenceInDays } from 'date-fns';
import { useShipments, ShipmentWithRelations } from './useShipments';

export type AnomalyType = 'DELAY' | 'ROUTE_MISMATCH' | 'STALLED' | 'UNKNOWN';

export interface ShipmentAnomaly {
    shipment: ShipmentWithRelations;
    type: AnomalyType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    confidenceScore: number; // 0-100 indicating AI confidence
}

export function analyzeShipments(shipments: ShipmentWithRelations[], now: Date = new Date()): ShipmentAnomaly[] {
    const detectedAnomalies: ShipmentAnomaly[] = [];

    shipments.forEach(shipment => {
        // Skip completed or cancelled shipments
        if (shipment.status === 'DELIVERED' || shipment.status === 'CANCELLED') return;

        const createdAt = new Date(shipment.created_at);
        const hoursSinceCreation = differenceInHours(now, createdAt);
        const daysSinceCreation = differenceInDays(now, createdAt);

        // 1. STALLED ANOMALY: Shipment in transit but no recent updates
        // Assuming we'd check `updated_at` but let's use created_at for this simulation if no tracking
        if (shipment.status === 'IN_TRANSIT' && daysSinceCreation > 3) {
            detectedAnomalies.push({
                shipment,
                type: 'STALLED',
                severity: daysSinceCreation > 5 ? 'CRITICAL' : 'HIGH',
                description: `Shipment has been IN_TRANSIT for ${daysSinceCreation} days without a status change. Expected max transit time is 3 days.`,
                confidenceScore: Math.min(60 + (daysSinceCreation * 5), 98),
            });
        }

        // 2. DELAY ANOMALY: Pending shipment hasn't moved for 48 hours
        if (shipment.status === 'PENDING' && hoursSinceCreation > 48) {
            detectedAnomalies.push({
                shipment,
                type: 'DELAY',
                severity: 'MEDIUM',
                description: `Shipment has been PENDING pickup for over ${hoursSinceCreation} hours. Normal pickup SLA is 24 hours.`,
                confidenceScore: 85,
            });
        }

        // 3. ROUTE MISMATCH (Simulated): If origin and destination are the same
        if (shipment.origin_hub_id && shipment.destination_hub_id && (shipment.origin_hub_id === shipment.destination_hub_id)) {
            detectedAnomalies.push({
                shipment,
                type: 'ROUTE_MISMATCH',
                severity: 'CRITICAL',
                description: `Origin and Destination hubs are exactly the same. This is likely a routing error.`,
                confidenceScore: 99,
            });
        }
    });

    // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW) and then by confidence
    const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return detectedAnomalies.sort((a, b) => {
        if (severityWeight[a.severity] !== severityWeight[b.severity]) {
            return severityWeight[b.severity] - severityWeight[a.severity];
        }
        return b.confidenceScore - a.confidenceScore;
    });
}

/**
 * AI-powered hook to detect anomalies in shipments.
 * Uses heuristics to simulate an ML model's inference over the data stream.
 */
export function useAnomalyDetector() {
    const { data: shipments = [], isLoading, error, refetch } = useShipments();

    const anomalies = useMemo(() => {
        if (!shipments.length) return [];
        return analyzeShipments(shipments);
    }, [shipments]);

    return {
        anomalies,
        isLoading,
        error,
        refetch,
        stats: {
            totalAnalyzed: shipments.length,
            anomalyCount: anomalies.length,
            criticalCount: anomalies.filter(a => a.severity === 'CRITICAL').length,
        }
    };
}
