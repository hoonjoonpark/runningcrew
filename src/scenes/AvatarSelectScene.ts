import Phaser from 'phaser';

const FRAME_WIDTH = 256;
const FRAME_HEIGHT = 256;

type AvatarOption = {
  label: string;
  textureKey: string;
  avatarId: string;
};

export class AvatarSelectScene extends Phaser.Scene {
  constructor() {
    super('AvatarSelectScene');
  }

  preload(): void {
    this.load.spritesheet('batcop-run-v1', '/assets/characters/batcop-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet('bluehair-run-v1', '/assets/characters/bluehair-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet('redhat-run-v1', '/assets/characters/redhat-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });

    this.load.spritesheet('redman-run-v1', '/assets/characters/redman-run-v1.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      spacing: 0,
      margin: 0
    });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width * 0.5, 70, 'Select Avatar', {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#f6f7ff'
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.5, 115, 'Choose one character to start running', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9cb0d4'
      })
      .setOrigin(0.5);

    const avatars: AvatarOption[] = [
      { label: 'Batcop', textureKey: 'batcop-run-v1', avatarId: 'batcop' },
      { label: 'Bluehair', textureKey: 'bluehair-run-v1', avatarId: 'bluehair' },
      { label: 'Redhat', textureKey: 'redhat-run-v1', avatarId: 'redhat' },
      { label: 'Redman', textureKey: 'redman-run-v1', avatarId: 'redman' }
    ];
    this.layoutAvatarGrid(width, height, avatars);
  }

  layoutAvatarGrid(width: number, height: number, avatars: AvatarOption[]): void {
    const cols = 2;
    const rows = 2;
    const cardW = Math.min(230, Math.floor(width * 0.42));
    const cardH = Math.min(250, Math.floor(height * 0.3));
    const gapX = Math.max(8, Math.floor(width * 0.015));
    const gapY = Math.max(8, Math.floor(height * 0.015));
    const gridW = cols * cardW + (cols - 1) * gapX;
    const gridH = rows * cardH + (rows - 1) * gapY;
    const startX = Math.floor((width - gridW) * 0.5 + cardW * 0.5);
    const startY = Math.floor(Math.max(180, (height - gridH) * 0.5) + cardH * 0.5);

    for (let i = 0; i < avatars.length; i += 1) {
      const avatar = avatars[i];
      if (!avatar) {
        continue;
      }
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.createAvatarCard(x, y, avatar, cardW, cardH);
    }
  }

  createAvatarCard(x: number, y: number, { label, textureKey, avatarId }: AvatarOption, cardW = 260, cardH = 300): void {
    const container = this.add.container(x, y);

    const back = this.add.rectangle(0, 0, cardW, cardH, 0x121c31, 1).setStrokeStyle(3, 0x8db7ff, 1);
    const previewScale = Math.min(cardW / 620, cardH / 580);
    const preview = this.add.sprite(0, -cardH * 0.13, textureKey, 0).setScale(previewScale);
    const name = this.add
      .text(0, cardH * 0.31, label, {
        fontFamily: 'monospace',
        fontSize: `${Math.max(20, Math.floor(cardW * 0.09))}px`,
        color: '#e6f0ff'
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(0, cardH * 0.42, 'Tap / Click to select', {
        fontFamily: 'monospace',
        fontSize: `${Math.max(12, Math.floor(cardW * 0.055))}px`,
        color: '#88a2cd'
      })
      .setOrigin(0.5);

    const hit = this.add.zone(0, 0, cardW, cardH).setOrigin(0.5).setInteractive();
    container.add([back, preview, name, hint, hit]);
    container.setSize(cardW, cardH);

    hit.on('pointerover', () => {
      back.setFillStyle(0x1a2946, 1);
      back.setStrokeStyle(3, 0xb5d1ff, 1);
    });

    hit.on('pointerout', () => {
      back.setFillStyle(0x121c31, 1);
      back.setStrokeStyle(3, 0x8db7ff, 1);
    });

    hit.on('pointerdown', () => {
      this.registry.set('selectedAvatar', avatarId);
      this.scene.start('RunningMainScene');
    });
  }
}
