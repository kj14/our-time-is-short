import AppKit
import SwiftUI

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    let store = AppStore()
    let gate = TickerGate()
    private lazy var windowManager = WidgetWindowManager(store: store, gate: gate)
    private lazy var dashboard = DashboardController(store: store)
    private var didBootstrapDefaults = false
    private var isScreenLocked = false
    private var isAsleep = false

    // MARK: - ライフサイクル

    func applicationDidFinishLaunching(_ notification: Notification) {
        applyActivationPolicy()
        buildMainMenu()

        store.onStateChange = { [weak self] in
            guard let self else { return }
            self.windowManager.reconcile()
            self.applyActivationPolicy()
            self.bootstrapDefaultWidgetsIfNeeded()
        }

        registerSystemObservers()
        windowManager.reconcile()
        bootstrapDefaultWidgetsIfNeeded()

        if !store.hasProfile {
            dashboard.show()
        }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        dashboard.show()
        return true
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    func applicationWillTerminate(_ notification: Notification) {
        store.flushSave()
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        true
    }

    // MARK: - 初期ウィジェット

    /// プロフィール初回設定時、カウントダウン + 電池の2枚を自動配置する
    private func bootstrapDefaultWidgetsIfNeeded() {
        guard !didBootstrapDefaults, store.hasProfile, store.state.widgets.isEmpty else { return }
        didBootstrapDefaults = true
        store.addWidget(WidgetConfig(kind: .lifeCountdown))
        var battery = WidgetConfig(kind: .lifeBattery)
        battery.displayMode = .battery
        store.addWidget(battery)
    }

    private func applyActivationPolicy() {
        let target: NSApplication.ActivationPolicy = store.state.hideDockIcon ? .accessory : .regular
        if NSApp.activationPolicy() != target {
            NSApp.setActivationPolicy(target)
        }
    }

    // MARK: - システムイベント（スリープ/ロック/日跨ぎ）

    private func registerSystemObservers() {
        let wnc = NSWorkspace.shared.notificationCenter
        wnc.addObserver(self, selector: #selector(systemWillSleep),
                        name: NSWorkspace.willSleepNotification, object: nil)
        wnc.addObserver(self, selector: #selector(systemDidWake),
                        name: NSWorkspace.didWakeNotification, object: nil)

        let dnc = DistributedNotificationCenter.default()
        dnc.addObserver(self, selector: #selector(screenLocked),
                        name: Notification.Name("com.apple.screenIsLocked"), object: nil)
        dnc.addObserver(self, selector: #selector(screenUnlocked),
                        name: Notification.Name("com.apple.screenIsUnlocked"), object: nil)

        NotificationCenter.default.addObserver(self, selector: #selector(dayChanged),
                                               name: .NSCalendarDayChanged, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(openDashboardRequested),
                                               name: .openDashboard, object: nil)
    }

    private func updateGate() {
        gate.isPaused = isScreenLocked || isAsleep
    }

    @objc nonisolated private func systemWillSleep(_ note: Notification) {
        Task { @MainActor in
            self.isAsleep = true
            self.updateGate()
            self.store.flushSave()
        }
    }

    @objc nonisolated private func systemDidWake(_ note: Notification) {
        Task { @MainActor in
            self.isAsleep = false
            self.updateGate()
            self.store.invalidateDeadlines() // ドリフト補正
        }
    }

    @objc nonisolated private func screenLocked(_ note: Notification) {
        Task { @MainActor in
            self.isScreenLocked = true
            self.updateGate()
        }
    }

    @objc nonisolated private func screenUnlocked(_ note: Notification) {
        Task { @MainActor in
            self.isScreenLocked = false
            self.updateGate()
            self.store.invalidateDeadlines()
        }
    }

    @objc nonisolated private func dayChanged(_ note: Notification) {
        Task { @MainActor in
            self.store.invalidateDeadlines()
        }
    }

    @objc nonisolated private func openDashboardRequested(_ note: Notification) {
        Task { @MainActor in
            self.dashboard.show()
        }
    }

    // MARK: - メインメニュー（Cmd+Q とテキスト編集系のため）

    private func buildMainMenu() {
        let mainMenu = NSMenu()

        let appItem = NSMenuItem()
        mainMenu.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "設定を開く…", action: #selector(showDashboardAction), keyEquivalent: ",")
            .target = self
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Our Time Is Short を終了",
                        action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let editItem = NSMenuItem()
        mainMenu.addItem(editItem)
        let editMenu = NSMenu(title: "編集")
        editMenu.addItem(withTitle: "取り消す", action: Selector(("undo:")), keyEquivalent: "z")
        editMenu.addItem(withTitle: "やり直す", action: Selector(("redo:")), keyEquivalent: "Z")
        editMenu.addItem(.separator())
        editMenu.addItem(withTitle: "カット", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "コピー", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "ペースト", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "すべてを選択", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = editMenu

        NSApp.mainMenu = mainMenu
    }

    @objc private func showDashboardAction() {
        dashboard.show()
    }
}
