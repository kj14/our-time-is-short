import Foundation

// Web版 src/types.ts と JSON フィールド互換のドメインモデル。
// フィールド名を変えると将来の Web データインポートが壊れる。

enum CalculationBasis: String, Codable, CaseIterable, Sendable {
    case life
    case healthy
    case working
}

enum Relationship: String, Codable, CaseIterable, Sendable {
    case parent, child, sibling, spouse, partner, friend, mentor, other
}

struct Person: Codable, Identifiable, Hashable, Sendable {
    var id: String
    var name: String
    var relationship: Relationship?
    var isMentor: Bool?

    // 明示年齢 or 生年月日のどちらか一方（明示年齢が優先 — Web の calculateAge と同じ）
    var age: Double?
    var birthYear: Int?
    var birthMonth: Int? // 1-12
    var birthDay: Int?

    var meetingFrequency: Double // 回/年: 365, 104, 52, 24, 12, 4, 1
    var hoursPerMeeting: Double  // 0.5, 1, 2, 3, 6, 24
    var color: String?

    static func newID(now: Date = .now) -> String {
        "person_\(Int(now.timeIntervalSince1970 * 1000))_\(UUID().uuidString.prefix(8).lowercased())"
    }
}

struct UserProfile: Codable, Hashable, Sendable {
    var country: String = "Japan"
    var birthYear: Int?
    var birthMonth: Int? // 1-12
    var birthDay: Int?
    var age: Double? // 生年月日未入力時のフォールバック（Web の userData.age 相当）

    // 国デフォルトの個別オーバーライド
    var lifeExpectancy: Double?
    var healthyLifeExpectancy: Double?
    var workingAgeLimit: Double?
}

enum DomainLimits {
    static let maxPeople = 10 // Web の MAX_PEOPLE
}

// Web の PersonSettings.tsx にあるプリセット
enum Presets {
    static let meetingFrequencies: [Double] = [365, 104, 52, 24, 12, 4, 1]
    static let hoursPerMeeting: [Double] = [0.5, 1, 2, 3, 6, 24]
}
