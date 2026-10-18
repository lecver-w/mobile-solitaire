export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';

export interface Card {
  id: string; // e.g. "hearts-1", "spades-13"
  suit: Suit;
  rank: number; // 1 (Ace) to 13 (King)
  faceUp: boolean;
}

export type PileType = 'stock' | 'waste' | 'foundation' | 'tableau';

export interface PileLocation {
  type: PileType;
  pileIndex?: number; // for foundation (0-3) or tableau (0-6)
  cardIndex?: number; // index of card inside pile
}

export interface GameMoveRecord {
  id: string;
  type: 'draw' | 'recycle' | 'move' | 'flip';
  from: PileLocation;
  to?: PileLocation;
  cards: Card[];
  flippedPreviousCard?: {
    pileIndex: number;
    cardIndex: number;
  };
  scoreDelta: number;
}

export interface GameSettings {
  drawCount: 1 | 3;
  soundEnabled: boolean;
  autoFinishNotice: boolean;
  theme: 'emerald' | 'ocean' | 'obsidian';
}

export interface GameStats {
  moves: number;
  score: number;
  timeElapsed: number; // in seconds
  isGameWon: boolean;
  isGameActive: boolean;
}
