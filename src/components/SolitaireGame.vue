<template>
  <div
    class="w-full h-full flex flex-col justify-between overflow-hidden select-none font-sans"
    :class="`theme-${settings.theme}`"
  >
    <!-- Top Status & Action Bar -->
    <header
      class="h-10 sm:h-12 bg-black/40 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0"
      style="padding-left: max(0.75rem, env(safe-area-inset-left)); padding-right: max(0.75rem, env(safe-area-inset-right));"
    >
      <!-- Left: Logo & Settings -->
      <div class="flex items-center gap-2 sm:gap-4">
        <div class="flex items-center gap-1.5 font-black text-xs sm:text-sm text-emerald-400 tracking-wider">
          <span class="text-base sm:text-lg">♠</span>
          <span>经典纸牌</span>
        </div>

        <!-- Draw 1 / Draw 3 Toggle -->
        <button
          @click="toggleDrawCount"
          class="px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold tracking-wide border transition"
          :class="settings.drawCount === 1 ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300' : 'bg-amber-600/30 border-amber-500/50 text-amber-300'"
          title="点击切换翻牌张数"
        >
          翻 {{ settings.drawCount }} 张
        </button>

        <!-- Sound Toggle -->
        <button
          @click="toggleSound"
          class="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition"
          :title="settings.soundEnabled ? '静音' : '开启声音'"
        >
          <Volume2 v-if="settings.soundEnabled" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <VolumeX v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
        </button>

        <!-- Theme Switcher -->
        <button
          @click="cycleTheme"
          class="px-2 py-0.5 rounded text-[10px] text-slate-300 border border-white/10 hover:bg-white/10 transition hidden sm:inline-block"
        >
          主题: {{ themeLabel }}
        </button>
      </div>

      <!-- Center: Stats (Time, Moves, Score) -->
      <div class="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <div class="flex items-center gap-1.5 text-slate-300">
          <Clock class="w-3.5 h-3.5 text-slate-400" />
          <span class="font-mono font-bold">{{ formattedTime }}</span>
        </div>
        <div class="flex items-center gap-1 text-slate-300">
          <span class="text-slate-400 text-[10px] sm:text-xs">步数:</span>
          <span class="font-bold text-white">{{ stats.moves }}</span>
        </div>
        <div class="flex items-center gap-1 text-slate-300">
          <span class="text-slate-400 text-[10px] sm:text-xs">得分:</span>
          <span class="font-bold text-emerald-400">{{ stats.score }}</span>
        </div>
      </div>

      <!-- Right: Game Controls (Undo, AutoComplete, Restart) -->
      <div class="flex items-center gap-2">
        <!-- Auto Complete Button (glows when conditions met) -->
        <button
          v-if="canAutoFinish && !isAutoCompleting"
          @click="triggerAutoComplete"
          class="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-lg text-xs shadow-lg animate-pulse hover:scale-105 active:scale-95 transition"
        >
          <Sparkles class="w-3 h-3" />
          <span>自动收牌</span>
        </button>

        <!-- Undo Button -->
        <button
          @click="undoLastMove"
          :disabled="history.length === 0 || isAutoCompleting"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition"
          :class="history.length > 0 ? 'bg-slate-800/80 hover:bg-slate-700 border-white/20 text-white' : 'bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed'"
        >
          <RotateCcw class="w-3 h-3" />
          <span class="hidden sm:inline">撤销</span>
        </button>

        <!-- New Game / Restart Button -->
        <button
          @click="confirmNewGame"
          :disabled="isAutoCompleting"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition active:scale-95"
        >
          <RefreshCw class="w-3 h-3" />
          <span>新对局</span>
        </button>

        <!-- Fullscreen Immersive Toggle -->
        <button
          @click="toggleFullscreen"
          class="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition"
          :title="isFullscreen ? '退出全屏' : '全屏沉浸（隐藏状态栏）'"
        >
          <Minimize v-if="isFullscreen" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <Maximize v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
        </button>
      </div>
    </header>

    <!-- Mobile Fullscreen Floating Pill (for in-browser play, e.g. Edge/Chrome) -->
    <div
      v-if="!isFullscreen && isMobileDevice && !dismissedFullscreenPill"
      class="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xl text-xs text-white animate-bounce [animation-duration:2.5s]"
    >
      <span class="text-emerald-400">✨</span>
      <span>隐藏电量与状态栏</span>
      <button
        @click="toggleFullscreen"
        class="ml-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-[11px] transition active:scale-95 shadow"
      >
        开启真正全屏
      </button>
      <button
        @click="dismissedFullscreenPill = true"
        class="text-slate-400 hover:text-white ml-1 px-1 text-xs"
      >
        ✕
      </button>
    </div>

    <!-- Main Game Board -->
    <main
      class="flex-1 flex flex-col justify-between p-2 sm:p-4 overflow-hidden relative"
      style="padding-left: max(0.5rem, env(safe-area-inset-left)); padding-right: max(0.5rem, env(safe-area-inset-right));"
    >
      <!-- Top Row: Stock, Waste, and 4 Foundations -->
      <div class="grid grid-cols-7 gap-2 sm:gap-3 items-start shrink-0 mb-2 sm:mb-3">
        <!-- Col 0: Stock Pile -->
        <div class="flex justify-center">
          <div
            @click="handleStockClick"
            class="w-full max-w-[85px] aspect-[5/7] rounded-lg sm:rounded-xl relative cursor-pointer active:scale-95 transition-transform"
          >
            <!-- Empty stock placeholder (Recycle icon) -->
            <div
              v-if="stock.length === 0"
              class="w-full h-full rounded-lg sm:rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/70 hover:border-white/40 transition"
              title="重新洗牌发牌"
            >
              <RotateCw class="w-5 h-5 sm:w-6 sm:h-6" />
              <span class="text-[9px] mt-1 font-semibold">重置</span>
            </div>

            <!-- Top of Stock Card -->
            <template v-else>
              <CardView :card="stock[stock.length - 1]" />
              <div class="absolute -top-1 -right-1 px-1.5 py-0.2 bg-black/60 rounded-full text-[9px] text-white/80 border border-white/10 font-mono">
                {{ stock.length }}
              </div>
            </template>
          </div>
        </div>

        <!-- Col 1: Waste Pile -->
        <div class="flex justify-center">
          <div class="w-full max-w-[85px] aspect-[5/7] rounded-lg sm:rounded-xl relative">
            <!-- Empty Waste outline -->
            <div
              v-if="waste.length === 0"
              class="w-full h-full rounded-lg sm:rounded-xl border border-white/10 bg-black/10"
            ></div>

            <!-- Top of Waste Card -->
            <div
              v-else
              class="w-full h-full cursor-pointer"
              @pointerdown="(e) => handlePointerDown(e, waste[waste.length - 1], { type: 'waste' })"
            >
              <CardView :card="waste[waste.length - 1]" />
            </div>
          </div>
        </div>

        <!-- Col 2: Spacer / Empty column in top row -->
        <div></div>

        <!-- Col 3 - 6: 4 Foundations (Hearts, Diamonds, Clubs, Spades) -->
        <div
          v-for="(foundation, fIdx) in foundations"
          :key="`foundation-${fIdx}`"
          class="flex justify-center"
        >
          <div
            class="w-full max-w-[85px] aspect-[5/7] rounded-lg sm:rounded-xl relative cursor-pointer"
            :class="[
              activeDropTarget?.type === 'foundation' && activeDropTarget.pileIndex === fIdx ? 'ring-2 ring-emerald-400' : ''
            ]"
            @pointerdown="(e) => foundation.length > 0 && handlePointerDown(e, foundation[foundation.length - 1], { type: 'foundation', pileIndex: fIdx })"
          >
            <!-- Empty Foundation Slot with Suit Watermark -->
            <div
              v-if="foundation.length === 0"
              class="w-full h-full rounded-lg sm:rounded-xl border border-white/15 bg-black/20 flex items-center justify-center text-white/20"
            >
              <span class="text-xl sm:text-2xl opacity-60">
                {{ foundationWatermark(fIdx) }}
              </span>
            </div>

            <!-- Top Foundation Card -->
            <template v-else>
              <CardView :card="foundation[foundation.length - 1]" />
            </template>
          </div>
        </div>
      </div>

      <!-- Bottom: 7 Tableau Columns -->
      <div class="flex-1 grid grid-cols-7 gap-2 sm:gap-3 items-stretch relative min-h-0">
        <div
          v-for="(column, colIdx) in tableau"
          :key="`col-${colIdx}`"
          class="flex flex-col items-center relative h-full"
        >
          <!-- Empty column slot outline -->
          <div
            class="w-full max-w-[85px] aspect-[5/7] rounded-lg sm:rounded-xl border border-white/15 bg-black/15 absolute top-0 flex items-center justify-center text-white/15"
            :class="[
              activeDropTarget?.type === 'tableau' && activeDropTarget.pileIndex === colIdx ? 'ring-2 ring-emerald-400 bg-emerald-500/10' : ''
            ]"
            @click="handleEmptyTableauClick(colIdx)"
          >
            <span class="text-xs font-bold opacity-30">K</span>
          </div>

          <!-- Cards Stack in Tableau Column -->
          <div class="w-full max-w-[85px] relative">
            <div
              v-for="(card, cardIdx) in column"
              :key="card.id"
              class="w-full absolute transition-transform"
              :style="{
                top: `${getTableauCardOffset(column, cardIdx)}px`,
                zIndex: cardIdx + 1,
              }"
              @pointerdown="(e) => handlePointerDown(e, card, { type: 'tableau', pileIndex: colIdx, cardIndex: cardIdx })"
            >
              <CardView
                :card="card"
                :isSelected="isCardSelected(card)"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Floating Dragging Cards Stack -->
    <Teleport to="body">
      <div
        v-if="dragState.isDragging && dragState.cards.length > 0"
        class="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
        :style="{
          left: `${dragState.currentX}px`,
          top: `${dragState.currentY}px`,
          width: `${dragState.cardWidth}px`,
        }"
      >
        <div class="relative w-full">
          <div
            v-for="(dCard, dIdx) in dragState.cards"
            :key="dCard.id"
            class="w-full absolute drop-shadow-2xl"
            :style="{
              top: `${dIdx * (dragState.isMobile ? 18 : 26)}px`,
              zIndex: 100 + dIdx,
            }"
          >
            <CardView :card="dCard" />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Rotate Prompt Overlay for Mobile Portrait Mode -->
    <RotatePrompt />

    <!-- Victory Screen with Classic Bouncing Waterfall -->
    <VictoryCascade
      v-if="stats.isGameWon"
      :foundations="foundations"
      :moves="stats.moves"
      :score="stats.score"
      :timeElapsed="stats.timeElapsed"
      @newGame="initGame"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import {
  Volume2,
  VolumeX,
  Clock,
  RotateCcw,
  RefreshCw,
  RotateCw,
  Sparkles,
  Maximize,
  Minimize,
} from 'lucide-vue-next';
import CardView from './CardView.vue';
import RotatePrompt from './RotatePrompt.vue';
import VictoryCascade from './VictoryCascade.vue';
import type { Card, GameMoveRecord, GameSettings, GameStats, PileLocation } from '../types/solitaire';
import { dealNewGame } from '../utils/deck';
import {
  canPlaceOnFoundation,
  canPlaceOnTableau,
  findSmartMove,
  canAutoComplete,
  isVictory,
} from '../utils/rules';
import { soundManager } from '../utils/sound';

// Reactive Game Piles
const tableau = ref<Card[][]>(Array.from({ length: 7 }, () => []));
const stock = ref<Card[]>([]);
const waste = ref<Card[]>([]);
const foundations = ref<Card[][]>(Array.from({ length: 4 }, () => []));
const history = ref<GameMoveRecord[]>([]);

// Settings & LocalStorage persistence
const settings = reactive<GameSettings>({
  drawCount: 1,
  soundEnabled: true,
  autoFinishNotice: true,
  theme: 'emerald',
});

// Stats
const stats = reactive<GameStats>({
  moves: 0,
  score: 0,
  timeElapsed: 0,
  isGameWon: false,
  isGameActive: false,
});

let timer: number | null = null;
const isAutoCompleting = ref(false);

// Formatted Timer string mm:ss
const formattedTime = computed(() => {
  const m = Math.floor(stats.timeElapsed / 60);
  const s = stats.timeElapsed % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const themeLabel = computed(() => {
  switch (settings.theme) {
    case 'emerald':
      return '墨绿';
    case 'ocean':
      return '深海';
    case 'obsidian':
      return '黑曜';
  }
});

function foundationWatermark(idx: number): string {
  const suits = ['♠', '♥', '♣', '♦'];
  return suits[idx] || '';
}

// Check if player has cleared all face-down cards
const canAutoFinish = computed(() => {
  if (stats.isGameWon) return false;
  return canAutoComplete(stock.value, waste.value, tableau.value);
});

// ----------------- Dynamic Layout Calculation -----------------
// Calculate tableau card stacking offsets based on screen height
function getTableauCardOffset(column: Card[], cardIdx: number): number {
  let offset = 0;
  const isSmallScreen = typeof window !== 'undefined' && window.innerHeight < 500;
  const downGap = isSmallScreen ? 12 : 16;
  const upGap = isSmallScreen ? 20 : 28;

  for (let i = 0; i < cardIdx; i++) {
    offset += column[i].faceUp ? upGap : downGap;
  }
  return offset;
}

// ----------------- Game Loop & Timer -----------------
function startTimer() {
  if (timer) clearInterval(timer);
  timer = window.setInterval(() => {
    if (stats.isGameActive && !stats.isGameWon) {
      stats.timeElapsed++;
    }
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ----------------- Start / Restart Game -----------------
function initGame() {
  stopTimer();
  const setup = dealNewGame();
  tableau.value = setup.tableau;
  stock.value = setup.stock;
  waste.value = setup.waste;
  foundations.value = setup.foundations;
  history.value = [];

  stats.moves = 0;
  stats.score = 0;
  stats.timeElapsed = 0;
  stats.isGameWon = false;
  stats.isGameActive = true;
  isAutoCompleting.value = false;

  soundManager.playDeal();
  startTimer();
}

function confirmNewGame() {
  if (stats.moves > 2 && !stats.isGameWon) {
    if (confirm('确定要放弃当前对局并开始新游戏吗？')) {
      initGame();
    }
  } else {
    initGame();
  }
}

// ----------------- Stock & Waste Actions -----------------
function handleStockClick() {
  if (isAutoCompleting.value) return;

  if (stock.value.length === 0) {
    // Recycle Waste back to Stock
    if (waste.value.length === 0) return;

    soundManager.playDeal();
    const recycledCards = waste.value.map((c) => ({ ...c, faceUp: false })).reverse();
    stock.value = recycledCards;
    waste.value = [];

    stats.moves++;
    stats.score = Math.max(0, stats.score - 20);

    history.value.push({
      id: Math.random().toString(),
      type: 'recycle',
      from: { type: 'waste' },
      to: { type: 'stock' },
      cards: recycledCards,
      scoreDelta: -20,
    });
    return;
  }

  // Draw cards from Stock to Waste (1 or 3)
  const drawAmount = Math.min(settings.drawCount, stock.value.length);
  const drawnCards: Card[] = [];

  for (let i = 0; i < drawAmount; i++) {
    const card = stock.value.pop()!;
    card.faceUp = true;
    drawnCards.push(card);
    waste.value.push(card);
  }

  soundManager.playFlip();
  stats.moves++;

  history.value.push({
    id: Math.random().toString(),
    type: 'draw',
    from: { type: 'stock' },
    to: { type: 'waste' },
    cards: drawnCards,
    scoreDelta: 0,
  });
}

// ----------------- Smart Tap & Pointer Drag -----------------
interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  source: PileLocation | null;
  cards: Card[];
  cardWidth: number;
  isMobile: boolean;
  hasMovedSignificant: boolean;
}

const dragState = reactive<DragState>({
  isDragging: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  source: null,
  cards: [],
  cardWidth: 70,
  isMobile: false,
  hasMovedSignificant: false,
});

const activeDropTarget = ref<PileLocation | null>(null);

function isCardSelected(card: Card): boolean {
  return dragState.isDragging && dragState.cards.some((c) => c.id === card.id);
}

function handlePointerDown(e: PointerEvent, card: Card, source: PileLocation) {
  if (isAutoCompleting.value || stats.isGameWon) return;

  // If card is face-down:
  if (!card.faceUp) {
    // If it's the top card of a tableau column, flip it!
    if (
      source.type === 'tableau' &&
      source.pileIndex !== undefined &&
      source.cardIndex === tableau.value[source.pileIndex].length - 1
    ) {
      card.faceUp = true;
      soundManager.playFlip();
      stats.score += 5;
      stats.moves++;
      history.value.push({
        id: Math.random().toString(),
        type: 'flip',
        from: source,
        cards: [card],
        scoreDelta: 5,
      });
    }
    return;
  }

  // Get moving cards stack (for tableau, moving a card also moves all cards below it)
  let cardsToMove: Card[] = [];
  if (source.type === 'tableau' && source.pileIndex !== undefined && source.cardIndex !== undefined) {
    cardsToMove = tableau.value[source.pileIndex].slice(source.cardIndex);
  } else {
    cardsToMove = [card];
  }

  const targetEl = e.currentTarget as HTMLElement;
  const rect = targetEl.getBoundingClientRect();

  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  dragState.currentX = e.clientX;
  dragState.currentY = e.clientY;
  dragState.source = source;
  dragState.cards = cardsToMove;
  dragState.cardWidth = rect.width || 70;
  dragState.isMobile = window.innerWidth < 800;
  dragState.hasMovedSignificant = false;

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(e: PointerEvent) {
  if (!dragState.source) return;

  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  if (!dragState.hasMovedSignificant && Math.hypot(dx, dy) > 8) {
    dragState.hasMovedSignificant = true;
    dragState.isDragging = true;
  }

  if (dragState.isDragging) {
    dragState.currentX = e.clientX;
    dragState.currentY = e.clientY;

    // Check potential drop target under pointer
    activeDropTarget.value = detectDropTarget(e.clientX, e.clientY);
  }
}

function onPointerUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);

  if (!dragState.source) return;

  const source = dragState.source;
  const cards = dragState.cards;
  const wasDragging = dragState.isDragging && dragState.hasMovedSignificant;

  dragState.isDragging = false;
  activeDropTarget.value = null;

  if (!wasDragging) {
    // ----------------- SMART TAP! -----------------
    executeSmartTap(cards, source);
  } else {
    // ----------------- DRAG & DROP RELEASE -----------------
    const target = detectDropTarget(e.clientX, e.clientY);
    if (target) {
      tryMoveCards(cards, source, target);
    }
  }

  dragState.source = null;
  dragState.cards = [];
}

// Detect which pile is under (x, y) coordinates
function detectDropTarget(x: number, y: number): PileLocation | null {
  const elements = document.elementsFromPoint(x, y);

  // Check Foundations first
  for (let f = 0; f < 4; f++) {
    for (const el of elements) {
      if (el.closest(`[key="foundation-${f}"]`) || el.getAttribute('key') === `foundation-${f}`) {
        return { type: 'foundation', pileIndex: f };
      }
    }
  }

  // Check 7 Tableau Columns
  for (let t = 0; t < 7; t++) {
    for (const el of elements) {
      if (el.closest(`[key="col-${t}"]`) || el.getAttribute('key') === `col-${t}`) {
        return { type: 'tableau', pileIndex: t };
      }
    }
  }

  return null;
}

// ----------------- Move Execution -----------------
function executeSmartTap(cards: Card[], source: PileLocation) {
  const target = findSmartMove(cards, source, foundations.value, tableau.value);
  if (target) {
    tryMoveCards(cards, source, target);
  } else {
    soundManager.playFlip(); // Subtle tap sound even when no move
  }
}

function handleEmptyTableauClick(colIdx: number) {
  // If user tapped empty column, see if top card of waste is King
  if (waste.value.length > 0 && waste.value[waste.value.length - 1].rank === 13) {
    tryMoveCards([waste.value[waste.value.length - 1]], { type: 'waste' }, { type: 'tableau', pileIndex: colIdx });
  }
}

function tryMoveCards(cards: Card[], source: PileLocation, target: PileLocation) {
  // Validation
  let isValid = false;
  let scoreDelta = 0;

  if (target.type === 'foundation' && target.pileIndex !== undefined) {
    if (cards.length === 1 && canPlaceOnFoundation(cards[0], foundations.value[target.pileIndex])) {
      isValid = true;
      scoreDelta = 10;
    }
  } else if (target.type === 'tableau' && target.pileIndex !== undefined) {
    if (canPlaceOnTableau(cards, tableau.value[target.pileIndex])) {
      isValid = true;
      if (source.type === 'waste') {
        scoreDelta = 5;
      } else if (source.type === 'foundation') {
        scoreDelta = -15; // Moving back from foundation
      }
    }
  }

  if (!isValid) return;

  // Execute Move:
  // 1. Remove from source
  if (source.type === 'waste') {
    waste.value.pop();
  } else if (source.type === 'foundation' && source.pileIndex !== undefined) {
    foundations.value[source.pileIndex].pop();
  } else if (source.type === 'tableau' && source.pileIndex !== undefined) {
    tableau.value[source.pileIndex].splice(source.cardIndex!, cards.length);
  }

  // 2. Add to target
  if (target.type === 'foundation' && target.pileIndex !== undefined) {
    foundations.value[target.pileIndex].push(...cards);
    soundManager.playFoundation(cards[0].rank);
  } else if (target.type === 'tableau' && target.pileIndex !== undefined) {
    tableau.value[target.pileIndex].push(...cards);
    soundManager.playPlace();
  }

  // 3. If source was tableau and the new top card is face-down, flip it!
  let flippedPreviousCard: { pileIndex: number; cardIndex: number } | undefined;
  if (source.type === 'tableau' && source.pileIndex !== undefined) {
    const col = tableau.value[source.pileIndex];
    if (col.length > 0 && !col[col.length - 1].faceUp) {
      col[col.length - 1].faceUp = true;
      scoreDelta += 5;
      flippedPreviousCard = {
        pileIndex: source.pileIndex,
        cardIndex: col.length - 1,
      };
      soundManager.playFlip();
    }
  }

  stats.moves++;
  stats.score += scoreDelta;

  history.value.push({
    id: Math.random().toString(),
    type: 'move',
    from: source,
    to: target,
    cards: [...cards],
    flippedPreviousCard,
    scoreDelta,
  });

  // Check victory
  checkVictory();
}

// ----------------- Undo Engine -----------------
function undoLastMove() {
  if (history.value.length === 0 || isAutoCompleting.value) return;

  const record = history.value.pop()!;
  soundManager.playUndo();

  if (record.type === 'draw') {
    // Put drawn cards back to stock
    for (let i = 0; i < record.cards.length; i++) {
      const card = waste.value.pop();
      if (card) {
        card.faceUp = false;
        stock.value.push(card);
      }
    }
  } else if (record.type === 'recycle') {
    // Put stock cards back to waste
    const cardsToWaste = stock.value.map((c) => ({ ...c, faceUp: true })).reverse();
    waste.value = cardsToWaste;
    stock.value = [];
  } else if (record.type === 'flip') {
    // Re-flip card face-down
    if (record.from.type === 'tableau' && record.from.pileIndex !== undefined) {
      const col = tableau.value[record.from.pileIndex];
      const card = col[col.length - 1];
      if (card) card.faceUp = false;
    }
  } else if (record.type === 'move') {
    // 1. If we flipped previous card in source tableau, un-flip it
    if (record.flippedPreviousCard) {
      const col = tableau.value[record.flippedPreviousCard.pileIndex];
      if (col[record.flippedPreviousCard.cardIndex]) {
        col[record.flippedPreviousCard.cardIndex].faceUp = false;
      }
    }

    // 2. Remove cards from target
    const target = record.to!;
    if (target.type === 'foundation' && target.pileIndex !== undefined) {
      for (let i = 0; i < record.cards.length; i++) {
        foundations.value[target.pileIndex].pop();
      }
    } else if (target.type === 'tableau' && target.pileIndex !== undefined) {
      tableau.value[target.pileIndex].splice(
        tableau.value[target.pileIndex].length - record.cards.length,
        record.cards.length
      );
    }

    // 3. Return cards to source
    const source = record.from;
    if (source.type === 'waste') {
      waste.value.push(...record.cards);
    } else if (source.type === 'foundation' && source.pileIndex !== undefined) {
      foundations.value[source.pileIndex].push(...record.cards);
    } else if (source.type === 'tableau' && source.pileIndex !== undefined) {
      tableau.value[source.pileIndex].push(...record.cards);
    }
  }

  stats.moves = Math.max(0, stats.moves - 1);
  stats.score = Math.max(0, stats.score - record.scoreDelta);
}

// ----------------- Auto Complete -----------------
function triggerAutoComplete() {
  if (isAutoCompleting.value || !canAutoFinish.value) return;

  isAutoCompleting.value = true;

  const timer = setInterval(() => {
    // Find any card on tableau that can move to foundations
    let moved = false;

    for (let t = 0; t < 7; t++) {
      const col = tableau.value[t];
      if (col.length > 0) {
        const topCard = col[col.length - 1];
        for (let f = 0; f < 4; f++) {
          if (canPlaceOnFoundation(topCard, foundations.value[f])) {
            const card = col.pop()!;
            foundations.value[f].push(card);
            soundManager.playFoundation(card.rank);
            stats.moves++;
            stats.score += 10;
            moved = true;
            break;
          }
        }
      }
      if (moved) break;
    }

    if (isVictory(foundations.value)) {
      clearInterval(timer);
      isAutoCompleting.value = false;
      checkVictory();
    } else if (!moved) {
      clearInterval(timer);
      isAutoCompleting.value = false;
    }
  }, 120);
}

// ----------------- Victory Checking -----------------
function checkVictory() {
  if (isVictory(foundations.value)) {
    stats.isGameWon = true;
    stopTimer();
  }
}

// ----------------- Toggles & Settings -----------------
function toggleDrawCount() {
  settings.drawCount = settings.drawCount === 1 ? 3 : 1;
  saveSettings();
}

function toggleSound() {
  settings.soundEnabled = !settings.soundEnabled;
  soundManager.setEnabled(settings.soundEnabled);
  saveSettings();
}

function cycleTheme() {
  const themes: ('emerald' | 'ocean' | 'obsidian')[] = ['emerald', 'ocean', 'obsidian'];
  const nextIdx = (themes.indexOf(settings.theme) + 1) % themes.length;
  settings.theme = themes[nextIdx];
  saveSettings();
}

function saveSettings() {
  try {
    localStorage.setItem('solitaire_settings', JSON.stringify(settings));
  } catch {
    // Storage quota or private mode
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('solitaire_settings');
    if (saved) {
      Object.assign(settings, JSON.parse(saved));
      soundManager.setEnabled(settings.soundEnabled);
    }
  } catch {
    // Ignore error
  }
}

// Fullscreen State & Mobile Detection
const isFullscreen = ref(false);
const isMobileDevice = ref(false);
const dismissedFullscreenPill = ref(false);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

function updateFullscreenState() {
  isFullscreen.value = !!document.fullscreenElement;
}

onMounted(() => {
  loadSettings();
  initGame();

  if (typeof window !== 'undefined') {
    isMobileDevice.value = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 900;
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
  }
});

onUnmounted(() => {
  stopTimer();
  if (typeof window !== 'undefined') {
    document.removeEventListener('fullscreenchange', updateFullscreenState);
    document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
  }
});
</script>
