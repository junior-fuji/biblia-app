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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atlas_biblico: {
        Row: {
          capitulo_inicio: number | null
          categoria: string | null
          descricao_tecnica: string | null
          dimensoes_biblicas: string | null
          id: string
          imagem_url: string | null
          livro_id: number | null
          localizacao_atual: string | null
          referencia_biblica: string | null
          titulo: string
        }
        Insert: {
          capitulo_inicio?: number | null
          categoria?: string | null
          descricao_tecnica?: string | null
          dimensoes_biblicas?: string | null
          id?: string
          imagem_url?: string | null
          livro_id?: number | null
          localizacao_atual?: string | null
          referencia_biblica?: string | null
          titulo: string
        }
        Update: {
          capitulo_inicio?: number | null
          categoria?: string | null
          descricao_tecnica?: string | null
          dimensoes_biblicas?: string | null
          id?: string
          imagem_url?: string | null
          livro_id?: number | null
          localizacao_atual?: string | null
          referencia_biblica?: string | null
          titulo?: string
        }
        Relationships: []
      }
      biblical_places: {
        Row: {
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          modern_country: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          modern_country?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          modern_country?: string | null
          name?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: number
          name: string
          testament: string
        }
        Insert: {
          id?: number
          name: string
          testament: string
        }
        Update: {
          id?: number
          name?: string
          testament?: string
        }
        Relationships: []
      }
      cronograma_leitura: {
        Row: {
          book_id_referencia: string | null
          capitulo_inicio: number | null
          concluido: boolean | null
          dia_ano: number
          era_nome: string
          id: number
          referencia_texto: string | null
          titulo_leitura: string | null
        }
        Insert: {
          book_id_referencia?: string | null
          capitulo_inicio?: number | null
          concluido?: boolean | null
          dia_ano: number
          era_nome: string
          id?: number
          referencia_texto?: string | null
          titulo_leitura?: string | null
        }
        Update: {
          book_id_referencia?: string | null
          capitulo_inicio?: number | null
          concluido?: boolean | null
          dia_ano?: number
          era_nome?: string
          id?: number
          referencia_texto?: string | null
          titulo_leitura?: string | null
        }
        Relationships: []
      }
      eras_biblicas: {
        Row: {
          created_at: string | null
          descricao_resumo: string | null
          id: string
          imagem_capa_url: string | null
          ordem: number
          periodo_fim: string | null
          periodo_inicio: string | null
          slug: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao_resumo?: string | null
          id?: string
          imagem_capa_url?: string | null
          ordem: number
          periodo_fim?: string | null
          periodo_inicio?: string | null
          slug: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao_resumo?: string | null
          id?: string
          imagem_capa_url?: string | null
          ordem?: number
          periodo_fim?: string | null
          periodo_inicio?: string | null
          slug?: string
          titulo?: string
        }
        Relationships: []
      }
      estudos_tematicos: {
        Row: {
          capitulo_inicio: number | null
          categoria: string | null
          comentario_sistematico: string | null
          cor_tema: string | null
          icone: string | null
          id: string
          livro_id: number | null
          nota_teologica: string | null
          referencia: string | null
          titulo: string | null
        }
        Insert: {
          capitulo_inicio?: number | null
          categoria?: string | null
          comentario_sistematico?: string | null
          cor_tema?: string | null
          icone?: string | null
          id?: string
          livro_id?: number | null
          nota_teologica?: string | null
          referencia?: string | null
          titulo?: string | null
        }
        Update: {
          capitulo_inicio?: number | null
          categoria?: string | null
          comentario_sistematico?: string | null
          cor_tema?: string | null
          icone?: string | null
          id?: string
          livro_id?: number | null
          nota_teologica?: string | null
          referencia?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      etapas_geograficas: {
        Row: {
          cor_linha: string | null
          created_at: string | null
          descricao: string | null
          destino: string | null
          evento_id: string
          id: string
          imagem_mapa_url: string | null
          ordem: number
          origem: string | null
        }
        Insert: {
          cor_linha?: string | null
          created_at?: string | null
          descricao?: string | null
          destino?: string | null
          evento_id: string
          id?: string
          imagem_mapa_url?: string | null
          ordem: number
          origem?: string | null
        }
        Update: {
          cor_linha?: string | null
          created_at?: string | null
          descricao?: string | null
          destino?: string | null
          evento_id?: string
          id?: string
          imagem_mapa_url?: string | null
          ordem?: number
          origem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etapas_geograficas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_era"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_jornada: {
        Row: {
          atlas_id: string | null
          cor_da_linha: string | null
          descricao_etapa: string | null
          destino: string | null
          id: string
          imagem_url: string | null
          ordem: number | null
          origem: string | null
        }
        Insert: {
          atlas_id?: string | null
          cor_da_linha?: string | null
          descricao_etapa?: string | null
          destino?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number | null
          origem?: string | null
        }
        Update: {
          atlas_id?: string | null
          cor_da_linha?: string | null
          descricao_etapa?: string | null
          destino?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number | null
          origem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etapas_jornada_atlas_id_fkey"
            columns: ["atlas_id"]
            isOneToOne: false
            referencedRelation: "atlas_biblico"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_era: {
        Row: {
          conexoes_textuais: Json | null
          created_at: string | null
          era_id: string
          id: string
          leitura_teologica: string | null
          mapa_principal_url: string | null
          ordem: number
          resumo_canonico: string | null
          slug: string
          tensao_historica: string | null
          titulo: string
        }
        Insert: {
          conexoes_textuais?: Json | null
          created_at?: string | null
          era_id: string
          id?: string
          leitura_teologica?: string | null
          mapa_principal_url?: string | null
          ordem: number
          resumo_canonico?: string | null
          slug: string
          tensao_historica?: string | null
          titulo: string
        }
        Update: {
          conexoes_textuais?: Json | null
          created_at?: string | null
          era_id?: string
          id?: string
          leitura_teologica?: string | null
          mapa_principal_url?: string | null
          ordem?: number
          resumo_canonico?: string | null
          slug?: string
          tensao_historica?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_era_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "eras_biblicas"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          date: string
          description: string | null
          id: string
          location: string
          title: string
        }
        Insert: {
          date: string
          description?: string | null
          id?: string
          location: string
          title: string
        }
        Update: {
          date?: string
          description?: string | null
          id?: string
          location?: string
          title?: string
        }
        Relationships: []
      }
      favoritos_estudos: {
        Row: {
          created_at: string | null
          estudo_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estudo_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estudo_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_estudos_estudo_id_fkey"
            columns: ["estudo_id"]
            isOneToOne: false
            referencedRelation: "estudos_tematicos"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_cronologico: {
        Row: {
          capitulo_inicio: number | null
          era_id: string | null
          id: number
          livro_id: number | null
          nota_teologica: string | null
          ordem: number | null
          referencia: string | null
          titulo: string | null
        }
        Insert: {
          capitulo_inicio?: number | null
          era_id?: string | null
          id?: number
          livro_id?: number | null
          nota_teologica?: string | null
          ordem?: number | null
          referencia?: string | null
          titulo?: string | null
        }
        Update: {
          capitulo_inicio?: number | null
          era_id?: string | null
          id?: number
          livro_id?: number | null
          nota_teologica?: string | null
          ordem?: number | null
          referencia?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      progresso_leitura: {
        Row: {
          concluido_em: string | null
          id: string
          tema_id: number | null
          user_id: string | null
        }
        Insert: {
          concluido_em?: string | null
          id?: string
          tema_id?: number | null
          user_id?: string | null
        }
        Update: {
          concluido_em?: string | null
          id?: string
          tema_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progresso_leitura_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "plano_cronologico"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_analyses: {
        Row: {
          ai_content: string | null
          book_name: string
          chapter: string
          created_at: string | null
          full_text: string | null
          id: number
          verse: string | null
        }
        Insert: {
          ai_content?: string | null
          book_name: string
          chapter: string
          created_at?: string | null
          full_text?: string | null
          id?: number
          verse?: string | null
        }
        Update: {
          ai_content?: string | null
          book_name?: string
          chapter?: string
          created_at?: string | null
          full_text?: string | null
          id?: number
          verse?: string | null
        }
        Relationships: []
      }
      saved_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          reference: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: never
          reference?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: never
          reference?: string | null
          title?: string | null
        }
        Relationships: []
      }
      saved_sermons: {
        Row: {
          created_at: string
          full_json: Json | null
          id: number
          verse_ref: string | null
        }
        Insert: {
          created_at?: string
          full_json?: Json | null
          id?: number
          verse_ref?: string | null
        }
        Update: {
          created_at?: string
          full_json?: Json | null
          id?: number
          verse_ref?: string | null
        }
        Relationships: []
      }
      saved_studies: {
        Row: {
          application: string | null
          created_at: string
          exegesis: string | null
          history: string | null
          id: number
          theme: string | null
          theology: string | null
          title: string | null
        }
        Insert: {
          application?: string | null
          created_at?: string
          exegesis?: string | null
          history?: string | null
          id?: number
          theme?: string | null
          theology?: string | null
          title?: string | null
        }
        Update: {
          application?: string | null
          created_at?: string
          exegesis?: string | null
          history?: string | null
          id?: number
          theme?: string | null
          theology?: string | null
          title?: string | null
        }
        Relationships: []
      }
      sketches: {
        Row: {
          content: Json
          created_at: string
          id: number
          title: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: number
          title: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: number
          title?: string
        }
        Relationships: []
      }
      verses: {
        Row: {
          book_id: number | null
          chapter: number
          id: number
          strongs: Json | null
          text_origin: string | null
          text_pt: string
          text_pt_tsv: unknown
          transliteration: string | null
          verse: number
          words: Json | null
        }
        Insert: {
          book_id?: number | null
          chapter: number
          id?: number
          strongs?: Json | null
          text_origin?: string | null
          text_pt: string
          text_pt_tsv?: unknown
          transliteration?: string | null
          verse: number
          words?: Json | null
        }
        Update: {
          book_id?: number | null
          chapter?: number
          id?: number
          strongs?: Json | null
          text_origin?: string | null
          text_pt?: string
          text_pt_tsv?: unknown
          transliteration?: string | null
          verse?: number
          words?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "verses_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
