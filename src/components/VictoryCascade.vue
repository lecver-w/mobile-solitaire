<template>
  <div class="fixed inset-0 z-50 pointer-events-auto flex flex-col items-center justify-center">
    <!-- Fullscreen Canvas for the classic bouncing waterfall -->
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full"></canvas>

    <!-- Victory Overlay Dialog -->
    <div
      v-if="showDialog"
      class="relative z-10 bg-slate-900/90 backdrop-blur-md border border-amber-400/30 rounded-2xl p-6 sm:p-8 max-w-sm w-11/12 text-center shadow-2xl text-white transform animate-in fade-in zoom-in-95 duration-300"
    >
      <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>

      <h2 class="text-2xl font-black tracking-wide text-amber-300 mb-1">恭喜获胜！</h2>
      <p class="text-xs sm:text-sm text-slate-300 mb-4">你已成功归位所有 52 张扑克牌</p>

      <div class="grid grid-cols-3 gap-2 bg-slate-800/60 rounded-xl p-3 mb-5 border border-slate-700/50">
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider">耗时</div>
          <div class="text-sm sm:text-base font-bold text-white">{{ formattedTime }}</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider">步数</div>
          <div class="text-sm sm:text-base font-bold text-white">{{ moves }}</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider">得分</div>
          <div class="text-sm sm:text-base font-bold text-emerald-400">{{ score }}</div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          @click="$emit('newGame')"
          class="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm sm:text-base"
        >
          再来一局
        </button>
        <button
          @click="showDialog = false"
          class="px-4 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition text-sm sm:text-base"
        >
          欣赏动画
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import confetti from 'canvas-confetti';
import type { Card } from '../types/solitaire';
import { getRankLabel, getCardColor } from '../utils/deck';
import { soundManager } from '../utils/sound';

const props = defineProps<{
  foundations: Card[][];
  moves: number;
  score: number;
  timeElapsed: number;
}>();

defineEmits<{
  (e: 'newGame'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const showDialog = ref(false);

const formattedTime = computed(() => {
  const m = Math.floor(props.timeElapsed / 60);
  const s = props.timeElapsed % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

interface BouncingCard {
  card: Card;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  active: boolean;
}

let animationId: number | null = null;
const bouncingCards: BouncingCard[] = [];

onMounted(() => {
  soundManager.playWin();

  // Burst modern confetti
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  } catch {
    // Confetti fallback
  }

  // Show victory score modal after 2.5 seconds so user can enjoy initial card cascade
  setTimeout(() => {
    showDialog.value = true;
  }, 2200);

  initCanvasAndCascade();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});

function initCanvasAndCascade() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const cardW = Math.max(50, Math.min(width / 9, 85));
  const cardH = cardW * 1.4;

  // Flatten all foundation cards in reverse order (Kings first down to Aces)
  const cardsToBounce: { card: Card; originX: number; originY: number }[] = [];
  props.foundations.forEach((pile, pIdx) => {
    // Estimate original foundation X coordinate on landscape screen (right side)
    const pileX = width * 0.55 + pIdx * (cardW + 8);
    const pileY = height * 0.08;

    for (let i = pile.length - 1; i >= 0; i--) {
      cardsToBounce.push({
        card: pile[i],
        originX: pileX,
        originY: pileY,
      });
    }
  });

  // Launch cards sequentially
  let cardIndex = 0;
  const interval = setInterval(() => {
    if (cardIndex >= cardsToBounce.length) {
      clearInterval(interval);
      return;
    }
    const item = cardsToBounce[cardIndex++];
    bouncingCards.push({
      card: item.card,
      x: item.originX,
      y: item.originY,
      vx: (Math.random() - 0.5) * 8 - 3, // Drift leftwards/downwards
      vy: -(Math.random() * 4 + 2),
      width: cardW,
      height: cardH,
      active: true,
    });
  }, 180);

  const gravity = 0.45;
  const bounce = -0.78;

  function renderLoop() {
    // NOTE: In classic Solitaire cascade, we deliberately do NOT clearRect!
    // The previous frames stay on the canvas, creating the iconic card waterfall stamp effect!

    for (const b of bouncingCards) {
      if (!b.active) continue;

      // Draw card stamp
      drawCardToCanvas(ctx!, b);

      // Physics update
      b.x += b.vx;
      b.y += b.vy;
      b.vy += gravity;

      // Floor bounce
      if (b.y + b.height >= height) {
        b.y = height - b.height;
        b.vy *= bounce;

        // Sound on floor bounce
        if (Math.abs(b.vy) > 2) {
          soundManager.playFlip();
        }
      }

      // Left or right bounce
      if (b.x < -b.width * 2 || b.x > width + b.width * 2) {
        b.active = false;
      }
    }

    animationId = requestAnimationFrame(renderLoop);
  }

  animationId = requestAnimationFrame(renderLoop);
}

function drawCardToCanvas(ctx: CanvasRenderingContext2D, b: BouncingCard) {
  const { x, y, width: w, height: h, card } = b;
  const radius = 6;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Card Body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  ctx.restore();

  // Card Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();

  // Suit & Rank Text
  const isRed = getCardColor(card.suit) === 'red';
  ctx.fillStyle = isRed ? '#e11d48' : '#0f172a';
  ctx.font = `bold ${Math.round(w * 0.22)}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const label = getRankLabel(card.rank);
  const suitChar = card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'spades' ? '♠' : '♣';

  ctx.fillText(label, x + w * 0.1, y + h * 0.08);

  ctx.font = `${Math.round(w * 0.22)}px sans-serif`;
  ctx.fillText(suitChar, x + w * 0.1, y + h * 0.28);

  // Big Center Suit
  ctx.font = `${Math.round(w * 0.45)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suitChar, x + w / 2, y + h / 2);
}
</script>
