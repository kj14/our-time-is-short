# our-life-is-short (Our Time Is Short)

自分の残り人生・大切な人と過ごせる残り時間を、Three.js による3D宇宙のメタファーで可視化する個人開発Webアプリ。開発者自身が「人生を後回しにしない」ために作っており、公開先は https://letmeknow.life 。詳細な思想は `CONCEPT.md` を参照。GitHub上のリポジトリ名は `our-time-is-short`（GitHub remote: `kj14/our-time-is-short`）で、ローカルディレクトリ名（`our-life-is-short`）と異なる点に注意。

現状はアルファ版（README記載）。

## 技術スタック

- React 19 + TypeScript（`allowJs: true` で `.jsx`/`.tsx` 混在可、strictモードは無効）
- Three.js + @react-three/fiber + @react-three/drei（3D宇宙・惑星・地球などの描画）
- Vite 7（ビルド/開発サーバ）
- Vitest 4（テスト）
- ESLint 9（Flat Config、`eslint.config.js`）
- html2canvas（可視化結果のスナップショット共有機能用）
- パッケージマネージャ: npm（`package-lock.json` あり）

## セットアップ / コマンド

```bash
npm install        # 依存関係インストール
npm run dev         # 開発サーバ起動（vite, port 5173, strictPort）
npm run build        # 本番ビルド（dist/ に出力）
npm run preview       # ビルド結果のプレビュー
npm run lint         # ESLint実行
npm run typecheck      # tsc --noEmit（型チェックのみ、出力なし）
npm run test         # vitest run（一回実行）
npm run test:watch      # vitest（ウォッチモード）
```

## ディレクトリ構成の要点

- `src/App.tsx`, `src/main.tsx` — エントリポイント
- `src/components/` — UIコンポーネント（`DetailPage`, `Scene`, `SolarSystem`, `Earth`, `DigitalHourglass*`, `EnergyTank` など3D/2D混在）
- `src/components/visualization/` — Visualization機能を分割したサブコンポーネント群（`PeopleSettings`, `StatCard`, `TimeUnit`, `UserSettings`, `helpers.ts`）
- `src/features/truthMessages/` — 「真実のメッセージ」機能（テンプレート・セレクタロジック、テストあり）
- `src/state/appView.ts` — アプリ全体のビュー状態（useReducerで管理）
- `src/i18n/` — 日英の文言管理（`strings.ts`, `useT` フック）
- `src/utils/` — 年齢・残り時間計算などのロジック（`calculations.ts`, `lifeData.ts`）
- `src/types.ts`, `src/constants.ts` — 型定義・定数
- `public/textures/`, `public/images/` — 3D惑星テクスチャ・背景画像
- テストファイルは対象モジュールと同階層に `*.test.js`/`*.test.ts` として併置

## コミット規約

`<type>: <説明>` 形式（コロン+半角スペース）。typeは `feat` / `fix` / `refactor` / `docs` / `test` / `build` / `perf` / `i18n` / `data` などを実際に使用。説明文は英語・日本語どちらも使われている（直近は英語が多い）。例:

- `feat: complete TypeScript migration — all .jsx → .tsx`
- `refactor: split Visualization.jsx into 5 sibling files`
- `fix: restore LifeEvents panel in DetailPage`
- `i18n: migrate remaining JP-only strings in DetailPage, Visualization, PersonVisualization, EnergyTank`
- `perf: dispose imperatively-created Three.js material in DigitalHourglass`

PRマージも `Merge pull request #N from ...` 形式で履歴に残る（例: PR #1, #2）。

## CI/デプロイ

`main` ブランチへの push で `.github/workflows/deploy.yml` が起動し、Node.js 20.19.0 上で `npm ci` → `npm run build` → GitHub Pages へ自動デプロイ（`actions/deploy-pages@v4`）。
