import type {
    BuildStudyEnvelopeInput,
    OldJson,
    ParsedStudyContent,
    Study,
    StudyEnvelope,
} from './types';
  
  export function safeParseJson(value: string): unknown | null {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  
  export function isStudyEnvelope(obj: unknown): obj is StudyEnvelope {
    if (!obj || typeof obj !== 'object') return false;
  
    const value = obj as Record<string, unknown>;
  
    return (
      value.version === 1 &&
      value.kind === 'ai_bible_study' &&
      typeof value.title === 'string'
    );
  }
  
  export function isOldJson(obj: unknown): obj is OldJson {
    if (!obj || typeof obj !== 'object') return false;
  
    const value = obj as Record<string, unknown>;
  
    return (
      'theme' in value ||
      'history' in value ||
      'exegesis' in value ||
      'theology' in value ||
      'application' in value
    );
  }
  
  export function buildStudyContentEnvelope(input: BuildStudyEnvelopeInput): string {
    const envelope: StudyEnvelope = {
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
  
  export function parseStudyContent(study: Pick<Study, 'title' | 'reference' | 'content' | 'observation' | 'application' | 'prayer'>): ParsedStudyContent {
    const fallbackTheme = study.title || 'Sem Título';
    const rawContent = String(study.content || '').trim();
  
    let theme = fallbackTheme;
    let history = '';
    let exegesis = '';
    let theology = '';
    let application = '';
  
    let envelope: StudyEnvelope | null = null;
    let oldJson: OldJson | null = null;
    let plainText = '';
  
    if (rawContent.startsWith('{')) {
      const parsed = safeParseJson(rawContent);
  
      if (isStudyEnvelope(parsed)) {
        envelope = parsed;
  
        const analysis = parsed.analysis || {};
        theme = analysis.theme || parsed.title || fallbackTheme;
        history = analysis.history || '';
        exegesis = analysis.exegesis || '';
        theology = analysis.theology || '';
        application = analysis.application || '';
      } else if (isOldJson(parsed)) {
        oldJson = parsed;
  
        theme = parsed.theme || fallbackTheme;
        history = parsed.history || '';
        exegesis = parsed.exegesis || '';
        theology = parsed.theology || '';
        application = parsed.application || '';
      } else {
        plainText = rawContent;
        exegesis = rawContent;
      }
    } else {
      plainText = rawContent;
      exegesis = rawContent;
    }
  
    if (study.observation) {
      exegesis = exegesis
        ? `${exegesis}\n\n[Obs]: ${study.observation}`
        : study.observation;
    }
  
    if (study.application) {
      application = application
        ? `${application}\n\n${study.application}`
        : study.application;
    }
  
    if (study.prayer) {
      application = application
        ? `${application}\n\n🙏 Oração: ${study.prayer}`
        : `🙏 Oração: ${study.prayer}`;
    }
  
    if (envelope) {
      return {
        kind: 'envelope',
        envelope,
        oldJson: null,
        plainText: '',
        fields: {
          theme: String(theme || ''),
          history: String(history || ''),
          exegesis: String(exegesis || ''),
          theology: String(theology || ''),
          application: String(application || ''),
        },
      };
    }
  
    if (oldJson) {
      return {
        kind: 'oldjson',
        envelope: null,
        oldJson,
        plainText: '',
        fields: {
          theme: String(theme || ''),
          history: String(history || ''),
          exegesis: String(exegesis || ''),
          theology: String(theology || ''),
          application: String(application || ''),
        },
      };
    }
  
    return {
      kind: 'plain',
      envelope: null,
      oldJson: null,
      plainText,
      fields: {
        theme: String(theme || ''),
        history: String(history || ''),
        exegesis: String(exegesis || ''),
        theology: String(theology || ''),
        application: String(application || ''),
      },
    };
  }
  
  export function buildContentFromEditor(params: {
    title: string;
    reference: string | null;
    existingEnvelope: StudyEnvelope | null;
    fields: {
      theme: string;
      history: string;
      exegesis: string;
      theology: string;
      application: string;
    };
  }): string {
    const { title, reference, existingEnvelope, fields } = params;
  
    const envelope: StudyEnvelope = {
      version: 1,
      kind: 'ai_bible_study',
      title,
      reference,
      ref: existingEnvelope?.ref,
      analysis: {
        theme: fields.theme || undefined,
        history: fields.history || undefined,
        exegesis: fields.exegesis || undefined,
        theology: fields.theology || undefined,
        application: fields.application || undefined,
      },
      raw: existingEnvelope?.raw ?? null,
      meta: {
        generated_by: existingEnvelope?.meta?.generated_by ?? 'ai',
        created_at: existingEnvelope?.meta?.created_at ?? new Date().toISOString(),
      },
    };
  
    return JSON.stringify(envelope);
  }
  
  export function sanitizeSavedNoteInsertPayload(payload: Record<string, unknown>) {
    const copy = { ...payload } as Record<string, unknown>;
  
    delete copy.id;
    delete copy.created_at;
    delete copy.updated_at;
    delete copy.source;
    delete copy.observation;
    delete copy.application;
    delete copy.prayer;
  
    return copy;
  }