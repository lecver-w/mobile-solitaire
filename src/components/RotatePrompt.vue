<template>
  <div
    v-if="isPortrait && !dismissed"
    class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-white text-center select-none"
  >
    <!-- Animated Rotating Device Icon -->
    <div class="relative w-24 h-24 mb-6 flex items-center justify-center">
      <div class="w-16 h-28 border-2 border-emerald-400 rounded-2xl flex items-center justify-center animate-spin [animation-duration:3s]">
        <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 mb-auto mt-2"></div>
      </div>
      <div class="absolute inset-0 flex items-center justify-center">
        <svg class="w-8 h-8 text-emerald-400/80 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    </div>

    <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
      请将手机旋转至横屏
    </h2>
    <p class="text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed mb-8">
      经典纸牌专为横屏视野设计，旋转屏幕即可享受最畅快的手感与全景桌面。
    </p>

    <!-- Dismiss Button for dev/testing -->
    <button
      @click="dismissed = true"
      class="px-5 py-2 rounded-full border border-slate-700 text-xs text-slate-400 hover:text-white transition active:scale-95"
    >
      保持竖屏继续（仅供调试）
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isPortrait = ref(false);
const dismissed = ref(false);

function checkOrientation() {
  if (typeof window !== 'undefined') {
    isPortrait.value = window.innerHeight > window.innerWidth && window.innerWidth < 800;
  }
}

onMounted(() => {
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation);
  window.removeEventListener('orientationchange', checkOrientation);
});
</script>
