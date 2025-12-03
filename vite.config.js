import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const detectRepoName = () => {
  // GitHub Actionsでは owner/repo 形式の環境変数が渡る
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY.split('/')[1]
  }
  // 環境変数で明示的に指定したい場合
  if (process.env.VITE_BASE_REPO) {
    return process.env.VITE_BASE_REPO
  }
  // ローカル開発時のデフォルト
  return 'our-time-is-short'
}

const repoName = detectRepoName()
const isProduction = process.env.NODE_ENV === 'production'

// https://vite.dev/config/
export default defineConfig({
  base: isProduction ? `/${repoName}/` : '/',
  plugins: [react()],
})
