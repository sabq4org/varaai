import SwiftUI

@MainActor
@Observable
final class WorldCupHubViewModel {
    enum State { case loading, loaded, failed(String) }

    var state: State = .loading
    var today: [Match] = []
    var nextMatch: Match?
    var myTeam: TeamFixtures?
    var groups: [StandingRow] = []
    var source = ""

    let competitionId = FavoritesModel.worldCupId
    private let client = VaraClient()

    var liveMatch: Match? { today.first { $0.state == .live } }

    var heroMatch: Match? {
        liveMatch
            ?? today.first { $0.state == .scheduled }
            ?? nextMatch
    }

    func load(favoriteTeamId: String?) async {
        if case .loaded = state {} else { state = .loading }
        do {
            async let todayE = client.competitionMatchDay(competitionId: competitionId)
            async let nextE = client.matches(competitionId: competitionId, status: "next", count: 1)
            async let standE = client.standings(competitionId: competitionId)

            today = try await todayE.data
            nextMatch = try await nextE.data.first
            let stand = try await standE
            groups = stand.data.rows
            source = stand.source

            if let fav = favoriteTeamId {
                myTeam = try? await client.teamFixtures(teamId: fav, competition: competitionId).data
            } else {
                myTeam = nil
            }
            state = .loaded
        } catch {
            state = .failed((error as? LocalizedError)?.errorDescription ?? error.localizedDescription)
        }
    }
}

struct WorldCupHubView: View {
    @Bindable var favorites: FavoritesModel
    @State private var vm = WorldCupHubViewModel()

    var body: some View {
        Group {
            switch vm.state {
            case .loading:
                VStack { Spacer(); ProgressView().tint(Theme.accent); Spacer() }
            case .failed(let msg):
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "wifi.exclamationmark").font(.largeTitle).foregroundStyle(Theme.lose)
                    Text(msg).foregroundStyle(Theme.muted).font(.footnote).multilineTextAlignment(.center)
                    Button("إعادة المحاولة") { Task { await vm.load(favoriteTeamId: favorites.teamId) } }
                        .buttonStyle(.borderedProminent).tint(Theme.accentDim)
                    Spacer()
                }.padding(32)
            case .loaded:
                loaded
            }
        }
        .task(id: favorites.teamId) { await vm.load(favoriteTeamId: favorites.teamId) }
    }

    private var loaded: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let hero = vm.heroMatch {
                    HeroMatchCard(match: hero)
                }
                if let mine = vm.myTeam {
                    MyTeamCard(data: mine, isFavorite: true)
                } else {
                    pickFavoritePrompt
                }
                sectionGrid
                if !vm.today.isEmpty {
                    todaySection
                }
            }
            .padding(.horizontal, 16).padding(.bottom, 16)
        }
    }

    private var pickFavoritePrompt: some View {
        Button {
            favorites.didOnboard = false
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "star.circle.fill").font(.title2).foregroundStyle(Theme.accent)
                VStack(alignment: .leading, spacing: 2) {
                    Text("اختر منتخبك المفضّل").font(.subheadline.weight(.bold)).foregroundStyle(Theme.text)
                    Text("لمتابعة مبارياته ومركزه في المجموعة").font(.caption).foregroundStyle(Theme.muted)
                }
                Spacer()
                Image(systemName: "chevron.left").font(.caption.weight(.bold)).foregroundStyle(Theme.muted)
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 16).fill(Theme.surface))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.accentDim, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var sectionGrid: some View {
        HStack(spacing: 10) {
            NavigationLink {
                GroupsScreen(rows: vm.groups)
            } label: { HubTile(icon: "rectangle.3.group.fill", title: "المجموعات") }
                .buttonStyle(.plain)

            NavigationLink {
                BracketView(competitionId: vm.competitionId)
            } label: { HubTile(icon: "trophy.fill", title: "الأدوار") }
                .buttonStyle(.plain)

            NavigationLink {
                ScorersView(competitionId: vm.competitionId)
            } label: { HubTile(icon: "soccerball", title: "الهدّافون") }
                .buttonStyle(.plain)
        }
    }

    private var todaySection: some View {
        VStack(spacing: 0) {
            HStack {
                Text("مباريات اليوم").font(.subheadline.weight(.heavy)).foregroundStyle(Theme.text)
                Spacer()
            }
            .padding(.horizontal, 14).padding(.top, 12).padding(.bottom, 8)

            ForEach(vm.today) { match in
                NavigationLink(value: match) { HubMatchRow(match: match) }
                    .buttonStyle(.plain)
                if match.id != vm.today.last?.id {
                    Divider().overlay(Theme.line).padding(.horizontal, 12)
                }
            }
            .padding(.bottom, 4)
        }
        .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
    }
}

// ——— Hero (live or next match) ———

private struct HeroMatchCard: View {
    let match: Match

    private var isLive: Bool { match.state == .live }

    var body: some View {
        NavigationLink(value: match) {
            VStack(spacing: 14) {
                HStack {
                    statusPill
                    Spacer()
                    if let round = match.round { Text("الجولة \(round)").font(.caption2).foregroundStyle(Theme.muted) }
                }
                HStack(spacing: 12) {
                    teamColumn(match.home)
                    centerScore
                    teamColumn(match.away)
                }
                follow
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 22)
                    .fill(LinearGradient(colors: isLive ? [Color(hex: 0x16242E), Color(hex: 0x0E1A1F)] : [Theme.surface, Theme.surface2],
                                         startPoint: .top, endPoint: .bottom))
            )
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(isLive ? Theme.lose.opacity(0.5) : Theme.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var statusPill: some View {
        HStack(spacing: 6) {
            if isLive {
                Circle().fill(Theme.lose).frame(width: 8, height: 8)
                TimelineView(.periodic(from: .now, by: 1)) { _ in
                    Text(match.currentMinute.map { "مباشر · \($0)′" } ?? "مباشر")
                        .font(.caption2.weight(.bold)).foregroundStyle(Theme.lose)
                }
            } else {
                Image(systemName: "clock.fill").font(.caption2).foregroundStyle(Theme.accent)
                Text("المباراة القادمة").font(.caption2.weight(.bold)).foregroundStyle(Theme.accent)
            }
        }
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(Capsule().fill(Theme.bg.opacity(0.5)))
    }

    private func teamColumn(_ s: MatchSide) -> some View {
        VStack(spacing: 8) {
            AsyncImageLogo(url: s.team.logo, size: 50)
            Text(s.team.name).font(.subheadline.weight(.bold)).foregroundStyle(Theme.text)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private var centerScore: some View {
        if match.state == .scheduled {
            VStack(spacing: 4) {
                Text(kickoff).font(.title2.weight(.heavy)).foregroundStyle(Theme.text)
                    .environment(\.layoutDirection, .leftToRight)
                Text(dayLabel).font(.caption2).foregroundStyle(Theme.muted)
            }
        } else {
            Text("\(score(match.away.score)) : \(score(match.home.score))")
                .font(.system(size: 34, weight: .heavy))
                .environment(\.layoutDirection, .leftToRight)
                .foregroundStyle(isLive ? Theme.accent : Theme.text)
        }
    }

    @ViewBuilder
    private var follow: some View {
        if isLive {
            HStack(spacing: 6) {
                Image(systemName: "dot.radiowaves.left.and.right")
                Text("تابِع مباشرة")
            }
            .font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: 0x08110D))
            .frame(maxWidth: .infinity).padding(.vertical, 10)
            .background(Capsule().fill(Theme.accent))
        }
    }

    private func score(_ s: Int?) -> String { s.map(String.init) ?? "-" }

    private var parsed: Date? {
        let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return iso.date(from: match.startTime) ?? ISO8601DateFormatter().date(from: match.startTime)
    }
    private var kickoff: String {
        guard let d = parsed else { return "—" }
        let f = DateFormatter(); f.locale = Locale(identifier: "ar"); f.timeStyle = .short; f.dateStyle = .none
        return f.string(from: d)
    }
    private var dayLabel: String {
        guard let d = parsed else { return "" }
        let f = DateFormatter(); f.locale = Locale(identifier: "ar"); f.dateFormat = "EEEE d MMM"
        return f.string(from: d)
    }
}

// ——— My team card ———

private struct MyTeamCard: View {
    let data: TeamFixtures
    let isFavorite: Bool

    private var nextFixture: Match? { data.fixtures.first { $0.state == .scheduled || $0.state == .live } }
    private var lastResult: Match? { data.fixtures.last { $0.state == .finished } }

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                AsyncImageLogo(url: data.team.logo, size: 34)
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: 5) {
                        Image(systemName: "star.fill").font(.caption2).foregroundStyle(Theme.draw)
                        Text("منتخبي").font(.caption2.weight(.bold)).foregroundStyle(Theme.muted)
                    }
                    Text(data.team.name).font(.headline).foregroundStyle(Theme.text)
                }
                Spacer()
                if let group = data.group, let rank = data.rank {
                    VStack(spacing: 1) {
                        Text(group).font(.caption2).foregroundStyle(Theme.muted)
                        Text("المركز \(rank)").font(.subheadline.weight(.heavy)).foregroundStyle(Theme.accent)
                    }
                }
            }
            if let next = nextFixture {
                infoLine(icon: "calendar", label: next.state == .live ? "الآن مباشرة" : "القادمة",
                         text: "\(next.home.team.name) × \(next.away.team.name)")
            }
            if let last = lastResult {
                infoLine(icon: "checkmark.seal", label: "آخر نتيجة",
                         text: "\(last.home.team.name) \(scoreStr(last)) \(last.away.team.name)")
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.draw.opacity(0.35), lineWidth: 1))
    }

    private func infoLine(icon: String, label: String, text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.caption).foregroundStyle(Theme.accent).frame(width: 18)
            Text(label).font(.caption).foregroundStyle(Theme.muted)
            Spacer()
            Text(text).font(.caption.weight(.semibold)).foregroundStyle(Theme.text)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
    }

    private func scoreStr(_ m: Match) -> String {
        "\(m.away.score.map(String.init) ?? "-") : \(m.home.score.map(String.init) ?? "-")"
    }
}

// ——— Reusable bits ———

private struct HubTile: View {
    let icon: String
    let title: String
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.title3).foregroundStyle(Theme.accent)
            Text(title).font(.caption.weight(.bold)).foregroundStyle(Theme.text)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 16)
        .background(RoundedRectangle(cornerRadius: 16).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line, lineWidth: 1))
    }
}

struct HubMatchRow: View {
    let match: Match
    var body: some View {
        HStack(spacing: 8) {
            sideView(match.home, alignment: .trailing)
            box
            sideView(match.away, alignment: .leading)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .contentShape(Rectangle())
    }
    private func sideView(_ s: MatchSide, alignment: HorizontalAlignment) -> some View {
        HStack(spacing: 8) {
            if alignment == .leading { AsyncImageLogo(url: s.team.logo, size: 24) }
            Text(s.team.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.text)
                .lineLimit(1).minimumScaleFactor(0.8)
                .multilineTextAlignment(alignment == .trailing ? .trailing : .leading)
            if alignment == .trailing { AsyncImageLogo(url: s.team.logo, size: 24) }
        }
        .frame(maxWidth: .infinity, alignment: alignment == .trailing ? .trailing : .leading)
    }
    @ViewBuilder private var box: some View {
        VStack(spacing: 2) {
            if match.state == .scheduled {
                Text(kickoff).font(.system(.subheadline, weight: .heavy)).foregroundStyle(Theme.text)
                    .environment(\.layoutDirection, .leftToRight)
            } else {
                Text("\(s(match.away.score)) : \(s(match.home.score))")
                    .font(.system(.title3, weight: .heavy)).environment(\.layoutDirection, .leftToRight)
                    .foregroundStyle(match.state == .live ? Theme.accent : Theme.text)
            }
            Text(badge).font(.system(size: 9, weight: .bold))
                .foregroundStyle(match.state == .live ? Theme.lose : Theme.muted)
        }
        .frame(minWidth: 64).padding(.vertical, 5).padding(.horizontal, 8)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface2))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(match.state == .live ? Theme.lose.opacity(0.5) : Theme.line, lineWidth: 1))
    }
    private func s(_ v: Int?) -> String { v.map(String.init) ?? "-" }
    private var badge: String {
        switch match.state {
        case .live: return match.currentMinute.map { "\($0)′" } ?? "مباشر"
        case .finished: return "انتهت"
        case .scheduled: return "بدء"
        default: return ""
        }
    }
    private var kickoff: String {
        let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let d = iso.date(from: match.startTime) ?? ISO8601DateFormatter().date(from: match.startTime) else { return "—" }
        let f = DateFormatter(); f.locale = Locale(identifier: "ar"); f.timeStyle = .short; f.dateStyle = .none
        return f.string(from: d)
    }
}

/// Groups screen reusing the grouped StandingsView.
struct GroupsScreen: View {
    let rows: [StandingRow]
    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            if rows.isEmpty {
                Text("لا توجد مجموعات").foregroundStyle(Theme.muted)
            } else {
                StandingsView(rows: rows)
            }
        }
        .navigationTitle("المجموعات")
        .navigationBarTitleDisplayMode(.inline)
    }
}
