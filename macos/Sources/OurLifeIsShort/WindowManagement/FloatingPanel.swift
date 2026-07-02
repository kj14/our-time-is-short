import AppKit

/// ウィジェットのピン留めレベル
enum PinLevel: String, Codable, CaseIterable, Sendable {
    case aboveAll // 常に最前面
    case normal   // 通常ウィンドウと同列
    case desktop  // 壁紙に貼り付く（旧 Dashboard 風）

    var windowLevel: NSWindow.Level {
        switch self {
        case .aboveAll: return .floating
        case .normal: return .normal
        case .desktop:
            return NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopIconWindow)) - 1)
        }
    }
}

/// ボーダーレス透明の常駐パネル。
/// - .nonactivatingPanel: クリックしてもアプリ全体をアクティブ化しない（作業を邪魔しない）
/// - hasShadow=false: 透明窓 + AppKit 影は残像バグの温床。影は SwiftUI 側で描く
/// - .stationary: Mission Control / Exposé で吹き飛ばされない
final class FloatingPanel: NSPanel {
    init(contentRect: NSRect) {
        super.init(
            contentRect: contentRect,
            styleMask: [.borderless, .nonactivatingPanel, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        isFloatingPanel = true
        level = .floating
        collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]
        backgroundColor = .clear
        isOpaque = false
        hasShadow = false
        isMovableByWindowBackground = true
        hidesOnDeactivate = false
        becomesKeyOnlyIfNeeded = true
        animationBehavior = .none
        isReleasedWhenClosed = false
    }

    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }

    func apply(pin: PinLevel, joinAllSpaces: Bool = true, showOverFullScreen: Bool) {
        level = pin.windowLevel
        var behavior: NSWindow.CollectionBehavior = [.stationary]
        if joinAllSpaces { behavior.insert(.canJoinAllSpaces) }
        if showOverFullScreen { behavior.insert(.fullScreenAuxiliary) }
        collectionBehavior = behavior
    }
}
