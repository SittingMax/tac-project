/* eslint-disable @typescript-eslint/no-explicit-any -- Data mapping requires any */

import React from 'react';
import { ManifestWithRelations } from '../../hooks/useManifests';

interface Props {
  manifest: ManifestWithRelations;
  items: any[];
}

// Using Global Standard Layout (IATA inspired)
export const ManifestPrintView = React.forwardRef<HTMLDivElement, Props>(
  ({ manifest, items }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black font-sans print-container">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">Cargo Manifest</h1>
              <div className="text-sm mt-1">TAC Logistics Pvt Ltd</div>
              <div className="text-xs">Imphal International Airport, Imphal - 795001</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-bold">{manifest.manifest_no}</div>
              <div className="text-sm mt-1">
                Date: {new Date(manifest.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="border p-4">
            <div className="font-bold text-xs uppercase text-muted-foreground mb-2">Sector</div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>
                {manifest.from_hub?.code} ({manifest.from_hub?.name})
              </span>
              <span>→</span>
              <span>
                {manifest.to_hub?.code} ({manifest.to_hub?.name})
              </span>
            </div>
          </div>
          <div className="border p-4">
            <div className="font-bold text-xs uppercase text-muted-foreground mb-2">
              Transport Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Mode</div>
                <div className="font-bold">{manifest.type}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Vehicle / Flight</div>
                <div className="font-bold">{(manifest.vehicle_meta as any)?.identifier}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Manifest Items Table */}
        <table className="w-full text-xs mb-8 border-collapse">
          <thead>
            <tr className="bg-muted border-y border-black">
              <th className="p-2 text-left w-12">#</th>
              <th className="p-2 text-left w-32">CN Number</th>
              <th className="p-2 text-left">Consignee</th>
              <th className="p-2 text-left">Destination</th>
              <th className="p-2 text-right">Pkgs</th>
              <th className="p-2 text-right">Weight (kg)</th>
              <th className="p-2 text-left pl-4">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-border">
                <td className="p-2">{index + 1}</td>
                <td className="p-2 font-mono font-bold">{item.shipment.cn_number}</td>
                <td className="p-2 truncate max-w-[150px]">{item.shipment.consignee_name}</td>
                <td className="p-2">
                  {item.shipment.destination_hub_id === manifest.to_hub_id ? 'Local' : 'Transit'}
                </td>
                <td className="p-2 text-right">{item.shipment.package_count}</td>
                <td className="p-2 text-right">{item.shipment.total_weight}</td>
                <td className="p-2 pl-4 italic text-muted-foreground">
                  {item.shipment.special_instructions || '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold bg-muted">
              <td colSpan={4} className="p-2 text-right uppercase">
                Total
              </td>
              <td className="p-2 text-right">{manifest.total_packages}</td>
              <td className="p-2 text-right">{manifest.total_weight} kg</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Footer / Signatures */}
        <div className="grid grid-cols-2 gap-20 mt-12 pt-12">
          <div className="border-t border-black pt-2">
            <div className="font-bold">Dispatch Officer</div>
            <div className="text-xs mt-1">Name: {manifest.creator?.full_name}</div>
            <div className="text-xs">Date: {new Date().toLocaleString()}</div>
          </div>
          <div className="border-t border-black pt-2">
            <div className="font-bold">Received By</div>
            <div className="text-xs mt-1">Signature & Stamp</div>
          </div>
        </div>

        <div className="mt-12 text-[10px] text-muted-foreground text-center">
          Generated by TAC Cargo • {manifest.id} • Page 1 of 1
        </div>

        <style>{`
                @media print {
                    .print-container { padding: 0; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
      </div>
    );
  }
);
