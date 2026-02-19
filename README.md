# runningcrew

2D 러닝 게임 프로토타입입니다. Phaser 3 + Vite + TypeScript 기반이며, 아바타 선택/파티 합류/아이템/오디오/반응형 UI를 포함합니다.

## 핵심 기능

- 아바타 선택 씬 (`AvatarSelectScene`)
- 러닝 메인 씬 (`RunningMainScene`)
- 파티 합류 시스템 (최대 20명)
- 코인/왕코인/슈퍼왕코인 + 자석/오토런 아이템
- HP 소모/회복(포션)
- 점프/스프린트/오토런/자석/비 토글
- 말풍선/응원 버튼/일시정지
- WebAudio 기반 BGM/SFX (`AudioSystem`)
- 레이아웃:
  - 선택 화면: 게임 풀스크린
  - 러닝 화면: 좌측(게임+HUD) / 우측(맵)

## 기술 스택

- `phaser` 3.x
- `vite` 5.x
- `typescript` 5.x
- `nosleep.js`
- Tailwind CSS (CDN, `index.html`)

## 프로젝트 구조

```text
src/
  main.ts
  scenes/
    AvatarSelectScene.ts
    RunningMainScene.ts
  systems/
    AudioSystem.ts
  vite-env.d.ts
public/
  assets/
```

## 시작하기

요구사항:
- Node.js 18+
- pnpm

설치:

```bash
pnpm install
```

개발 서버:

```bash
pnpm dev
```

빌드:

```bash
pnpm build
```

타입체크:

```bash
pnpm typecheck
```

## 조작

- `Left / Right`: 배경 스크롤 방향 이동
- `Space`: 점프
- `Shift`: 스프린트(2x)
- `R`: HP 회복(코인 소모)
- 터치: 오른쪽 이동, 빠른 연속 터치/다중 터치 시 스프린트

UI 버튼:
- 캔버스 버튼: `가자!`, `화이팅!`, `일시중지/재개`
- HUD 버튼: Potion, Magnet, Auto, Shift, Rain

## 타입스크립트 설정

현재 `tsconfig.json`은 strict 모드 기준으로 구성되어 있습니다.

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noEmit: true`
