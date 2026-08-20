export type EventType =
  | "notification"
  | "application_start"
  | "application_end"
  | "admit_card"
  | "exam_date"
  | "result"
  | "answer_key"
  | string;

export type ExamEventStatus = "upcoming" | "postponed" | "cancelled" | "completed" | string;

export type ApplicationStatus = "not_applied" | "applied" | "admit_card_downloaded" | "exam_given" | string;

export type ScrapedEventStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string;
          name: string;
          organization: string;
          category: string;
          official_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          organization: string;
          category: string;
          official_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exams"]["Insert"]>;
        Relationships: [];
      };
      exam_events: {
        Row: {
          id: string;
          exam_id: string;
          event_type: EventType;
          event_date: string;
          status: ExamEventStatus;
          official_source_url: string | null;
          last_verified_at: string | null;
        };
        Insert: {
          id?: string;
          exam_id: string;
          event_type: EventType;
          event_date: string;
          status?: ExamEventStatus;
          official_source_url?: string | null;
          last_verified_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exam_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "exam_events_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          state: string | null;
          interests: string[] | null;
          push_subscription: PushSubscriptionJSON | null;
        };
        Insert: {
          id: string;
          phone?: string | null;
          state?: string | null;
          interests?: string[] | null;
          push_subscription?: PushSubscriptionJSON | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_exams: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          application_status: ApplicationStatus | null;
          reminders_enabled: boolean | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          application_status?: ApplicationStatus | null;
          reminders_enabled?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_exams"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_exams_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders_sent: {
        Row: {
          id: string;
          user_id: string;
          exam_event_id: string;
          reminder_type: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_event_id: string;
          reminder_type: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders_sent"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reminders_sent_exam_event_id_fkey";
            columns: ["exam_event_id"];
            isOneToOne: false;
            referencedRelation: "exam_events";
            referencedColumns: ["id"];
          },
        ];
      };
      scraped_events: {
        Row: {
          id: string;
          source_url: string;
          raw_label: string;
          raw_value: string;
          title: string;
          inferred_organization: string | null;
          inferred_category: string | null;
          event_type: EventType | null;
          parsed_date: string | null;
          status: ScrapedEventStatus;
          promoted_exam_id: string | null;
          promoted_event_id: string | null;
          scraped_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          source_url: string;
          raw_label: string;
          raw_value: string;
          title: string;
          inferred_organization?: string | null;
          inferred_category?: string | null;
          event_type?: EventType | null;
          parsed_date?: string | null;
          status?: ScrapedEventStatus;
          promoted_exam_id?: string | null;
          promoted_event_id?: string | null;
          scraped_at?: string;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["scraped_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
