import Foundation

// Web版 (src/utils/calculations.ts) とのパリティチェック。
// Command Line Tools のみの環境には XCTest / swift-testing が無いため、
// `swift run OurLifeIsShort --parity-check` でヘッドレス実行する方式を採る。
// Xcode 導入後は正式な testTarget へ移行してよい。

@MainActor
enum ParityChecks {
    private static var failures: [String] = []

    private static func check(_ condition: Bool, _ name: String) {
        if condition {
            print("  ✓ \(name)")
        } else {
            failures.append(name)
            print("  ✗ \(name)")
        }
    }

    private static func approx(_ a: Double, _ b: Double, tol: Double = 1e-9) -> Bool {
        abs(a - b) < tol
    }

    private static var jst: Calendar {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Tokyo")!
        return cal
    }

    private static func date(_ y: Int, _ m: Int, _ d: Int, _ h: Int = 0, _ min: Int = 0) -> Date {
        jst.date(from: DateComponents(year: y, month: m, day: d, hour: h, minute: min))!
    }

    /// 全チェックを実行して成否を返す
    static func runAll() -> Bool {
        failures = []

        print("fractionalAge:")
        // 1990-01-01生まれ、2026-07-03 00:00 → 36歳 + 183日/365日
        check(approx(
            LifeMath.fractionalAge(birthYear: 1990, birthMonth: 1, birthDay: 1,
                                   now: date(2026, 7, 3), calendar: jst),
            36.0 + 183.0 / 365.0), "誕生日経過済み")
        // 1990-12-31生まれ、2026-07-03 → 35歳 + 184/365
        check(approx(
            LifeMath.fractionalAge(birthYear: 1990, birthMonth: 12, birthDay: 31,
                                   now: date(2026, 7, 3), calendar: jst),
            35.0 + 184.0 / 365.0), "誕生日未到来")
        // 誕生日当日の正午: JSは nextBirthday(0時) < now → 翌年繰上げ、進捗 12h/365d
        check(approx(
            LifeMath.fractionalAge(birthYear: 1990, birthMonth: 7, birthDay: 3,
                                   now: date(2026, 7, 3, 12, 0), calendar: jst),
            36.0 + 0.5 / 365.0), "誕生日当日")

        print("expectancy:")
        check(CountryData.expectancy(country: "Japan", basis: .life) == 84.6, "日本・平均寿命")
        check(CountryData.expectancy(country: "Japan", basis: .healthy) == 75.0, "日本・健康寿命")
        check(CountryData.expectancy(country: "Japan", basis: .working) == 65, "日本・労働年限")
        check(CountryData.expectancy(country: "Atlantis", basis: .life) == 73.2, "未知国→Global")
        var overridden = UserProfile(country: "Japan")
        overridden.lifeExpectancy = 100
        check(LifeMath.expectancy(profile: overridden, basis: .life) == 100, "オーバーライド優先")
        check(LifeMath.expectancy(profile: overridden, basis: .healthy) == 75.0, "未設定基準は国値")

        print("remaining:")
        check(LifeMath.remainingYears(age: 90, expectancy: 84.6) == 0, "超過は0にクランプ")
        check(approx(LifeMath.percentRemaining(age: 42.3, expectancy: 84.6), 50.0), "残り%=50")
        check(LifeMath.remainingSeconds(remainingYears: 40.1) == 40.1 * 365.25 * 24 * 60 * 60,
              "remainingSeconds式")

        print("timeComponents:")
        // 1234567.89s = 14日 6時間 56分 7秒 .89
        let c = LifeMath.components(remaining: 1_234_567.89)
        check(c == LifeMath.TimeComponents(days: 14, hours: 6, minutes: 56, seconds: 7, centiseconds: 89),
              "分解 (Web getTimeComponents)")
        check(LifeMath.components(remaining: -5) ==
              LifeMath.TimeComponents(days: 0, hours: 0, minutes: 0, seconds: 0, centiseconds: 0),
              "負値は0")

        print("timeTogether:")
        // 44歳(日本)、8歳の子、週1(52)×2h → effective = min(84.6-8, 84.6-44) = 40.6年
        let child = Person(id: "p1", name: "子", relationship: .child,
                           age: 8, meetingFrequency: 52, hoursPerMeeting: 2)
        let r1 = TimeTogether.calculate(person: child, userAge: 44, country: "Japan")
        check(approx(r1.years, 40.6), "年下→自分の寿命で打切り")
        check(approx(r1.meetings, 40.6 * 52), "meetings = years×freq")
        check(approx(r1.hours, 40.6 * 52 * 2), "hours = meetings×hpm")
        check(approx(r1.days, 40.6 * 52 * 2 / 24), "days = hours/24")
        // 70歳の親、月1(12)×2h → effective = min(84.6-70, 40.6) = 14.6年
        let parent = Person(id: "p2", name: "親", relationship: .parent,
                            age: 70, meetingFrequency: 12, hoursPerMeeting: 2)
        let r2 = TimeTogether.calculate(person: parent, userAge: 44, country: "Japan")
        check(approx(r2.years, 14.6), "年上→相手の寿命で打切り")
        check(approx(r2.hours, 14.6 * 12 * 2), "親: hours")
        // 明示age優先（Web calculateAge と同じ）
        let withBoth = Person(id: "p3", name: "x", age: 30,
                              birthYear: 2000, birthMonth: 1, birthDay: 1,
                              meetingFrequency: 12, hoursPerMeeting: 2)
        check(LifeMath.personAge(withBoth) == 30, "明示age > 生年月日")
        // 年齢不明は0結果
        let noAge = Person(id: "p4", name: "x", meetingFrequency: 12, hoursPerMeeting: 2)
        let r3 = TimeTogether.calculate(person: noAge, userAge: 44, country: "Japan")
        check(r3.personAge == nil && r3.hours == 0 && r3.meetings == 0, "年齢不明→ゼロ")
        // userRemainingYears の明示渡し
        let r4 = TimeTogether.calculate(person: child, userAge: 44, country: "Japan",
                                        userRemainingYears: 20)
        check(approx(r4.years, 20), "remainingYears明示渡し")

        print("periods:")
        let day = Periods.snapshot(.day, now: date(2026, 7, 3, 18, 0), calendar: jst)
        check(approx(day.fraction, 0.75), "今日18時=75%経過")
        check(approx(day.remaining, 6 * 3600), "今日残り6時間")
        let year = Periods.snapshot(.year, now: date(2026, 7, 3, 18, 0), calendar: jst)
        check(approx(year.fraction, 183.75 / 365.0), "今年の経過割合")
        let custom = Periods.snapshot(
            .custom(start: date(2026, 1, 1), end: date(2026, 1, 11), label: "test"),
            now: date(2026, 2, 1), calendar: jst)
        check(custom.fraction == 1 && custom.remaining == 0, "期間超過はクランプ")

        if failures.isEmpty {
            print("\nすべてのパリティチェックに合格")
            return true
        } else {
            print("\n失敗: \(failures.count)件 — \(failures.joined(separator: ", "))")
            return false
        }
    }
}
