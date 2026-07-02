import SwiftUI

/// 大切な人カード:「あと◯回会える / 約◯時間」（Web calculateTimeWithPerson と同値）
struct PersonCard: View {
    @Environment(AppStore.self) private var store
    let config: WidgetConfig

    private var scale: CGFloat { config.sizeClass.scale }

    var body: some View {
        if let person = store.person(id: config.personID),
           let result = store.timeWith(person) {
            let personColor = Color(hexString: person.color) ?? Theme.accentBlue
            // 1分ごとに再計算（会える回数は緩やかにしか変わらない）
            TimelineView(.periodic(from: .now, by: 60)) { _ in
                content(person: person, result: result, color: personColor)
            }
            .padding(16 * scale)
        } else {
            Text("この人は削除されました")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textSecondary)
                .padding(20)
        }
    }

    @ViewBuilder
    private func content(person: Person, result: TimeWithPersonResult, color: Color) -> some View {
        switch config.displayMode {
        case .compact:
            HStack(spacing: 6 * scale) {
                Circle().fill(color).frame(width: 5 * scale, height: 5 * scale)
                    .shadow(color: color.opacity(0.8), radius: 3)
                Text("\(person.name)  あと \(Formatters.int(result.meetings))回")
                    .font(.counter(size: 12 * scale, weight: .regular))
                    .foregroundStyle(Theme.textPrimary)
            }
        case .battery:
            VStack(alignment: .leading, spacing: 8 * scale) {
                header(person: person, color: color)
                let percent = personRemainingPercent(result: result)
                BatteryGauge(
                    percent: percent, color: color,
                    height: 36 * scale, shimmer: !store.state.lowPowerMode
                )
                .frame(width: 180 * scale)
                Text("あと \(Formatters.int(result.meetings))回 ・ 約\(Formatters.int(result.hours))時間")
                    .font(.system(size: 11 * scale))
                    .foregroundStyle(Theme.textSecondary)
            }
        case .countdown:
            VStack(alignment: .leading, spacing: 5 * scale) {
                header(person: person, color: color)
                HStack(alignment: .firstTextBaseline, spacing: 3) {
                    Text("あと")
                        .font(.system(size: 11 * scale))
                        .foregroundStyle(Theme.textSecondary)
                    Text(Formatters.int(result.meetings))
                        .font(.counter(size: 34 * scale, weight: .light))
                        .foregroundStyle(color)
                        .shadow(color: color.opacity(0.5), radius: 8)
                    Text("回会える")
                        .font(.system(size: 12 * scale))
                        .foregroundStyle(Theme.textPrimary)
                }
                Text("約\(Formatters.int(result.hours))時間 ・ \(Formatters.decimal1(result.years))年分")
                    .font(.system(size: 11 * scale))
                    .foregroundStyle(Theme.textSecondary)
            }
        }
    }

    private func header(person: Person, color: Color) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 7 * scale, height: 7 * scale)
                .shadow(color: color.opacity(0.8), radius: 3)
            Text(person.name)
                .font(.system(size: 12 * scale, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
            Text(L10n.relationship(person.relationship))
                .font(.system(size: 9 * scale))
                .foregroundStyle(Theme.textSecondary)
                .padding(.horizontal, 5)
                .padding(.vertical, 1.5)
                .background(Capsule().fill(Color.white.opacity(0.08)))
            Text("\(L10n.frequency(person.meetingFrequency))×\(L10n.hoursPerMeeting(person.hoursPerMeeting))")
                .font(.system(size: 9 * scale))
                .foregroundStyle(Theme.textSecondary)
        }
    }

    /// 相手自身の余命% （ユーザーと同じ国・基準で計算）
    private func personRemainingPercent(result: TimeWithPersonResult) -> Double {
        guard let personAge = result.personAge else { return 0 }
        let basis = config.basisOverride ?? store.state.calculationBasis
        let le = CountryData.expectancy(country: store.state.user.country, basis: basis)
        return LifeMath.percentRemaining(age: personAge, expectancy: le)
    }
}

extension Color {
    init?(hexString: String?) {
        guard let hexString else { return nil }
        var hex = hexString
        if hex.hasPrefix("#") { hex.removeFirst() }
        guard hex.count == 6, let v = UInt32(hex, radix: 16) else { return nil }
        self.init(hex: v)
    }
}
