export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      tp_clients: {
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
            foreignKeyName: "tp_clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_custom_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          name: string
          options: Json
          organization_id: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          name: string
          options?: Json
          organization_id: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          name?: string
          options?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_custom_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_discussion_channel_members: {
        Row: {
          channel_id: string
          created_at: string
          profile_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          profile_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_discussion_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "tp_discussion_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_discussion_channel_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_discussion_channels: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          id: string
          is_archived: boolean
          last_message_at: string | null
          last_message_preview: string | null
          name: string | null
          organization_id: string
          task_id: string | null
          type: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          organization_id: string
          task_id?: string | null
          type: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          organization_id?: string
          task_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_discussion_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_discussion_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_discussion_channels_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_discussion_messages: {
        Row: {
          attachment_file_id: string | null
          body: string
          channel_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          attachment_file_id?: string | null
          body: string
          channel_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          attachment_file_id?: string | null
          body?: string
          channel_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_discussion_messages_attachment_file_id_fkey"
            columns: ["attachment_file_id"]
            isOneToOne: false
            referencedRelation: "tp_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_discussion_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "tp_discussion_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_discussion_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_file_shares: {
        Row: {
          created_at: string
          file_id: string
          id: string
          shared_by_id: string
          shared_with_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          shared_by_id: string
          shared_with_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          shared_by_id?: string
          shared_with_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "tp_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_file_shares_shared_by_id_fkey"
            columns: ["shared_by_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_file_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_file_stars: {
        Row: {
          created_at: string
          file_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_file_stars_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "tp_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_file_stars_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_files: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          organization_id: string
          owner_id: string
          size_bytes: number
          source: string
          storage_path: string
          task_id: string | null
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          organization_id: string
          owner_id: string
          size_bytes?: number
          source?: string
          storage_path: string
          task_id?: string | null
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          owner_id?: string
          size_bytes?: number
          source?: string
          storage_path?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tp_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "tp_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_files_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_folder_shares: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          shared_by_id: string
          shared_with_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          shared_by_id: string
          shared_with_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          shared_by_id?: string
          shared_with_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_folder_shares_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "tp_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_folder_shares_shared_by_id_fkey"
            columns: ["shared_by_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_folder_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_folder_stars: {
        Row: {
          created_at: string
          folder_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_folder_stars_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "tp_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_folder_stars_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          owner_id: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          owner_id: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tp_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_folders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tp_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_note_stars: {
        Row: {
          created_at: string
          note_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_note_stars_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "tp_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_note_stars_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_notes: {
        Row: {
          body_html: string
          color: string
          created_at: string
          id: string
          organization_id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body_html?: string
          color?: string
          created_at?: string
          id?: string
          organization_id: string
          owner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          color?: string
          created_at?: string
          id?: string
          organization_id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_notes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          organization_id: string
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          organization_id: string
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          organization_id?: string
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_organizations: {
        Row: {
          address: string | null
          billing_email: string | null
          code: string
          country: string | null
          created_at: string
          gst_number: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          code: string
          country?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          code?: string
          country?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      tp_pipeline_stages: {
        Row: {
          created_at: string
          id: string
          name: string
          pipeline_id: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "tp_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "tp_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_pipelines: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_pipelines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_profiles: {
        Row: {
          avatar_color: string | null
          created_at: string
          full_name: string
          id: string
          organization_id: string
          phone: string | null
          role: string
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string
          full_name: string
          id: string
          organization_id: string
          phone?: string | null
          role?: string
        }
        Update: {
          avatar_color?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organization_id?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_project_stars: {
        Row: {
          created_at: string
          profile_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_project_stars_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_project_stars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tp_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_projects: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_projects_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_services: {
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
            foreignKeyName: "tp_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_tasks: {
        Row: {
          archived_at: string | null
          assignee_id: string | null
          checklist_mandatory: boolean
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_archived: boolean
          is_draft: boolean
          is_pinned: boolean
          is_recurring: boolean
          name: string
          organization_id: string
          parent_recurring_task_id: string | null
          pipeline_stage_id: string | null
          position: number
          priority: string
          progress: number
          project_id: string | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          recurrence_interval: number
          remind_at: string | null
          service_id: string | null
          site_visit: boolean
          status: string
          subtasks_mandatory: boolean
          department_id: string | null
          updated_at: string
          workflow_status: string
        }
        Insert: {
          archived_at?: string | null
          assignee_id?: string | null
          checklist_mandatory?: boolean
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_archived?: boolean
          is_draft?: boolean
          is_pinned?: boolean
          is_recurring?: boolean
          name: string
          organization_id: string
          parent_recurring_task_id?: string | null
          pipeline_stage_id?: string | null
          position?: number
          priority?: string
          progress?: number
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_interval?: number
          remind_at?: string | null
          service_id?: string | null
          site_visit?: boolean
          status?: string
          subtasks_mandatory?: boolean
          department_id?: string | null
          updated_at?: string
          workflow_status?: string
        }
        Update: {
          archived_at?: string | null
          assignee_id?: string | null
          checklist_mandatory?: boolean
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_archived?: boolean
          is_draft?: boolean
          is_pinned?: boolean
          is_recurring?: boolean
          name?: string
          organization_id?: string
          parent_recurring_task_id?: string | null
          pipeline_stage_id?: string | null
          position?: number
          priority?: string
          progress?: number
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_interval?: number
          remind_at?: string | null
          service_id?: string | null
          site_visit?: boolean
          status?: string
          subtasks_mandatory?: boolean
          department_id?: string | null
          updated_at?: string
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_parent_recurring_task_id_fkey"
            columns: ["parent_recurring_task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "tp_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "tp_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "tp_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: string | null
          id: string
          organization_id: string
          task_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          organization_id: string
          task_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_done: boolean
          label: string
          organization_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done?: boolean
          label: string
          organization_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done?: boolean
          label?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_checklist_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_custom_field_values: {
        Row: {
          custom_field_id: string
          task_id: string
          value: string | null
        }
        Insert: {
          custom_field_id: string
          task_id: string
          value?: string | null
        }
        Update: {
          custom_field_id?: string
          task_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "tp_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_custom_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_departments: {
        Row: {
          created_at: string
          department_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "tp_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_departments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_assignees: {
        Row: {
          created_at: string
          profile_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_followers: {
        Row: {
          created_at: string
          profile_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_followers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_followers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_reads: {
        Row: {
          profile_id: string
          read_at: string
          task_id: string
        }
        Insert: {
          profile_id: string
          read_at?: string
          task_id: string
        }
        Update: {
          profile_id?: string
          read_at?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_reads_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_task_subtasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          id: string
          is_done: boolean
          organization_id: string
          task_id: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          organization_id: string
          task_id: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          organization_id?: string
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_task_subtasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_subtasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tp_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_departments: {
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
            foreignKeyName: "tp_departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_department_members: {
        Row: {
          created_at: string
          department_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_department_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "tp_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_department_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tp_task_monthly_stats: {
        Row: {
          completed: number | null
          incomplete: number | null
          organization_id: string | null
          period: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tp_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tp_user_presence: {
        Row: {
          last_seen_at: string
          organization_id: string
          profile_id: string
        }
        Insert: {
          last_seen_at?: string
          organization_id: string
          profile_id: string
        }
        Update: {
          last_seen_at?: string
          organization_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tp_user_presence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tp_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tp_user_presence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "tp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      tp_create_organization_and_admin: {
        Args: { admin_full_name: string; org_name: string }
        Returns: string
      }
      tp_join_organization: {
        Args: { member_full_name: string; org_code: string }
        Returns: string
      }
      tp_lookup_org_name_by_code: {
        Args: { p_code: string }
        Returns: string
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
