export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          ip: string | null
          organization_id: string
          payload: Json
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          organization_id: string
          payload?: Json
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          organization_id?: string
          payload?: Json
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_orders: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          kind: string
          organization_id: string
          status: string
          stripe_checkout_session_id: string | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          id?: string
          kind: string
          organization_id: string
          status: string
          stripe_checkout_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          kind?: string
          organization_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_results: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_results_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      check_results_2026_09: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_results_2026_10: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_results_2026_11: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_results_2026_12: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_results_2027_01: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_results_2027_02: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_results_2027_03: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_results_default: {
        Row: {
          error: string | null
          http_code: number | null
          id: string
          latency_ms: number | null
          monitor_id: string
          region: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id: string
          region: string
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          http_code?: number | null
          id?: string
          latency_ms?: number | null
          monitor_id?: string
          region?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      check_rollups: {
        Row: {
          avg_latency_ms: number | null
          bucket: string
          down_count: number
          max_latency_ms: number | null
          monitor_id: string
          period_start: string
          up_count: number
        }
        Insert: {
          avg_latency_ms?: number | null
          bucket: string
          down_count?: number
          max_latency_ms?: number | null
          monitor_id: string
          period_start: string
          up_count?: number
        }
        Update: {
          avg_latency_ms?: number | null
          bucket?: string
          down_count?: number
          max_latency_ms?: number | null
          monitor_id?: string
          period_start?: string
          up_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "check_rollups_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          channel: string
          created_at: string
          destination: string
          enabled: boolean
          encrypted_secret: string | null
          id: string
          label: string
          list_id: string
          organization_id: string
          verified: boolean
        }
        Insert: {
          channel: string
          created_at?: string
          destination: string
          enabled?: boolean
          encrypted_secret?: string | null
          id?: string
          label: string
          list_id: string
          organization_id: string
          verified?: boolean
        }
        Update: {
          channel?: string
          created_at?: string
          destination?: string
          enabled?: boolean
          encrypted_secret?: string | null
          id?: string
          label?: string
          list_id?: string
          organization_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_updates: {
        Row: {
          actor_user_id: string | null
          body: string
          created_at: string
          id: string
          incident_id: string
          status_page_visible: boolean
        }
        Insert: {
          actor_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          incident_id: string
          status_page_visible?: boolean
        }
        Update: {
          actor_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          incident_id?: string
          status_page_visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "incident_updates_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          acknowledged_at: string | null
          id: string
          monitor_id: string | null
          organization_id: string
          resolved_at: string | null
          severity: string
          source: string
          started_at: string
          status: string
          summary: string
        }
        Insert: {
          acknowledged_at?: string | null
          id?: string
          monitor_id?: string | null
          organization_id: string
          resolved_at?: string | null
          severity: string
          source: string
          started_at?: string
          status?: string
          summary: string
        }
        Update: {
          acknowledged_at?: string | null
          id?: string
          monitor_id?: string | null
          organization_id?: string
          resolved_at?: string | null
          severity?: string
          source?: string
          started_at?: string
          status?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_windows: {
        Row: {
          body: string
          ends_at: string
          id: string
          monitor_ids: string[]
          organization_id: string
          starts_at: string
          status_page_id: string | null
          suppress_alerts: boolean
          title: string
        }
        Insert: {
          body?: string
          ends_at: string
          id?: string
          monitor_ids?: string[]
          organization_id: string
          starts_at: string
          status_page_id?: string | null
          suppress_alerts?: boolean
          title: string
        }
        Update: {
          body?: string
          ends_at?: string
          id?: string
          monitor_ids?: string[]
          organization_id?: string
          starts_at?: string
          status_page_id?: string | null
          suppress_alerts?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_windows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_windows_status_page_id_fkey"
            columns: ["status_page_id"]
            isOneToOne: false
            referencedRelation: "status_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      monitor_tokens: {
        Row: {
          created_at: string
          id: string
          kind: string
          last_payload: Json | null
          last_seen_at: string | null
          monitor_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          last_payload?: Json | null
          last_seen_at?: string | null
          monitor_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          last_payload?: Json | null
          last_seen_at?: string | null
          monitor_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitor_tokens_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      monitors: {
        Row: {
          confirmation_count: number
          consecutive_failures: number
          created_at: string
          created_by: string | null
          headers_ciphertext: string | null
          id: string
          interval_seconds: number
          keyword: string | null
          last_check_at: string | null
          last_latency_ms: number | null
          last_status_code: number | null
          method: string | null
          name: string
          next_check_at: string
          organization_id: string
          paused: boolean
          port: number | null
          regions: string[]
          status: string
          target: string
          timeout_ms: number
          type: string
          updated_at: string
          uptime_pct: number | null
        }
        Insert: {
          confirmation_count?: number
          consecutive_failures?: number
          created_at?: string
          created_by?: string | null
          headers_ciphertext?: string | null
          id?: string
          interval_seconds: number
          keyword?: string | null
          last_check_at?: string | null
          last_latency_ms?: number | null
          last_status_code?: number | null
          method?: string | null
          name: string
          next_check_at?: string
          organization_id: string
          paused?: boolean
          port?: number | null
          regions?: string[]
          status?: string
          target?: string
          timeout_ms?: number
          type: string
          updated_at?: string
          uptime_pct?: number | null
        }
        Update: {
          confirmation_count?: number
          consecutive_failures?: number
          created_at?: string
          created_by?: string | null
          headers_ciphertext?: string | null
          id?: string
          interval_seconds?: number
          keyword?: string | null
          last_check_at?: string | null
          last_latency_ms?: number | null
          last_status_code?: number | null
          method?: string | null
          name?: string
          next_check_at?: string
          organization_id?: string
          paused?: boolean
          port?: number | null
          regions?: string[]
          status?: string
          target?: string
          timeout_ms?: number
          type?: string
          updated_at?: string
          uptime_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monitors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          channel: string
          contact_id: string
          created_at: string
          error: string | null
          id: string
          incident_id: string | null
          provider_id: string | null
          status: string
        }
        Insert: {
          channel: string
          contact_id: string
          created_at?: string
          error?: string | null
          id?: string
          incident_id?: string | null
          provider_id?: string | null
          status: string
        }
        Update: {
          channel?: string
          contact_id?: string
          created_at?: string
          error?: string | null
          id?: string
          incident_id?: string | null
          provider_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          id: string
          list_id: string
          on_down: boolean
          on_incident: boolean
          on_maintenance: boolean
          on_recovery: boolean
          organization_id: string
        }
        Insert: {
          id?: string
          list_id: string
          on_down?: boolean
          on_incident?: boolean
          on_maintenance?: boolean
          on_recovery?: boolean
          organization_id: string
        }
        Update: {
          id?: string
          list_id?: string
          on_down?: boolean
          on_incident?: boolean
          on_maintenance?: boolean
          on_recovery?: boolean
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          access_mode: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          permission_mask: string
          preset_role: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          access_mode: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          permission_mask: string
          preset_role?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          access_mode?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          permission_mask?: string
          preset_role?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          access_mode: string
          created_at: string
          locked_at: string | null
          locked_by: string | null
          organization_id: string
          permission_mask: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          access_mode: string
          created_at?: string
          locked_at?: string | null
          locked_by?: string | null
          organization_id: string
          permission_mask: string
          role: string
          status: string
          user_id: string
        }
        Update: {
          access_mode?: string
          created_at?: string
          locked_at?: string | null
          locked_by?: string | null
          organization_id?: string
          permission_mask?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_cycle: string | null
          billing_status: string
          created_at: string
          created_by: string
          default_regions: string[]
          icon_path: string | null
          id: string
          kind: string
          name: string
          oidc_client_id: string | null
          oidc_client_secret: string | null
          oidc_issuer: string | null
          plan_id: string
          referral_code: string
          referred_by_organization_id: string | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          support_email: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          billing_status: string
          created_at?: string
          created_by: string
          default_regions?: string[]
          icon_path?: string | null
          id?: string
          kind: string
          name: string
          oidc_client_id?: string | null
          oidc_client_secret?: string | null
          oidc_issuer?: string | null
          plan_id: string
          referral_code?: string
          referred_by_organization_id?: string | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          support_email?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          billing_status?: string
          created_at?: string
          created_by?: string
          default_regions?: string[]
          icon_path?: string | null
          id?: string
          kind?: string
          name?: string
          oidc_client_id?: string | null
          oidc_client_secret?: string | null
          oidc_issuer?: string | null
          plan_id?: string
          referral_code?: string
          referred_by_organization_id?: string | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          support_email?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_referred_by_organization_id_fkey"
            columns: ["referred_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_organization_id: string | null
          avatar_path: string | null
          avatar_source: string
          created_at: string
          first_name: string
          last_name: string
          marketing_opt_in: boolean
          tos_accepted_at: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          active_organization_id?: string | null
          avatar_path?: string | null
          avatar_source?: string
          created_at?: string
          first_name: string
          last_name: string
          marketing_opt_in?: boolean
          tos_accepted_at?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          active_organization_id?: string | null
          avatar_path?: string | null
          avatar_source?: string
          created_at?: string
          first_name?: string
          last_name?: string
          marketing_opt_in?: boolean
          tos_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_organization_id: string
          referrer_organization_id: string
          status: string
          stripe_credit_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referred_organization_id: string
          referrer_organization_id: string
          status?: string
          stripe_credit_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referred_organization_id?: string
          referrer_organization_id?: string
          status?: string
          stripe_credit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_organization_id_fkey"
            columns: ["referred_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_organization_id_fkey"
            columns: ["referrer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      status_page_components: {
        Row: {
          display_name: string
          id: string
          monitor_id: string
          sort: number
          status_page_id: string
        }
        Insert: {
          display_name: string
          id?: string
          monitor_id: string
          sort?: number
          status_page_id: string
        }
        Update: {
          display_name?: string
          id?: string
          monitor_id?: string
          sort?: number
          status_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_page_components_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_page_components_status_page_id_fkey"
            columns: ["status_page_id"]
            isOneToOne: false
            referencedRelation: "status_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      status_pages: {
        Row: {
          created_at: string
          custom_domain: string | null
          domain_verified_at: string | null
          hide_branding: boolean
          id: string
          name: string
          organization_id: string
          slug: string
          theme: Json
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          domain_verified_at?: string | null
          hide_branding?: boolean
          id?: string
          name: string
          organization_id: string
          slug: string
          theme?: Json
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          domain_verified_at?: string | null
          hide_branding?: boolean
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          theme?: Json
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_pages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      status_subscribers: {
        Row: {
          confirm_token_hash: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          status_page_id: string
          unsubscribed_at: string | null
        }
        Insert: {
          confirm_token_hash?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          status_page_id: string
          unsubscribed_at?: string | null
        }
        Update: {
          confirm_token_hash?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          status_page_id?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "status_subscribers_status_page_id_fkey"
            columns: ["status_page_id"]
            isOneToOne: false
            referencedRelation: "status_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          created_at: string
          id: string
          organization_id: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
