import SwiftUI

/// Web のガラスモーフィズムカード。透明パネル内では .ultraThinMaterial が
/// デスクトップ背景をボカして透けさせる（NSPanel 側は hasShadow=false、影はここで描く）。
struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = Theme.radiusLG
    @ViewBuilder var content: () -> Content

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        content()
            .background {
                shape
                    .fill(.ultraThinMaterial)
                    .overlay(shape.fill(Theme.bg.opacity(0.55)))
            }
            .overlay(shape.strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
            .clipShape(shape)
            .shadow(color: .black.opacity(0.45), radius: 16, y: 6)
    }
}
