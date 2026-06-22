import SwiftUI

struct ResultsView: View {
    let matches: [Match]

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(matches) { match in
                    NavigationLink(value: match) {
                        MatchRowView(match: match)
                    }
                    .buttonStyle(.plain)
                    if match.id != matches.last?.id {
                        Divider().overlay(Theme.line)
                    }
                }
            }
            .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
            .padding(.horizontal, 16)
        }
    }
}

private struct MatchRowView: View {
    let match: Match

    var body: some View {
        HStack(spacing: 10) {
            side(match.home, alignment: .trailing)
            scoreBox
            side(match.away, alignment: .leading)
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
    }

    private func side(_ s: MatchSide, alignment: HorizontalAlignment) -> some View {
        HStack(spacing: 10) {
            if alignment == .leading { AsyncImageLogo(url: s.team.logo, size: 26) }
            Text(s.team.name)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.text)
                .lineLimit(1)
                .multilineTextAlignment(alignment == .trailing ? .trailing : .leading)
            if alignment == .trailing { AsyncImageLogo(url: s.team.logo, size: 26) }
        }
        .frame(maxWidth: .infinity, alignment: alignment == .trailing ? .trailing : .leading)
    }

    private var scoreBox: some View {
        VStack(spacing: 2) {
            // Home is on the right in RTL, so render "away : home" (forced LTR)
            // to keep each score next to its team.
            Text("\(scoreText(match.away.score)) : \(scoreText(match.home.score))")
                .font(.system(.title3, weight: .heavy))
                .environment(\.layoutDirection, .leftToRight)
                .foregroundStyle(match.state == .live ? Theme.accent : Theme.text)
            Text(badgeText)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(match.state == .live ? Theme.lose : Theme.muted)
        }
        .frame(minWidth: 76)
        .padding(.vertical, 6).padding(.horizontal, 8)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface2))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line, lineWidth: 1))
    }

    private func scoreText(_ score: Int?) -> String { score.map(String.init) ?? "-" }

    private var badgeText: String {
        switch match.state {
        case .live: return match.minute.map { "\($0)′" } ?? "مباشر"
        case .finished: return formattedDate
        case .scheduled: return formattedDate
        default: return match.state.rawValue
        }
    }

    private var formattedDate: String {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = iso.date(from: match.startTime)
            ?? ISO8601DateFormatter().date(from: match.startTime)
        guard let date else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ar")
        f.dateFormat = "d MMM"
        return f.string(from: date)
    }
}
