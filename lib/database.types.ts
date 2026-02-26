export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_staff_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          ip_address: string | null;
          org_id: string;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_staff_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          ip_address?: string | null;
          org_id: string;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_staff_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          ip_address?: string | null;
          org_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_staff_id_fkey';
            columns: ['actor_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_logs_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: {
          consignee_details: Json;
          consignor_details: Json;
          created_at: string | null;
          id: string;
          images: string[] | null;
          status: string;
          updated_at: string | null;
          user_id: string | null;
          volume_matrix: Json;
          whatsapp_number: string | null;
        };
        Insert: {
          consignee_details: Json;
          consignor_details: Json;
          created_at?: string | null;
          id?: string;
          images?: string[] | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
          volume_matrix: Json;
          whatsapp_number?: string | null;
        };
        Update: {
          consignee_details?: Json;
          consignor_details?: Json;
          created_at?: string | null;
          id?: string;
          images?: string[] | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
          volume_matrix?: Json;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          archived: boolean;
          created_at: string;
          email: string | null;
          id: string;
          message: string;
          name: string;
          phone: string | null;
          replied: boolean | null;
          replied_at: string | null;
          replies: Json | null;
          reply_content: string | null;
          status: string;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
          replied?: boolean | null;
          replied_at?: string | null;
          replies?: Json | null;
          reply_content?: string | null;
          status?: string;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
          replied?: boolean | null;
          replied_at?: string | null;
          replies?: Json | null;
          reply_content?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address: Json | null;
          billing_address: Json | null;
          created_at: string | null;
          credit_limit: number | null;
          current_balance: number | null;
          customer_code: string;
          deleted_at: string | null;
          email: string | null;
          gstin: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          org_id: string;
          phone: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          address?: Json | null;
          billing_address?: Json | null;
          created_at?: string | null;
          credit_limit?: number | null;
          current_balance?: number | null;
          customer_code: string;
          deleted_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          org_id: string;
          phone: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          address?: Json | null;
          billing_address?: Json | null;
          created_at?: string | null;
          credit_limit?: number | null;
          current_balance?: number | null;
          customer_code?: string;
          deleted_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          org_id?: string;
          phone?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      exceptions: {
        Row: {
          assigned_to_staff_id: string | null;
          created_at: string | null;
          description: string;
          id: string;
          images: Json | null;
          org_id: string;
          reported_by_staff_id: string | null;
          resolution: string | null;
          resolved_at: string | null;
          severity: string;
          shipment_id: string;
          status: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to_staff_id?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          images?: Json | null;
          org_id: string;
          reported_by_staff_id?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          severity?: string;
          shipment_id: string;
          status?: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to_staff_id?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          images?: Json | null;
          org_id?: string;
          reported_by_staff_id?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          severity?: string;
          shipment_id?: string;
          status?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'exceptions_assigned_to_staff_id_fkey';
            columns: ['assigned_to_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exceptions_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exceptions_reported_by_staff_id_fkey';
            columns: ['reported_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exceptions_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'public_shipment_tracking';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exceptions_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
        ];
      };
      hubs: {
        Row: {
          address: Json | null;
          code: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          org_id: string | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          address?: Json | null;
          code: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          org_id?: string | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          address?: Json | null;
          code?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          org_id?: string | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'hubs_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      invoice_counters: {
        Row: {
          last_number: number;
          org_id: string;
          year: number;
        };
        Insert: {
          last_number?: number;
          org_id: string;
          year: number;
        };
        Update: {
          last_number?: number;
          org_id?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_counters_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          created_at: string | null;
          customer_id: string;
          deleted_at: string | null;
          discount: number | null;
          due_date: string | null;
          id: string;
          invoice_no: string;
          issue_date: string | null;
          line_items: Json | null;
          notes: string | null;
          org_id: string;
          paid_at: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          shipment_id: string | null;
          status: string;
          subtotal: number;
          tax_amount: number | null;
          total: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          deleted_at?: string | null;
          discount?: number | null;
          due_date?: string | null;
          id?: string;
          invoice_no: string;
          issue_date?: string | null;
          line_items?: Json | null;
          notes?: string | null;
          org_id: string;
          paid_at?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          shipment_id?: string | null;
          status?: string;
          subtotal?: number;
          tax_amount?: number | null;
          total?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          deleted_at?: string | null;
          discount?: number | null;
          due_date?: string | null;
          id?: string;
          invoice_no?: string;
          issue_date?: string | null;
          line_items?: Json | null;
          notes?: string | null;
          org_id?: string;
          paid_at?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          shipment_id?: string | null;
          status?: string;
          subtotal?: number;
          tax_amount?: number | null;
          total?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'public_shipment_tracking';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
        ];
      };
      manifest_container_items: {
        Row: {
          container_id: string;
          id: string;
          loaded_at: string | null;
          loaded_by_staff_id: string | null;
          manifest_item_id: string;
          org_id: string;
        };
        Insert: {
          container_id: string;
          id?: string;
          loaded_at?: string | null;
          loaded_by_staff_id?: string | null;
          manifest_item_id: string;
          org_id: string;
        };
        Update: {
          container_id?: string;
          id?: string;
          loaded_at?: string | null;
          loaded_by_staff_id?: string | null;
          manifest_item_id?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'manifest_container_items_container_id_fkey';
            columns: ['container_id'];
            isOneToOne: false;
            referencedRelation: 'manifest_containers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_container_items_loaded_by_staff_id_fkey';
            columns: ['loaded_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_container_items_manifest_item_id_fkey';
            columns: ['manifest_item_id'];
            isOneToOne: true;
            referencedRelation: 'manifest_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_container_items_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      manifest_containers: {
        Row: {
          container_number: string;
          container_type: string;
          created_at: string | null;
          created_by_staff_id: string | null;
          dimensions: Json | null;
          gross_weight: number | null;
          id: string;
          manifest_id: string;
          max_weight: number | null;
          notes: string | null;
          org_id: string;
          seal_number: string | null;
          tare_weight: number | null;
          updated_at: string | null;
        };
        Insert: {
          container_number: string;
          container_type: string;
          created_at?: string | null;
          created_by_staff_id?: string | null;
          dimensions?: Json | null;
          gross_weight?: number | null;
          id?: string;
          manifest_id: string;
          max_weight?: number | null;
          notes?: string | null;
          org_id: string;
          seal_number?: string | null;
          tare_weight?: number | null;
          updated_at?: string | null;
        };
        Update: {
          container_number?: string;
          container_type?: string;
          created_at?: string | null;
          created_by_staff_id?: string | null;
          dimensions?: Json | null;
          gross_weight?: number | null;
          id?: string;
          manifest_id?: string;
          max_weight?: number | null;
          notes?: string | null;
          org_id?: string;
          seal_number?: string | null;
          tare_weight?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'manifest_containers_created_by_staff_id_fkey';
            columns: ['created_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_containers_manifest_id_fkey';
            columns: ['manifest_id'];
            isOneToOne: false;
            referencedRelation: 'manifests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_containers_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      manifest_counters: {
        Row: {
          last_number: number | null;
          org_id: string;
          year: number;
        };
        Insert: {
          last_number?: number | null;
          org_id: string;
          year: number;
        };
        Update: {
          last_number?: number | null;
          org_id?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'manifest_counters_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      manifest_items: {
        Row: {
          id: string;
          manifest_id: string;
          org_id: string;
          scanned_at: string | null;
          scanned_by_staff_id: string | null;
          shipment_id: string;
        };
        Insert: {
          id?: string;
          manifest_id: string;
          org_id: string;
          scanned_at?: string | null;
          scanned_by_staff_id?: string | null;
          shipment_id: string;
        };
        Update: {
          id?: string;
          manifest_id?: string;
          org_id?: string;
          scanned_at?: string | null;
          scanned_by_staff_id?: string | null;
          shipment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'manifest_items_manifest_id_fkey';
            columns: ['manifest_id'];
            isOneToOne: false;
            referencedRelation: 'manifests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_items_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_items_scanned_by_staff_id_fkey';
            columns: ['scanned_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_items_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'public_shipment_tracking';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_items_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
        ];
      };
      manifest_scan_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          id: string;
          manifest_id: string;
          normalized_token: string | null;
          org_id: string;
          raw_scan_token: string;
          scan_result: string;
          scan_source: string | null;
          scanned_by_staff_id: string | null;
          shipment_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          manifest_id: string;
          normalized_token?: string | null;
          org_id: string;
          raw_scan_token: string;
          scan_result: string;
          scan_source?: string | null;
          scanned_by_staff_id?: string | null;
          shipment_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          manifest_id?: string;
          normalized_token?: string | null;
          org_id?: string;
          raw_scan_token?: string;
          scan_result?: string;
          scan_source?: string | null;
          scanned_by_staff_id?: string | null;
          shipment_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'manifest_scan_logs_manifest_id_fkey';
            columns: ['manifest_id'];
            isOneToOne: false;
            referencedRelation: 'manifests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_scan_logs_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_scan_logs_scanned_by_staff_id_fkey';
            columns: ['scanned_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_scan_logs_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'public_shipment_tracking';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifest_scan_logs_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
        ];
      };
      manifests: {
        Row: {
          airline_code: string | null;
          arrived_at: string | null;
          closed_at: string | null;
          closed_by_staff_id: string | null;
          created_at: string | null;
          created_by_staff_id: string | null;
          deleted_at: string | null;
          departed_at: string | null;
          dispatch_at: string | null;
          driver_name: string | null;
          driver_phone: string | null;
          eta: string | null;
          etd: string | null;
          flight_date: string | null;
          flight_number: string | null;
          from_hub_id: string;
          id: string;
          manifest_no: string;
          notes: string | null;
          org_id: string;
          reconciled_at: string | null;
          reconciled_by_staff_id: string | null;
          status: string;
          to_hub_id: string;
          total_packages: number | null;
          total_shipments: number | null;
          total_weight: number | null;
          type: string;
          updated_at: string | null;
          vehicle_meta: Json | null;
          vehicle_number: string | null;
        };
        Insert: {
          airline_code?: string | null;
          arrived_at?: string | null;
          closed_at?: string | null;
          closed_by_staff_id?: string | null;
          created_at?: string | null;
          created_by_staff_id?: string | null;
          deleted_at?: string | null;
          departed_at?: string | null;
          dispatch_at?: string | null;
          driver_name?: string | null;
          driver_phone?: string | null;
          eta?: string | null;
          etd?: string | null;
          flight_date?: string | null;
          flight_number?: string | null;
          from_hub_id: string;
          id?: string;
          manifest_no: string;
          notes?: string | null;
          org_id: string;
          reconciled_at?: string | null;
          reconciled_by_staff_id?: string | null;
          status?: string;
          to_hub_id: string;
          total_packages?: number | null;
          total_shipments?: number | null;
          total_weight?: number | null;
          type: string;
          updated_at?: string | null;
          vehicle_meta?: Json | null;
          vehicle_number?: string | null;
        };
        Update: {
          airline_code?: string | null;
          arrived_at?: string | null;
          closed_at?: string | null;
          closed_by_staff_id?: string | null;
          created_at?: string | null;
          created_by_staff_id?: string | null;
          deleted_at?: string | null;
          departed_at?: string | null;
          dispatch_at?: string | null;
          driver_name?: string | null;
          driver_phone?: string | null;
          eta?: string | null;
          etd?: string | null;
          flight_date?: string | null;
          flight_number?: string | null;
          from_hub_id?: string;
          id?: string;
          manifest_no?: string;
          notes?: string | null;
          org_id?: string;
          reconciled_at?: string | null;
          reconciled_by_staff_id?: string | null;
          status?: string;
          to_hub_id?: string;
          total_packages?: number | null;
          total_shipments?: number | null;
          total_weight?: number | null;
          type?: string;
          updated_at?: string | null;
          vehicle_meta?: Json | null;
          vehicle_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'manifests_closed_by_staff_id_fkey';
            columns: ['closed_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifests_created_by_staff_id_fkey';
            columns: ['created_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifests_from_hub_id_fkey';
            columns: ['from_hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifests_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifests_reconciled_by_staff_id_fkey';
            columns: ['reconciled_by_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manifests_to_hub_id_fkey';
            columns: ['to_hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
        ];
      };
      orgs: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          settings: Json | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          settings?: Json | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          settings?: Json | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      packages: {
        Row: {
          created_at: string | null;
          description: string | null;
          dimensions: Json | null;
          id: string;
          org_id: string;
          package_number: number;
          shipment_id: string;
          weight: number;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          id?: string;
          org_id: string;
          package_number: number;
          shipment_id: string;
          weight: number;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          id?: string;
          org_id?: string;
          package_number?: number;
          shipment_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'packages_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'packages_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'public_shipment_tracking';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'packages_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
        ];
      };
      permissions: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          id: string;
          module: string;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module: string;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module?: string;
          name?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          created_at: string | null;
          id: string;
          permission_code: string;
          role: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          permission_code: string;
          role: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          permission_code?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'role_permissions_permission_code_fkey';
            columns: ['permission_code'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['code'];
          },
        ];
      };
      shipments: {
        Row: {
          cn_number: string;
          chargeable_weight: number | null;
          created_at: string | null;
          current_hub_id: string | null;
          customer_id: string;
          declared_value: number | null;
          deleted_at: string | null;
          delivered_at: string | null;
          destination_hub_id: string;
          id: string;
          manifest_id: string | null;
          mode: string;
          org_id: string;
          origin_hub_id: string;
          package_count: number;
          pod_image_url: string | null;
          pod_signature_url: string | null;
          consignee_address: Json;
          consignee_name: string;
          consignee_phone: string;
          consignor_address: Json | null;
          consignor_name: string | null;
          consignor_phone: string | null;
          service_level: string;
          special_instructions: string | null;
          status: string;
          total_weight: number;
          updated_at: string | null;
          version: number | null;
          volumetric_weight: number | null;
        };
        Insert: {
          cn_number: string;
          chargeable_weight?: number | null;
          created_at?: string | null;
          current_hub_id?: string | null;
          customer_id: string;
          declared_value?: number | null;
          deleted_at?: string | null;
          delivered_at?: string | null;
          destination_hub_id: string;
          id?: string;
          manifest_id?: string | null;
          mode: string;
          org_id: string;
          origin_hub_id: string;
          package_count?: number;
          pod_image_url?: string | null;
          pod_signature_url?: string | null;
          consignee_address: Json;
          consignee_name: string;
          consignee_phone: string;
          consignor_address?: Json | null;
          consignor_name?: string | null;
          consignor_phone?: string | null;
          service_level: string;
          special_instructions?: string | null;
          status?: string;
          total_weight: number;
          updated_at?: string | null;
          version?: number | null;
          volumetric_weight?: number | null;
        };
        Update: {
          cn_number?: string;
          chargeable_weight?: number | null;
          created_at?: string | null;
          current_hub_id?: string | null;
          customer_id?: string;
          declared_value?: number | null;
          deleted_at?: string | null;
          delivered_at?: string | null;
          destination_hub_id?: string;
          id?: string;
          manifest_id?: string | null;
          mode?: string;
          org_id?: string;
          origin_hub_id?: string;
          package_count?: number;
          pod_image_url?: string | null;
          pod_signature_url?: string | null;
          consignee_address?: Json;
          consignee_name?: string;
          consignee_phone?: string;
          consignor_address?: Json | null;
          consignor_name?: string | null;
          consignor_phone?: string | null;
          service_level?: string;
          special_instructions?: string | null;
          status?: string;
          total_weight?: number;
          updated_at?: string | null;
          version?: number | null;
          volumetric_weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_shipments_manifest';
            columns: ['manifest_id'];
            isOneToOne: false;
            referencedRelation: 'manifests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_current_hub_id_fkey';
            columns: ['current_hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_destination_hub_id_fkey';
            columns: ['destination_hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_origin_hub_id_fkey';
            columns: ['origin_hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
        ];
      };
      staff: {
        Row: {
          auth_user_id: string | null;
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          full_name: string;
          hub_id: string | null;
          id: string;
          is_active: boolean | null;
          org_id: string;
          phone: string | null;
          role: string;
          settings: Json | null;
          updated_at: string | null;
        };
        Insert: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          full_name: string;
          hub_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          org_id: string;
          phone?: string | null;
          role: string;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string;
          hub_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          org_id?: string;
          phone?: string | null;
          role?: string;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_hub_id_fkey';
            columns: ['hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      tracking_events: {
        Row: {
          actor_staff_id: string | null;
          cn_number: string;
          created_at: string | null;
          event_code: string;
          event_time: string | null;
          hub_id: string | null;
          id: string;
          location: string | null;
          meta: Json | null;
          notes: string | null;
          org_id: string;
          shipment_id: string;
          source: string;
        };
        Insert: {
          actor_staff_id?: string | null;
          cn_number: string;
          created_at?: string | null;
          event_code: string;
          event_time?: string | null;
          hub_id?: string | null;
          id?: string;
          location?: string | null;
          meta?: Json | null;
          notes?: string | null;
          org_id: string;
          shipment_id: string;
          source?: string;
        };
        Update: {
          actor_staff_id?: string | null;
          cn_number?: string;
          created_at?: string | null;
          event_code?: string;
          event_time?: string | null;
          hub_id?: string | null;
          id?: string;
          location?: string | null;
          meta?: Json | null;
          notes?: string | null;
          org_id?: string;
          shipment_id?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tracking_events_actor_staff_id_fkey';
            columns: ['actor_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tracking_events_hub_id_fkey';
            columns: ['hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tracking_events_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tracking_events_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'public_shipment_tracking';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tracking_events_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      public_shipment_tracking: {
        Row: {
          cn_number: string | null;
          created_at: string | null;
          destination_hub_id: string | null;
          id: string | null;
          mode: string | null;
          origin_hub_id: string | null;
          package_count: number | null;
          service_level: string | null;
          status: string | null;
          total_weight: number | null;
          updated_at: string | null;
        };
        Insert: {
          cn_number?: string | null;
          created_at?: string | null;
          destination_hub_id?: string | null;
          id?: string | null;
          mode?: string | null;
          origin_hub_id?: string | null;
          package_count?: number | null;
          service_level?: string | null;
          status?: string | null;
          total_weight?: number | null;
          updated_at?: string | null;
        };
        Update: {
          cn_number?: string | null;
          created_at?: string | null;
          destination_hub_id?: string | null;
          id?: string | null;
          mode?: string | null;
          origin_hub_id?: string | null;
          package_count?: number | null;
          service_level?: string | null;
          status?: string | null;
          total_weight?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipments_destination_hub_id_fkey';
            columns: ['destination_hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_origin_hub_id_fkey';
            columns: ['origin_hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
        ];
      };
      public_tracking_events: {
        Row: {
          cn_number: string | null;
          created_at: string | null;
          event_code: string | null;
          event_time: string | null;
          hub_id: string | null;
          id: string | null;
          location: string | null;
          shipment_id: string | null;
          source: string | null;
        };
        Insert: {
          cn_number?: string | null;
          created_at?: string | null;
          event_code?: string | null;
          event_time?: string | null;
          hub_id?: string | null;
          id?: string | null;
          location?: string | null;
          shipment_id?: string | null;
          source?: string | null;
        };
        Update: {
          cn_number?: string | null;
          created_at?: string | null;
          event_code?: string | null;
          event_time?: string | null;
          hub_id?: string | null;
          id?: string | null;
          location?: string | null;
          shipment_id?: string | null;
          source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tracking_events_hub_id_fkey';
            columns: ['hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tracking_events_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'public_shipment_tracking';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tracking_events_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      can_access_hub: { Args: { hub_id: string }; Returns: boolean };
      can_access_module: { Args: { module_name: string }; Returns: boolean };
      generate_cn_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_invoice_number: { Args: { p_org_id: string }; Returns: string };
      get_current_org_id: { Args: never; Returns: string };
      get_user_hub_id: { Args: never; Returns: string };
      get_user_org_id: { Args: never; Returns: string };
      get_user_permissions: {
        Args: never;
        Returns: {
          module: string;
          permission_code: string;
        }[];
      };
      has_any_permission: {
        Args: { required_permissions: string[] };
        Returns: boolean;
      };
      has_permission: {
        Args: { required_permission: string };
        Returns: boolean;
      };
      has_role: { Args: { required_roles: string[] }; Returns: boolean };
      is_warehouse_role: { Args: never; Returns: boolean };
      link_e2e_test_user: {
        Args: { user_auth_id: string; user_email: string };
        Returns: boolean;
      };
      manifest_add_shipment_by_scan: {
        Args: {
          p_manifest_id: string;
          p_org_id: string;
          p_scan_source?: string;
          p_scan_token: string;
          p_staff_id?: string;
          p_validate_destination?: boolean;
          p_validate_status?: boolean;
        };
        Returns: Json;
      };
      manifest_remove_item: {
        Args: {
          p_manifest_id: string;
          p_org_id: string;
          p_shipment_id: string;
          p_staff_id?: string;
        };
        Returns: Json;
      };
      manifest_update_totals: {
        Args: { p_manifest_id: string };
        Returns: undefined;
      };
      search_global: {
        Args: { p_limit?: number; p_org_id: string; p_query: string };
        Returns: Database['public']['CompositeTypes']['search_result'][];
        SetofOptions: {
          from: '*';
          to: 'search_result';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      search_shipments: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_org_id: string;
          p_search_text: string;
          p_status?: string;
        };
        Returns: {
          cn_number: string;
          chargeable_weight: number | null;
          created_at: string | null;
          current_hub_id: string | null;
          customer_id: string;
          declared_value: number | null;
          deleted_at: string | null;
          delivered_at: string | null;
          destination_hub_id: string;
          id: string;
          manifest_id: string | null;
          mode: string;
          org_id: string;
          origin_hub_id: string;
          package_count: number;
          pod_image_url: string | null;
          pod_signature_url: string | null;
          consignee_address: Json;
          consignee_name: string;
          consignee_phone: string;
          consignor_address: Json | null;
          consignor_name: string | null;
          consignor_phone: string | null;
          service_level: string;
          special_instructions: string | null;
          status: string;
          total_weight: number;
          updated_at: string | null;
          version: number | null;
          volumetric_weight: number | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'shipments';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      search_result: {
        id: string | null;
        entity_type: string | null;
        title: string | null;
        subtitle: string | null;
        link: string | null;
        metadata: Json | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
