import AppKit
import SwiftUI

/// 設定ダッシュボードウィンドウの管理
@MainActor
final class DashboardController {
    private let store: AppStore
    private var window: NSWindow?

    init(store: AppStore) {
        self.store = store
    }

    func show() {
        if window == nil {
            let hosting = NSHostingController(rootView: DashboardView().environment(store))
            let w = NSWindow(contentViewController: hosting)
            w.styleMask = [.titled, .closable, .miniaturizable, .resizable]
            w.title = "Our Time Is Short"
            w.appearance = NSAppearance(named: .darkAqua)
            w.setContentSize(NSSize(width: 700, height: 580))
            w.minSize = NSSize(width: 620, height: 480)
            w.isReleasedWhenClosed = false
            w.center()
            window = w
        }
        NSApp.activate(ignoringOtherApps: true)
        window?.makeKeyAndOrderFront(nil)
    }
}
