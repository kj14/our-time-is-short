# Our Time Is Short — macOS デスクトップウィジェット版

Web版（[letmeknow.life](https://letmeknow.life)）の思想をデスクトップに常駐させるネイティブアプリ。
人生の残り時間が常に視界にあることで、日々のノイズが消え、大切なものが明確になる。

## できること

- **人生カウントダウン** — 残り○日○時間○分○秒.00 がコンマ秒まで流れ続ける
- **人生の残り電池** — Macのバッテリー風の電池ビジュアル + %表示（クリックで表示モード切替）
- **3つの基準** — 人生（平均寿命）/ 健康（健康寿命）/ 仕事（労働年限）。Web版と同じ30カ国データ + 個別カスタム
- **大切な人** — 子どもや家族を登録して「あと○回会える / 約○時間」を自分のカードの隣に並べて比較
- **期間プログレス** — 今日・今年・カスタム期間の経過%と残り時間
- すべてのウィジェットは自由に配置でき、位置は再起動後も復元される
- 右クリックで: 表示モード / 基準 / ピン留め（最前面・通常・壁紙貼り付け）/ サイズ S・M・L / クリック透過

## ビルドと起動（Xcode不要）

Command Line Tools だけでビルドできる（Swift Package Manager + 自前 .app バンドル）。

```sh
cd macos
make app    # ビルド → .app組立 → ad-hoc署名
make run    # ビルドして起動
make test   # Web版とのドメイン計算パリティチェック
make clean
```

生成物: `macos/build/OurLifeIsShort.app`（`/Applications` へコピーしてもよい）

初回起動すると設定ウィンドウが開くので、生年月日と国を入力すると
カウントダウンと電池の2枚がデスクトップに現れる。

## データ

`~/Library/Application Support/OurLifeIsShort/state.json` にローカル保存（スタンドアロン）。
モデルのフィールド名は Web 版の localStorage JSON（`lifevis_userData` / `lifevis_people`）と互換で、
将来 Web 版エクスポートのインポートに対応できる。

## アーキテクチャ

```
Sources/OurLifeIsShort/
  App/               main.swift（AppKitライフサイクル）, AppDelegate
  Domain/            LifeMath / TimeTogether / Periods / CountryData（Web版 src/utils の忠実移植）
  Store/             AppStore(@Observable) + PersistenceService(JSON, debounce保存)
  WindowManagement/  FloatingPanel(NSPanel) + WidgetWindowManager(差分reconcile)
  Widgets/           WidgetChrome(ドラッグ/右クリック/hover) + 各カード
  Dashboard/         設定ウィンドウ（プロフィール / 大切な人 / ウィジェット / 一般）
  DesignSystem/      Theme（Webのデザイントークン移植）/ GlassCard / BatteryGauge
  Support/           L10n / ParityChecks / LoginItem
```

### パフォーマンス設計（重要）

コンマ秒カウンターとシマーは **Core Animation 直接駆動**（SwiftUI の毎フレーム再評価をバイパス）:

- `SecondsTickerView` — CATextLayer を Timer(30fps) で直接更新
- `ShimmerNSView` — CAGradientLayer + CABasicAnimation（レンダーサーバー駆動）

これにより全8種のウィジェット同時表示で **CPU 約3%**（SwiftUI TimelineView 実装だと約38%）。
画面ロック・スリープ・オクルージョン時は tick を停止する。

### テストについて

Command Line Tools には XCTest / swift-testing が含まれないため、
パリティテストはアプリ内蔵の `--parity-check` フラグで実行する（`make test`）。
Xcode 導入後は正式な testTarget へ移行してよい。

## 将来拡張（v1スコープ外）

- WidgetKit（通知センター/標準デスクトップウィジェット）— 要Xcode。Domain層はそのまま共有可能
- メニューバーモード（`MenuBarExtra` にコンパクト%）
- Web版エクスポートのインポート / iCloud同期
- Truth Messages（データ駆動の問いかけ）
