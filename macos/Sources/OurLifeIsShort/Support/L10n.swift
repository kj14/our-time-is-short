import Foundation

// v1 は日本語のみ（state.language は将来の英語対応用に保持）

enum L10n {
    static func relationship(_ r: Relationship?) -> String {
        switch r {
        case .parent: return "親"
        case .child: return "子ども"
        case .sibling: return "兄弟姉妹"
        case .spouse: return "配偶者"
        case .partner: return "パートナー"
        case .friend: return "友人"
        case .mentor: return "メンター"
        case .other, .none: return "その他"
        }
    }

    static func basis(_ b: CalculationBasis) -> String {
        switch b {
        case .life: return "人生"
        case .healthy: return "健康"
        case .working: return "仕事"
        }
    }

    static func basisLong(_ b: CalculationBasis) -> String {
        switch b {
        case .life: return "平均寿命"
        case .healthy: return "健康寿命"
        case .working: return "労働年限"
        }
    }

    static func frequency(_ f: Double) -> String {
        switch f {
        case 365: return "毎日"
        case 104: return "週2回"
        case 52: return "週1回"
        case 24: return "月2回"
        case 12: return "月1回"
        case 4: return "年4回"
        case 1: return "年1回"
        default: return "年\(Int(f))回"
        }
    }

    static func hoursPerMeeting(_ h: Double) -> String {
        switch h {
        case 0.5: return "30分"
        case 1: return "1時間"
        case 2: return "2時間"
        case 3: return "3時間"
        case 6: return "半日"
        case 24: return "丸1日"
        default: return "\(Formatters.decimal1(h))時間"
        }
    }

    static func widgetKind(_ k: WidgetKind) -> String {
        switch k {
        case .lifeCountdown: return "人生カウントダウン"
        case .lifeBattery: return "人生の残り電池"
        case .metrics: return "3つの基準"
        case .person: return "大切な人"
        case .comparison: return "みんなの時間"
        case .dayProgress: return "今日"
        case .yearProgress: return "今年"
        case .customPeriod: return "カスタム期間"
        }
    }

    static func displayMode(_ m: WidgetDisplayMode) -> String {
        switch m {
        case .countdown: return "カウントダウン"
        case .battery: return "電池"
        case .compact: return "コンパクト"
        }
    }

    static func pin(_ p: PinLevel) -> String {
        switch p {
        case .aboveAll: return "常に最前面"
        case .normal: return "通常"
        case .desktop: return "壁紙に貼り付け"
        }
    }
}

enum Formatters {
    static let grouped: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.groupingSeparator = ","
        f.maximumFractionDigits = 0
        return f
    }()

    static func int(_ v: Double) -> String {
        grouped.string(from: NSNumber(value: v.rounded(.down))) ?? "0"
    }

    static func int(_ v: Int) -> String {
        grouped.string(from: NSNumber(value: v)) ?? "0"
    }

    static func decimal1(_ v: Double) -> String {
        String(format: "%.1f", v)
    }

    static func percent1(_ v: Double) -> String {
        String(format: "%.1f", v)
    }

    /// 残り時間の短い表現（例: "9時間12分" / "3日"）
    static func shortDuration(_ seconds: TimeInterval) -> String {
        let s = max(0, Int(seconds))
        let days = s / 86400
        let hours = (s % 86400) / 3600
        let minutes = (s % 3600) / 60
        if days > 0 { return "\(days)日\(hours)時間" }
        if hours > 0 { return "\(hours)時間\(minutes)分" }
        return "\(minutes)分"
    }
}
