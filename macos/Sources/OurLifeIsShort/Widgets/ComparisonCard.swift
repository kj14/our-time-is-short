import SwiftUI

/// 自分 + 大切な人を1枚に縦積みして比較するカード
struct ComparisonCard: View {
    @Environment(AppStore.self) private var store
    let config: WidgetConfig

    private var scale: CGFloat { config.sizeClass.scale }

    private var people: [Person] {
        if let ids = config.comparisonPersonIDs {
            return ids.compactMap { store.person(id: $0) }
        }
        return store.state.people
    }

    var body: some View {
        let basis = config.basisOverride ?? store.state.calculationBasis
        VStack(alignment: .leading, spacing: 10 * scale) {
            Text("みんなの時間")
                .font(.system(size: 10 * scale, weight: .semibold))
                .foregroundStyle(Theme.textSecondary)

            Grid(alignment: .leading, horizontalSpacing: 10 * scale, verticalSpacing: 9 * scale) {
                // 自分の行
                if let remainingYears = store.remainingYears(basis: basis),
                   let percent = store.percentRemaining(basis: basis) {
                    GridRow {
                        HStack(spacing: 5) {
                            Circle().fill(Theme.accentGradient)
                                .frame(width: 7 * scale, height: 7 * scale)
                            Text("自分")
                                .font(.system(size: 12 * scale, weight: .semibold))
                                .foregroundStyle(Theme.textPrimary)
                        }
                        MiniBar(percent: percent,
                                color: Theme.urgencyColor(remainingYears: remainingYears),
                                height: 8 * scale)
                            .frame(minWidth: 80 * scale)
                        Text("残り\(Formatters.decimal1(remainingYears))年")
                            .font(.counter(size: 11 * scale, weight: .medium))
                            .foregroundStyle(Theme.textPrimary)
                            .gridColumnAlignment(.trailing)
                    }
                }

                ForEach(people) { person in
                    if let result = store.timeWith(person, basis: basis) {
                        let color = Color(hexString: person.color) ?? Theme.accentBlue
                        GridRow {
                            HStack(spacing: 5) {
                                Circle().fill(color)
                                    .frame(width: 7 * scale, height: 7 * scale)
                                    .shadow(color: color.opacity(0.7), radius: 2)
                                Text(person.name)
                                    .font(.system(size: 12 * scale))
                                    .foregroundStyle(Theme.textPrimary)
                                    .lineLimit(1)
                            }
                            MiniBar(percent: personPercent(result: result, basis: basis),
                                    color: color, height: 8 * scale)
                                .frame(minWidth: 80 * scale)
                            Text("あと\(Formatters.int(result.meetings))回")
                                .font(.counter(size: 11 * scale, weight: .medium))
                                .foregroundStyle(Theme.textPrimary)
                                .gridColumnAlignment(.trailing)
                        }
                    }
                }
            }

            if people.isEmpty {
                Text("⚙ から大切な人を追加してください")
                    .font(.system(size: 10 * scale))
                    .foregroundStyle(Theme.textSecondary)
            }
        }
        .padding(16 * scale)
        .frame(width: 300 * scale)
    }

    private func personPercent(result: TimeWithPersonResult, basis: CalculationBasis) -> Double {
        guard let age = result.personAge else { return 0 }
        let le = CountryData.expectancy(country: store.state.user.country, basis: basis)
        return LifeMath.percentRemaining(age: age, expectancy: le)
    }
}
