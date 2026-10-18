<template>
  <div
    class="select-none relative rounded-lg sm:rounded-xl flex flex-col justify-between overflow-hidden transition-all duration-150"
    :class="[
      card.faceUp ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-md' : 'shadow-sm',
      isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-emerald-950 scale-[1.03] z-40' : '',
      isDropTarget ? 'ring-2 ring-emerald-400 scale-[1.02]' : '',
      card.faceUp ? 'border border-slate-200/90' : 'border border-slate-700/60',
    ]"
    :style="{
      width: '100%',
      aspectRatio: '5 / 7',
    }"
  >
    <!-- Face Down (Card Back) -->
    <template v-if="!card.faceUp">
      <div class="w-full h-full p-1 sm:p-1.5 bg-slate-900 flex items-center justify-center">
        <div
          class="w-full h-full rounded border border-blue-400/30 flex items-center justify-center relative overflow-hidden"
          :class="cardBackStyle"
        >
          <!-- Modern Geometric Pattern -->
          <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:6px_6px]"></div>
          <div class="w-4 h-4 sm:w-6 sm:h-6 rounded-full border border-blue-300/40 flex items-center justify-center backdrop-blur-xs">
            <div class="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-400/60"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Face Up -->
    <template v-else>
      <!-- Top Left Index -->
      <div class="flex flex-col items-center leading-none p-1 sm:p-1.5" :style="{ color: suitColor }">
        <span class="text-xs sm:text-sm md:text-base font-black tracking-tight font-sans">
          {{ rankLabel }}
        </span>
        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path :d="suitSvgPath" />
        </svg>
      </div>

      <!-- Center Art / Big Suit -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none" :style="{ color: suitColor }">
        <template v-if="card.rank === 1">
          <!-- Big Ace -->
          <svg class="w-7 h-7 sm:w-10 sm:h-10 opacity-90" viewBox="0 0 24 24" fill="currentColor">
            <path :d="suitSvgPath" />
          </svg>
        </template>
        <template v-else-if="card.rank >= 11">
          <!-- Court Card (J, Q, K) Modern Badge -->
          <div class="flex flex-col items-center justify-center opacity-85">
            <span class="text-lg sm:text-2xl font-black font-serif tracking-widest">
              {{ rankLabel }}
            </span>
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-75 mt-[-2px]" viewBox="0 0 24 24" fill="currentColor">
              <path :d="suitSvgPath" />
            </svg>
          </div>
        </template>
        <template v-else>
          <!-- Standard Numbers -->
          <svg class="w-5 h-5 sm:w-8 sm:h-8 opacity-80" viewBox="0 0 24 24" fill="currentColor">
            <path :d="suitSvgPath" />
          </svg>
        </template>
      </div>

      <!-- Bottom Right Index (Inverted) -->
      <div
        class="flex flex-col items-center leading-none p-1 sm:p-1.5 rotate-180 self-end"
        :style="{ color: suitColor }"
      >
        <span class="text-xs sm:text-sm md:text-base font-black tracking-tight font-sans">
          {{ rankLabel }}
        </span>
        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path :d="suitSvgPath" />
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card } from '../types/solitaire';
import { getCardColor, getRankLabel } from '../utils/deck';

const props = defineProps<{
  card: Card;
  isSelected?: boolean;
  isDropTarget?: boolean;
}>();

const rankLabel = computed(() => getRankLabel(props.card.rank));

const suitColor = computed(() => {
  return getCardColor(props.card.suit) === 'red' ? '#e11d48' : '#0f172a';
});

const cardBackStyle = computed(() => {
  return 'bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900';
});

// SVG Paths for 4 suits
const suitSvgPath = computed(() => {
  switch (props.card.suit) {
    case 'hearts':
      return 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
    case 'diamonds':
      return 'M12 2L2 12l10 10 10-10L12 2z';
    case 'spades':
      return 'M12 2C9.5 7 3.5 11 3.5 15c0 3 2.5 5 5.5 5 1.5 0 2.5-1 3-2 .5 1 1.5 2 3 2 3 0 5.5-2 5.5-5 0-4-6-8-8.5-13z M11 19h2v4h-2z';
    case 'clubs':
      return 'M12 2a4 4 0 0 0-4 4c0 1.2.5 2.2 1.3 3A4 4 0 0 0 5 13a4 4 0 0 0 4 4c1 0 2-.4 2.7-1L11 20H9v2h6v-2h-2l-.7-4c.7.6 1.7 1 2.7 1a4 4 0 0 0 4-4 4 4 0 0 0-4.3-4c.8-.8 1.3-1.8 1.3-3a4 4 0 0 0-4-4z';
  }
});
</script>
