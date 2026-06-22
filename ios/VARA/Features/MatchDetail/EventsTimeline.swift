import SwiftUI

struct EventsTimeline: View {
    let events: [MatchEvent]
    let homeTeam: Team
    let awayTeam: Team

    // Newest first: descending by minute (+ stoppage), keeping server order for ties.
    private var ordered: [MatchEvent] {
        events.enumerated()
            .sorted { lhs, rhs in
                let lk = lhs.element.minute * 100 + (lhs.element.extraMinute ?? 0)
                let rk = rhs.element.minute * 100 + (rhs.element.extraMinute ?? 0)
                if lk != rk { return lk > rk }
                return lhs.offset < rhs.offset
            }
            .map(\.element)
    }

    var body: some View {
        if events.isEmpty {
            Text("لا توجد أحداث").foregroundStyle(Theme.muted).padding(.top, 30)
        } else {
            VStack(spacing: 0) {
                ForEach(Array(ordered.enumerated()), id: \.element.id) { index, event in
                    EventRow(
                        event: event,
                        team: event.side == .home ? homeTeam : awayTeam,
                        isFirst: index == 0,
                        isLast: index == ordered.count - 1
                    )
                }
            }
            .padding(.vertical, 4)
        }
    }
}

private struct EventRow: View {
    let event: MatchEvent
    let team: Team
    let isFirst: Bool
    let isLast: Bool

    var body: some View {
        HStack(spacing: 12) {
            Text(minuteText)
                .font(.caption.weight(.heavy))
                .foregroundStyle(event.isVar ? Theme.draw : Theme.accent)
                .frame(width: 38)

            rail

            VStack(alignment: .leading, spacing: 2) {
                if let player = event.player {
                    Text(player)
                        .font(.subheadline.weight(event.type == .goal ? .bold : .semibold))
                        .foregroundStyle(Theme.text)
                        .lineLimit(1)
                }
                HStack(spacing: 6) {
                    if event.isVar {
                        Text("لقطة VARA")
                            .font(.system(size: 9, weight: .black))
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(Capsule().fill(Theme.draw))
                            .foregroundStyle(Color(hex: 0x08110D))
                    }
                    Text(arabicDetail)
                        .font(.caption2)
                        .foregroundStyle(event.isVar ? Theme.draw : Theme.muted)
                }
                if let assist = event.assist, event.type == .goal {
                    Text("صناعة: \(assist)").font(.caption2).foregroundStyle(Theme.muted)
                }
            }

            Spacer(minLength: 8)

            AsyncImageLogo(url: team.logo, size: 22)
        }
        .padding(.vertical, 9)
    }

    // Continuous vertical rail with the event icon centered on it.
    private var rail: some View {
        ZStack {
            VStack(spacing: 0) {
                Rectangle().fill(isFirst ? .clear : Theme.line).frame(width: 2)
                Rectangle().fill(isLast ? .clear : Theme.line).frame(width: 2)
            }
            icon
        }
        .frame(width: 32)
        .frame(maxHeight: .infinity)
    }

    private var icon: some View {
        ZStack {
            Circle().fill(iconBg).frame(width: 30, height: 30)
            Circle().stroke(Theme.bg, lineWidth: 3).frame(width: 30, height: 30)
            if event.isVar {
                Text("VAR").font(.system(size: 8, weight: .black)).foregroundStyle(Color(hex: 0x08110D))
            } else {
                Image(systemName: iconName).font(.system(size: 13, weight: .bold)).foregroundStyle(iconColor)
            }
        }
    }

    private var minuteText: String {
        if let extra = event.extraMinute, extra > 0 { return "\(event.minute)+\(extra)′" }
        return "\(event.minute)′"
    }

    private var iconName: String {
        switch event.type {
        case .goal: return "soccerball"
        case .card: return "rectangle.portrait.fill"
        case .subst: return "arrow.left.arrow.right"
        default: return "circle.fill"
        }
    }

    private var iconColor: Color {
        switch event.type {
        case .goal: return Theme.accent
        case .card: return event.detail.lowercased().contains("red") ? .white : Color(hex: 0x08110D)
        case .subst: return Theme.text
        default: return Theme.muted
        }
    }

    private var iconBg: Color {
        if event.isVar { return Theme.draw }
        switch event.type {
        case .goal: return Theme.surface2
        case .card: return event.detail.lowercased().contains("red") ? Theme.lose : Theme.draw
        default: return Theme.surface2
        }
    }

    private var arabicDetail: String {
        let d = event.detail.lowercased()
        if d.contains("penalty") && d.contains("confirm") { return "تأكيد ركلة جزاء" }
        if d.contains("goal") && d.contains("disallow") { return "إلغاء هدف" }
        if d.contains("penalty") && d.contains("cancel") { return "إلغاء ركلة جزاء" }
        if d.contains("missed penalty") { return "إهدار ركلة جزاء" }
        if d.contains("penalty") { return event.type == .goal ? "هدف من ركلة جزاء" : "ركلة جزاء" }
        if d.contains("own goal") { return "هدف عكسي" }
        if d.contains("normal goal") { return "هدف" }
        if d.contains("yellow") { return "بطاقة صفراء" }
        if d.contains("red") { return "بطاقة حمراء" }
        if d.contains("subst") { return "تبديل" }
        if event.type == .goal { return "هدف" }
        if event.type == .subst { return "تبديل" }
        return event.detail
    }
}
