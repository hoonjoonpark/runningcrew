import Phaser from 'phaser';
import { AudioSystem } from '../systems/AudioSystem';

const BATCOP_RUN_KEY = 'batcop-run-v1';
const BATCOP_IDLE_KEY = 'batcop-idle-v1';
const BLUEHAIR_RUN_KEY = 'bluehair-run-v1';
const BLUEHAIR_IDLE_KEY = 'bluehair-idle-v1';
const REDHAT_RUN_KEY = 'redhat-run-v1';
const REDHAT_IDLE_KEY = 'redhat-idle-v1';
const REDMAN_RUN_KEY = 'redman-run-v1';
const REDMAN_IDLE_KEY = 'redman-idle-v1';
const BG_LOOP_KEY = 'bg-loop';
const COIN_KEY = 'coin';
const KING_COIN_KEY = 'coin-king';
const SUPER_KING_COIN_KEY = 'coin-super-king';
const MAGNET_ITEM_KEY = 'item-magnet';
const AUTO_ITEM_KEY = 'item-auto';

// Assumption based on your note: 5x5 sheet where each frame is 256x256.
// If your full image is 256x256 total, change these to match actual frame size.
const FRAME_WIDTH = 256;
const FRAME_HEIGHT = 256;
const MOVE_SPEED = 350;
const SPRINT_MULTIPLIER = 2;
const JUMP_VELOCITY = -720;
const FOOTSTEP_FRAME_START = 3;
const FOOTSTEP_FRAME_STEP = 4;
const FOOTSTEP_FRAME_END = 23;
const FOOTSTEP_HIGH_SPEED_THRESHOLD = 1.4;
const FOOTSTEP_MIN_INTERVAL_MS = 45;
const RAPID_TOUCH_WINDOW_MS = 250;
const TOUCH_MOVE_GRACE_MS = 2000;
const BG_SCROLL_FACTOR = 0.35;
const BG_SEAM_OVERLAP_PX = 2;
const BG_VERTICAL_OVERDRAW_PX = 2;
const COIN_SCROLL_FACTOR = 1;
const COIN_SPAWN_MIN_MS = 550;
const COIN_SPAWN_MAX_MS = 1200;
const COIN_BURST_CHANCE_PERCENT = 24;
const COIN_BURST_MIN_COUNT = 4;
const COIN_BURST_MAX_COUNT = 7;
const COIN_BURST_MIN_GAP_MS = 85;
const COIN_BURST_MAX_GAP_MS = 140;
const COIN_RUN_HEIGHT_OFFSET = 72;
const COIN_JUMP_HEIGHT_OFFSET = 182;
const KING_COIN_CHANCE_PERCENT = 12;
const KING_COIN_VALUE = 10;
const SUPER_KING_COIN_CHANCE_PERCENT = 2;
const SUPER_KING_COIN_VALUE = 30;
const MAGNET_ITEM_CHANCE_PERCENT = 7;
const MAGNET_DURATION_MS = 30000;
const AUTO_ITEM_CHANCE_PERCENT = 5;
const AUTO_RUN_DURATION_MS = 60000;
const COIN_MILESTONE_STEP = 100;
const MAGNET_ATTRACT_RADIUS = 220;
const MAGNET_COLLECT_RADIUS = 44;
const MAGNET_PULL_SPEED = 760;
const HEALTH_FULL_DURATION_SEC = 180;
const HEALTH_RECHARGE_RATIO = 0.1;
const HEALTH_RECHARGE_COST = 10;
const LEADER_SCALE = 0.62;
// Single vertical control value:
// lower value => everything moves upward.
const RUNNER_BASE_Y_RATIO = 0.66;
const GROUND_Y_RATIO = RUNNER_BASE_Y_RATIO + 0.15;
const PARTY_BASE_SPACING_X = 30;
const PARTY_FORMATION_SWAY_X = 70;
const PARTY_FORMATION_SWAY_Y = 0;
const PARTY_SWAY_BASE_SPEED = 0.56;
const PARTY_FOLLOW_LERP_BASE = 0.05;
const PARTY_FOLLOW_LERP_DT = 0.18;
const JUMP_TILT_DEG = 8;
const MAX_PARTY_SIZE = 20;
const ALLY_ITEM_CHANCE_PERCENT = 18;
// Relative to leader scale (0.8~1.1 => 80%~110% of leader size).
const FOLLOWER_MIN_SCALE_RATIO = 0.8;
const FOLLOWER_MAX_SCALE_RATIO = 1.1;
const FOLLOWER_VISUAL_NORMALIZE_MIN = 0.75;
const FOLLOWER_VISUAL_NORMALIZE_MAX = 1.25;
const IDLE_FRAME_COUNT = 25;
const SPEECH_MIN_INTERVAL_MS = 3200;
const SPEECH_MAX_INTERVAL_MS = 7800;
const SPEECH_DURATION_MS = 1900;
const SPEECH_MAX_ACTIVE = 2;
const SPEECH_LINES = ['가자!', '달려보자!', '할 수 있어!', '좋은 페이스야!', '끝까지 가보자!', '오늘도 전진!'];
const RAIN_MIN_ON_MS = 4500;
const RAIN_MAX_ON_MS = 10500;
const RAIN_MIN_OFF_MS = 6000;
const RAIN_MAX_OFF_MS = 15000;
const RAIN_DROP_COUNT = 140;
const FPS_UPDATE_INTERVAL_MS = 150;
const AVATAR_CONFIGS: Record<string, { runSheet: string; idleSheet: string }> = {
  batcop: {
    runSheet: BATCOP_RUN_KEY,
    idleSheet: BATCOP_IDLE_KEY
  },
  bluehair: {
    runSheet: BLUEHAIR_RUN_KEY,
    idleSheet: BLUEHAIR_IDLE_KEY
  },
  redhat: {
    runSheet: REDHAT_RUN_KEY,
    idleSheet: REDHAT_IDLE_KEY
  },
  redman: {
    runSheet: REDMAN_RUN_KEY,
    idleSheet: REDMAN_IDLE_KEY
  }
};

type AvatarId = keyof typeof AVATAR_CONFIGS;
type PartyMember = {
  id: AvatarId;
  sprite: Phaser.GameObjects.Sprite;
  runAnimKey: string;
  idleAnimKey: string;
  scaleFactor: number;
  phase: number;
  idleStartFrame: number;
};
type RainDrop = { x: number; y: number; vy: number; vx: number; len: number; a: number };
type SpeechBubble = {
  target: Phaser.GameObjects.Sprite;
  container: Phaser.GameObjects.Container;
  style: SpeechBubbleStyle;
  expireAt: number;
};
type ExternalUiState = {
  coinScore: number;
  partyCount: number;
  healthPercent: number;
  magnetManual: boolean;
  magnetBuffSec: number;
  autoManual: boolean;
  autoBuffSec: number;
  sprintManual: boolean;
  rainManual: boolean;
  rainingNow: boolean;
};
type SpeechBubbleStyle = 'thought' | 'speech';
type SpeechBubbleOptions = {
  style?: SpeechBubbleStyle;
  duration?: number;
  force?: boolean;
};
type CanvasButtonStyle = {
  width?: number;
  height?: number;
  fill?: number;
  stroke?: number;
  textColor?: string;
  activeFill?: number;
};

export class RunningMainScene extends Phaser.Scene {
  audioSystem: AudioSystem | null = null;
  avatarIds: AvatarId[] = [];
  avatarVisualScaleRatios: Record<string, number> = {};
  idlePhaseCursorByAvatar: Record<string, number> = {};
  leadAvatarId: AvatarId = 'batcop';
  leadRunAnimKey = '';
  leadIdleAnimKey = '';

  bgBaseWidth = 0;
  bgBaseHeight = 0;
  bgOffset = 0;
  bgScale = 1;
  bgSegmentWidth = 0;
  bgSegments: Phaser.GameObjects.Image[] = [];

  ground!: Phaser.GameObjects.Rectangle;
  runner!: Phaser.Physics.Arcade.Sprite;
  hat: Phaser.GameObjects.Image | null = null;
  partyMembers: PartyMember[] = [];

  coins!: Phaser.Physics.Arcade.Group;
  coinScore = 0;
  coinBurstRemaining = 0;
  coinBurstY: number | null = null;
  nextCoinAt = 0;
  nextCoinMilestone = COIN_MILESTONE_STEP;

  magnetEnabled = false;
  magnetBuffUntil = 0;
  autoRunManual = false;
  autoRunUntil = 0;
  sprintManual = false;

  healthRatio = 1;
  milestoneQueue: number[] = [];
  milestonePlaying = false;
  milestoneContainer: Phaser.GameObjects.Container | null = null;

  speechBubbles: SpeechBubble[] = [];
  nextSpeechAt = 0;

  rainManual = false;
  rainingNow = false;
  rainEmitting = false;
  rainWidth = 0;
  rainHeight = 0;
  rainGraphics: Phaser.GameObjects.Graphics | null = null;
  rainToggleTimer: Phaser.Time.TimerEvent | null = null;
  rainDrops: RainDrop[] = [];

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  jumpKey!: Phaser.Input.Keyboard.Key;
  shiftKey!: Phaser.Input.Keyboard.Key;
  rechargeKey!: Phaser.Input.Keyboard.Key;

  touchMoveActive = false;
  touchSprint = false;
  activeTouchCount = 0;
  lastTouchStartAt = 0;
  lastTouchEndAt = -Infinity;

  lastFootstepAt = -Infinity;
  nextExternalUiEmitAt = 0;
  gamePaused = false;
  nextFpsUpdateAt = 0;
  uiHealthGaugeHeight = 220;

  uiFill: Phaser.GameObjects.Graphics | null = null;
  uiFrame: Phaser.GameObjects.Graphics | null = null;
  uiPanel: Phaser.GameObjects.Rectangle | null = null;
  uiTitle: Phaser.GameObjects.Text | null = null;
  uiScore: Phaser.GameObjects.Text | null = null;
  uiMagnetStatus: Phaser.GameObjects.Text | null = null;
  uiAutoStatus: Phaser.GameObjects.Text | null = null;
  uiHealthLabel: Phaser.GameObjects.Text | null = null;
  uiHealthBack: Phaser.GameObjects.Rectangle | null = null;
  uiHealthFill: Phaser.GameObjects.Rectangle | null = null;
  uiHealthValue: Phaser.GameObjects.Text | null = null;
  uiMagnetButton: Phaser.GameObjects.Container | null = null;
  uiShoutGoButton: Phaser.GameObjects.Container | null = null;
  uiShoutFightButton: Phaser.GameObjects.Container | null = null;
  uiPauseButton: Phaser.GameObjects.Container | null = null;
  uiFpsText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('RunningMainScene');
  }

  preload(): void {
    this.load.image(BG_LOOP_KEY, '/assets/1.webp');

    this.load.spritesheet(BATCOP_RUN_KEY, '/assets/characters/batcop-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet(BATCOP_IDLE_KEY, '/assets/characters/batcop-idle-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet(BLUEHAIR_RUN_KEY, '/assets/characters/bluehair-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet(BLUEHAIR_IDLE_KEY, '/assets/characters/bluehair-idle-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet(REDHAT_RUN_KEY, '/assets/characters/redhat-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet(REDHAT_IDLE_KEY, '/assets/characters/redhat-idle-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet(REDMAN_RUN_KEY, '/assets/characters/redman-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet(REDMAN_IDLE_KEY, '/assets/characters/redman-idle-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });
  }

  create(): void {
    const { width, height } = this.scale;
    this.avatarIds = Object.keys(AVATAR_CONFIGS) as AvatarId[];
    const defaultAvatar: AvatarId = this.avatarIds[0] ?? 'batcop';
    this.avatarVisualScaleRatios = {};
    this.idlePhaseCursorByAvatar = {};
    this.leadAvatarId = (this.registry.get('selectedAvatar') as AvatarId) || defaultAvatar;
    if (!AVATAR_CONFIGS[this.leadAvatarId]) {
      this.leadAvatarId = defaultAvatar;
    }
    this.leadRunAnimKey = `${this.leadAvatarId}-run`;
    this.leadIdleAnimKey = `${this.leadAvatarId}-idle`;

    this.createHatTexture();
    this.createCoinTexture();
    this.createKingCoinTexture();
    this.createSuperKingCoinTexture();
    this.createMagnetItemTexture();
    this.createAutoItemTexture();
    this.createRainTexture();

    this.createLoopBackground(width, height);

    // Ground collider (visual removed; collider remains invisible).
    this.ground = this.add.rectangle(width / 2, height * GROUND_Y_RATIO, width, 24, 0x000000, 0).setOrigin(0.5);
    this.physics.add.existing(this.ground, true);

    this.createPartyRunners(width, height, this.leadAvatarId);
    this.buildAvatarVisualScaleRatios();
    this.lastFootstepAt = -Infinity;
    this.setupFootstepFrameSync();
    //this.hat = this.add.image(this.runner.x, this.runner.y, 'runner-hat').setScale(1.15).setDepth(20);

    this.coins = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
    this.physics.add.overlap(this.runner, this.coins, this.handleCoinOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.coinScore = 0;
    this.magnetEnabled = false;
    this.magnetBuffUntil = 0;
    this.autoRunManual = false;
    this.sprintManual = false;
    this.autoRunUntil = 0;
    this.healthRatio = 1;
    this.nextCoinMilestone = COIN_MILESTONE_STEP;
    this.milestoneQueue = [];
    this.milestonePlaying = false;
    this.speechBubbles = [];
    this.rainManual = false;
    this.nextSpeechAt = this.time.now + Phaser.Math.Between(SPEECH_MIN_INTERVAL_MS, SPEECH_MAX_INTERVAL_MS);
    this.coinBurstRemaining = 0;
    this.coinBurstY = null;
    this.nextCoinAt = this.time.now + Phaser.Math.Between(COIN_SPAWN_MIN_MS, COIN_SPAWN_MAX_MS);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.rechargeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.input.addPointer(2);
    this.touchMoveActive = false;
    this.touchSprint = false;
    this.activeTouchCount = 0;
    this.lastTouchStartAt = 0;
    this.lastTouchEndAt = -Infinity;
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointerupoutside', this.handlePointerUp, this);

    this.scale.on('resize', this.handleResize, this);

    this.add
      .text(16, 16, 'Left/Right or Touch=Right | Shift or fast touch=2x | Space jump', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#dbe7ff'
      })
      .setDepth(10);

    this.createGameUi();
    this.createShoutCanvasButtons();
    this.createPauseCanvasButton();
    this.createFpsOverlay();
    this.nextExternalUiEmitAt = 0;
    this.emitExternalUiState(true);
    this.handleResize(this.scale.gameSize);
    this.audioSystem = new AudioSystem(this);
    this.setupBackgroundMusic();
    this.setupRainCycle();
  }

  update(_: number, delta: number): void {
    const dt = delta / 1000;

    if (!this.runner) {
      return;
    }
    if (this.gamePaused) {
      return;
    }

    // Safety clamp for occasional layout/physics desync right after scene switch.
    const outBottom = this.runner.y > this.scale.height + this.runner.displayHeight * 0.8;
    if (outBottom && this.ground) {
      this.placeRunnerOnGround(this.scale.width * 0.5);
    }

    const touchMoveWithGrace = this.touchMoveActive || this.time.now - this.lastTouchEndAt <= TOUCH_MOVE_GRACE_MS;
    const canSprint = this.healthRatio > 0;
    if (!canSprint && this.sprintManual) {
      this.sprintManual = false;
      this.emitExternalUiState(true);
    }
    const sprintActive = canSprint && (this.shiftKey.isDown || this.touchSprint || this.sprintManual);
    const speed = sprintActive ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    const runAnimSpeed = sprintActive ? 2 : 1;
    let scrollInputSpeed = 0;
    if (this.cursors.left.isDown) {
      scrollInputSpeed = -speed;
      this.runner.setFlipX(true);
    } else if (this.cursors.right.isDown || touchMoveWithGrace) {
      scrollInputSpeed = speed;
      this.runner.setFlipX(false);
    }
    if (this.isAutoRunActive()) {
      scrollInputSpeed = speed;
      this.runner.setFlipX(false);
    }
    // Keep avatar fixed in place horizontally.
    this.runner.setVelocityX(0);

    this.updateLoopBackground(scrollInputSpeed * BG_SCROLL_FACTOR * dt);
    this.updateRainOverlay(dt);
    this.updateFpsOverlay();
    this.updateCoins(scrollInputSpeed);
    this.updateActiveItemsUi();
    if (Phaser.Input.Keyboard.JustDown(this.rechargeKey)) {
      this.tryRechargeHealth();
    }

    const runnerBody = this.runner.body as Phaser.Physics.Arcade.Body;
    const canJump = runnerBody.blocked.down || runnerBody.touching.down;
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && canJump) {
      this.runner.setVelocityY(JUMP_VELOCITY);
    }

    const movingHorizontally = Math.abs(scrollInputSpeed) > 5;
    const onGround = runnerBody.blocked.down || runnerBody.touching.down;
    const healthDrainMultiplier = movingHorizontally ? Math.max(1, Math.abs(scrollInputSpeed) / MOVE_SPEED) : 1;
    this.updateHealth(dt, movingHorizontally && onGround, healthDrainMultiplier);
    this.syncPartyAnimation(movingHorizontally && onGround, runAnimSpeed);
    this.updatePartyFormation(dt, movingHorizontally);
    this.updatePartyTilt(onGround);
    this.updateSpeechBubbles();
    this.maybeSpawnSpeechBubble();

    if (this.hat) {
      const xOffset = this.runner.flipX ? -14 : 14;
      this.hat.setPosition(this.runner.x + xOffset - 10, this.runner.y - 40);
      this.hat.setFlipX(this.runner.flipX);
    }

    this.emitExternalUiState();
  }

  createPartyRunners(width: number, height: number, leadAvatarId: AvatarId): void {
    this.partyMembers = [];
    this.ensureAvatarAnimations(leadAvatarId);
    const avatar = AVATAR_CONFIGS[leadAvatarId]!;

    const leader = this.physics.add
      .sprite(width * 0.5, height * RUNNER_BASE_Y_RATIO, avatar.runSheet)
      .setScale(LEADER_SCALE)
      .setCollideWorldBounds(true);
    const leaderBody = leader.body as Phaser.Physics.Arcade.Body;
    leaderBody.setSize(70, 108);
    leaderBody.setOffset(94, 146);
    this.physics.add.collider(leader, this.ground);
    this.runner = leader;
    this.placeRunnerOnGround(width * 0.5);

    leader.play(`${leadAvatarId}-idle`);
    this.partyMembers.push({
      id: leadAvatarId,
      sprite: leader,
      runAnimKey: `${leadAvatarId}-run`,
      idleAnimKey: `${leadAvatarId}-idle`,
      scaleFactor: LEADER_SCALE,
      phase: 0,
      idleStartFrame: this.allocateIdleStartFrame(leadAvatarId)
    });
  }

  ensureAvatarAnimations(avatarId: AvatarId): void {
    const avatar = AVATAR_CONFIGS[avatarId];
    if (!avatar) {
      return;
    }
    const runAnimKey = `${avatarId}-run`;
    const idleAnimKey = `${avatarId}-idle`;
    if (!this.anims.exists(runAnimKey)) {
      this.anims.create({
        key: runAnimKey,
        frames: this.anims.generateFrameNumbers(avatar.runSheet, {
          start: 0,
          end: 22
        }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!this.anims.exists(idleAnimKey)) {
      this.anims.create({
        key: idleAnimKey,
        frames: this.anims.generateFrameNumbers(avatar.idleSheet, {
          start: 0,
          end: 24
        }),
        frameRate: 12,
        repeat: -1
      });
    }
  }

  addPartyMember(avatarId: AvatarId): boolean {
    if (!AVATAR_CONFIGS[avatarId]) {
      return false;
    }
    if (this.partyMembers.length >= MAX_PARTY_SIZE) {
      return false;
    }
    this.ensureAvatarAnimations(avatarId);
    const runAnimKey = `${avatarId}-run`;
    const idleAnimKey = `${avatarId}-idle`;
    const minRatio = Math.min(FOLLOWER_MIN_SCALE_RATIO, FOLLOWER_MAX_SCALE_RATIO);
    const maxRatio = Math.max(FOLLOWER_MIN_SCALE_RATIO, FOLLOWER_MAX_SCALE_RATIO);
    const randomRatio = Phaser.Math.FloatBetween(minRatio, maxRatio);
    const visualRatio = this.avatarVisualScaleRatios?.[avatarId] ?? 1;
    const scaleFactor = LEADER_SCALE * randomRatio * visualRatio;
    const sprite = this.add
      .sprite(this.runner.x, this.runner.y, AVATAR_CONFIGS[avatarId].runSheet)
      .setScale(scaleFactor)
      .setDepth(8 + this.partyMembers.length);
    sprite.play(idleAnimKey);
    this.partyMembers.push({
      id: avatarId,
      sprite,
      runAnimKey,
      idleAnimKey,
      scaleFactor,
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      idleStartFrame: this.allocateIdleStartFrame(avatarId)
    });
    return true;
  }

  allocateIdleStartFrame(avatarId: AvatarId): number {
    const current = this.idlePhaseCursorByAvatar[avatarId] ?? 0;
    this.idlePhaseCursorByAvatar[avatarId] = current + 1;
    // Spread same-avatar members across idle timeline (step=7 is coprime with 25).
    return (current * 7) % IDLE_FRAME_COUNT;
  }

  buildAvatarVisualScaleRatios(): void {
    const leadVisualHeight = this.getAvatarVisualHeight(this.leadAvatarId);
    if (!Number.isFinite(leadVisualHeight) || leadVisualHeight <= 0) {
      for (const avatarId of this.avatarIds) {
        this.avatarVisualScaleRatios[avatarId] = 1;
      }
      return;
    }

    for (const avatarId of this.avatarIds) {
      const h = this.getAvatarVisualHeight(avatarId);
      if (!Number.isFinite(h) || h <= 0) {
        this.avatarVisualScaleRatios[avatarId] = 1;
        continue;
      }
      const ratio = Phaser.Math.Clamp(
        leadVisualHeight / h,
        FOLLOWER_VISUAL_NORMALIZE_MIN,
        FOLLOWER_VISUAL_NORMALIZE_MAX
      );
      this.avatarVisualScaleRatios[avatarId] = ratio;
    }
  }

  getAvatarVisualHeight(avatarId: AvatarId): number {
    const avatar = AVATAR_CONFIGS[avatarId];
    if (!avatar) {
      return NaN;
    }
    const texture = this.textures.get(avatar.idleSheet);
    const frame = texture?.get(0);
    if (!frame) {
      return NaN;
    }
    const image = frame.source?.image;
    if (!image) {
      return NaN;
    }

    const w = frame.cutWidth || FRAME_WIDTH;
    const h = frame.cutHeight || FRAME_HEIGHT;
    if (w <= 0 || h <= 0) {
      return NaN;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return NaN;
    }

    const sourceImage = image as CanvasImageSource;
    ctx.drawImage(
      sourceImage,
      frame.cutX,
      frame.cutY,
      w,
      h,
      0,
      0,
      w,
      h
    );

    const data = ctx.getImageData(0, 0, w, h).data;
    let minY = h;
    let maxY = -1;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const alpha = data[(y * w + x) * 4 + 3] ?? 0;
        if (alpha > 16) {
          if (y < minY) {
            minY = y;
          }
          if (y > maxY) {
            maxY = y;
          }
        }
      }
    }
    if (maxY < minY) {
      return NaN;
    }
    return maxY - minY + 1;
  }

  syncPartyAnimation(isRunningOnGround: boolean, runAnimSpeed: number): void {
    for (const member of this.partyMembers) {
      const wanted = isRunningOnGround ? member.runAnimKey : member.idleAnimKey;
      if (member.sprite.anims.currentAnim?.key !== wanted) {
        if (isRunningOnGround) {
          member.sprite.play(wanted, true);
        } else {
          member.sprite.anims.play(
            {
              key: wanted,
              startFrame: member.idleStartFrame ?? 0
            },
            true
          );
        }
      }
      member.sprite.anims.timeScale = isRunningOnGround ? runAnimSpeed : 1;
    }
  }

  updatePartyFormation(dt: number, movingHorizontally: boolean): void {
    if (!this.partyMembers || this.partyMembers.length < 2) {
      return;
    }
    const totalFollowers = this.partyMembers.length - 1;
    const leadScale = this.partyMembers[0]?.scaleFactor ?? LEADER_SCALE;
    const t = this.time.now / 1000;
    for (let i = 1; i < this.partyMembers.length; i += 1) {
      const member = this.partyMembers[i];
      if (!member) {
        continue;
      }
      const s = member.sprite;

      const rank = i - 1;
      const baseX = (rank - (totalFollowers - 1) * 0.5) * PARTY_BASE_SPACING_X;
      const baseY = 0;
      const aheadBehind = movingHorizontally
        ? Math.sin(t * (PARTY_SWAY_BASE_SPEED + i * 0.03) + member.phase) * PARTY_FORMATION_SWAY_X
        : 0;
      const nearFar = movingHorizontally
        ? Math.cos(t * (PARTY_SWAY_BASE_SPEED * 1.14 + i * 0.03) + member.phase) * PARTY_FORMATION_SWAY_Y
        : 0;
      const sizeYOffset = (leadScale - member.scaleFactor) * FRAME_HEIGHT * 0.5;
      const targetX = this.runner.x + baseX + aheadBehind;
      const targetY = this.runner.y + baseY + nearFar + sizeYOffset;

      s.x = Phaser.Math.Linear(s.x, targetX, PARTY_FOLLOW_LERP_BASE + dt * PARTY_FOLLOW_LERP_DT);
      s.y = Phaser.Math.Linear(s.y, targetY, PARTY_FOLLOW_LERP_BASE + dt * PARTY_FOLLOW_LERP_DT);
      s.setFlipX(this.runner.flipX);
      s.setDepth(8 + i + Math.floor(aheadBehind * 0.025));
    }
  }

  updatePartyTilt(onGround: boolean): void {
    const forwardTilt = this.runner.flipX ? -JUMP_TILT_DEG : JUMP_TILT_DEG;
    const targetAngle = onGround ? 0 : forwardTilt;
    for (const member of this.partyMembers) {
      member.sprite.angle = Phaser.Math.Linear(member.sprite.angle, targetAngle, 0.22);
    }
  }

  updateCoins(scrollInputSpeed: number): void {
    const movingHorizontally = Math.abs(scrollInputSpeed) > 5;
    const now = this.time.now;

    if (movingHorizontally && now >= this.nextCoinAt) {
      const moveDirection = scrollInputSpeed > 0 ? 1 : -1;
      const burstGap = Phaser.Math.Between(COIN_BURST_MIN_GAP_MS, COIN_BURST_MAX_GAP_MS);

      if (this.coinBurstRemaining > 0) {
        this.spawnCoin(moveDirection, this.coinBurstY, false);
        this.coinBurstRemaining -= 1;
        this.nextCoinAt = now + burstGap;
      } else {
        const startBurst = Phaser.Math.Between(0, 99) < COIN_BURST_CHANCE_PERCENT;
        if (startBurst) {
          this.coinBurstY = this.getRandomCoinLevelY();
          this.coinBurstRemaining = Phaser.Math.Between(COIN_BURST_MIN_COUNT, COIN_BURST_MAX_COUNT);
          this.spawnCoin(moveDirection, this.coinBurstY, false);
          this.coinBurstRemaining -= 1;
          this.nextCoinAt = now + burstGap;
        } else {
          this.spawnCoin(moveDirection, null, true);
          this.nextCoinAt = now + Phaser.Math.Between(COIN_SPAWN_MIN_MS, COIN_SPAWN_MAX_MS);
        }
      }
    }

    const velocityX = -scrollInputSpeed * COIN_SCROLL_FACTOR;
    const minX = -80;
    const maxX = this.scale.width + 80;
    const toCollect: Phaser.Physics.Arcade.Image[] = [];
    const activeCoins = this.coins.getChildren() as Phaser.Physics.Arcade.Image[];
    for (const coin of activeCoins) {
      const prevX = coin.getData('prevX') ?? coin.x;
      const currentX = coin.x;

      if (this.shouldCollectCoinBySweep(coin, prevX, currentX)) {
        toCollect.push(coin);
      }

      coin.setData('prevX', coin.x);

      if (this.isMagnetActive()) {
        const dx = this.runner.x - coin.x;
        const dy = this.runner.y - coin.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= MAGNET_ATTRACT_RADIUS) {
          if (dist <= MAGNET_COLLECT_RADIUS) {
            toCollect.push(coin);
          } else {
            const pull = Math.max(180, MAGNET_PULL_SPEED * (1 - dist / MAGNET_ATTRACT_RADIUS));
            const nx = dx / dist;
            const ny = dy / dist;
            coin.setVelocity(nx * pull, ny * pull);
          }
        } else {
          coin.setVelocityX(velocityX);
        }
      } else {
        coin.setVelocityX(velocityX);
      }
      if (coin.x < minX || coin.x > maxX) {
        coin.destroy();
      }
    }

    for (const coin of toCollect) {
      if (coin.active) {
        this.handleCoinOverlap(this.runner, coin);
      }
    }
  }

  setupFootstepFrameSync(): void {
    this.runner.on('animationupdate', (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (animation.key !== this.leadRunAnimKey) {
        return;
      }
      const runnerBody = this.runner.body as Phaser.Physics.Arcade.Body;
      const onGround = runnerBody.blocked.down || runnerBody.touching.down;
      const isRunningAnim = this.runner.anims.currentAnim?.key === this.leadRunAnimKey;
      if (!isRunningAnim || !onGround) {
        return;
      }
      const frameNumber = Number(frame.textureFrame);
      if (!Number.isFinite(frameNumber)) {
        return;
      }
      const timeScale = Math.max(1, this.runner.anims.timeScale || 1);
      const now = this.time.now;
      if (now - this.lastFootstepAt < FOOTSTEP_MIN_INTERVAL_MS) {
        return;
      }

      // At high speed, fire 1 frame earlier to reduce perceived late audio.
      const advance = timeScale >= FOOTSTEP_HIGH_SPEED_THRESHOLD ? 1 : 0;
      if (this.isFootstepFrame(frameNumber, advance)) {
        this.lastFootstepAt = now;
        const speedRatio = Math.max(1, this.runner.anims.timeScale || 1);
        this.playFootstepSound(speedRatio);
      }
    });
  }

  isFootstepFrame(frameNumber: number, advance = 0): boolean {
    const adjusted = frameNumber + advance;
    return adjusted >= FOOTSTEP_FRAME_START &&
      adjusted <= FOOTSTEP_FRAME_END &&
      (adjusted - FOOTSTEP_FRAME_START) % FOOTSTEP_FRAME_STEP === 0;
  }

  spawnCoin(moveDirection: number, forcedY: number | null = null, allowMagnetItem = true): void {
    const spawnX = moveDirection > 0 ? this.scale.width + 40 : -40;
    const spawnY = forcedY ?? this.getRandomCoinLevelY();
    const canSpawnAllyItem = allowMagnetItem && this.partyMembers.length < MAX_PARTY_SIZE;
    const spawnAllyItem = canSpawnAllyItem && Phaser.Math.Between(0, 99) < ALLY_ITEM_CHANCE_PERCENT;
    if (spawnAllyItem) {
      const allyAvatarId = String(Phaser.Utils.Array.GetRandom(this.avatarIds)) as AvatarId;
      const avatarConfig = AVATAR_CONFIGS[allyAvatarId];
      if (!avatarConfig) {
        return;
      }
      const idleSheet = avatarConfig.idleSheet;
      const item = this.coins.create(spawnX, spawnY, idleSheet, 0);
      item.setScale(0.16);
      item.setCircle(10, 8, 8);
      item.setData('value', 0);
      item.setData('type', 'ally-item');
      item.setData('allyAvatarId', allyAvatarId);
      item.setDepth(12);
      item.setData('prevX', spawnX);
      this.tweens.add({
        targets: item,
        scale: 0.2,
        duration: 260,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      return;
    }

    const canSpawnAutoItem = allowMagnetItem && !this.isAutoRunActive();
    const spawnAutoItem = canSpawnAutoItem && Phaser.Math.Between(0, 99) < AUTO_ITEM_CHANCE_PERCENT;
    if (spawnAutoItem) {
      const item = this.coins.create(spawnX, spawnY, AUTO_ITEM_KEY);
      item.setScale(1.25);
      item.setCircle(11, 3, 3);
      item.setData('value', 0);
      item.setData('type', 'auto-item');
      item.setDepth(12);
      item.setData('prevX', spawnX);
      this.tweens.add({
        targets: item,
        angle: { from: -10, to: 10 },
        duration: 220,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      return;
    }

    const magnetBuffActive = this.time.now < this.magnetBuffUntil;
    const spawnMagnetItem = allowMagnetItem && !magnetBuffActive && Phaser.Math.Between(0, 99) < MAGNET_ITEM_CHANCE_PERCENT;
    if (spawnMagnetItem) {
      const item = this.coins.create(spawnX, spawnY, MAGNET_ITEM_KEY);
      item.setScale(1.25);
      item.setCircle(11, 3, 3);
      item.setData('value', 0);
      item.setData('type', 'magnet-item');
      item.setDepth(12);
      item.setData('prevX', spawnX);
      this.tweens.add({
        targets: item,
        scale: 1.45,
        duration: 320,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      return;
    }

    const roll = Phaser.Math.Between(0, 99);
    const isSuperKing = roll < SUPER_KING_COIN_CHANCE_PERCENT;
    const isKing = !isSuperKing && roll < SUPER_KING_COIN_CHANCE_PERCENT + KING_COIN_CHANCE_PERCENT;
    const key = isSuperKing ? SUPER_KING_COIN_KEY : isKing ? KING_COIN_KEY : COIN_KEY;

    const coin = this.coins.create(spawnX, spawnY, key);
    if (isSuperKing) {
      coin.setScale(1.9);
      coin.setCircle(14, 8, 8);
      coin.setData('value', SUPER_KING_COIN_VALUE);
      coin.setData('type', 'super');
      this.tweens.add({
        targets: coin,
        scale: 2.2,
        duration: 250,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      this.tweens.add({
        targets: coin,
        angle: { from: -14, to: 14 },
        duration: 180,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    } else if (isKing) {
      coin.setScale(1.5);
      coin.setCircle(12, 6, 6);
      coin.setData('value', KING_COIN_VALUE);
      coin.setData('type', 'king');
      this.tweens.add({
        targets: coin,
        scale: 1.72,
        duration: 260,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      this.tweens.add({
        targets: coin,
        angle: { from: -8, to: 8 },
        duration: 220,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    } else {
      coin.setScale(1);
      coin.setCircle(8, 4, 4);
      coin.setData('value', 1);
      coin.setData('type', 'normal');
    }
    coin.setDepth(12);
    coin.setData('prevX', spawnX);
  }

  getRandomCoinLevelY(): number {
    const runLevelY = this.ground.y - COIN_RUN_HEIGHT_OFFSET;
    const jumpLevelY = this.ground.y - COIN_JUMP_HEIGHT_OFFSET;
    return Phaser.Math.Between(0, 1) === 0 ? runLevelY : jumpLevelY;
  }

  shouldCollectCoinBySweep(coin: Phaser.Physics.Arcade.Image, prevX: number, currentX: number): boolean {
    if (!coin.active || !this.runner?.active) {
      return false;
    }

    // 기존 overlap이 놓치는 프레임 간 관통(고속 이동)을 보정.
    const runnerX = this.runner.x;
    const minX = Math.min(prevX, currentX) - 14;
    const maxX = Math.max(prevX, currentX) + 14;
    const crossedRunnerX = runnerX >= minX && runnerX <= maxX;
    const yClose = Math.abs(coin.y - this.runner.y) <= 72;

    return crossedRunnerX && yClose;
  }

  handleCoinOverlap(_: unknown, coinObj: unknown): void {
    const coin = coinObj as Phaser.Physics.Arcade.Image;
    if (!coin || !coin.active) {
      return;
    }
    const coinX = coin.x;
    const coinY = coin.y;
    const value = coin.getData('value') ?? 1;
    const type = coin.getData('type') ?? 'normal';
    const allyAvatarId = String(coin.getData('allyAvatarId') ?? '') as AvatarId;
    coin.destroy();
    if (type === 'ally-item' && allyAvatarId) {
      const joined = this.addPartyMember(allyAvatarId);
      if (joined) {
        this.playAutoItemSound();
        this.showAllyJoinFx(coinX, coinY, allyAvatarId);
      }
    } else if (type === 'magnet-item') {
      this.activateMagnetBuff();
      this.playMagnetItemSound();
      this.showMagnetItemFx(coinX, coinY);
    } else if (type === 'auto-item') {
      this.activateAutoRunBuff();
      this.playAutoItemSound();
      this.showAutoItemFx(coinX, coinY);
    } else if (type === 'super') {
      this.playSuperKingCoinCollectSound();
      this.showSuperKingCoinCollectFx(coinX, coinY, value);
    } else if (type === 'king') {
      this.playKingCoinCollectSound();
      this.showKingCoinCollectFx(coinX, coinY, value);
    } else {
      this.playCoinCollectSound();
    }
    this.coinScore += value;
    if (this.uiScore) {
      this.uiScore.setText(`COIN ${this.coinScore}`);
    }
    this.checkCoinMilestone();
  }

  activateMagnetBuff(): void {
    this.magnetBuffUntil = this.time.now + MAGNET_DURATION_MS;
    this.updateActiveItemsUi();
  }

  activateAutoRunBuff(): void {
    this.autoRunUntil = this.time.now + AUTO_RUN_DURATION_MS;
    this.updateActiveItemsUi();
  }

  isMagnetActive(): boolean {
    return this.magnetEnabled || this.time.now < this.magnetBuffUntil;
  }

  isAutoRunActive(): boolean {
    return this.autoRunManual || this.time.now < this.autoRunUntil;
  }

  updateActiveItemsUi(): void {
    if (!this.uiMagnetStatus || !this.uiAutoStatus) {
      this.emitExternalUiState();
      return;
    }
    const magnetSec = Math.max(0, Math.ceil((this.magnetBuffUntil - this.time.now) / 1000));
    const autoSec = Math.max(0, Math.ceil((this.autoRunUntil - this.time.now) / 1000));

    if (this.magnetEnabled || magnetSec > 0) {
      const suffix = magnetSec > 0 ? ` ${magnetSec}s` : '';
      this.uiMagnetStatus.setText(`MAGNET ON${suffix}`);
      this.uiMagnetStatus.setColor('#9dffd9');
    } else {
      this.uiMagnetStatus.setText('MAGNET OFF');
      this.uiMagnetStatus.setColor('#7f94b8');
    }

    if (this.autoRunManual || autoSec > 0) {
      const suffix = autoSec > 0 ? ` ${autoSec}s` : '';
      this.uiAutoStatus.setText(`AUTO RUN ON${suffix}`);
      this.uiAutoStatus.setColor('#b8e7ff');
    } else {
      this.uiAutoStatus.setText('AUTO RUN OFF');
      this.uiAutoStatus.setColor('#7f94b8');
    }

    this.emitExternalUiState();
  }

  updateHealth(dt: number, shouldDrain: boolean, drainMultiplier = 1): void {
    if (shouldDrain) {
      this.healthRatio = Phaser.Math.Clamp(
        this.healthRatio - (dt / HEALTH_FULL_DURATION_SEC) * drainMultiplier,
        0,
        1
      );
    }
    this.updateHealthUi();
  }

  tryRechargeHealth(): void {
    if (this.healthRatio >= 1) {
      return;
    }
    if (this.coinScore < HEALTH_RECHARGE_COST) {
      return;
    }

    this.coinScore -= HEALTH_RECHARGE_COST;
    this.healthRatio = Phaser.Math.Clamp(this.healthRatio + HEALTH_RECHARGE_RATIO, 0, 1);
    if (this.uiScore) {
      this.uiScore.setText(`COIN ${this.coinScore}`);
    }
    this.updateHealthUi();
    this.emitExternalUiState(true);
  }

  checkCoinMilestone(): void {
    while (this.coinScore >= this.nextCoinMilestone) {
      this.milestoneQueue.push(this.nextCoinMilestone);
      this.nextCoinMilestone += COIN_MILESTONE_STEP;
    }
    this.playNextMilestoneFx();
  }

  playNextMilestoneFx(): void {
    if (this.milestonePlaying || this.milestoneQueue.length === 0) {
      return;
    }

    const milestone = this.milestoneQueue.shift();
    this.milestonePlaying = true;
    this.playMilestoneSound();

    const centerX = this.scale.width * 0.5;
    const centerY = this.scale.height * 0.5;

    const container = this.add.container(centerX, centerY).setDepth(80);
    const glow = this.add.circle(0, 0, 110, 0xffe58f, 0.24);
    const coin = this.add.image(0, 0, KING_COIN_KEY).setScale(0.8);
    const text = this.add
      .text(0, 88, `${milestone} COINS!`, {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#fff3b2',
        stroke: '#7a4200',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    container.add([glow, coin, text]);
    container.setAlpha(0);
    this.milestoneContainer = container;

    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 120,
      ease: 'Sine.easeOut'
    });
    this.tweens.add({
      targets: coin,
      scale: { from: 0.45, to: 2.2 },
      angle: { from: -15, to: 15 },
      duration: 620,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: glow,
      scale: { from: 0.4, to: 2.8 },
      alpha: { from: 0.35, to: 0 },
      duration: 780,
      ease: 'Quad.easeOut'
    });
    this.tweens.add({
      targets: text,
      y: 70,
      scale: { from: 0.7, to: 1.18 },
      duration: 520,
      ease: 'Cubic.easeOut'
    });
    this.tweens.add({
      targets: container,
      alpha: 0,
      delay: 700,
      duration: 280,
      onComplete: () => {
        container.destroy();
        this.milestoneContainer = null;
        this.milestonePlaying = false;
        this.playNextMilestoneFx();
      }
    });
  }

  getAudioContext(): AudioContext | null {
    const manager = this.sound as Phaser.Sound.WebAudioSoundManager | undefined;
    const audioContext = manager?.context as AudioContext | undefined;
    if (!audioContext || audioContext.state !== 'running') {
      return null;
    }
    return audioContext;
  }

  playCoinCollectSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.52, now);
    mainGain.connect(ctx.destination);

    // Calm metallic hit
    const hitOsc = ctx.createOscillator();
    const hitGain = ctx.createGain();
    hitOsc.type = 'sine';
    hitOsc.frequency.setValueAtTime(980, now);
    hitOsc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
    hitGain.gain.setValueAtTime(0.0001, now);
    hitGain.gain.exponentialRampToValueAtTime(0.026, now + 0.012);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    hitOsc.connect(hitGain);
    hitGain.connect(mainGain);
    hitOsc.start(now);
    hitOsc.stop(now + 0.12);

    // Soft short tail
    const tailOsc = ctx.createOscillator();
    const tailGain = ctx.createGain();
    tailOsc.type = 'sine';
    tailOsc.frequency.setValueAtTime(430, now + 0.05);
    tailOsc.frequency.exponentialRampToValueAtTime(280, now + 0.22);
    tailGain.gain.setValueAtTime(0.0001, now + 0.04);
    tailGain.gain.exponentialRampToValueAtTime(0.014, now + 0.085);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    tailOsc.connect(tailGain);
    tailGain.connect(mainGain);
    tailOsc.start(now + 0.05);
    tailOsc.stop(now + 0.25);
  }

  playKingCoinCollectSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.68, now);
    mainGain.connect(ctx.destination);

    // Softer, calmer arpeggio
    const freq = [640, 820, 980];
    for (let i = 0; i < freq.length; i += 1) {
      const note = freq[i] ?? freq[0]!;
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);
      osc.frequency.exponentialRampToValueAtTime(note * 0.94, t + 0.1);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.045, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(gain);
      gain.connect(mainGain);
      osc.start(t + 0.001);
      osc.stop(t + 0.15);
    }

    // Upward ending tail
    const tail = ctx.createOscillator();
    const tailGain = ctx.createGain();
    tail.type = 'sine';
    tail.frequency.setValueAtTime(560, now + 0.17);
    tail.frequency.exponentialRampToValueAtTime(1020, now + 0.4);
    tailGain.gain.setValueAtTime(0.0001, now + 0.17);
    tailGain.gain.exponentialRampToValueAtTime(0.035, now + 0.2);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
    tail.connect(tailGain);
    tailGain.connect(mainGain);
    tail.start(now + 0.17);
    tail.stop(now + 0.45);
  }

  playSuperKingCoinCollectSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.82, now);
    master.connect(ctx.destination);

    const notes = [540, 760, 980, 1240, 1560];
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i] ?? notes[0]!;
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(note, t);
      osc.frequency.exponentialRampToValueAtTime(note * 1.18, t + 0.14);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.22);
    }
  }

  playMilestoneSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.75, now);
    master.connect(ctx.destination);

    const notes = [520, 660, 820, 1040];
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i] ?? notes[0]!;
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);
      osc.frequency.exponentialRampToValueAtTime(note * 1.08, t + 0.12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  playMagnetItemSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.22);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(oscGain);
    oscGain.connect(gain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playAutoItemSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.2);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.055, now + 0.018);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    osc.connect(oscGain);
    oscGain.connect(gain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  showKingCoinCollectFx(x: number, y: number, value: number): void {
    const burst = this.add.graphics().setDepth(40);
    burst.fillStyle(0xfff2a8, 1);
    const pieces = 10;
    for (let i = 0; i < pieces; i += 1) {
      const angle = (Math.PI * 2 * i) / pieces;
      const px = x + Math.cos(angle) * 8;
      const py = y + Math.sin(angle) * 8;
      burst.fillCircle(px, py, 2);
    }
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2.8,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => burst.destroy()
    });

    const popup = this.add
      .text(x, y - 16, `+${value}!`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#fff6b0',
        stroke: '#8a4f00',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(41);
    this.tweens.add({
      targets: popup,
      y: y - 72,
      alpha: 0,
      scale: 1.25,
      duration: 550,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });

    this.cameras.main.flash(80, 255, 235, 120, false);
  }

  showSuperKingCoinCollectFx(x: number, y: number, value: number): void {
    const burst = this.add.graphics().setDepth(42);
    burst.fillStyle(0xb7f9ff, 1);
    const pieces = 16;
    for (let i = 0; i < pieces; i += 1) {
      const angle = (Math.PI * 2 * i) / pieces;
      const px = x + Math.cos(angle) * 10;
      const py = y + Math.sin(angle) * 10;
      burst.fillCircle(px, py, 2.6);
    }
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 3.4,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => burst.destroy()
    });

    const popup = this.add
      .text(x, y - 20, `SUPER +${value}!`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#c8f6ff',
        stroke: '#153d70',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(43);
    this.tweens.add({
      targets: popup,
      y: y - 90,
      alpha: 0,
      scale: 1.35,
      duration: 680,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });

    this.cameras.main.flash(110, 180, 245, 255, false);
  }

  showMagnetItemFx(x: number, y: number): void {
    const text = this.add
      .text(x, y - 14, 'MAGNET 30s', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#b7ffe9',
        stroke: '#11453a',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(43);
    this.tweens.add({
      targets: text,
      y: y - 64,
      alpha: 0,
      duration: 620,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  showAutoItemFx(x: number, y: number): void {
    const text = this.add
      .text(x, y - 14, 'AUTO RUN 30s', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#c7e8ff',
        stroke: '#173a5f',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(43);
    this.tweens.add({
      targets: text,
      y: y - 64,
      alpha: 0,
      duration: 620,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  showAllyJoinFx(x: number, y: number, avatarId: AvatarId): void {
    const label = `${avatarId.toUpperCase()} JOIN!`;
    const text = this.add
      .text(x, y - 14, label, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#d7f0ff',
        stroke: '#173a5f',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(43);
    this.tweens.add({
      targets: text,
      y: y - 58,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  maybeSpawnSpeechBubble(): void {
    const now = this.time.now;
    if (now < this.nextSpeechAt) {
      return;
    }

    const candidates = (this.partyMembers || [])
      .map((m) => m.sprite)
      .filter((sprite) => sprite?.active && !sprite.getData('speechActive')) as Phaser.GameObjects.Sprite[];

    if (candidates.length > 0 && this.speechBubbles.length < SPEECH_MAX_ACTIVE) {
      const target = Phaser.Utils.Array.GetRandom(candidates);
      const line = Phaser.Utils.Array.GetRandom(SPEECH_LINES);
      this.spawnSpeechBubble(target, line);
    }

    this.nextSpeechAt = now + Phaser.Math.Between(SPEECH_MIN_INTERVAL_MS, SPEECH_MAX_INTERVAL_MS);
  }

  spawnSpeechBubble(target: Phaser.GameObjects.Sprite, line: string, options: SpeechBubbleOptions = {}) {
    if (!target?.active) {
      return;
    }
    const style = options.style || 'thought';
    const duration = options.duration ?? SPEECH_DURATION_MS;
    const force = Boolean(options.force);
    if (force) {
      this.clearSpeechBubblesForTarget(target);
    }

    const text = this.add
      .text(0, 0, line, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#192234'
      })
      .setOrigin(0.5);

    const bubblePadX = 24;
    const bubblePadY = 12;
    const bubbleW = Math.max(108, text.width + bubblePadX * 2);
    const bubbleH = Math.max(56, text.height + bubblePadY * 2);
    const halfH = bubbleH * 0.5;
    const bg = this.add.graphics();
    bg.fillStyle(0xf8fbff, 0.96);
    bg.lineStyle(0, 0x20304d, 0);
    bg.fillEllipse(0, 0, bubbleW, bubbleH);
    if (style === 'speech') {
      bg.fillTriangle(-8, halfH - 2, 10, halfH - 2, 0, halfH + 11);
    } else {
      // Thought tail: small round bubbles below.
      bg.fillCircle(-8, halfH + 10, 6);
      bg.fillCircle(-16, halfH + 20, 4);
    }

    const container = this.add.container(0, 0, [bg, text]).setDepth(72).setAlpha(0);
    const bubble = {
      target,
      container,
      style,
      expireAt: this.time.now + duration
    };
    this.speechBubbles.push(bubble);
    target.setData('speechActive', true);

    this.positionSpeechBubble(bubble);

    this.tweens.add({
      targets: container,
      alpha: 1,
      y: container.y - 8,
      duration: 140,
      ease: 'Cubic.easeOut'
    });
  }

  updateSpeechBubbles(): void {
    if (!this.speechBubbles || this.speechBubbles.length === 0) {
      return;
    }

    const now = this.time.now;
    for (let i = this.speechBubbles.length - 1; i >= 0; i -= 1) {
      const bubble = this.speechBubbles[i];
      if (!bubble) {
        continue;
      }
      if (!bubble.target?.active || now >= bubble.expireAt) {
        const { container, target } = bubble;
        this.speechBubbles.splice(i, 1);
        if (target?.active) {
          target.setData('speechActive', false);
        }
        this.tweens.add({
          targets: container,
          alpha: 0,
          y: container.y - 6,
          duration: 160,
          onComplete: () => {
            container.destroy();
          }
        });
        continue;
      }
      this.positionSpeechBubble(bubble);
    }
  }

  clearSpeechBubblesForTarget(target: Phaser.GameObjects.Sprite): void {
    if (!this.speechBubbles || this.speechBubbles.length === 0) {
      return;
    }
    for (let i = this.speechBubbles.length - 1; i >= 0; i -= 1) {
      const bubble = this.speechBubbles[i];
      if (!bubble) {
        continue;
      }
      if (bubble.target !== target) {
        continue;
      }
      this.speechBubbles.splice(i, 1);
      bubble.container.destroy();
    }
    if (target?.active) {
      target.setData('speechActive', false);
    }
  }

  positionSpeechBubble(bubble: SpeechBubble): void {
    const t = bubble.target;
    const yOffset = t.displayHeight * 0.62 + 16;
    bubble.container.setPosition(t.x + 30, t.y - yOffset);
  }

  shoutGoAll(): void {
    this.shoutMessageAll('가자!');
  }

  shoutMessageAll(message: string): void {
    if (!this.partyMembers?.length) {
      return;
    }
    for (const member of this.partyMembers) {
      const s = member.sprite;
      if (!s?.active) {
        continue;
      }
      this.spawnSpeechBubble(s, message, {
        style: 'speech',
        duration: 1200,
        force: true
      });
    }
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) {
      return;
    }

    this.activeTouchCount += 1;
    const now = this.time.now;
    const rapidTouch = now - this.lastTouchStartAt <= RAPID_TOUCH_WINDOW_MS;
    this.lastTouchStartAt = now;

    this.touchMoveActive = true;
    this.touchSprint = rapidTouch || this.activeTouchCount > 1;
  }

  handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) {
      return;
    }

    this.activeTouchCount = Math.max(0, this.activeTouchCount - 1);
    if (this.activeTouchCount === 0) {
      this.touchMoveActive = false;
      this.touchSprint = false;
      this.lastTouchEndAt = this.time.now;
    }
  }

  handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    if (!this.bgSegments || !this.runner || !this.ground) {
      return;
    }
    this.physics.world.setBounds(0, 0, width, height);

    this.layoutLoopBackground(width, height);

    this.ground.setPosition(width / 2, height * GROUND_Y_RATIO).setSize(width, 24);
    (this.ground.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // Keep jump/fall motion intact on resize. Only fix if runner is clearly below ground.
    const groundTop = this.ground.y - this.ground.height * 0.5;
    const runnerBody = this.runner.body as Phaser.Physics.Arcade.Body;
    const belowGround = runnerBody.bottom > groundTop + 10;
    if (belowGround) {
      this.placeRunnerOnGround(width * 0.5, true);
    } else {
      this.runner.x = width * 0.5;
      runnerBody.updateFromGameObject();
    }
    if (this.partyMembers?.length > 1) {
      for (let i = 1; i < this.partyMembers.length; i += 1) {
        const member = this.partyMembers[i];
        if (member) {
          member.sprite.setPosition(this.runner.x, this.runner.y);
        }
      }
    }

    if (this.milestoneContainer) {
      this.milestoneContainer.setPosition(width * 0.5, height * 0.5);
    }

    this.layoutShoutCanvasButtons(width, height);
    this.layoutFpsOverlay(width);
    this.updateRainBounds(width, height);
    this.layoutGameUi(width, height);
  }

  placeRunnerOnGround(x = this.runner?.x ?? 0, zeroVelocity = true): void {
    if (!this.runner || !this.ground) {
      return;
    }
    const body = this.runner.body as Phaser.Physics.Arcade.Body;
    const groundTop = this.ground.y - this.ground.height * 0.5;
    // Arcade body uses texture-space body metrics; keep this unscaled.
    const bodyBottomFromSpriteCenter = -this.runner.displayOriginY + body.offset.y + body.height;
    const groundedY = groundTop - bodyBottomFromSpriteCenter;
    body.reset(x, groundedY);
    if (zeroVelocity) {
      this.runner.setVelocity(0, 0);
    }
  }

  createLoopBackground(width: number, height: number): void {
    const source = this.textures.get(BG_LOOP_KEY).getSourceImage();
    this.bgBaseWidth = source.width;
    this.bgBaseHeight = source.height;
    this.bgOffset = 0;
    this.bgSegments = [];
    this.layoutLoopBackground(width, height);
  }

  layoutLoopBackground(width: number, height: number): void {
    this.bgScale = height / this.bgBaseHeight;
    this.bgSegmentWidth = this.bgBaseWidth * this.bgScale;
    const neededSegments = Math.max(2, Math.ceil(width / this.bgSegmentWidth) + 1);

    while (this.bgSegments.length < neededSegments) {
      const seg = this.add.image(0, 0, BG_LOOP_KEY).setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
      this.bgSegments.push(seg);
    }
    while (this.bgSegments.length > neededSegments) {
      const popped = this.bgSegments.pop();
      if (popped) {
        popped.destroy();
      }
    }

    const wrappedOffset = ((this.bgOffset % this.bgSegmentWidth) + this.bgSegmentWidth) % this.bgSegmentWidth;
    for (let i = 0; i < this.bgSegments.length; i += 1) {
      const seg = this.bgSegments[i];
      if (!seg) {
        continue;
      }
      seg.setScale(1);
      seg.setDisplaySize(
        Math.ceil(this.bgSegmentWidth) + BG_SEAM_OVERLAP_PX,
        Math.ceil(height) + BG_VERTICAL_OVERDRAW_PX
      );
      seg.setPosition(
        Math.round(i * this.bgSegmentWidth - wrappedOffset),
        -Math.floor(BG_VERTICAL_OVERDRAW_PX / 2)
      );
    }
  }

  updateLoopBackground(deltaX: number): void {
    if (!this.bgSegments || this.bgSegments.length === 0 || this.bgSegmentWidth <= 0) {
      return;
    }
    this.bgOffset += deltaX;
    const wrappedOffset = ((this.bgOffset % this.bgSegmentWidth) + this.bgSegmentWidth) % this.bgSegmentWidth;
    for (let i = 0; i < this.bgSegments.length; i += 1) {
      const seg = this.bgSegments[i];
      if (seg) {
        seg.x = Math.round(i * this.bgSegmentWidth - wrappedOffset);
      }
    }
  }

  playFootstepSound(speedRatio = 1): void {
    this.audioSystem?.playFootstepSound(speedRatio);
  }

  createRainTexture(): void {}

  setupRainCycle(): void {
    const { width, height } = this.scale;
    this.rainWidth = width;
    this.rainHeight = height;
    this.rainGraphics = this.add.graphics().setDepth(9);
    this.rainDrops = [];
    for (let i = 0; i < RAIN_DROP_COUNT; i += 1) {
      this.rainDrops.push({
        x: Phaser.Math.FloatBetween(-20, width + 20),
        y: Phaser.Math.FloatBetween(-height, height),
        vy: Phaser.Math.FloatBetween(680, 980),
        vx: Phaser.Math.FloatBetween(-70, -25),
        len: Phaser.Math.FloatBetween(8, 14),
        a: Phaser.Math.FloatBetween(0.18, 0.45)
      });
    }
    this.rainingNow = true;
    this.rainToggleTimer = null;
    this.setRainEmitting(true);
    this.scheduleNextRainToggle();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardownRainCycle());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardownRainCycle());
  }

  scheduleNextRainToggle(): void {
    if (!this.time) {
      return;
    }
    if (this.rainManual) {
      return;
    }
    if (this.rainToggleTimer) {
      this.rainToggleTimer.remove(false);
      this.rainToggleTimer = null;
    }

    const delay = this.rainingNow
      ? Phaser.Math.Between(RAIN_MIN_ON_MS, RAIN_MAX_ON_MS)
      : Phaser.Math.Between(RAIN_MIN_OFF_MS, RAIN_MAX_OFF_MS);

    this.rainToggleTimer = this.time.delayedCall(delay, () => {
      this.rainingNow = !this.rainingNow;
      this.setRainEmitting(this.rainingNow);
      this.emitExternalUiState(true);
      this.scheduleNextRainToggle();
    });
  }

  updateRainBounds(width: number, height: number): void {
    this.rainWidth = width;
    this.rainHeight = height;
  }

  teardownRainCycle(): void {
    if (this.rainToggleTimer) {
      this.rainToggleTimer.remove(false);
      this.rainToggleTimer = null;
    }
    if (this.rainGraphics) {
      this.rainGraphics.destroy();
      this.rainGraphics = null;
    }
    this.rainDrops = [];
  }

  setRainModeEnabled(enabled: boolean): void {
    this.rainManual = Boolean(enabled);
    if (this.rainToggleTimer) {
      this.rainToggleTimer.remove(false);
      this.rainToggleTimer = null;
    }
    if (this.rainManual) {
      this.rainingNow = true;
      this.setRainEmitting(true);
    } else {
      this.rainingNow = false;
      this.setRainEmitting(false);
      this.scheduleNextRainToggle();
    }
    this.emitExternalUiState(true);
  }

  setRainEmitting(enabled: boolean): void {
    this.rainEmitting = Boolean(enabled);
  }

  updateRainOverlay(dt: number): void {
    if (!this.rainGraphics) {
      return;
    }
    this.rainGraphics.clear();
    if (!this.rainEmitting || !this.rainDrops?.length) {
      return;
    }

    const w = this.rainWidth || this.scale.width;
    const h = this.rainHeight || this.scale.height;
    this.rainGraphics.lineStyle(1.6, 0xd6ecff, 0.6);
    for (const d of this.rainDrops) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y > h + 20 || d.x < -40) {
        d.x = Phaser.Math.FloatBetween(0, w + 30);
        d.y = Phaser.Math.FloatBetween(-40, -6);
      }
      this.rainGraphics.lineStyle(1.6, 0xd6ecff, d.a);
      this.rainGraphics.beginPath();
      this.rainGraphics.moveTo(d.x, d.y);
      this.rainGraphics.lineTo(d.x - d.len * 0.25, d.y + d.len);
      this.rainGraphics.strokePath();
    }
  }

  setupBackgroundMusic(): void {
    this.audioSystem?.setupBackgroundMusic();
  }

  createHatTexture(): void {
    if (this.textures.exists('runner-hat')) {
      return;
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xb30000, 1);
    g.fillRoundedRect(2, 2, 28, 14, 5);
    g.fillRoundedRect(20, 10, 16, 6, 3);
    g.fillStyle(0x8f0000, 1);
    g.fillRoundedRect(4, 15, 24, 4, 2);
    g.generateTexture('runner-hat', 36, 22);
    g.destroy();
  }

  createCoinTexture(): void {
    if (this.textures.exists(COIN_KEY)) {
      return;
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffdf4d, 1);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xfff3a1, 1);
    g.fillCircle(9, 9, 4);
    g.lineStyle(2, 0xc88b00, 1);
    g.strokeCircle(12, 12, 10);
    g.generateTexture(COIN_KEY, 24, 24);
    g.destroy();
  }

  createKingCoinTexture(): void {
    if (this.textures.exists(KING_COIN_KEY)) {
      return;
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xfff2a8, 1);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0xffde59, 1);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 11, 4);
    g.lineStyle(3, 0xff9e00, 1);
    g.strokeCircle(16, 16, 13);
    g.lineStyle(2, 0xfff9d6, 0.85);
    g.strokeCircle(16, 16, 9);
    g.generateTexture(KING_COIN_KEY, 32, 32);
    g.destroy();
  }

  createSuperKingCoinTexture(): void {
    if (this.textures.exists(SUPER_KING_COIN_KEY)) {
      return;
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xe2f8ff, 1);
    g.fillCircle(18, 18, 15);
    g.fillStyle(0x9ce9ff, 1);
    g.fillCircle(18, 18, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(13, 12, 4);
    g.lineStyle(3, 0x4bbdff, 1);
    g.strokeCircle(18, 18, 14);
    g.lineStyle(2, 0x91f4ff, 0.95);
    g.strokeCircle(18, 18, 10);
    g.generateTexture(SUPER_KING_COIN_KEY, 36, 36);
    g.destroy();
  }

  createMagnetItemTexture(): void {
    if (this.textures.exists(MAGNET_ITEM_KEY)) {
      return;
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Outer U body
    g.fillStyle(0x2b2f3a, 1);
    g.fillRoundedRect(4, 2, 32, 28, 10);
    g.fillRoundedRect(12, 10, 16, 18, 6);
    g.fillStyle(0x000000, 1);
    g.fillRect(12, 14, 16, 16);

    // Left pole (red)
    g.fillStyle(0xe84d4d, 1);
    g.fillRoundedRect(4, 2, 12, 18, 5);
    g.fillStyle(0xffd9d9, 1);
    g.fillRect(5, 16, 10, 4);

    // Right pole (blue)
    g.fillStyle(0x4d7be8, 1);
    g.fillRoundedRect(24, 2, 12, 18, 5);
    g.fillStyle(0xdce6ff, 1);
    g.fillRect(25, 16, 10, 4);

    g.lineStyle(2, 0x11151d, 1);
    g.strokeRoundedRect(4, 2, 32, 28, 10);
    g.generateTexture(MAGNET_ITEM_KEY, 40, 32);
    g.destroy();
  }

  createAutoItemTexture(): void {
    if (this.textures.exists(AUTO_ITEM_KEY)) {
      return;
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xdff0ff, 1);
    g.fillRoundedRect(2, 6, 36, 20, 5);
    g.fillStyle(0x4da7ff, 1);
    g.fillRoundedRect(6, 10, 28, 12, 4);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(12, 12, 12, 20, 20, 16);
    g.fillTriangle(20, 12, 20, 20, 28, 16);
    g.lineStyle(2, 0x14518e, 1);
    g.strokeRoundedRect(2, 6, 36, 20, 5);
    g.generateTexture(AUTO_ITEM_KEY, 40, 32);
    g.destroy();
  }

  createGameUi(): void {
    // Canvas HUD disabled. Use right-side HTML HUD only.
    this.uiFill = null;
    this.uiFrame = null;
    this.uiPanel = null;
    this.uiTitle = null;
    this.uiScore = null;
    this.uiMagnetStatus = null;
    this.uiAutoStatus = null;
    this.uiHealthLabel = null;
    this.uiHealthBack = null;
    this.uiHealthFill = null;
    this.uiHealthValue = null;
    this.uiMagnetButton = null;
    this.emitExternalUiState(true);
  }

  createUiButton(label: string, onClick?: (() => void) | null): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0).setDepth(53).setScrollFactor(0);
    const shadow = this.add.rectangle(2, 2, 126, 48, 0x0b1020, 1).setOrigin(0.5);
    const back = this.add.rectangle(0, 0, 126, 48, 0x1a2740, 1).setOrigin(0.5);
    const edge = this.add.graphics();
    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e8f3ff'
      })
      .setOrigin(0.5);

    edge.fillStyle(0x93b9ff, 1);
    this.drawRetroFrame(edge, -63, -24, 126, 48, 3, 0x93b9ff, 0x0a1427, 0x101b2f, true);

    container.add([shadow, back, edge, text]);
    container.setSize(126, 48);
    const hit = this.add.zone(0, 0, 126, 48).setOrigin(0.5).setInteractive();
    container.add(hit);
    container.setData('pressed', false);
    hit.on('pointerdown', () => {
      if (container.getData('pressed')) {
        return;
      }
      container.setData('pressed', true);
      container.y += 2;
      back.setFillStyle(0x15213a, 1);
    });
    hit.on('pointerup', () => {
      if (container.getData('pressed')) {
        container.y -= 2;
      }
      container.setData('pressed', false);
      back.setFillStyle(0x1a2740, 1);
      if (onClick) {
        onClick();
      }
    });
    hit.on('pointerout', () => {
      if (container.getData('pressed')) {
        container.y -= 2;
      }
      container.setData('pressed', false);
      back.setFillStyle(0x1a2740, 1);
    });

    container.setData('back', back);
    container.setData('text', text);
    return container;
  }

  createShoutCanvasButtons(): void {
    this.uiShoutGoButton = this.createCanvasShoutButton('가자!', () => {
      this.shoutMessageAll('가자!');
    });
    this.uiShoutFightButton = this.createCanvasShoutButton('화이팅!', () => {
      this.shoutMessageAll('화이팅!');
    });
    this.layoutShoutCanvasButtons(this.scale.width, this.scale.height);
  }

  createPauseCanvasButton(): void {
    this.gamePaused = false;
    this.uiPauseButton = this.createCanvasShoutButton('일시중지', () => {
      this.toggleGamePause();
    }, {
      width: 114,
      fill: 0x5a4a1a,
      stroke: 0xffe49b,
      textColor: '#fff3cc'
    });
    this.layoutShoutCanvasButtons(this.scale.width, this.scale.height);
  }

  createCanvasShoutButton(label: string, onClick: (() => void) | null, style: CanvasButtonStyle = {}) {
    const width = style.width ?? 98;
    const height = style.height ?? 38;
    const fill = style.fill ?? 0x1a6f4f;
    const stroke = style.stroke ?? 0xb9ffd7;
    const textColor = style.textColor ?? '#ecfff5';
    const activeFill = style.activeFill ?? 0x145a40;
    const container = this.add.container(0, 0).setDepth(85).setScrollFactor(0);
    const back = this.add.rectangle(0, 0, width, height, fill, 0.92).setOrigin(0.5);
    const edge = this.add.rectangle(0, 0, width, height).setOrigin(0.5).setStrokeStyle(2, stroke, 1);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: textColor
      })
      .setOrigin(0.5);
    const hit = this.add.zone(0, 0, width, height).setOrigin(0.5).setInteractive();
    container.add([back, edge, text, hit]);
    container.setSize(width, height);

    hit.on('pointerdown', () => {
      container.y += 1;
      back.setFillStyle(activeFill, 0.95);
    });
    hit.on('pointerup', () => {
      container.y -= 1;
      back.setFillStyle(fill, 0.92);
      if (onClick) {
        onClick();
      }
    });
    hit.on('pointerout', () => {
      back.setFillStyle(fill, 0.92);
    });

    container.setData('back', back);
    container.setData('text', text);
    container.setData('fill', fill);
    container.setData('activeFill', activeFill);
    return container;
  }

  layoutShoutCanvasButtons(width: number, height: number): void {
    if (!this.uiShoutGoButton || !this.uiShoutFightButton || !this.uiPauseButton) {
      return;
    }
    const baseX = 56;
    const baseY = height - 30;
    this.uiShoutGoButton.setPosition(baseX, baseY);
    this.uiShoutFightButton.setPosition(baseX + 110, baseY);
    this.uiPauseButton.setPosition(baseX + 236, baseY);
  }

  createFpsOverlay(): void {
    const w = this.scale.width;
    this.uiFpsText = this.add
      .text(w - 10, 10, 'FPS --', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#d8f2ff',
        backgroundColor: 'rgba(6,16,30,0.55)',
        padding: { x: 6, y: 3 }
      })
      .setOrigin(1, 0)
      .setDepth(95)
      .setScrollFactor(0);
    this.nextFpsUpdateAt = 0;
  }

  updateFpsOverlay(): void {
    if (!this.uiFpsText) {
      return;
    }
    const now = this.time.now;
    if (now < (this.nextFpsUpdateAt || 0)) {
      return;
    }
    this.nextFpsUpdateAt = now + FPS_UPDATE_INTERVAL_MS;
    const fps = this.game?.loop?.actualFps ?? 0;
    this.uiFpsText.setText(`FPS ${fps.toFixed(1)}`);
  }

  layoutFpsOverlay(width: number): void {
    if (!this.uiFpsText) {
      return;
    }
    this.uiFpsText.setPosition(width - 10, 10);
  }

  toggleGamePause(): void {
    this.setGamePause(!this.gamePaused);
  }

  setGamePause(paused: boolean): void {
    const next = Boolean(paused);
    if (this.gamePaused === next) {
      return;
    }
    this.gamePaused = next;
    if (next) {
      this.physics.world.pause();
      this.tweens.pauseAll();
      this.anims.pauseAll();
      this.time.timeScale = 0;
      this.sound.pauseAll();
      this.sound.mute = true;
      this.pauseBackgroundMusicHard();
      const ctx = (this.sound as Phaser.Sound.WebAudioSoundManager | undefined)?.context as AudioContext | undefined;
      if (ctx?.state === 'running') {
        ctx.suspend().catch(() => {
          // ignore
        });
      }
    } else {
      const ctx = (this.sound as Phaser.Sound.WebAudioSoundManager | undefined)?.context as AudioContext | undefined;
      if (ctx && ctx.state !== 'running') {
        ctx.resume().catch(() => {
          // ignore
        });
      }
      this.sound.mute = false;
      this.time.timeScale = 1;
      this.physics.world.resume();
      this.tweens.resumeAll();
      this.anims.resumeAll();
      this.sound.resumeAll();
      this.resumeBackgroundMusicAfterPause();
    }
    this.syncPauseButtonUi();
  }

  pauseBackgroundMusicHard(): void {
    this.audioSystem?.pauseBackgroundMusicHard();
  }

  resumeBackgroundMusicAfterPause(): void {
    this.audioSystem?.resumeBackgroundMusicAfterPause();
  }

  syncPauseButtonUi(): void {
    if (!this.uiPauseButton) {
      return;
    }
    const text = this.uiPauseButton.getData('text');
    const back = this.uiPauseButton.getData('back');
    if (!text || !back) {
      return;
    }
    if (this.gamePaused) {
      text.setText('재개');
      back.setFillStyle(0x2d5c1e, 0.92);
    } else {
      text.setText('일시중지');
      back.setFillStyle(this.uiPauseButton.getData('fill') ?? 0x5a4a1a, 0.92);
    }
  }

  layoutGameUi(width: number, height: number): void {
    if (!this.uiFrame || !this.uiFill || !this.uiPanel || !this.uiTitle || !this.uiScore || !this.uiMagnetStatus ||
      !this.uiAutoStatus || !this.uiHealthLabel || !this.uiHealthBack || !this.uiHealthFill || !this.uiHealthValue || !this.uiMagnetButton) {
      return;
    }

    const inset = 0;
    const bottomY = height - inset - 30;
    const centerX = width * 0.5;
    const frameX = inset;
    const frameY = inset;
    const frameW = width - inset * 2;
    const frameH = height - inset * 2;
    const gaugeHeight = Math.max(120, Math.min(260, frameH - 140));

    this.uiPanel.setPosition(inset + 96, inset + 19);
    this.uiTitle.setPosition(inset + 26, inset + 10);
    this.uiScore.setPosition(inset + 188, inset + 11);
    this.uiMagnetStatus.setOrigin(1, 0.5).setPosition(frameX + frameW - 14, inset + 12);
    this.uiAutoStatus.setOrigin(1, 0.5).setPosition(frameX + frameW - 14, inset + 34);
    this.uiHealthLabel.setPosition(inset + 16, inset + 36);
    this.uiHealthBack.setPosition(inset + 22, frameY + frameH * 0.5).setSize(18, gaugeHeight);
    this.uiHealthFill.setPosition(inset + 22, frameY + frameH * 0.5 + gaugeHeight * 0.5).setSize(12, gaugeHeight);
    this.uiHealthValue.setPosition(inset + 22, frameY + frameH * 0.5 + gaugeHeight * 0.5 + 14);
    this.uiHealthGaugeHeight = gaugeHeight;

    this.uiMagnetButton.setPosition(frameX + 63, bottomY);

    this.uiFill.clear();

    this.uiFrame.clear();
    this.drawRetroFrame(this.uiFrame, frameX, frameY, frameW, frameH, 4, 0xa4c6ff, 0x060b16, 0x101c30, false);
    this.updateHealthUi();
  }

  updateHealthUi(): void {
    if (!this.uiHealthFill || !this.uiHealthBack) {
      return;
    }

    const h = this.uiHealthGaugeHeight ?? 220;
    const clamped = Phaser.Math.Clamp(this.healthRatio, 0, 1);
    const fillH = Math.max(2, h * clamped);
    const baseY = this.uiHealthBack.y + h * 0.5;
    this.uiHealthFill.setSize(12, fillH);
    this.uiHealthFill.setPosition(this.uiHealthBack.x, baseY);

    let color = 0xff6b6b;
    if (clamped > 0.66) {
      color = 0x7dff9b;
    } else if (clamped > 0.33) {
      color = 0xffc857;
    }
    this.uiHealthFill.setFillStyle(color, 1);

    if (this.uiHealthValue) {
      this.uiHealthValue.setText(`${Math.round(clamped * 100)}%`);
    }
  }

  toggleMagnetMode(): void {
    this.magnetEnabled = !this.magnetEnabled;
    this.syncMagnetButtonUi();
    this.emitExternalUiState(true);
  }

  setMagnetModeEnabled(enabled: boolean): void {
    this.magnetEnabled = Boolean(enabled);
    this.syncMagnetButtonUi();
    this.emitExternalUiState(true);
  }

  setAutoRunModeEnabled(enabled: boolean): void {
    this.autoRunManual = Boolean(enabled);
    this.updateActiveItemsUi();
    this.emitExternalUiState(true);
  }

  setSprintModeEnabled(enabled: boolean): void {
    if (enabled && this.healthRatio <= 0) {
      this.sprintManual = false;
      this.emitExternalUiState(true);
      return;
    }
    this.sprintManual = Boolean(enabled);
    this.emitExternalUiState(true);
  }

  drinkPotionFromUi(): void {
    this.tryRechargeHealth();
    this.emitExternalUiState(true);
  }

  getExternalUiState(): ExternalUiState {
    const now = this.time.now;
    return {
      coinScore: this.coinScore ?? 0,
      partyCount: this.partyMembers?.length ?? 1,
      healthPercent: Math.round((this.healthRatio ?? 0) * 100),
      magnetManual: Boolean(this.magnetEnabled),
      magnetBuffSec: Math.max(0, Math.ceil((this.magnetBuffUntil - now) / 1000)),
      autoManual: Boolean(this.autoRunManual),
      autoBuffSec: Math.max(0, Math.ceil((this.autoRunUntil - now) / 1000)),
      sprintManual: Boolean(this.sprintManual),
      rainManual: Boolean(this.rainManual),
      rainingNow: Boolean(this.rainingNow)
    };
  }

  emitExternalUiState(force = false): void {
    if (typeof window === 'undefined') {
      return;
    }
    const now = this.time.now || 0;
    if (!force && now < (this.nextExternalUiEmitAt || 0)) {
      return;
    }
    this.nextExternalUiEmitAt = now + 140;
    window.dispatchEvent(
      new CustomEvent('runner-ui-state', {
        detail: this.getExternalUiState()
      })
    );
  }

  syncMagnetButtonUi(): void {
    if (!this.uiMagnetButton) {
      return;
    }
    const back = this.uiMagnetButton.getData('back');
    const text = this.uiMagnetButton.getData('text');
    if (this.magnetEnabled) {
      back.setFillStyle(0x1b4f2a, 1);
      text.setText('MAGNET ON');
      text.setColor('#d7ffe0');
    } else {
      back.setFillStyle(0x1a2740, 1);
      text.setText('MAGNET OFF');
      text.setColor('#e8f3ff');
    }
    this.updateActiveItemsUi();
  }

  drawRetroFrame(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    thickness: number,
    lightColor: number,
    darkColor: number,
    faceColor: number,
    fillFace = true
  ): void {
    if (fillFace) {
      graphics.fillStyle(darkColor, 1);
      graphics.fillRect(x, y, width, height);
      graphics.fillStyle(faceColor, 1);
      graphics.fillRect(x + thickness, y + thickness, width - thickness * 2, height - thickness * 2);
    }

    graphics.fillStyle(lightColor, 1);
    graphics.fillRect(x, y, width, thickness);
    graphics.fillRect(x, y, thickness, height);

    graphics.fillStyle(darkColor, 1);
    graphics.fillRect(x, y + height - thickness, width, thickness);
    graphics.fillRect(x + width - thickness, y, thickness, height);
  }

}
