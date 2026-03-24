import { shuffle } from '../utils/shuffle';

const OBJECTS = ['\uD83C\uDF4E', '\uD83C\uDF4C', '\uD83C\uDF4A', '\uD83C\uDF47', '\uD83C\uDF53', '\u2B50', '\uD83C\uDF88', '\uD83C\uDF52'];

export type CountingMode = 'count' | 'add';

export interface CountingQuestion {
  mode: CountingMode;
  // For count mode
  objects: string;
  count: number;
  // For add mode
  a: number;
  b: number;
  answer: number;
  // Displayed objects for add mode
  objectsA: string;
  objectsB: string;
  // Choices
  choices: number[];
}

export function generateQuestion(mode: CountingMode, maxNum: number): CountingQuestion {
  const emoji = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];

  if (mode === 'count') {
    const count = 1 + Math.floor(Math.random() * maxNum);
    const objects = emoji.repeat(count);
    const choices = generateChoices(count, maxNum);
    return { mode, objects, count, a: 0, b: 0, answer: count, objectsA: '', objectsB: '', choices };
  } else {
    const a = 1 + Math.floor(Math.random() * Math.min(maxNum - 1, 10));
    const b = 1 + Math.floor(Math.random() * Math.min(maxNum - a, 10));
    const answer = a + b;
    const objectsA = emoji.repeat(a);
    const emoji2 = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    const objectsB = emoji2.repeat(b);
    const choices = generateChoices(answer, maxNum);
    return { mode, objects: '', count: 0, a, b, answer, objectsA, objectsB, choices };
  }
}

function generateChoices(correct: number, maxNum: number): number[] {
  const choices = new Set<number>([correct]);
  while (choices.size < 4) {
    let c = correct + Math.floor(Math.random() * 5) - 2;
    if (c < 1) c = 1;
    if (c > maxNum + 5) c = maxNum + 5;
    if (c !== correct) choices.add(c);
  }
  return shuffle([...choices]);
}
