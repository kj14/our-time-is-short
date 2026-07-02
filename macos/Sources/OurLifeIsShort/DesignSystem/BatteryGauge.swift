import SwiftUI

/// Web の EnergyTank（横型）を移植した電池ゲージ。
/// Mac のメニューバー電池風: 角丸外枠 + 右端子 + グラデーション塗り + シマー。
struct BatteryGauge: View {
    var percent: Double // 残り% 0-100
    var color: Color
    var height: CGFloat = 44
    var showPercentText = true
    var shimmer = true

    private var clamped: Double { min(100, max(0, percent)) }

    var body: some View {
        HStack(spacing: 2) {
            GeometryReader { geo in
                let fillWidth = geo.size.width * clamped / 100
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: height * 0.22, style: .continuous)
                        .fill(Color.white.opacity(0.04))
                    RoundedRectangle(cornerRadius: height * 0.16, style: .continuous)
                        .fill(LinearGradient(
                            colors: [color, color.opacity(0.87), color.opacity(0.67)],
                            startPoint: .leading, endPoint: .trailing
                        ))
                        .frame(width: max(height * 0.3, fillWidth))
                        .overlay {
                            if shimmer {
                                ShimmerOverlay()
                                    .clipShape(RoundedRectangle(cornerRadius: height * 0.16, style: .continuous))
                            }
                        }
                        .shadow(color: color.opacity(0.45), radius: 6)
                        .padding(2)
                    if showPercentText {
                        Text("\(Formatters.percent1(clamped))%")
                            .font(.system(size: height * 0.36, weight: .bold, design: .monospaced))
                            .foregroundStyle(Theme.textPrimary)
                            .shadow(color: .black.opacity(0.6), radius: 2)
                            .frame(maxWidth: .infinity)
                    }
                }
                .overlay(
                    RoundedRectangle(cornerRadius: height * 0.22, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.3), lineWidth: 1.5)
                )
            }
            .frame(height: height)

            // 端子キャップ
            RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                .fill(Color.white.opacity(0.3))
                .frame(width: 4, height: height * 0.4)
        }
    }
}

/// 3.5秒周期で流れる白ハイライト（Web の shimmer keyframes 相当）。
/// SwiftUI の offset アニメーションは毎フレーム AttributeGraph を回して CPU を食うため、
/// Core Animation（レンダーサーバー駆動・アプリCPUほぼゼロ）で実装する。
struct ShimmerOverlay: NSViewRepresentable {
    func makeNSView(context: Context) -> ShimmerNSView { ShimmerNSView() }
    func updateNSView(_ nsView: ShimmerNSView, context: Context) {}
}

final class ShimmerNSView: NSView {
    private let gradient = CAGradientLayer()
    private var lastWidth: CGFloat = -1

    override init(frame: NSRect) {
        super.init(frame: frame)
        wantsLayer = true
        gradient.colors = [
            NSColor.white.withAlphaComponent(0).cgColor,
            NSColor.white.withAlphaComponent(0.22).cgColor,
            NSColor.white.withAlphaComponent(0).cgColor,
        ]
        gradient.startPoint = CGPoint(x: 0, y: 0.5)
        gradient.endPoint = CGPoint(x: 1, y: 0.5)
        layer?.masksToBounds = true
        layer?.addSublayer(gradient)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override var isFlipped: Bool { true }

    override func hitTest(_ point: NSPoint) -> NSView? { nil }

    override func layout() {
        super.layout()
        let w = bounds.width
        let bandWidth = max(w * 0.5, 24)
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        gradient.frame = CGRect(x: 0, y: 0, width: bandWidth, height: bounds.height)
        CATransaction.commit()
        // アニメーションの再起動は幅が実際に変わったときだけ
        //（layout は頻繁に呼ばれるため、毎回リスタートすると位相が飛ぶ）
        if w != lastWidth, w > 0 {
            lastWidth = w
            restartAnimation(totalWidth: w, bandWidth: bandWidth)
        }
    }

    private func restartAnimation(totalWidth: CGFloat, bandWidth: CGFloat) {
        gradient.removeAnimation(forKey: "shimmer")
        guard totalWidth > 0 else { return }
        let anim = CABasicAnimation(keyPath: "transform.translation.x")
        anim.fromValue = -bandWidth
        anim.toValue = totalWidth
        anim.duration = 3.5
        anim.repeatCount = .infinity
        gradient.add(anim, forKey: "shimmer")
    }
}

/// MetricsCard / ComparisonCard 用の細いミニバー
struct MiniBar: View {
    var percent: Double
    var color: Color
    var height: CGFloat = 8

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.07))
                Capsule()
                    .fill(LinearGradient(
                        colors: [color, color.opacity(0.7)],
                        startPoint: .leading, endPoint: .trailing
                    ))
                    .frame(width: max(height, geo.size.width * min(100, max(0, percent)) / 100))
                    .shadow(color: color.opacity(0.4), radius: 3)
            }
        }
        .frame(height: height)
    }
}
