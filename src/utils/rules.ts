import type { Card, PileLocation } from '../types/solitaire';
import { getCardColor } from './deck';

/**
 * Check if a single card can be placed on a foundation pile.
 */
export function canPlaceOnFoundation(card: Card, foundationPile: Card[]): boolean {
  if (foundationPile.length === 0) {
    return card.rank === 1; // Must be Ace
  }
  const topCard = foundationPile[foundationPile.length - 1];
  return card.suit === topCard.suit && card.rank === topCard.rank + 1;
}

/**
 * Check if cards can be placed onto a tableau column.
 * We inspect the bottom-most card of the moving slice (cardsToPlace[0]).
 */
export function canPlaceOnTableau(cardsToPlace: Card[], tableauPile: Card[]): boolean {
  if (cardsToPlace.length === 0) return false;
  const bottomMovingCard = cardsToPlace[0];

  if (tableauPile.length === 0) {
    // Only King (13) can be placed on an empty column
    return bottomMovingCard.rank === 13;
  }

  const topCard = tableauPile[tableauPile.length - 1];
  if (!topCard.faceUp) return false;

  // Alternate colors (Red on Black, Black on Red) and descending by 1
  const isOppositeColor = getCardColor(bottomMovingCard.suit) !== getCardColor(topCard.suit);
  const isRankDescending = bottomMovingCard.rank === topCard.rank - 1;

  return isOppositeColor && isRankDescending;
}

/**
 * Find the optimal target for a "Smart Tap" on a card.
 * Priority:
 * 1. Foundations (single card only)
 * 2. Non-empty Tableau columns (to build sequences)
 * 3. Empty Tableau column (only if it's a King and not already at the base of an empty column)
 */
export function findSmartMove(
  cardsToMove: Card[],
  source: PileLocation,
  foundations: Card[][],
  tableau: Card[][]
): PileLocation | null {
  if (cardsToMove.length === 0) return null;

  // 1. Foundation (only valid if moving a single card)
  if (cardsToMove.length === 1) {
    const card = cardsToMove[0];
    for (let f = 0; f < foundations.length; f++) {
      if (canPlaceOnFoundation(card, foundations[f])) {
        return { type: 'foundation', pileIndex: f };
      }
    }
  }

  // 2. Non-empty Tableau columns
  for (let t = 0; t < tableau.length; t++) {
    // Don't move to the same pile
    if (source.type === 'tableau' && source.pileIndex === t) continue;

    if (tableau[t].length > 0 && canPlaceOnTableau(cardsToMove, tableau[t])) {
      return { type: 'tableau', pileIndex: t };
    }
  }

  // 3. Empty Tableau columns (for Kings)
  if (cardsToMove[0].rank === 13) {
    // If it's already a King at the base of its own tableau column, don't move it to another empty column
    if (source.type === 'tableau' && source.cardIndex === 0) {
      return null;
    }

    for (let t = 0; t < tableau.length; t++) {
      if (source.type === 'tableau' && source.pileIndex === t) continue;
      if (tableau[t].length === 0) {
        return { type: 'tableau', pileIndex: t };
      }
    }
  }

  return null;
}

/**
 * Check if the game has reached the state where auto-completion is guaranteed.
 * If all face-down cards in all tableau columns have been revealed and stock+waste are cleared,
 * or all cards on table are face up.
 */
export function canAutoComplete(stock: Card[], waste: Card[], tableau: Card[][]): boolean {
  if (stock.length > 0 || waste.length > 0) return false;
  // All cards in tableau must be faceUp
  for (const col of tableau) {
    for (const card of col) {
      if (!card.faceUp) return false;
    }
  }
  return true;
}

/**
 * Check if player has completely won (all 4 foundations have 13 cards)
 */
export function isVictory(foundations: Card[][]): boolean {
  return foundations.every((pile) => pile.length === 13);
}
