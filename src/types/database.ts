export type ProfileRole = "patient" | "provider" | "insurance" | "admin";
export type OrganizationType = "hospital" | "clinic" | "insurance";
export type Gender = "male" | "female" | "other";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type ConsentAccessType = "full" | "clinical" | "claims" | "documents";
export type AlertSeverity = "low" | "medium" | "high";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          name: string;
          type: OrganizationType;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          type: OrganizationType;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          type?: OrganizationType;
        };
        Relationships: [];
      };
      developers: {
        Row: {
          created_at: string;
          id: string;
          organization_name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          created_at: string;
          developer_id: string;
          id: string;
          is_active: boolean;
          key: string;
        };
        Insert: {
          created_at?: string;
          developer_id: string;
          id?: string;
          is_active?: boolean;
          key: string;
        };
        Update: {
          created_at?: string;
          developer_id?: string;
          id?: string;
          is_active?: boolean;
          key?: string;
        };
        Relationships: [];
      };
      api_requests: {
        Row: {
          api_key_id: string;
          created_at: string;
          developer_id: string;
          id: string;
          method: string;
          path: string;
        };
        Insert: {
          api_key_id: string;
          created_at?: string;
          developer_id: string;
          id?: string;
          method: string;
          path: string;
        };
        Update: {
          api_key_id?: string;
          created_at?: string;
          developer_id?: string;
          id?: string;
          method?: string;
          path?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          organization_id: string | null;
          role: ProfileRole;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          organization_id?: string | null;
          role?: ProfileRole;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          organization_id?: string | null;
          role?: ProfileRole;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          address: string | null;
          created_at: string;
          date_of_birth: string | null;
          first_name: string | null;
          gender: Gender | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          first_name?: string | null;
          gender?: Gender | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          first_name?: string | null;
          gender?: Gender | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
          organization_id: string | null;
          specialty: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          organization_id?: string | null;
          specialty?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          organization_id?: string | null;
          specialty?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      encounters: {
        Row: {
          created_at: string;
          diagnosis: string | null;
          id: string;
          notes: string | null;
          organization_id: string | null;
          patient_id: string | null;
          provider_id: string | null;
          reason: string | null;
          visit_date: string | null;
        };
        Insert: {
          created_at?: string;
          diagnosis?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string | null;
          patient_id?: string | null;
          provider_id?: string | null;
          reason?: string | null;
          visit_date?: string | null;
        };
        Update: {
          created_at?: string;
          diagnosis?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string | null;
          patient_id?: string | null;
          provider_id?: string | null;
          reason?: string | null;
          visit_date?: string | null;
        };
        Relationships: [];
      };
      observations: {
        Row: {
          created_at: string;
          encounter_id: string | null;
          id: string;
          observed_at: string | null;
          patient_id: string | null;
          type: string | null;
          unit: string | null;
          value: string | null;
        };
        Insert: {
          created_at?: string;
          encounter_id?: string | null;
          id?: string;
          observed_at?: string | null;
          patient_id?: string | null;
          type?: string | null;
          unit?: string | null;
          value?: string | null;
        };
        Update: {
          created_at?: string;
          encounter_id?: string | null;
          id?: string;
          observed_at?: string | null;
          patient_id?: string | null;
          type?: string | null;
          unit?: string | null;
          value?: string | null;
        };
        Relationships: [];
      };
      medications: {
        Row: {
          created_at: string;
          dosage: string | null;
          end_date: string | null;
          frequency: string | null;
          id: string;
          name: string | null;
          patient_id: string | null;
          provider_id: string | null;
          start_date: string | null;
        };
        Insert: {
          created_at?: string;
          dosage?: string | null;
          end_date?: string | null;
          frequency?: string | null;
          id?: string;
          name?: string | null;
          patient_id?: string | null;
          provider_id?: string | null;
          start_date?: string | null;
        };
        Update: {
          created_at?: string;
          dosage?: string | null;
          end_date?: string | null;
          frequency?: string | null;
          id?: string;
          name?: string | null;
          patient_id?: string | null;
          provider_id?: string | null;
          start_date?: string | null;
        };
        Relationships: [];
      };
      claims: {
        Row: {
          amount: number | null;
          created_at: string;
          id: string;
          organization_id: string | null;
          patient_id: string | null;
          provider_id: string | null;
          status: ClaimStatus | null;
          submitted_at: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          patient_id?: string | null;
          provider_id?: string | null;
          status?: ClaimStatus | null;
          submitted_at?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          patient_id?: string | null;
          provider_id?: string | null;
          status?: ClaimStatus | null;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          alert_type: string;
          created_at: string;
          id: string;
          message: string;
          patient_id: string;
          severity: AlertSeverity;
        };
        Insert: {
          alert_type: string;
          created_at?: string;
          id?: string;
          message: string;
          patient_id: string;
          severity: AlertSeverity;
        };
        Update: {
          alert_type?: string;
          created_at?: string;
          id?: string;
          message?: string;
          patient_id?: string;
          severity?: AlertSeverity;
        };
        Relationships: [];
      };
      consents: {
        Row: {
          access_type: ConsentAccessType | null;
          created_at: string;
          granted: boolean;
          granted_at: string | null;
          id: string;
          organization_id: string | null;
          patient_id: string | null;
        };
        Insert: {
          access_type?: ConsentAccessType | null;
          created_at?: string;
          granted?: boolean;
          granted_at?: string | null;
          id?: string;
          organization_id?: string | null;
          patient_id?: string | null;
        };
        Update: {
          access_type?: ConsentAccessType | null;
          created_at?: string;
          granted?: boolean;
          granted_at?: string | null;
          id?: string;
          organization_id?: string | null;
          patient_id?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          bucket_path: string;
          created_at: string;
          id: string;
          mime_type: string;
          patient_id: string | null;
          source_system: string | null;
          title: string;
          uploaded_by: string;
        };
        Insert: {
          bucket_path: string;
          created_at?: string;
          id?: string;
          mime_type: string;
          patient_id?: string | null;
          source_system?: string | null;
          title: string;
          uploaded_by: string;
        };
        Update: {
          bucket_path?: string;
          created_at?: string;
          id?: string;
          mime_type?: string;
          patient_id?: string | null;
          source_system?: string | null;
          title?: string;
          uploaded_by?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_org_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: ProfileRole | null;
      };
      user_has_active_consent: {
        Args: {
          p_access_type: ConsentAccessType;
          p_org_id: string;
          p_patient_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
