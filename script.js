const overlayEl = document.getElementById("overlay");

let closeTimer = null;
let effectTimer = null;
let isRunning = false;
let scrollLockY = 0;
let tick = 0;

const START_DELAY_MS = 2000; // задержка перед стартом
const EFFECT_MS = 3000;      // длительность эффекта

function lockScroll() {
  if (document.body.dataset.scrollLocked === "1") return;
  document.body.dataset.scrollLocked = "1";

  scrollLockY = window.scrollY || 0;

  // Лёгкая блокировка прокрутки (без position: fixed — на мобилках меньше багов)
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
}

function unlockScroll() {
  if (document.body.dataset.scrollLocked !== "1") return;
  document.body.dataset.scrollLocked = "0";

  document.body.style.overflow = "";
  document.body.style.touchAction = "";

  document.documentElement.style.overflow = "";

  window.scrollTo(0, scrollLockY);
}

function preventScrollWhileRunning(e) {
  if (!isRunning) return;
  e.preventDefault();
}

function preventScrollKeysWhileRunning(e) {
  if (!isRunning) return;
  if (e.key === "Escape") return;

  const blocked = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
  ]);
  if (blocked.has(e.key)) e.preventDefault();
}

// Блокируем скролл, пока идёт эффект
window.addEventListener("wheel", preventScrollWhileRunning, { passive: false });
window.addEventListener("touchmove", preventScrollWhileRunning, { passive: false });
window.addEventListener("keydown", preventScrollKeysWhileRunning, { passive: false });

function closeOverlay() {
  overlayEl?.classList.remove("is-open");
  overlayEl?.setAttribute("aria-hidden", "true");

  document.documentElement.classList.remove("shake-a", "shake-b");
  document.body.classList.remove("flash-a", "flash-b");

  unlockScroll();

  if (effectTimer) window.clearInterval(effectTimer);
  effectTimer = null;

  if (closeTimer) window.clearTimeout(closeTimer);
  closeTimer = null;

  isRunning = false;
}

function openOverlay() {
  if (!overlayEl || isRunning) return;
  isRunning = true;

  lockScroll();

  overlayEl.classList.add("is-open");
  overlayEl.setAttribute("aria-hidden", "false");

  const startedAt = Date.now();

  effectTimer = window.setInterval(() => {
    tick = (tick + 1) & 1;

    // Перезапуск “удара” без forced reflow (меньше лагов на мобилках)
    document.documentElement.classList.toggle("shake-a", tick === 0);
    document.documentElement.classList.toggle("shake-b", tick === 1);
    document.body.classList.toggle("flash-a", tick === 0);
    document.body.classList.toggle("flash-b", tick === 1);

    if (Date.now() - startedAt >= EFFECT_MS) {
      closeOverlay();
    }
  }, 260);

  closeTimer = window.setTimeout(closeOverlay, EFFECT_MS + 200);
}

function startWithDelay() {
  window.setTimeout(() => {
    openOverlay();
  }, 2000);
}
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startWithDelay, { once: true });
} else {
  startWithDelay();
}

// (опционально) закрыть по клику на фон
overlayEl?.addEventListener("click", (e) => {
  if (e.target === overlayEl) closeOverlay();
});

// (опционально) закрыть по Escape
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeOverlay();
});
