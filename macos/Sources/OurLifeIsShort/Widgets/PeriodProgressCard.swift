import SwiftUI

/// 今日 / 今年 / カスタム期間のプログレスカード（1秒tick）
struct PeriodProgressCard: View {
    @Environment(AppStore.self) private var store
    @Environment(TickerGate.self) private var gate
    @Environment(PanelContext.self) private var panel
    let config: WidgetConfig

    private var scale: CGFloat { config.sizeClass.scale }

    private var kind: PeriodKind {
        switch config.kind {
        case .dayProgress: return .day
        case .yearProgress: return .year
        default: return config.period ?? .day
        }
    }

    private var title: String {
        switch kind {
        case .day: return "今日"
        case .year: return "今年"
        case .custom(_, _, let label): return label
        }
    }

    var body: some View {
        let paused = gate.isPaused || panel.isOccluded
        TimelineView(.animation(minimumInterval: 1.0, paused: paused)) { ctx in
            let s = Periods.snapshot(kind, now: ctx.date)
            VStack(alignment: .leading, spacing: 7 * scale) {
                HStack(alignment: .firstTextBaseline) {
                    Text(title)
                        .font(.system(size: 12 * scale, weight: .semibold))
                        .foregroundStyle(Theme.textPrimary)
                    Spacer()
                    Text("\(Formatters.percent1(s.fraction * 100))%")
                        .font(.counter(size: 20 * scale, weight: .light))
                        .foregroundStyle(Theme.accentBlue)
                        .shadow(color: Theme.accentBlue.opacity(0.5), radius: 6)
                    Text("経過")
                        .font(.system(size: 10 * scale))
                        .foregroundStyle(Theme.textSecondary)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.07))
                        Capsule()
                            .fill(Theme.accentGradient)
                            .frame(width: max(8, geo.size.width * s.fraction))
                            .shadow(color: Theme.accentBlue.opacity(0.4), radius: 4)
                    }
                }
                .frame(height: 8 * scale)
                Text("残り \(Formatters.shortDuration(s.remaining))")
                    .font(.system(size: 11 * scale))
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(16 * scale)
            .frame(width: 230 * scale)
        }
    }
}
