import {
  evaluateQuiz,
  parseQuizDefinition,
  QuizContentValidationError,
  sanitizeQuizPayload,
} from './quiz-content';

const validJson = JSON.stringify({
  version: 1,
  passingScorePercent: 70,
  questions: [
    {
      id: 'q1',
      prompt: '2+2?',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
      correctOptionId: 'b',
    },
    {
      id: 'q2',
      prompt: 'Capital of France?',
      options: [
        { id: 'a', text: 'Paris' },
        { id: 'b', text: 'Berlin' },
      ],
      correctOptionId: 'a',
    },
  ],
});

describe('quiz-content', () => {
  it('parseQuizDefinition accepts version 1 payload', () => {
    const def = parseQuizDefinition(validJson);
    expect(def.questions).toHaveLength(2);
    expect(def.passingScorePercent).toBe(70);
  });

  it('parseQuizDefinition defaults passingScorePercent to 70', () => {
    const raw = JSON.stringify({
      version: 1,
      questions: [
        {
          id: 'q1',
          prompt: 'x',
          options: [
            { id: 'a', text: '1' },
            { id: 'b', text: '2' },
          ],
          correctOptionId: 'a',
        },
      ],
    });
    const def = parseQuizDefinition(raw);
    expect(def.passingScorePercent).toBe(70);
  });

  it('parseQuizDefinition throws QUIZ_INVALID_JSON for malformed JSON', () => {
    expect(() => parseQuizDefinition('{')).toThrow(QuizContentValidationError);
    try {
      parseQuizDefinition('{');
    } catch (e) {
      expect(e).toBeInstanceOf(QuizContentValidationError);
      expect((e as QuizContentValidationError).code).toBe('QUIZ_INVALID_JSON');
    }
  });

  it('parseQuizDefinition throws QUIZ_INVALID_CONTENT for wrong version', () => {
    expect(() =>
      parseQuizDefinition(JSON.stringify({ version: 2, questions: [] })),
    ).toThrow(QuizContentValidationError);
  });

  it('sanitizeQuizPayload omits correct answers', () => {
    const def = parseQuizDefinition(validJson);
    const pub = sanitizeQuizPayload(def);
    expect(JSON.stringify(pub)).not.toContain('correctOptionId');
    expect(pub.questions[0].options).toEqual([
      { id: 'a', text: '3' },
      { id: 'b', text: '4' },
    ]);
  });

  it('evaluateQuiz scores answers', () => {
    const def = parseQuizDefinition(validJson);
    const r = evaluateQuiz(def, { q1: 'b', q2: 'a' });
    expect(r.scorePercent).toBe(100);
    expect(r.completed).toBe(true);
    expect(r.correctCount).toBe(2);
  });

  it('evaluateQuiz marks incomplete when below passing threshold', () => {
    const def = parseQuizDefinition(validJson);
    const r = evaluateQuiz(def, { q1: 'a', q2: 'a' });
    expect(r.scorePercent).toBe(50);
    expect(r.completed).toBe(false);
  });
});
