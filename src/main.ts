import Phaser from 'phaser';
import NoSleep from 'nosleep.js';
import { AvatarSelectScene } from './scenes/AvatarSelectScene';
import { RunningMainScene } from './scenes/RunningMainScene';

type RunnerUiState = {
  coinScore: number;
  partyCount: number;
  healthPercent: number;
  magnetManual: boolean;
  autoManual: boolean;
  sprintManual: boolean;
  rainManual: boolean;
  rainingNow: boolean;
  magnetBuffSec: number;
  autoBuffSec: number;
};

type RunnerSceneApi = Phaser.Scene & {
  getExternalUiState: () => RunnerUiState;
  drinkPotionFromUi: () => void;
  setMagnetModeEnabled: (enabled: boolean) => void;
  setAutoRunModeEnabled: (enabled: boolean) => void;
  setSprintModeEnabled: (enabled: boolean) => void;
  setRainModeEnabled: (enabled: boolean) => void;
};

const appEl = document.getElementById('app') as HTMLElement | null;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: appEl?.clientWidth || window.innerWidth,
  height: appEl?.clientHeight || window.innerHeight,
  backgroundColor: '#1a1f2b',
  pixelArt: true,
  antialias: false,
  antialiasGL: false,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1700 },
      debug: false
    }
  },
  scene: [AvatarSelectScene, RunningMainScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
const sceneManager = game.scene as Phaser.Scenes.SceneManager & { events?: Phaser.Events.EventEmitter };
let appResizeObserver: ResizeObserver | null = null;
const hudCoinEl = document.getElementById('hud-coin') as HTMLElement | null;
const hudPartyEl = document.getElementById('hud-party') as HTMLElement | null;
const hudHpEl = document.getElementById('hud-hp') as HTMLElement | null;
const hudHpBarEl = document.getElementById('hud-hp-bar') as HTMLElement | null;
const potionBtnEl = document.getElementById('btn-potion') as HTMLButtonElement | null;
const magnetBtnEl = document.getElementById('btn-magnet') as HTMLButtonElement | null;
const autoBtnEl = document.getElementById('btn-auto') as HTMLButtonElement | null;
const shiftBtnEl = document.getElementById('btn-shift') as HTMLButtonElement | null;
const rainBtnEl = document.getElementById('btn-rain') as HTMLButtonElement | null;
let lastLayoutMode = '';
let lastResizeWidth = -1;
let lastResizeHeight = -1;

function getRunnerScene(): RunnerSceneApi | null {
  const scene = game.scene.getScene('RunningMainScene');
  if (!scene || !scene.scene?.isActive()) {
    return null;
  }
  return scene as RunnerSceneApi;
}

function renderHudState(state: RunnerUiState | null | undefined): void {
  if (!state) {
    return;
  }
  const coinScore = Math.max(0, Number(state.coinScore) || 0);
  const partyCount = Math.max(1, Number(state.partyCount) || 1);
  const healthPercent = Math.max(0, Math.min(100, Number(state.healthPercent) || 0));
  const magnetManual = Boolean(state.magnetManual);
  const autoManual = Boolean(state.autoManual);
  const sprintManual = Boolean(state.sprintManual);
  const rainManual = Boolean(state.rainManual);
  const rainingNow = Boolean(state.rainingNow);
  const magnetBuffSec = Math.max(0, Number(state.magnetBuffSec) || 0);
  const autoBuffSec = Math.max(0, Number(state.autoBuffSec) || 0);

  if (hudCoinEl) {
    hudCoinEl.textContent = String(coinScore);
  }
  if (hudPartyEl) {
    hudPartyEl.textContent = String(partyCount);
  }
  if (hudHpEl) {
    hudHpEl.textContent = `${healthPercent}%`;
  }
  if (hudHpBarEl) {
    hudHpBarEl.style.width = `${healthPercent}%`;
  }

  if (magnetBtnEl) {
    const magnetLabel = magnetManual ? 'MAGNET ON' : 'MAGNET OFF';
    const buffSuffix = magnetBuffSec > 0 ? ` ${magnetBuffSec}s` : '';
    magnetBtnEl.textContent = `${magnetLabel}${buffSuffix}`;
    magnetBtnEl.classList.toggle('bg-emerald-500/25', magnetManual);
    magnetBtnEl.classList.toggle('border-emerald-300', magnetManual);
    magnetBtnEl.classList.toggle('text-emerald-100', magnetManual);
  }

  if (autoBtnEl) {
    const autoLabel = autoManual ? 'AUTO ON' : 'AUTO OFF';
    const buffSuffix = autoBuffSec > 0 ? ` ${autoBuffSec}s` : '';
    autoBtnEl.textContent = `${autoLabel}${buffSuffix}`;
    autoBtnEl.classList.toggle('bg-cyan-500/25', autoManual);
    autoBtnEl.classList.toggle('border-cyan-300', autoManual);
    autoBtnEl.classList.toggle('text-cyan-100', autoManual);
  }

  if (shiftBtnEl) {
    shiftBtnEl.textContent = sprintManual ? 'SHIFT ON' : 'SHIFT OFF';
    shiftBtnEl.classList.toggle('bg-lime-500/30', sprintManual);
    shiftBtnEl.classList.toggle('border-lime-200', sprintManual);
    shiftBtnEl.classList.toggle('text-lime-50', sprintManual);
  }

  if (rainBtnEl) {
    if (rainManual) {
      rainBtnEl.textContent = 'RAIN ON';
      rainBtnEl.classList.add('bg-cyan-500/30', 'border-cyan-200', 'text-cyan-50');
    } else {
      rainBtnEl.textContent = rainingNow ? 'RAIN AUTO(ON)' : 'RAIN AUTO';
      rainBtnEl.classList.remove('bg-cyan-500/30', 'border-cyan-200', 'text-cyan-50');
    }
  }
}

function resizeGameToPane(): void {
  if (!appEl || !game?.scale) {
    return;
  }
  const width = Math.max(1, appEl.clientWidth);
  const height = Math.max(1, appEl.clientHeight);
  if (width === lastResizeWidth && height === lastResizeHeight) {
    return;
  }
  lastResizeWidth = width;
  lastResizeHeight = height;
  game.scale.resize(width, height);
}

function forceLayoutResize(): void {
  syncLayoutMode();
  resizeGameToPane();
  window.requestAnimationFrame(() => {
    resizeGameToPane();
    window.requestAnimationFrame(() => {
      resizeGameToPane();
    });
  });
}

function syncLayoutMode(): void {
  const isRunnerActive = game.scene.isActive('RunningMainScene');
  const mode = isRunnerActive ? 'mode-runner' : 'mode-select';
  if (mode === lastLayoutMode) {
    return;
  }
  lastLayoutMode = mode;
  document.body.classList.remove('mode-runner', 'mode-select');
  document.body.classList.add(mode);
  window.requestAnimationFrame(() => {
    resizeGameToPane();
  });
}

window.addEventListener('resize', resizeGameToPane);
resizeGameToPane();
syncLayoutMode();
if (sceneManager.events) {
  sceneManager.events.on('start', forceLayoutResize);
  sceneManager.events.on('wake', forceLayoutResize);
}
if (typeof ResizeObserver !== 'undefined' && appEl) {
  appResizeObserver = new ResizeObserver(() => {
    resizeGameToPane();
  });
  appResizeObserver.observe(appEl);
}

window.addEventListener('runner-ui-state', (event: Event) => {
  const customEvent = event as CustomEvent<RunnerUiState>;
  renderHudState(customEvent.detail);
});

window.setInterval(() => {
  syncLayoutMode();
  const scene = getRunnerScene();
  if (!scene || typeof scene.getExternalUiState !== 'function') {
    return;
  }
  renderHudState(scene.getExternalUiState());
}, 100);

if (potionBtnEl) {
  potionBtnEl.addEventListener('click', () => {
    const scene = getRunnerScene();
    if (scene && typeof scene.drinkPotionFromUi === 'function') {
      scene.drinkPotionFromUi();
    }
  });
}

if (magnetBtnEl) {
  magnetBtnEl.addEventListener('click', () => {
    const scene = getRunnerScene();
    if (scene && typeof scene.setMagnetModeEnabled === 'function' && typeof scene.getExternalUiState === 'function') {
      const state = scene.getExternalUiState();
      scene.setMagnetModeEnabled(!state.magnetManual);
    }
  });
}

if (autoBtnEl) {
  autoBtnEl.addEventListener('click', () => {
    const scene = getRunnerScene();
    if (scene && typeof scene.setAutoRunModeEnabled === 'function' && typeof scene.getExternalUiState === 'function') {
      const state = scene.getExternalUiState();
      scene.setAutoRunModeEnabled(!state.autoManual);
    }
  });
}

if (shiftBtnEl) {
  shiftBtnEl.addEventListener('click', () => {
    const scene = getRunnerScene();
    if (scene && typeof scene.setSprintModeEnabled === 'function' && typeof scene.getExternalUiState === 'function') {
      const state = scene.getExternalUiState();
      scene.setSprintModeEnabled(!state.sprintManual);
    }
  });
}

if (rainBtnEl) {
  rainBtnEl.addEventListener('click', () => {
    const scene = getRunnerScene();
    if (scene && typeof scene.setRainModeEnabled === 'function' && typeof scene.getExternalUiState === 'function') {
      const state = scene.getExternalUiState();
      scene.setRainModeEnabled(!state.rainManual);
    }
  });
}

const noSleep = new NoSleep();
let noSleepEnabled = false;

function registerNoSleepActivation() {
  const activate = async () => {
    if (noSleepEnabled) {
      return;
    }
    try {
      await noSleep.enable();
      noSleepEnabled = true;
    } catch {
      // Ignore failures (browser policy / unsupported environment).
    }
  };

  window.addEventListener('pointerdown', activate, { once: true });
  window.addEventListener('keydown', activate, { once: true });
}

registerNoSleepActivation();

document.addEventListener('visibilitychange', () => {
  if (document.hidden && noSleepEnabled) {
    noSleep.disable();
    noSleepEnabled = false;
    registerNoSleepActivation();
  }
});

window.addEventListener('beforeunload', () => {
  if (sceneManager.events) {
    sceneManager.events.off('start', forceLayoutResize);
    sceneManager.events.off('wake', forceLayoutResize);
  }
  if (appResizeObserver) {
    appResizeObserver.disconnect();
    appResizeObserver = null;
  }
});
