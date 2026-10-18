import type { Card, CardColor, Suit } from '../types/solitaire';

export const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

export function getCardColor(suit: Suit): CardColor {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function getRankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return rank.toString();
  }
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
}

export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface InitialGameSetup {
  tableau: Card[][];
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
}

export function dealNewGame(): InitialGameSetup {
  const deck = shuffleDeck(createDeck());
  const tableau: Card[][] = Array.from({ length: 7 }, () => []);

  // Deal 7 tableau columns: col 0 gets 1, col 1 gets 2, ..., col 6 gets 7
  let deckIndex = 0;
  for (let col = 0; col < 7; col++) {
    for (let count = 0; count <= col; count++) {
      const card = { ...deck[deckIndex++] };
      // The last card in each column is face up
      card.faceUp = count === col;
      tableau[col].push(card);
    }
  }

  // The remaining 24 cards go into stock
  const stock: Card[] = deck.slice(deckIndex).map((card) => ({
    ...card,
    faceUp: false,
  }));

  const waste: Card[] = [];
  const foundations: Card[][] = Array.from({ length: 4 }, () => []);

  return {
    tableau,
    stock,
    waste,
    foundations,
  };
}
