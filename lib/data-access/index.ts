import {
  Shipment,
  Manifest,
  Invoice,
  Exception,
  User,
  Customer,
  TrackingEvent,
  AuditLog,
  ShipmentStatus,
  HubLocation,
  InvoiceStatus,
} from '../../types';

export interface DataAccessLayer {
  shipments: ShipmentRepository;
  manifests: ManifestRepository;
  invoices: InvoiceRepository;
  exceptions: ExceptionRepository;
  users: UserRepository;
  customers: CustomerRepository;
  events: EventRepository;
  audit: AuditRepository;
}

export interface ShipmentRepository {
  getAll(): Promise<Shipment[]>;
  getByAWB(awb: string): Promise<Shipment | null>;
  create(data: Shipment): Promise<Shipment>;
  updateStatus(
    id: string,
    status: ShipmentStatus,
    description: string,
    hubId?: HubLocation
  ): Promise<void>;
}

export interface ManifestRepository {
  getAll(): Promise<Manifest[]>;
  getByRef(ref: string): Promise<Manifest | null>;
  create(data: Manifest): Promise<Manifest>;
  updateStatus(id: string, status: 'DEPARTED' | 'ARRIVED'): Promise<void>;
  addShipment(manifestId: string, shipmentId: string): Promise<void>;
}

export interface InvoiceRepository {
  getAll(): Promise<Invoice[]>;
  create(data: Invoice): Promise<Invoice>;
  updateStatus(id: string, status: InvoiceStatus): Promise<void>;
}

export interface ExceptionRepository {
  getAll(): Promise<Exception[]>;
  create(data: Exception): Promise<Exception>;
  resolve(id: string, notes: string): Promise<void>;
}

export interface UserRepository {
  getAll(): Promise<User[]>;
  create(data: User): Promise<User>;
  updateStatus(id: string, active: boolean): Promise<void>;
}

export interface CustomerRepository {
  getAll(): Promise<Customer[]>;
  create(data: Customer): Promise<Customer>;
}

export interface EventRepository {
  getByShipmentId(shipmentId: string): Promise<TrackingEvent[]>;
  create(data: TrackingEvent): Promise<TrackingEvent>;
}

export interface AuditRepository {
  getAll(): Promise<AuditLog[]>;
  log(
    action: string,
    entityType: string,
    entityId: string,
    payload?: Record<string, unknown>
  ): Promise<void>;
}
