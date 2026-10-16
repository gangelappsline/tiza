import { parseJsonParam, randomInt } from './utils';

export const OPERATIONS = {
  suma: { symbol: '+', display: '+', name: 'Suma', emoji: '➕' },
  resta: { symbol: '-', display: '−', name: 'Resta', emoji: '➖' },
  multiplicacion: { symbol: '×', display: '×', name: 'Multiplicación', emoji: '✖️' },
  division: { symbol: '÷', display: '÷', name: 'División', emoji: '➗' },
};

export const OPERATION_IDS = Object.keys(OPERATIONS);

export const LEVELS = {
  facil: { name: 'Fácil', range: [1, 10], tone: 'emerald' },
  medio: { name: 'Medio', range: [11, 50], tone: 'amber' },
  dificil: { name: 'Difícil', range: [51, 100], tone: 'rose' },
  experto: { name: 'Experto', range: [101, 999], tone: 'violet' },
};

export const QUESTION_COUNTS = [10, 20, 30, 50];

/** Tablas usadas en multiplicación y división según el nivel. */
const MULTIPLICATION = {
  facil: { a: [1, 5], b: [1, 10] },
  medio: { a: [2, 10], b: [2, 10] },
  dificil: { a: [2, 12], b: [2, 12] },
  experto: { a: [11, 99], b: [2, 9] },
};

const DIVISION = {
  facil: { divisor: [1, 5], quotient: [1, 10] },
  medio: { divisor: [2, 10], quotient: [2, 10] },
  dificil: { divisor: [2, 12], quotient: [2, 12] },
  experto: { divisor: [2, 12], quotient: [10, 99] },
};

const LEVEL_ALIASES = {
  facil: 'facil',
  easy: 'facil',
  medio: 'medio',
  media: 'medio',
  medium: 'medio',
  dificil: 'dificil',
  hard: 'dificil',
  experto: 'experto',
  expert: 'experto',
};

/** Acepta los niveles en español o inglés ("medium" → "medio"). */
export function normalizeLevel(value) {
  if (!value) return null;
  const key = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return LEVEL_ALIASES[key] ?? null;
}

const OPERATION_ALIASES = {
  suma: 'suma',
  sumas: 'suma',
  addition: 'suma',
  '+': 'suma',
  resta: 'resta',
  restas: 'resta',
  subtraction: 'resta',
  '-': 'resta',
  '−': 'resta',
  multiplicacion: 'multiplicacion',
  multiplicaciones: 'multiplicacion',
  multiplication: 'multiplicacion',
  '×': 'multiplicacion',
  x: 'multiplicacion',
  '*': 'multiplicacion',
  division: 'division',
  divisiones: 'division',
  '÷': 'division',
  '/': 'division',
};

export function normalizeOperation(value) {
  if (!value) return null;
  const key = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return OPERATION_ALIASES[key] ?? null;
}

/** "suma,resta" → ['suma', 'resta'] (ignora valores desconocidos). */
export function parseOperations(value) {
  if (!value) return null;
  const list = String(value)
    .split(',')
    .map((item) => normalizeOperation(item))
    .filter(Boolean);
  const unique = [...new Set(list)];
  return unique.length ? unique : null;
}

/** Crea una operación aleatoria para el nivel indicado. */
export function createQuestion(operation, level = 'facil', random = Math.random) {
  const op = OPERATIONS[operation] ? operation : 'suma';
  const lvl = LEVELS[level] ? level : 'facil';
  const [min, max] = LEVELS[lvl].range;
  let num1;
  let num2;
  let answer;

  switch (op) {
    case 'resta': {
      num1 = randomInt(min, max, random);
      num2 = randomInt(min, max, random);
      if (num1 < num2) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      break;
    }
    case 'multiplicacion': {
      const { a, b } = MULTIPLICATION[lvl];
      num1 = randomInt(a[0], a[1], random);
      num2 = randomInt(b[0], b[1], random);
      if (random() > 0.5 && lvl !== 'experto') [num1, num2] = [num2, num1];
      answer = num1 * num2;
      break;
    }
    case 'division': {
      const { divisor, quotient } = DIVISION[lvl];
      num2 = randomInt(divisor[0], divisor[1], random);
      answer = randomInt(quotient[0], quotient[1], random);
      num1 = num2 * answer;
      break;
    }
    default: {
      num1 = randomInt(min, max, random);
      num2 = randomInt(min, max, random);
      answer = num1 + num2;
    }
  }

  return { num1, num2, operation: op, symbol: OPERATIONS[op].symbol, answer, emoji: OPERATIONS[op].emoji };
}

/** Genera una lista de operaciones evitando repetir la misma dos veces seguidas. */
export function createQuestionSet({ operations, level, count, random = Math.random }) {
  const ops = (operations?.length ? operations : ['suma', 'resta']).filter((op) => OPERATIONS[op]);
  const questions = [];
  const key = (q) => `${q.num1}${q.symbol}${q.num2}`;
  for (let i = 0; i < count; i += 1) {
    const op = ops[Math.floor(random() * ops.length)];
    let question = createQuestion(op, level, random);
    let tries = 0;
    while (questions.length && key(questions[questions.length - 1]) === key(question) && tries < 5) {
      question = createQuestion(op, level, random);
      tries += 1;
    }
    questions.push(question);
  }
  return questions;
}

function inferAnswer(num1, num2, operation) {
  switch (operation) {
    case 'resta':
      return num1 - num2;
    case 'multiplicacion':
      return num1 * num2;
    case 'division':
      return num2 === 0 ? null : num1 / num2;
    default:
      return num1 + num2;
  }
}

/**
 * Lee las preguntas enviadas por un maestro en la URL (?questions=[...]).
 * Devuelve null si el formato no es válido.
 */
export function parseQuestionsParam(raw) {
  const parsed = parseJsonParam(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const questions = parsed
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const num1 = Number(item.num1);
      const num2 = Number(item.num2);
      if (!Number.isFinite(num1) || !Number.isFinite(num2)) return null;
      const operation = normalizeOperation(item.operation) || normalizeOperation(item.symbol) || 'suma';
      const provided = Number(item.answer);
      const answer = Number.isFinite(provided) ? provided : inferAnswer(num1, num2, operation);
      if (!Number.isFinite(answer)) return null;
      return {
        num1,
        num2,
        operation,
        symbol: item.symbol || OPERATIONS[operation].symbol,
        answer,
        emoji: item.emoji || OPERATIONS[operation].emoji,
      };
    })
    .filter(Boolean);
  return questions.length ? questions : null;
}
