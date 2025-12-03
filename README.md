# Our Life Is Short

インタラクティブなビジュアライゼーションで、残りの人生や大切な人との時間を直感的に把握できる React + Vite 製アプリです。  
GitHub Pages でのホスティングを前提に、CI/CD（Actions）とベースパスの設定を済ませています。

## 使用技術

- React 18 / Vite 7
- Three.js + react-three-fiber（3D 可視化）
- GitHub Actions（Pages への自動デプロイ）
- LocalStorage（ユーザー設定の永続化）

## 動作要件

- Node.js **20.19 以上** または **22.12 以上**（Vite の要件）
- npm 10 以上

## セットアップ

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ に本番成果物を出力
```

> ⚠️ Node.js 20.19 未満だと Vite が警告を出します。必要に応じて `nvm install 20.19.0` などでアップデートしてください。

## GitHub Pages へのデプロイ

1. リポジトリの **Settings → Pages** で「GitHub Actions」を選択。
2. 既に `.github/workflows/deploy.yml` があるため、`main` ブランチへ push すると自動で `npm ci → npm run build` が走り、Pages に反映されます。
3. 公開 URL は `https://<GitHubユーザー名>.github.io/our-life-is-short/`（または Settings で指定したカスタムドメイン）です。

### ベースパスについて

`vite.config.js` で `base` を `/<repository-name>/` に設定済みです。  
リポジトリ名を変更した場合は、以下のように書き換えてください。

```js
const repoName = 'your-new-repo-name'
export default defineConfig({
  base: `/${repoName}/`,
  // ...
})
```

## よくある作業

| 作業             | コマンド例                         |
|------------------|------------------------------------|
| 依存関係更新     | `npm install <package>`            |
| Lint (Eslint)    | `npm run lint`                     |
| 本番ビルド確認   | `npm run build && npm run preview` |

## ライセンス

プロジェクトで採用したいライセンス（例: MIT, Apache-2.0 等）をここに明記してください。
