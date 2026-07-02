import AppKit
import SwiftUI
import Observation

/// 全ウィジェット共通の tick 制御（画面ロック・スリープ・低電力で停止）
@Observable
@MainActor
final class TickerGate {
    var isPaused = false
}

/// パネル単体の状態（オクルージョン = 完全に隠れているか）
@Observable
@MainActor
final class PanelContext {
    var isOccluded = false
}

extension Notification.Name {
    static let openDashboard = Notification.Name("jp.tnmrkj.OurLifeIsShort.openDashboard")
}

/// WidgetConfig の配列 ⇄ 実際の NSPanel 群を差分同期する
@MainActor
final class WidgetWindowManager: NSObject, NSWindowDelegate {
    private struct Holder {
        let panel: FloatingPanel
        let context: PanelContext
    }

    private let store: AppStore
    private let gate: TickerGate
    private var holders: [UUID: Holder] = [:]
    private var cascadeIndex = 0

    init(store: AppStore, gate: TickerGate) {
        self.store = store
        self.gate = gate
        super.init()
    }

    func reconcile() {
        let configs = store.state.widgets
        let visibleIDs = Set(configs.filter(\.isVisible).map(\.id))

        // 消えた/非表示になったパネルを閉じる
        for (id, holder) in holders where !visibleIDs.contains(id) {
            holder.panel.delegate = nil // teardown中のdelegateコールバックを防ぐ
            holder.panel.orderOut(nil)
            holder.panel.close()
            holders.removeValue(forKey: id)
        }

        // 追加・更新
        for config in configs where config.isVisible {
            if let holder = holders[config.id] {
                holder.panel.apply(
                    pin: config.pin,
                    showOverFullScreen: store.state.showOverFullScreen
                )
                holder.panel.ignoresMouseEvents = config.clickThrough
            } else {
                createPanel(for: config)
            }
        }
    }

    private func createPanel(for config: WidgetConfig) {
        let context = PanelContext()
        let root = WidgetRootView(widgetID: config.id)
            .environment(store)
            .environment(gate)
            .environment(context)

        let panel = FloatingPanel(contentRect: NSRect(x: 0, y: 0, width: 320, height: 140))
        // NSHostingView.fittingSize はレイアウト前に 0 を返し、0×0 の不可視パネルになる。
        // NSHostingController の sizingOptions がウィンドウサイズを SwiftUI の
        // preferred size に自動追従させる正攻法（macOS 13+）。
        let controller = NSHostingController(rootView: root)
        controller.sizingOptions = .preferredContentSize
        panel.contentViewController = controller
        controller.view.layoutSubtreeIfNeeded()
        let fit = controller.view.fittingSize
        if fit.width > 1, fit.height > 1 {
            panel.setContentSize(fit)
        }
        panel.apply(pin: config.pin, showOverFullScreen: store.state.showOverFullScreen)
        panel.ignoresMouseEvents = config.clickThrough
        panel.delegate = self
        panel.identifier = NSUserInterfaceItemIdentifier(config.id.uuidString)

        if let saved = config.frame {
            panel.setFrameOrigin(clampOrigin(saved.origin, size: panel.frame.size))
        } else {
            panel.setFrameOrigin(nextCascadeOrigin(size: panel.frame.size))
        }

        panel.alphaValue = 0
        panel.orderFrontRegardless()
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.35
            panel.animator().alphaValue = 1
        }

        holders[config.id] = Holder(panel: panel, context: context)
    }

    /// 保存位置が画面外に出ないようクランプ（モニタ構成変化対策）。
    /// カード全体が最寄りのスクリーンの可視領域に収まるようにする。
    private func clampOrigin(_ origin: CGPoint, size: CGSize) -> CGPoint {
        let screens = NSScreen.screens
        guard !screens.isEmpty else { return origin }
        let target = CGRect(origin: origin, size: size)
        let screen = screens.first { $0.visibleFrame.intersects(target) }
            ?? NSScreen.main ?? screens[0]
        let vf = screen.visibleFrame
        return CGPoint(
            x: min(max(origin.x, vf.minX), max(vf.minX, vf.maxX - size.width)),
            y: min(max(origin.y, vf.minY), max(vf.minY, vf.maxY - size.height))
        )
    }

    private func nextCascadeOrigin(size: CGSize) -> CGPoint {
        let vf = (NSScreen.main ?? NSScreen.screens.first)?.visibleFrame
            ?? CGRect(x: 0, y: 0, width: 1440, height: 900)
        let offset = CGFloat(cascadeIndex % 8) * 36
        cascadeIndex += 1
        return CGPoint(
            x: vf.maxX - size.width - 40 - offset,
            y: vf.maxY - size.height - 40 - offset
        )
    }

    // MARK: - NSWindowDelegate

    private func widgetID(of window: NSWindow?) -> UUID? {
        guard let raw = window?.identifier?.rawValue else { return nil }
        return UUID(uuidString: raw)
    }

    func windowDidMove(_ notification: Notification) {
        guard let window = notification.object as? NSWindow,
              let id = widgetID(of: window) else { return }
        store.saveWidgetFrame(id: id, frame: window.frame)
    }

    func windowDidResize(_ notification: Notification) {
        guard let window = notification.object as? NSWindow,
              let id = widgetID(of: window) else { return }
        store.saveWidgetFrame(id: id, frame: window.frame)
    }

    func windowDidChangeOcclusionState(_ notification: Notification) {
        guard let window = notification.object as? NSWindow,
              let id = widgetID(of: window),
              let holder = holders[id] else { return }
        holder.context.isOccluded = !window.occlusionState.contains(.visible)
    }
}
