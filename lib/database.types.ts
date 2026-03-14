export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          type: "hospital" | "clinic" | "insurance";
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          type: "hospital" | "clinic" | "insurance";
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string | null;
          role: "patient" | "provider" | "insurance" | "admin";
        };
        Insert: {
          created_at?: string;
          id: string;
          organization_id?: string | null;
          role: "patient" | "provider" | "insurance" | "admin";
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      patients: {
        Row: {
          address: string | null;
          created_at: string;
          dob: string;
          gender: "male" | "female" | "other";
          id: string;
          name: string;
          phone: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          dob: string;
          gender: "male" | "female" | "other";
          id?: string;
          name: string;
          phone?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
      };
      providers: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
          specialty: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
          specialty: string;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["providers"]["Insert"]>;
      };
      encounters: {
        Row: {
          created_at: string;
          date: string;
          diagnosis: string;
          id: string;
          patient_id: string;
          provider_id: string;
          reason: string;
          source_system: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          diagnosis: string;
          id?: string;
          patient_id: string;
          provider_id: string;
          reason: string;
          source_system: string;
        };
        Update: Partial<Database["public"]["Tables"]["encounters"]["Insert"]>;
      };
      observations: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          patient_id: string;
          source_system: string;
          type: string;
          unit: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          patient_id: string;
          source_system: string;
          type: string;
          unit: string;
          value: string;
        };
        Update: Partial<Database["public"]["Tables"]["observations"]["Insert"]>;
      };
      medications: {
        Row: {
          created_at: string;
          dosage: string;
          id: string;
          name: string;
          patient_id: string;
          prescribed_by: string;
          source_system: string;
        };
        Insert: {
          created_at?: string;
          dosage: string;
          id?: string;
          name: string;
          patient_id: string;
          prescribed_by: string;
          source_system: string;
        };
        Update: Partial<Database["public"]["Tables"]["medications"]["Insert"]>;
      };
      claims: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          patient_id: string;
          provider_id: string;
          status: "pending" | "approved" | "rejected";
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          patient_id: string;
          provider_id: string;
          status?: "pending" | "approved" | "rejected";
        };
        Update: Partial<Database["public"]["Tables"]["claims"]["Insert"]>;
      };
      consents: {
        Row: {
          access_type: "full" | "clinical" | "claims" | "documents";
          created_at: string;
          granted: boolean;
          id: string;
          organization_id: string;
          patient_id: string;
          updated_at: string;
        };
        Insert: {
          access_type: "full" | "clinical" | "claims" | "documents";
          created_at?: string;
          granted?: boolean;
          id?: string;
          organization_id: string;
          patient_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["consents"]["Insert"]>;
      };
      documents: {
        Row: {
          bucket_path: string;
          created_at: string;
          id: string;
          mime_type: string;
          patient_id: string;
          source_system: string;
          title: string;
          uploaded_by: string;
        };
        Insert: {
          bucket_path: string;
          created_at?: string;
          id?: string;
          mime_type: string;
          patient_id: string;
          source_system: string;
          title: string;
          uploaded_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
    };
    Functions: {
      user_has_active_consent: {
        Args: {
          p_patient_id: string;
          p_org_id: string;
          p_access_type: "full" | "clinical" | "claims" | "documents";
        };
        Returns: boolean;
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: "patient" | "provider" | "insurance" | "admin" | null;
      };
      current_org_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
  };
}
