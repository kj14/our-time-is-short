import Foundation
import ServiceManagement

/// ログイン時起動（SMAppService）。
/// ad-hoc 署名 + バンドル外実行では失敗しうるので、失敗時は手動追加を案内する。
@MainActor
enum LoginItem {
    static var isEnabled: Bool {
        SMAppService.mainApp.status == .enabled
    }

    static func set(enabled: Bool) throws {
        if enabled {
            try SMAppService.mainApp.register()
        } else {
            try SMAppService.mainApp.unregister()
        }
    }
}
