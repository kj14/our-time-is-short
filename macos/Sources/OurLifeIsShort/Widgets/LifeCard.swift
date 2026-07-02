import SwiftUI

/// 自分の人生カード。表示モード:
///  countdown — 残り○日○時間○分 / ○秒.cc がコンマ秒まで流れる
///  battery   — 人生の残り電池（% + ゲージ）
///  compact   — 1行ミニ表示
///
/// パフォーマンス設計: 高速 tick（30fps）は「秒.cc」のテキストだけに限定する。
/// カード全体（ガラス材質・影・ヘッダ）を毎フレーム再描画すると CPU が跳ね上がる。
struct LifeCard: View {
    @Environment(AppStore.self) private var store
    @Environment(TickerGate.self) private var gate
    @Environment(PanelContext.self) private var panel
    let config: WidgetConfig

    private var basis: CalculationBasis { config.basisOverride ?? store.state.calculationBasis }
    private var scale: CGFloat { config.sizeClass.scale }

    var body: some View {
        if let deadline = store.deadline(basis: basis),
           let remainingYears = store.remainingYears(basis: basis),
           let percent = store.percentRemaining(basis: basis) {
            let color = Theme.urgencyColor(remainingYears: remainingYears)
            let paused = gate.isPaused || panel.isOccluded

            Group {
                switch config.displayMode {
                case .countdown:
                    countdown(deadline: deadline, color: color, paused: paused)
                case .battery:
                    battery(percent: percent, remainingYears: remainingYears, color: color)
                case .compact:
                    compact(deadline: deadline, color: color)
                }
            }
            .padding(16 * scale)
        } else {
            VStack(spacing: 6) {
                Text("Our Time Is Short")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.textPrimary)
                Text("⚙ から生年月日を設定してください")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(20)
        }
    }

    // MARK: countdown

    private func countdown(deadline: Date, color: Color, paused: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4 * scale) {
            header

            // 日・時間・分は1分に1回しか変わらない → 1秒周期で十分
            TimelineView(.periodic(from: .now, by: 1)) { ctx in
                let c = LifeMath.components(remaining: max(0, deadline.timeIntervalSince(ctx.date)))
                HStack(alignment: .firstTextBaseline, spacing: 3 * scale) {
                    Text("残り")
                        .font(.system(size: 11 * scale))
                        .foregroundStyle(Theme.textSecondary)
                    unitNumber(Formatters.int(c.days), "日")
                    unitNumber(String(c.hours), "時間")
                    unitNumber(String(c.minutes), "分")
                }
            }

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                SecondsTicker(
                    deadline: deadline,
                    paused: paused,
                    lowPower: store.state.lowPowerMode,
                    size: 42 * scale,
                    color: color
                )
                Text("秒")
                    .font(.system(size: 12 * scale))
                    .foregroundStyle(Theme.textSecondary)
            }
            // グローは静的レイヤーで描く。ticking テキストに .shadow を掛けると
            // 毎フレームぼかしが再計算されて CPU が跳ね上がる。
            .background {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(color.opacity(0.16))
                    .blur(radius: 16)
                    .padding(-6)
            }
        }
    }

    private func unitNumber(_ value: String, _ unit: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 1) {
            Text(value)
                .font(.counter(size: 19 * scale, weight: .regular))
                .foregroundStyle(Theme.textPrimary)
            Text(unit)
                .font(.system(size: 10 * scale))
                .foregroundStyle(Theme.textSecondary)
        }
    }

    // MARK: battery（tick不要 — 1時間ごとに再計算するだけ）

    private func battery(percent: Double, remainingYears: Double, color: Color) -> some View {
        TimelineView(.periodic(from: .now, by: 3600)) { _ in
            VStack(alignment: .leading, spacing: 8 * scale) {
                header
                BatteryGauge(
                    percent: percent,
                    color: color,
                    height: 42 * scale,
                    shimmer: !store.state.lowPowerMode
                )
                .frame(width: 190 * scale)
                Text("残り約 \(Formatters.decimal1(remainingYears))年")
                    .font(.system(size: 11 * scale))
                    .foregroundStyle(Theme.textSecondary)
            }
        }
    }

    // MARK: compact（秒までなので1秒周期）

    private func compact(deadline: Date, color: Color) -> some View {
        TimelineView(.periodic(from: .now, by: 1)) { ctx in
            let c = LifeMath.components(remaining: max(0, deadline.timeIntervalSince(ctx.date)))
            HStack(spacing: 6 * scale) {
                Circle()
                    .fill(color)
                    .frame(width: 5 * scale, height: 5 * scale)
                    .shadow(color: color.opacity(0.8), radius: 3)
                Text("\(L10n.basis(basis)) 残り \(Formatters.int(c.days))日 ")
                    .font(.counter(size: 12 * scale, weight: .regular))
                    .foregroundStyle(Theme.textPrimary)
                + Text(String(format: "%02d:%02d:%02d", c.hours, c.minutes, c.seconds))
                    .font(.counter(size: 12 * scale, weight: .regular))
                    .foregroundStyle(Theme.textPrimary)
            }
        }
    }

    private var header: some View {
        HStack(spacing: 5) {
            Text(L10n.basis(basis))
                .font(.system(size: 10 * scale, weight: .semibold))
                .foregroundStyle(Theme.textPrimary.opacity(0.85))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Capsule().fill(Color.white.opacity(0.08)))
            Text("\(L10n.basisLong(basis)) \(Formatters.decimal1(store.expectancy(basis: basis)))年だとしたら")
                .font(.system(size: 10 * scale))
                .foregroundStyle(Theme.textSecondary)
        }
    }
}

/// 「SS.cc」だけを高速更新する最小コンポーネント。
/// SwiftUI の TimelineView(.animation) は 30fps でも毎フレーム AttributeGraph +
/// レイアウトが走って CPU を食うため、CATextLayer を Timer で直接更新する
/// （SwiftUI の diff を完全にバイパス。数%以下の CPU で回る）。
private struct SecondsTicker: NSViewRepresentable {
    let deadline: Date
    let paused: Bool
    let lowPower: Bool
    let size: CGFloat
    let color: Color

    func makeNSView(context: Context) -> SecondsTickerView { SecondsTickerView() }

    func updateNSView(_ view: SecondsTickerView, context: Context) {
        view.configure(
            deadline: deadline,
            paused: paused,
            lowPower: lowPower,
            size: size,
            color: NSColor(color)
        )
    }

    func sizeThatFits(_ proposal: ProposedViewSize, nsView: SecondsTickerView, context: Context) -> CGSize? {
        nsView.intrinsicContentSize
    }
}

final class SecondsTickerView: NSView {
    private let textLayer = CATextLayer()
    private var timer: Timer?
    private var deadline: Date = .distantFuture
    private var paused = false
    private var lowPower = false
    private var size: CGFloat = 42
    private var color: NSColor = .white
    private var cachedSize: CGSize = .zero

    override init(frame: NSRect) {
        super.init(frame: frame)
        wantsLayer = true
        textLayer.actions = ["contents": NSNull()] // 文字更新のフェードを無効化
        textLayer.isWrapped = false
        layer?.addSublayer(textLayer)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    isolated deinit {
        timer?.invalidate()
    }

    override var isFlipped: Bool { true }
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
    override var intrinsicContentSize: NSSize { cachedSize }

    func configure(deadline: Date, paused: Bool, lowPower: Bool, size: CGFloat, color: NSColor) {
        self.deadline = deadline
        self.paused = paused
        self.lowPower = lowPower
        self.color = color
        if self.size != size || cachedSize == .zero {
            self.size = size
            // 桁幅は等幅フォントで一定 → テンプレートで一度だけ測る
            cachedSize = attributedString(seconds: 88, centi: 88).size()
            cachedSize.width = ceil(cachedSize.width) + 2
            cachedSize.height = ceil(cachedSize.height)
            invalidateIntrinsicContentSize()
        }
        render()
        rescheduleTimer()
    }

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        textLayer.contentsScale = window?.backingScaleFactor ?? 2
        rescheduleTimer()
    }

    /// Retina ⇄ 非Retina のモニタ間移動でスケールが変わったとき
    override func viewDidChangeBackingProperties() {
        super.viewDidChangeBackingProperties()
        textLayer.contentsScale = window?.backingScaleFactor ?? 2
    }

    override func layout() {
        super.layout()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        textLayer.frame = bounds
        CATransaction.commit()
    }

    private func rescheduleTimer() {
        timer?.invalidate()
        timer = nil
        guard window != nil, !paused else { return }
        let interval = lowPower ? 1.0 : 1.0 / 30.0
        let t = Timer(timeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.render() }
        }
        t.tolerance = interval * 0.2
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    private func render() {
        let remaining = max(0, deadline.timeIntervalSinceNow)
        let c = LifeMath.components(remaining: remaining)
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        textLayer.string = attributedString(seconds: c.seconds, centi: lowPower ? nil : c.centiseconds)
        CATransaction.commit()
    }

    private func attributedString(seconds: Int, centi: Int?) -> NSAttributedString {
        let big = NSFont.monospacedSystemFont(ofSize: size, weight: .ultraLight)
        let small = NSFont.monospacedSystemFont(ofSize: size * 0.71, weight: .bold)
        let s = NSMutableAttributedString(
            string: String(format: "%02d", seconds),
            attributes: [.font: big, .foregroundColor: color]
        )
        let fracText = centi.map { String(format: ".%02d", $0) } ?? ".--"
        s.append(NSAttributedString(
            string: fracText,
            attributes: [.font: small, .foregroundColor: color]
        ))
        return s
    }
}
