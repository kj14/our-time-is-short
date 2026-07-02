import Foundation

// アプリ全体の永続状態。state.json に保存される。
// スキーマ進化に耐えるよう、decode は全フィールド decodeIfPresent + デフォルト値。

enum WidgetKind: String, Codable, CaseIterable, Sendable {
    case lifeCountdown
    case lifeBattery
    case metrics
    case person
    case comparison
    case dayProgress
    case yearProgress
    case customPeriod
}

enum WidgetDisplayMode: String, Codable, CaseIterable, Sendable {
    case countdown // 残り○日○時間○分○秒.cc
    case battery   // 電池ビジュアル + %
    case compact   // 1行ミニ表示
}

enum WidgetSize: String, Codable, CaseIterable, Sendable {
    case s = "S"
    case m = "M"
    case l = "L"
}

struct WidgetConfig: Codable, Identifiable, Hashable, Sendable {
    var id: UUID = UUID()
    var kind: WidgetKind
    var personID: String?
    var comparisonPersonIDs: [String]? // nil = 全員
    var period: PeriodKind?
    var displayMode: WidgetDisplayMode = .countdown
    var basisOverride: CalculationBasis?
    var pin: PinLevel = .aboveAll
    var clickThrough: Bool = false
    var sizeClass: WidgetSize = .m
    var frame: CGRect?
    var isVisible: Bool = true
    // metrics カードの行トグル
    var showLife: Bool = true
    var showHealthy: Bool = true
    var showWorking: Bool = true

    init(kind: WidgetKind) {
        self.kind = kind
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decodeIfPresent(UUID.self, forKey: .id) ?? UUID()
        kind = try c.decode(WidgetKind.self, forKey: .kind)
        personID = try c.decodeIfPresent(String.self, forKey: .personID)
        comparisonPersonIDs = try c.decodeIfPresent([String].self, forKey: .comparisonPersonIDs)
        period = try c.decodeIfPresent(PeriodKind.self, forKey: .period)
        displayMode = try c.decodeIfPresent(WidgetDisplayMode.self, forKey: .displayMode) ?? .countdown
        basisOverride = try c.decodeIfPresent(CalculationBasis.self, forKey: .basisOverride)
        pin = try c.decodeIfPresent(PinLevel.self, forKey: .pin) ?? .aboveAll
        clickThrough = try c.decodeIfPresent(Bool.self, forKey: .clickThrough) ?? false
        sizeClass = try c.decodeIfPresent(WidgetSize.self, forKey: .sizeClass) ?? .m
        frame = try c.decodeIfPresent(CGRect.self, forKey: .frame)
        isVisible = try c.decodeIfPresent(Bool.self, forKey: .isVisible) ?? true
        showLife = try c.decodeIfPresent(Bool.self, forKey: .showLife) ?? true
        showHealthy = try c.decodeIfPresent(Bool.self, forKey: .showHealthy) ?? true
        showWorking = try c.decodeIfPresent(Bool.self, forKey: .showWorking) ?? true
    }
}

struct AppState: Codable, Sendable {
    var schemaVersion: Int = 1
    var user: UserProfile = UserProfile()
    var people: [Person] = []
    var calculationBasis: CalculationBasis = .life
    var language: String = "ja"
    var widgets: [WidgetConfig] = []
    var lowPowerMode: Bool = false
    var showOverFullScreen: Bool = true
    var hideDockIcon: Bool = false

    init() {}

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        schemaVersion = try c.decodeIfPresent(Int.self, forKey: .schemaVersion) ?? 1
        user = try c.decodeIfPresent(UserProfile.self, forKey: .user) ?? UserProfile()
        people = try c.decodeIfPresent([Person].self, forKey: .people) ?? []
        calculationBasis = try c.decodeIfPresent(CalculationBasis.self, forKey: .calculationBasis) ?? .life
        language = try c.decodeIfPresent(String.self, forKey: .language) ?? "ja"
        widgets = try c.decodeIfPresent([WidgetConfig].self, forKey: .widgets) ?? []
        lowPowerMode = try c.decodeIfPresent(Bool.self, forKey: .lowPowerMode) ?? false
        showOverFullScreen = try c.decodeIfPresent(Bool.self, forKey: .showOverFullScreen) ?? true
        hideDockIcon = try c.decodeIfPresent(Bool.self, forKey: .hideDockIcon) ?? false
    }
}
