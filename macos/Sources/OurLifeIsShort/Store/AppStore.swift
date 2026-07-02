import Foundation
import Observation

/// 単一の状態ストア。SwiftUI は @Observable 経由で自動更新、
/// ウィンドウ管理などの AppKit 側は onStateChange で通知を受ける。
@Observable
@MainActor
final class AppStore {
    private(set) var state: AppState
    @ObservationIgnored private let persistence: PersistenceService
    @ObservationIgnored var onStateChange: (() -> Void)?

    /// deadline はプロフィール/基準ごとに固定 Date をキャッシュ
    /// （fractional age は線形に増えるので本来一定。日跨ぎ・スリープ復帰でドリフト補正）
    private var deadlineCache: [CalculationBasis: Date] = [:]

    init(persistence: PersistenceService = PersistenceService()) {
        self.persistence = persistence
        self.state = persistence.load() ?? AppState()
    }

    // MARK: - 派生値

    var userAge: Double? { LifeMath.userAge(profile: state.user) }
    var hasProfile: Bool { userAge != nil }

    func expectancy(basis: CalculationBasis) -> Double {
        LifeMath.expectancy(profile: state.user, basis: basis)
    }

    func remainingYears(basis: CalculationBasis) -> Double? {
        guard let age = userAge else { return nil }
        return LifeMath.remainingYears(age: age, expectancy: expectancy(basis: basis))
    }

    func percentRemaining(basis: CalculationBasis) -> Double? {
        guard let age = userAge else { return nil }
        return LifeMath.percentRemaining(age: age, expectancy: expectancy(basis: basis))
    }

    func deadline(basis: CalculationBasis) -> Date? {
        if let cached = deadlineCache[basis] { return cached }
        guard let d = LifeMath.deadline(profile: state.user, basis: basis) else { return nil }
        deadlineCache[basis] = d
        return d
    }

    func invalidateDeadlines() {
        deadlineCache = [:]
    }

    func timeWith(_ person: Person, basis: CalculationBasis? = nil) -> TimeWithPersonResult? {
        guard let age = userAge else { return nil }
        let b = basis ?? state.calculationBasis
        return TimeTogether.calculate(
            person: person,
            userAge: age,
            country: state.user.country,
            basis: b,
            userRemainingYears: remainingYears(basis: b)
        )
    }

    func person(id: String?) -> Person? {
        guard let id else { return nil }
        return state.people.first { $0.id == id }
    }

    func widget(id: UUID) -> WidgetConfig? {
        state.widgets.first { $0.id == id }
    }

    // MARK: - 変更（すべてこの funnel を通す）

    private func mutate(_ f: (inout AppState) -> Void) {
        f(&state)
        persistence.scheduleSave(state)
        onStateChange?()
    }

    func flushSave() {
        persistence.saveNow(state)
    }

    // MARK: プロフィール

    func updateProfile(_ profile: UserProfile) {
        mutate { $0.user = profile }
        invalidateDeadlines()
    }

    func setBasis(_ basis: CalculationBasis) {
        mutate { $0.calculationBasis = basis }
    }

    // MARK: 大切な人（最大10人・メンター1人は Web と同じ制約）

    @discardableResult
    func addPerson(_ person: Person) -> Bool {
        guard state.people.count < DomainLimits.maxPeople else { return false }
        var p = person
        if p.color == nil {
            p.color = PersonPalette.color(at: state.people.count)
        }
        mutate { st in
            if p.isMentor == true {
                st.people = st.people.map { var q = $0; q.isMentor = false; return q }
            }
            st.people.append(p)
        }
        return true
    }

    func updatePerson(_ person: Person) {
        mutate { st in
            if person.isMentor == true {
                st.people = st.people.map { var q = $0; q.isMentor = ($0.id == person.id); return q }
            }
            if let i = st.people.firstIndex(where: { $0.id == person.id }) {
                st.people[i] = person
            }
        }
    }

    func removePerson(id: String) {
        mutate { st in
            st.people.removeAll { $0.id == id }
            // この人を参照するウィジェットも掃除
            st.widgets.removeAll { $0.kind == .person && $0.personID == id }
            st.widgets = st.widgets.map { w in
                var w = w
                w.comparisonPersonIDs?.removeAll { $0 == id }
                return w
            }
        }
    }

    // MARK: ウィジェット

    @discardableResult
    func addWidget(_ config: WidgetConfig) -> WidgetConfig {
        mutate { $0.widgets.append(config) }
        return config
    }

    func updateWidget(_ config: WidgetConfig) {
        mutate { st in
            if let i = st.widgets.firstIndex(where: { $0.id == config.id }) {
                st.widgets[i] = config
            }
        }
    }

    func updateWidget(id: UUID, _ f: (inout WidgetConfig) -> Void) {
        mutate { st in
            if let i = st.widgets.firstIndex(where: { $0.id == id }) {
                f(&st.widgets[i])
            }
        }
    }

    func removeWidget(id: UUID) {
        mutate { $0.widgets.removeAll { $0.id == id } }
    }

    /// ウィンドウ移動時の位置保存（reconcile 不要なので onStateChange は呼ばない）
    func saveWidgetFrame(id: UUID, frame: CGRect) {
        guard let i = state.widgets.firstIndex(where: { $0.id == id }) else { return }
        state.widgets[i].frame = frame
        persistence.scheduleSave(state)
    }

    // MARK: 一般設定

    func resetAll() {
        mutate { $0 = AppState() }
        invalidateDeadlines()
        flushSave()
    }

    func setLowPowerMode(_ on: Bool) { mutate { $0.lowPowerMode = on } }
    func setShowOverFullScreen(_ on: Bool) { mutate { $0.showOverFullScreen = on } }
    func setHideDockIcon(_ on: Bool) { mutate { $0.hideDockIcon = on } }
    func setLanguage(_ lang: String) { mutate { $0.language = lang } }
}

/// 大切な人のアクセントカラー（Web の惑星テクスチャ7種に相当）
enum PersonPalette {
    static let colors = ["#60a5fa", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#f87171", "#22d3ee"]
    static func color(at index: Int) -> String {
        colors[index % colors.count]
    }
}
