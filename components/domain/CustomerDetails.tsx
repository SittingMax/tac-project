'use client';

import React from 'react';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotesPanel } from '@/components/domain/NotesPanel';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  FileText,
  Calendar,
  CreditCard,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CustomerDetailsProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, onClose }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
            {customer.type === 'BUSINESS' ? (
              <Building className="w-7 h-7 text-primary" />
            ) : (
              <User className="w-7 h-7 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {customer.companyName || customer.name}
              </h2>
              <Badge variant={customer.tier === 'ENTERPRISE' ? 'secondary' : 'default'}>
                {customer.tier}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {customer.type} • ID: {customer.id}
            </p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact Information */}
          <Card>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Contact Person</div>
                <div className="font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {customer.contactPerson || customer.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <a
                  href={`mailto:${customer.email}`}
                  className="font-medium text-primary hover:underline flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </a>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Phone</div>
                <a
                  href={`tel:${customer.phone}`}
                  className="font-medium text-foreground flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {customer.phone}
                </a>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Address</div>
                <div className="font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {customer.address}
                </div>
              </div>
            </div>
          </Card>

          {/* Business Details */}
          <Card>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">
              Business Details
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {customer.gstin && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">GSTIN</div>
                  <div className="font-mono text-sm text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {customer.gstin}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Active Contracts</div>
                <div className="font-bold text-lg text-foreground">
                  {customer.activeContracts || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Member Since</div>
                <div className="text-sm text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {customer.createdAt.split('T')[0]}
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          {customer.preferences && (
            <Card>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">
                Shipping Preferences
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {customer.preferences.preferredTransportMode && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Preferred Mode</div>
                    <Badge>{customer.preferences.preferredTransportMode}</Badge>
                  </div>
                )}
                {customer.preferences.preferredPaymentMode && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Payment Mode</div>
                    <Badge>{customer.preferences.preferredPaymentMode}</Badge>
                  </div>
                )}
                {customer.preferences.typicalContents && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Typical Contents</div>
                    <div className="text-sm text-foreground">
                      {customer.preferences.typicalContents}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Invoice Stats */}
          {customer.invoiceCount !== undefined && (
            <Card>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">
                Invoice History
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Invoices</div>
                  <div className="font-bold text-2xl text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    {customer.invoiceCount}
                  </div>
                </div>
                {customer.avgInvoiceValue !== undefined && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Avg. Invoice Value</div>
                    <div className="font-bold text-lg text-foreground flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      {formatCurrency(customer.avgInvoiceValue)}
                    </div>
                  </div>
                )}
                {customer.lastInvoiceAt && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Last Invoice</div>
                    <div className="text-sm text-foreground">
                      {customer.lastInvoiceAt.split('T')[0]}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Notes */}
        <div>
          <NotesPanel
            entityType="CUSTOMER"
            entityId={customer.id}
            title="Customer Notes"
            currentUserId="System"
            maxHeight="500px"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
