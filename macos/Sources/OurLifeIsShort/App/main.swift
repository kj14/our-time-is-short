import AppKit

// パリティチェックモード（CLT環境にはXCTestが無いためヘッドレス実行）
if CommandLine.arguments.contains("--parity-check") {
    exit(ParityChecks.runAll() ? 0 : 1)
}

// AppKit ライフサイクル（SwiftUI App プロトコルは使わない）。
// すべてのウィンドウは NSPanel / NSWindow + NSHostingView で管理する。
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
