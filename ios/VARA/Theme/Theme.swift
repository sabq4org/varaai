import SwiftUI

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}

enum Theme {
    static let bg = Color(hex: 0x0A0E14)
    static let surface = Color(hex: 0x121821)
    static let surface2 = Color(hex: 0x1A222E)
    static let line = Color(hex: 0x232C3A)
    static let text = Color(hex: 0xEAF0F7)
    static let muted = Color(hex: 0x8B97A8)
    static let accent = Color(hex: 0x00E0A4)
    static let accentDim = Color(hex: 0x0C6B54)
    static let win = Color(hex: 0x00E0A4)
    static let draw = Color(hex: 0xC9A227)
    static let lose = Color(hex: 0xFF5D6C)

    static func formColor(_ ch: Character) -> Color {
        switch ch {
        case "W": return win
        case "D": return draw
        case "L": return lose
        default: return muted
        }
    }
}
