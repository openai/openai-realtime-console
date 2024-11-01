export interface Word {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const words: Word[] = [
  { word: 'cat', difficulty: 'easy' },
  { word: 'dog', difficulty: 'easy' },
  { word: 'bird', difficulty: 'easy' },
  { word: 'fish', difficulty: 'easy' },
  { word: 'tree', difficulty: 'easy' },
];
