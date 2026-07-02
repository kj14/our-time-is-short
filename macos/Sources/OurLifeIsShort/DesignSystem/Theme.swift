import SwiftUI

// Web版 src/index.css のデザイントークンを 1:1 移植

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 8) & 0xff) / 255,
            blue: Double(hex & 0xff) / 255,
            opacity: opacity
        )
    }
}

enum Theme {
    // 基本色
    static let bg = Color(hex: 0x050505)
    static let surface = Color.white.opacity(0.03)
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.6)

    // アクセント
    static let accentBlue = Color(hex: 0x60a5fa)
    static let accentPurple = Color(hex: 0xa78bfa)
    static let accentGradient = LinearGradient(
        colors: [accentBlue, accentPurple],
        startPoint: .topLeading, endPoint: .bottomTrailing // CSS 135deg 相当
    )
    static let glow = Color(hex: 0x3b82f6).opacity(0.5)

    // 緊急色（Web Visualization.tsx: 残り年数 <10 赤 / <30 琥珀 / それ以外 シアン）
    static let urgent = Color(hex: 0xef4444)
    static let warn = Color(hex: 0xeab308)
    static let calm = Color(hex: 0x06b6d4)

    static func urgencyColor(remainingYears: Double) -> Color {
        if remainingYears < 10 { return urgent }
        if remainingYears < 30 { return warn }
        return calm
    }

    // 角丸
    static let radiusSM: CGFloat = 8
    static let radiusMD: CGFloat = 12
    static let radiusLG: CGFloat = 20
    static let radiusXL: CGFloat = 32
}

extension Font {
    /// カウントダウン数字用モノスペース（Web の JetBrains Mono 相当 → SF Mono）
    static func counter(size: CGFloat, weight: Font.Weight = .light) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}
