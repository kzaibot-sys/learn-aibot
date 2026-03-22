export type QuizContentErrorCode = 'QUIZ_INVALID_JSON' | 'QUIZ_INVALID_CONTENT';

export class QuizContentValidationError extends Error {
  constructor(
    public readonly code: QuizContentErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'QuizContentValidationError';
  }
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface QuizDefinition {
  version: number;
  passingScorePercent: number;
  questions: QuizQuestion[];
}

export interface QuizPublicPayload {
  passingScorePercent: number;
  questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
  }>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseQuizDefinition(content: string | null): QuizDefinition {
  if (content === null || content.trim() === '') {
    throw new QuizContentValidationError(
      'QUIZ_INVALID_CONTENT',
      'Quiz content is empty',
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content) as unknown;
  } catch {
    throw new QuizContentValidationError(
      'QUIZ_INVALID_JSON',
      'Quiz content is not valid JSON',
    );
  }

  if (!isPlainObject(raw)) {
    throw new QuizContentValidationError(
      'QUIZ_INVALID_CONTENT',
      'Quiz definition must be a JSON object',
    );
  }

  const version = raw.version;
  if (version !== 1) {
    throw new QuizContentValidationError(
      'QUIZ_INVALID_CONTENT',
      'Unsupported or missing quiz version (expected 1)',
    );
  }

  let passingScorePercent = 70;
  if (raw.passingScorePercent !== undefined) {
    if (
      typeof raw.passingScorePercent !== 'number' ||
      Number.isNaN(raw.passingScorePercent) ||
      raw.passingScorePercent < 0 ||
      raw.passingScorePercent > 100
    ) {
      throw new QuizContentValidationError(
        'QUIZ_INVALID_CONTENT',
        'passingScorePercent must be a number between 0 and 100',
      );
    }
    passingScorePercent = raw.passingScorePercent;
  }

  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    throw new QuizContentValidationError(
      'QUIZ_INVALID_CONTENT',
      'Quiz must include a non-empty questions array',
    );
  }

  const seenQuestionIds = new Set<string>();
  const questions: QuizQuestion[] = [];

  for (const item of raw.questions) {
    if (!isPlainObject(item)) {
      throw new QuizContentValidationError(
        'QUIZ_INVALID_CONTENT',
        'Each question must be an object',
      );
    }

    if (!isNonEmptyString(item.id) || !isNonEmptyString(item.prompt)) {
      throw new QuizContentValidationError(
        'QUIZ_INVALID_CONTENT',
        'Each question needs id and prompt',
      );
    }

    if (seenQuestionIds.has(item.id)) {
      throw new QuizContentValidationError(
        'QUIZ_INVALID_CONTENT',
        'Duplicate question id in quiz definition',
      );
    }
    seenQuestionIds.add(item.id);

    if (!Array.isArray(item.options) || item.options.length < 2) {
      throw new QuizContentValidationError(
        'QUIZ_INVALID_CONTENT',
        'Each question needs at least two options',
      );
    }

    const optionIds = new Set<string>();
    const options: QuizOption[] = [];

    for (const opt of item.options) {
      if (!isPlainObject(opt)) {
        throw new QuizContentValidationError(
          'QUIZ_INVALID_CONTENT',
          'Each option must be an object',
        );
      }
      if (!isNonEmptyString(opt.id) || !isNonEmptyString(opt.text)) {
        throw new QuizContentValidationError(
          'QUIZ_INVALID_CONTENT',
          'Each option needs id and text',
        );
      }
      if (optionIds.has(opt.id)) {
        throw new QuizContentValidationError(
          'QUIZ_INVALID_CONTENT',
          'Duplicate option id within a question',
        );
      }
      optionIds.add(opt.id);
      options.push({ id: opt.id.trim(), text: opt.text.trim() });
    }

    if (!isNonEmptyString(item.correctOptionId)) {
      throw new QuizContentValidationError(
        'QUIZ_INVALID_CONTENT',
        'Each question needs correctOptionId',
      );
    }

    if (!optionIds.has(item.correctOptionId)) {
      throw new QuizContentValidationError(
        'QUIZ_INVALID_CONTENT',
        'correctOptionId must match an option id',
      );
    }

    questions.push({
      id: item.id.trim(),
      prompt: item.prompt.trim(),
      options,
      correctOptionId: item.correctOptionId.trim(),
    });
  }

  return {
    version: 1,
    passingScorePercent,
    questions,
  };
}

export function sanitizeQuizPayload(def: QuizDefinition): QuizPublicPayload {
  return {
    passingScorePercent: def.passingScorePercent,
    questions: def.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

export function evaluateQuiz(
  def: QuizDefinition,
  answers: Record<string, string>,
): {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  completed: boolean;
} {
  let correctCount = 0;
  const totalQuestions = def.questions.length;

  for (const q of def.questions) {
    const selected = answers[q.id];
    if (typeof selected === 'string' && selected === q.correctOptionId) {
      correctCount++;
    }
  }

  const scorePercent =
    totalQuestions === 0
      ? 0
      : Number(((correctCount / totalQuestions) * 100).toFixed(2));

  const completed = scorePercent >= def.passingScorePercent;

  return {
    scorePercent,
    correctCount,
    totalQuestions,
    completed,
  };
}
