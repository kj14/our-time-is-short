import Foundation

/// state.json の読み書き。保存は 500ms debounce + atomic write。
@MainActor
final class PersistenceService {
    let fileURL: URL
    private var pendingSave: DispatchWorkItem?

    init(fileURL: URL? = nil) {
        if let fileURL {
            self.fileURL = fileURL
        } else {
            let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            let dir = base.appendingPathComponent("OurLifeIsShort", isDirectory: true)
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            self.fileURL = dir.appendingPathComponent("state.json")
        }
    }

    func load() -> AppState? {
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        do {
            return try decoder.decode(AppState.self, from: data)
        } catch {
            // 壊れたファイルは退避してデフォルトで起動（ユーザーデータを黙って消さない）
            let backup = fileURL.deletingLastPathComponent()
                .appendingPathComponent("state.corrupt.json")
            try? FileManager.default.removeItem(at: backup)
            try? FileManager.default.copyItem(at: fileURL, to: backup)
            NSLog("state.json の読み込みに失敗（state.corrupt.json に退避): \(error)")
            return nil
        }
    }

    func scheduleSave(_ state: AppState) {
        pendingSave?.cancel()
        let item = DispatchWorkItem { [weak self] in
            Task { @MainActor in self?.saveNow(state) }
        }
        pendingSave = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: item)
    }

    func saveNow(_ state: AppState) {
        pendingSave?.cancel()
        pendingSave = nil
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        do {
            let data = try encoder.encode(state)
            try data.write(to: fileURL, options: .atomic)
        } catch {
            NSLog("state.json の保存に失敗: \(error)")
        }
    }
}
