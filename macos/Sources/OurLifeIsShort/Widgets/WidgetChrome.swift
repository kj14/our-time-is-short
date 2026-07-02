import AppKit
import SwiftUI

/// ウィジェット直下の背景レイヤー。
/// 左ドラッグでウィンドウ移動、動かなければクリック扱い、右クリックで NSMenu。
private final class DragClickNSView: NSView {
    var onClick: (() -> Void)?
    var menuProvider: (() -> NSMenu?)?

    override var mouseDownCanMoveWindow: Bool { false }

    override func mouseDown(with event: NSEvent) {
        guard let window else { return }
        let before = window.frame.origin
        window.performDrag(with: event)
        let after = window.frame.origin
        if abs(before.x - after.x) < 2, abs(before.y - after.y) < 2 {
            onClick?()
        }
    }

    override func menu(for event: NSEvent) -> NSMenu? {
        menuProvider?() ?? super.menu(for: event)
    }
}

private struct WindowDragArea: NSViewRepresentable {
    var onClick: (() -> Void)?
    var menuProvider: (() -> NSMenu?)?

    func makeNSView(context: Context) -> NSView {
        let v = DragClickNSView()
        v.onClick = onClick
        v.menuProvider = menuProvider
        return v
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        guard let v = nsView as? DragClickNSView else { return }
        v.onClick = onClick
        v.menuProvider = menuProvider
    }
}

/// closure を撃てる NSMenuItem
@MainActor
final class ClosureMenuItem: NSMenuItem {
    private var handler: () -> Void

    init(_ title: String, state: NSControl.StateValue = .off, handler: @escaping () -> Void) {
        self.handler = handler
        super.init(title: title, action: #selector(fire), keyEquivalent: "")
        self.target = self
        self.state = state
    }

    required init(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @objc private func fire() { handler() }
}

/// ウィジェットのルートビュー: config を store から引いて枠+カードを描く
struct WidgetRootView: View {
    @Environment(AppStore.self) private var store
    let widgetID: UUID

    var body: some View {
        if let config = store.widget(id: widgetID) {
            WidgetChrome(config: config)
        }
    }
}

/// ガラスカード枠 + ドラッグ/クリック/右クリックメニュー/hover操作
struct WidgetChrome: View {
    @Environment(AppStore.self) private var store
    let config: WidgetConfig
    @State private var hovering = false

    private var cycleable: Bool {
        switch config.kind {
        case .lifeCountdown, .lifeBattery, .person: return true
        default: return false
        }
    }

    var body: some View {
        GlassCard {
            ZStack(alignment: .topTrailing) {
                WindowDragArea(
                    onClick: cycleable ? { cycleMode() } : nil,
                    menuProvider: { buildMenu() }
                )
                cardBody
                    .allowsHitTesting(false)
                if hovering {
                    hoverControls
                        .padding(6)
                        .transition(.opacity)
                }
            }
        }
        .onHover { h in
            withAnimation(.easeOut(duration: 0.15)) { hovering = h }
        }
        .padding(20) // SwiftUI 影の描画余白
    }

    @ViewBuilder
    private var cardBody: some View {
        switch config.kind {
        case .lifeCountdown, .lifeBattery:
            LifeCard(config: config)
        case .metrics:
            MetricsCard(config: config)
        case .person:
            PersonCard(config: config)
        case .comparison:
            ComparisonCard(config: config)
        case .dayProgress, .yearProgress, .customPeriod:
            PeriodProgressCard(config: config)
        }
    }

    private var hoverControls: some View {
        HStack(spacing: 4) {
            Button {
                NotificationCenter.default.post(name: .openDashboard, object: nil)
            } label: {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.textSecondary)
                    .padding(5)
                    .background(Circle().fill(Color.white.opacity(0.08)))
            }
            .buttonStyle(.plain)
            Button {
                store.updateWidget(id: config.id) { $0.isVisible = false }
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(Theme.textSecondary)
                    .padding(5)
                    .background(Circle().fill(Color.white.opacity(0.08)))
            }
            .buttonStyle(.plain)
        }
    }

    private func cycleMode() {
        let next: WidgetDisplayMode
        switch config.displayMode {
        case .countdown: next = .battery
        case .battery: next = .compact
        case .compact: next = .countdown
        }
        store.updateWidget(id: config.id) { $0.displayMode = next }
    }

    private func buildMenu() -> NSMenu {
        let store = self.store
        let config = self.config
        let menu = NSMenu()

        if cycleable {
            for mode in WidgetDisplayMode.allCases {
                menu.addItem(ClosureMenuItem(
                    L10n.displayMode(mode),
                    state: config.displayMode == mode ? .on : .off
                ) {
                    store.updateWidget(id: config.id) { $0.displayMode = mode }
                })
            }
            menu.addItem(.separator())
        }

        if config.kind == .lifeCountdown || config.kind == .lifeBattery || config.kind == .metrics {
            let basisMenu = NSMenu()
            basisMenu.addItem(ClosureMenuItem(
                "全体設定に従う", state: config.basisOverride == nil ? .on : .off
            ) {
                store.updateWidget(id: config.id) { $0.basisOverride = nil }
            })
            for b in CalculationBasis.allCases {
                basisMenu.addItem(ClosureMenuItem(
                    "\(L10n.basis(b))（\(L10n.basisLong(b))）",
                    state: config.basisOverride == b ? .on : .off
                ) {
                    store.updateWidget(id: config.id) { $0.basisOverride = b }
                })
            }
            let basisItem = NSMenuItem(title: "基準", action: nil, keyEquivalent: "")
            basisItem.submenu = basisMenu
            menu.addItem(basisItem)
        }

        let pinMenu = NSMenu()
        for p in PinLevel.allCases {
            pinMenu.addItem(ClosureMenuItem(L10n.pin(p), state: config.pin == p ? .on : .off) {
                store.updateWidget(id: config.id) { $0.pin = p }
            })
        }
        let pinItem = NSMenuItem(title: "ピン留め", action: nil, keyEquivalent: "")
        pinItem.submenu = pinMenu
        menu.addItem(pinItem)

        let sizeMenu = NSMenu()
        for s in WidgetSize.allCases {
            sizeMenu.addItem(ClosureMenuItem(s.rawValue, state: config.sizeClass == s ? .on : .off) {
                store.updateWidget(id: config.id) { $0.sizeClass = s }
            })
        }
        let sizeItem = NSMenuItem(title: "サイズ", action: nil, keyEquivalent: "")
        sizeItem.submenu = sizeMenu
        menu.addItem(sizeItem)

        menu.addItem(.separator())
        menu.addItem(ClosureMenuItem("クリック透過（解除は設定から）") {
            store.updateWidget(id: config.id) { $0.clickThrough = true }
        })
        menu.addItem(ClosureMenuItem("このウィジェットを隠す") {
            store.updateWidget(id: config.id) { $0.isVisible = false }
        })
        menu.addItem(.separator())
        menu.addItem(ClosureMenuItem("設定を開く…") {
            NotificationCenter.default.post(name: .openDashboard, object: nil)
        })
        return menu
    }
}

extension WidgetSize {
    /// カード内フォント/寸法のスケール
    var scale: CGFloat {
        switch self {
        case .s: return 0.78
        case .m: return 1.0
        case .l: return 1.3
        }
    }
}
