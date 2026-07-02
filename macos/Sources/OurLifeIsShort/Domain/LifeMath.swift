import Foundation

// Web版 src/utils/calculations.ts / lifeData.ts の計算を忠実移植。
// 数式を変えるときは Web 側と必ず同時に変えること（パリティテストが落ちる）。

enum LifeMath {
    static let secondsPerYear: Double = 365.25 * 24 * 60 * 60

    /// Web の ageFromDate と同一: 整数年齢 + (今日 − 直前誕生日)/(次回誕生日 − 直前誕生日)
    static func fractionalAge(
        birthYear: Int, birthMonth: Int, birthDay: Int,
        now: Date = .now, calendar: Calendar = .current
    ) -> Double {
        let comps = calendar.dateComponents([.year, .month, .day], from: now)
        guard let ty = comps.year, let tm = comps.month, let td = comps.day else { return 0 }

        var age = ty - birthYear
        let monthDiff = tm - birthMonth
        let dayDiff = td - birthDay
        if monthDiff < 0 || (monthDiff == 0 && dayDiff < 0) { age -= 1 }

        // JS の new Date(y, m-1, d) と同じく、範囲外の日付は翌月に繰り越される（lenient）
        var next = calendar.date(from: DateComponents(year: ty, month: birthMonth, day: birthDay)) ?? now
        if next < now {
            next = calendar.date(byAdding: .year, value: 1, to: next) ?? next
        }
        let last = calendar.date(byAdding: .year, value: -1, to: next) ?? next
        let span = next.timeIntervalSince(last)
        let yearProgress = span > 0 ? now.timeIntervalSince(last) / span : 0
        return Double(age) + yearProgress
    }

    /// プロフィールから現在の実年齢（生年月日優先、なければ明示 age）
    static func userAge(profile: UserProfile, now: Date = .now, calendar: Calendar = .current) -> Double? {
        if let y = profile.birthYear, let m = profile.birthMonth, let d = profile.birthDay {
            return fractionalAge(birthYear: y, birthMonth: m, birthDay: d, now: now, calendar: calendar)
        }
        return profile.age
    }

    /// Web の calculateAge(person) と同じ優先順位: 明示 age → 生年月日 → nil
    static func personAge(_ person: Person, now: Date = .now, calendar: Calendar = .current) -> Double? {
        if let a = person.age { return a }
        if let y = person.birthYear, let m = person.birthMonth, let d = person.birthDay {
            return fractionalAge(birthYear: y, birthMonth: m, birthDay: d, now: now, calendar: calendar)
        }
        return nil
    }

    /// オーバーライド ?? 国デフォルト（Web の userData.lifeExpectancy 優先ロジック相当）
    static func expectancy(profile: UserProfile, basis: CalculationBasis) -> Double {
        let override: Double?
        switch basis {
        case .life: override = profile.lifeExpectancy
        case .healthy: override = profile.healthyLifeExpectancy
        case .working: override = profile.workingAgeLimit
        }
        return override ?? CountryData.expectancy(country: profile.country, basis: basis)
    }

    static func remainingYears(age: Double, expectancy: Double) -> Double {
        max(0, expectancy - age)
    }

    static func remainingSeconds(remainingYears: Double) -> TimeInterval {
        remainingYears * secondsPerYear
    }

    static func percentRemaining(age: Double, expectancy: Double) -> Double {
        guard expectancy > 0 else { return 0 }
        return remainingYears(age: age, expectancy: expectancy) / expectancy * 100
    }

    /// カウントダウンの締切時刻（Web と同じ「今の残秒数から固定 endDate を作る」方式）。
    /// 呼び出し側でキャッシュし、プロフィール/基準変更・日跨ぎ・スリープ復帰時のみ再計算する。
    static func deadline(
        profile: UserProfile, basis: CalculationBasis,
        now: Date = .now, calendar: Calendar = .current
    ) -> Date? {
        guard let age = userAge(profile: profile, now: now, calendar: calendar) else { return nil }
        let e = expectancy(profile: profile, basis: basis)
        return now.addingTimeInterval(remainingSeconds(remainingYears: remainingYears(age: age, expectancy: e)))
    }

    // MARK: - カウントダウン分解（Web の getTimeComponents と同一）

    struct TimeComponents: Equatable, Sendable {
        var days: Int
        var hours: Int
        var minutes: Int
        var seconds: Int
        var centiseconds: Int // 0-99（Web: floor((ms % 1000) / 10)）
    }

    static func components(remaining: TimeInterval) -> TimeComponents {
        let ms = Int(max(0, remaining) * 1000)
        return TimeComponents(
            days: ms / 86_400_000,
            hours: (ms % 86_400_000) / 3_600_000,
            minutes: (ms % 3_600_000) / 60_000,
            seconds: (ms % 60_000) / 1000,
            centiseconds: (ms % 1000) / 10
        )
    }
}
