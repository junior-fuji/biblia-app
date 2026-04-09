export type StudyContentEnvelopeV1 = {
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
  
  export function buildStudyContentEnvelope(input: {
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
  }): string {
    const envelope: StudyContentEnvelopeV1 = {
      version: 1,
      kind: 'ai_bible_study',
      title: input.title,
      reference: input.reference ?? null,
      ref: input.ref,
      analysis: input.analysisData ?? null,
      raw: input.rawAi ?? null,
      meta: {
        generated_by: 'ai',
        created_at: new Date().toISOString(),
      },
    };
  
    return JSON.stringify(envelope);
  }
  
  export function sanitizeSavedNoteInsertPayload(payload: Record<string, any>) {
    const {
      id,
      created_at,
      updated_at,
      source,
      observation,
      application,
      prayer,
      ...rest
    } = payload;
  
    return rest;
  }