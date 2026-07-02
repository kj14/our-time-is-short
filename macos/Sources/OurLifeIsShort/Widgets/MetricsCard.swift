import SwiftUI

/// 人生 / 健康 / 仕事 の3基準を並べるカード（行ごとに表示トグル可能）
struct MetricsCard: View {
    @Environment(AppStore.self) private var store
    let config: WidgetConfig

    private var scale: CGFloat { config.sizeClass.scale }

    private var enabledBases: [CalculationBasis] {
        var result: [CalculationBasis] = []
        if config.showLife { result.append(.life) }
        if config.showHealthy { result.append(.healthy) }
        if config.showWorking { result.append(.working) }
        return result
    }

    var body: some View {
        if store.hasProfile {
            VStack(alignment: .leading, spacing: 10 * scale) {
                Text("残り時間")
                    .font(.system(size: 10 * scale, weight: .semibold))
                    .foregroundStyle(Theme.textSecondary)
                Grid(alignment: .leading, horizontalSpacing: 10 * scale, verticalSpacing: 9 * scale) {
                    ForEach(enabledBases, id: \.self) { basis in
                        row(basis)
                    }
                }
            }
            .padding(16 * scale)
            .frame(width: 280 * scale)
        } else {
            Text("⚙ から生年月日を設定してください")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textSecondary)
                .padding(20)
        }
    }

    @ViewBuilder
    private func row(_ basis: CalculationBasis) -> some View {
        let remainingYears = store.remainingYears(basis: basis) ?? 0
        let percent = store.percentRemaining(basis: basis) ?? 0
        let color = Theme.urgencyColor(remainingYears: remainingYears)
        GridRow {
            Text(L10n.basis(basis))
                .font(.system(size: 12 * scale, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
                .frame(width: 34 * scale, alignment: .leading)
            MiniBar(percent: percent, color: color, height: 9 * scale)
                .frame(minWidth: 90 * scale)
            Text("\(Formatters.decimal1(remainingYears))年")
                .font(.counter(size: 12 * scale, weight: .medium))
                .foregroundStyle(Theme.textPrimary)
                .gridColumnAlignment(.trailing)
            Text("\(Formatters.percent1(percent))%")
                .font(.counter(size: 11 * scale, weight: .regular))
                .foregroundStyle(Theme.textSecondary)
                .gridColumnAlignment(.trailing)
        }
    }
}
