import SwiftUI

struct LineupsSection: View {
    let lineups: Lineups
    let match: Match

    var body: some View {
        if lineups.home == nil && lineups.away == nil {
            Text("التشكيلة غير متاحة").foregroundStyle(Theme.muted).padding(.top, 30)
        } else {
            VStack(spacing: 16) {
                if let home = lineups.home {
                    TeamLineupCard(lineup: home, team: match.home.team)
                }
                if let away = lineups.away {
                    TeamLineupCard(lineup: away, team: match.away.team)
                }
            }
        }
    }
}

private struct TeamLineupCard: View {
    let lineup: Lineup
    let team: Team

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                AsyncImageLogo(url: team.logo, size: 28)
                Text(team.name).font(.headline).foregroundStyle(Theme.text)
                Spacer()
                if let f = lineup.formation {
                    Text(f).font(.caption.weight(.bold)).foregroundStyle(Theme.accent)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Capsule().fill(Theme.surface2))
                }
            }
            ForEach(lineup.startXI) { p in
                PlayerRow(player: p, highlight: true)
            }
            if !lineup.substitutes.isEmpty {
                Text("البدلاء").font(.caption.weight(.bold)).foregroundStyle(Theme.muted).padding(.top, 4)
                ForEach(lineup.substitutes) { p in
                    PlayerRow(player: p, highlight: false)
                }
            }
            if let coach = lineup.coach {
                Divider().overlay(Theme.line)
                Label(coach, systemImage: "person.fill").font(.caption).foregroundStyle(Theme.muted)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
    }
}

private struct PlayerRow: View {
    let player: LineupPlayer
    let highlight: Bool

    var body: some View {
        HStack(spacing: 12) {
            Text(player.number.map(String.init) ?? "–")
                .font(.caption.weight(.heavy))
                .frame(width: 26, height: 26)
                .background(RoundedRectangle(cornerRadius: 7).fill(highlight ? Theme.accentDim : Theme.surface2))
                .foregroundStyle(highlight ? Color(hex: 0xD8FFF3) : Theme.muted)
            Text(player.name).font(.subheadline).foregroundStyle(Theme.text)
            Spacer()
            if let pos = player.pos {
                Text(pos).font(.caption2.weight(.semibold)).foregroundStyle(Theme.muted)
            }
        }
    }
}
