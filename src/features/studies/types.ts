export type StudySource = 'supabase' | 'local';

export type Study = {
  id: string | number;
  title: string;
  content: string | null;
  reference: string | null;
  observation?: string | null;
  application?: string | null;
  prayer?: string | null;
  created_at: string;
  user_id?: string | null;
  client_id?: string | null;
  source?: StudySource;
};

export type OldJson = {
  theme?: string;
  history?: string;
  exegesis?: string;
  theology?: string;
  application?: string;
};

export type StudyEnvelope = {
  version: 1;
  kind: 'ai_bible_study';
  title: string;
  reference: string | null;
  ref?: {
    book_id?: number;
    chapter?: number;
    verse?: number | null;
    label?: string;
  };
  analysis: {
    theme?: string;
    history?: string;
    exegesis?: string;
    theology?: string;
    application?: string;
  } | null;
  raw: string | null;
  meta?: {
    generated_by?: 'ai';
    created_at?: string;
  };
};

export type ParsedKind = 'envelope' | 'oldjson' | 'plain';

export type ParsedStudyContent = {
  kind: ParsedKind;
  envelope: StudyEnvelope | null;
  oldJson: OldJson | null;
  plainText: string;
  fields: {
    theme: string;
    history: string;
    exegesis: string;
    theology: string;
    application: string;
  };
};

export type StudyInsertInput = {
  user_id: string;
  title: string;
  reference: string | null;
  content: string;
  client_id?: string | null;
};

export type StudyUpdateInput = {
  title: string;
  reference: string | null;
  content: string;
};

export type BuildStudyEnvelopeInput = {
  title: string;
  reference?: string | null;
  ref?: {
    book_id?: number;
    chapter?: number;
    verse?: number | null;
    label?: string;
  };
  analysisData?: {
    theme?: string;
    history?: string;
    exegesis?: string;
    theology?: string;
    application?: string;
  } | null;
  rawAi?: string | null;
};