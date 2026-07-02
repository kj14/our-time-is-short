import Foundation

// 今日 / 今年 / カスタム期間のプログレス計算（Mac版の新機能）

enum PeriodKind: Codable, Hashable, Sendable {
    case day
    case year
    case custom(start: Date, end: Date, label: String)
}

struct PeriodSnapshot: Equatable, Sendable {
    var fraction: Double // 経過割合 0...1
    var elapsed: TimeInterval
    var remaining: TimeInterval
    var start: Date
    var end: Date
}

enum Periods {
    static func snapshot(_ kind: PeriodKind, now: Date = .now, calendar: Calendar = .current) -> PeriodSnapshot {
        let start: Date
        let end: Date
        switch kind {
        case .day:
            start = calendar.startOfDay(for: now)
            end = calendar.date(byAdding: .day, value: 1, to: start) ?? start.addingTimeInterval(86400)
        case .year:
            let y = calendar.component(.year, from: now)
            start = calendar.date(from: DateComponents(year: y, month: 1, day: 1)) ?? now
            end = calendar.date(from: DateComponents(year: y + 1, month: 1, day: 1)) ?? now
        case .custom(let s, let e, _):
            start = s
            end = max(e, s)
        }
        let total = end.timeIntervalSince(start)
        let elapsed = min(max(0, now.timeIntervalSince(start)), max(0, total))
        return PeriodSnapshot(
            fraction: total > 0 ? elapsed / total : 1,
            elapsed: elapsed,
            remaining: max(0, total - elapsed),
            start: start,
            end: end
        )
    }
}
