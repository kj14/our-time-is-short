import Foundation

// Web版 calculateTimeWithPerson の忠実移植。
// 「どちらかの寿命が先に尽きるまで」の非対称クランプがポイント:
//   相手が年下 → 自分の寿命で打ち切り / 相手が年上・同い年 → 相手の寿命で打ち切り

struct TimeWithPersonResult: Equatable, Sendable {
    var hours: Double
    var meetings: Double
    var days: Double
    var years: Double
    var personAge: Double?
}

enum TimeTogether {
    static func calculate(
        person: Person,
        userAge: Double,
        country: String,
        basis: CalculationBasis = .life,
        userRemainingYears: Double? = nil,
        now: Date = .now,
        calendar: Calendar = .current
    ) -> TimeWithPersonResult {
        guard let personAge = LifeMath.personAge(person, now: now, calendar: calendar) else {
            return TimeWithPersonResult(hours: 0, meetings: 0, days: 0, years: 0, personAge: nil)
        }

        let userLE = CountryData.expectancy(country: country, basis: basis)
        let personLE = userLE // Web 同様: 同一国の平均値（unisex）
        let limitLE = personAge < userAge ? userLE : personLE

        let yearsWithPerson = max(0, limitLE - personAge)
        let effectiveRemaining = userRemainingYears ?? max(0, userLE - userAge)
        let effectiveYears = min(yearsWithPerson, effectiveRemaining)

        let meetings = effectiveYears * person.meetingFrequency
        let hours = meetings * person.hoursPerMeeting

        return TimeWithPersonResult(
            hours: max(0, hours),
            meetings: max(0, meetings),
            days: max(0, hours / 24),
            years: effectiveYears,
            personAge: personAge
        )
    }
}
