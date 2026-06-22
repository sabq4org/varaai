import SwiftUI

struct RootView: View {
    @State private var vm = LeagueViewModel()
    @State private var app = AppModel()
    @State private var favorites = FavoritesModel()
    @State private var tab: Tab = .today

    private var isWorldCup: Bool { app.activeCompetitionId == FavoritesModel.worldCupId }

    enum Tab: String, CaseIterable {
        case today, standings, results, scorers, clubs
        var title: String {
            switch self {
            case .today: return "اليوم"
            case .standings: return "الترتيب"
            case .results: return "النتائج"
            case .scorers: return "الهدّافون"
            case .clubs: return "الأندية"
            }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                backgroundGradient.ignoresSafeArea()

                VStack(spacing: 0) {
                    BrandHeader(competition: vm.competition, app: app)
                    if isWorldCup {
                        WorldCupHubView(favorites: favorites)
                    } else {
                        segmented
                        content
                    }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Match.self) { match in
                MatchDetailView(matchId: match.id, seed: match)
            }
            .navigationDestination(for: Team.self) { team in
                TeamDetailView(teamId: team.id, seed: team)
            }
            .navigationDestination(for: PlayerRef.self) { player in
                PlayerDetailView(playerId: player.id, seed: player)
            }
        }
        .tint(Theme.accent)
        .task(id: app.activeCompetitionId) { await vm.load(competitionId: app.activeCompetitionId) }
        .fullScreenCover(isPresented: Binding(
            get: { !favorites.didOnboard },
            set: { _ in }
        )) {
            FavoriteTeamPicker(favorites: favorites)
                .environment(\.layoutDirection, .rightToLeft)
        }
    }

    private var backgroundGradient: some View {
        RadialGradient(
            colors: [Color(hex: 0x10202B), Theme.bg],
            center: .topTrailing,
            startRadius: 10,
            endRadius: 600
        )
    }

    private var segmented: some View {
        HStack(spacing: 5) {
            ForEach(Tab.allCases, id: \.self) { t in
                Button {
                    withAnimation(.snappy) { tab = t }
                } label: {
                    Text(t.title)
                        .font(.footnote.weight(.semibold))
                        .lineLimit(1).minimumScaleFactor(0.7)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(tab == t ? Theme.surface2 : Theme.surface)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(tab == t ? Theme.accentDim : Theme.line, lineWidth: 1)
                        )
                        .foregroundStyle(tab == t ? Theme.text : Theme.muted)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.bottom, 14)
    }

    @ViewBuilder
    private var content: some View {
        // Today and the catalog tabs load independently of the active competition.
        switch tab {
        case .today:
            TodayView(competitionId: app.activeCompetitionId)
        case .scorers:
            ScorersView(competitionId: app.activeCompetitionId)
        case .clubs:
            ClubsView(competitionId: app.activeCompetitionId)
        case .standings, .results:
            standingsOrResults
        }
    }

    @ViewBuilder
    private var standingsOrResults: some View {
        switch vm.state {
        case .idle, .loading:
            Spacer()
            ProgressView().tint(Theme.accent)
            Text("جارٍ التحميل…").foregroundStyle(Theme.muted).padding(.top, 8)
            Spacer()
        case .failed(let msg):
            Spacer()
            VStack(spacing: 12) {
                Image(systemName: "wifi.exclamationmark").font(.largeTitle).foregroundStyle(Theme.lose)
                Text("تعذّر الاتصال بـ VARA Edge").foregroundStyle(Theme.text).font(.headline)
                Text(msg).foregroundStyle(Theme.muted).font(.footnote).multilineTextAlignment(.center)
                Button("إعادة المحاولة") { Task { await vm.load(competitionId: app.activeCompetitionId) } }
                    .buttonStyle(.borderedProminent).tint(Theme.accentDim)
            }
            .padding(32)
            Spacer()
        case .loaded:
            if tab == .standings {
                if vm.standings.isEmpty {
                    Spacer()
                    Text("لا يوجد ترتيب لهذه البطولة").foregroundStyle(Theme.muted)
                    Spacer()
                } else {
                    StandingsView(rows: vm.standings)
                }
            } else {
                ResultsView(matches: vm.results)
            }
            SourceFooter(source: vm.source, cached: vm.cached)
        }
    }
}

private struct BrandHeader: View {
    let competition: Competition?
    @Bindable var app: AppModel
    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 0) {
                    Text("VA").foregroundStyle(Theme.text)
                    Text("R").foregroundStyle(Theme.accent)
                    Text("A").foregroundStyle(Theme.text)
                }
                .font(.system(size: 30, weight: .heavy, design: .rounded))
                .environment(\.layoutDirection, .leftToRight)
                Text("دقّة الرياضة").font(.caption).foregroundStyle(Theme.muted)
            }
            Spacer()
            NavigationLink {
                CompetitionsView(app: app)
            } label: {
                HStack(spacing: 8) {
                    AsyncImageLogo(url: competition?.logo, size: 22)
                    Text(competition?.name ?? app.activeCompetitionName).font(.caption).foregroundStyle(Theme.muted)
                        .lineLimit(1)
                    Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold)).foregroundStyle(Theme.muted)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)
                .background(Capsule().fill(Theme.surface))
                .overlay(Capsule().stroke(Theme.line, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 16)
    }
}

private struct SourceFooter: View {
    let source: String
    let cached: Bool
    var body: some View {
        Text("المصدر: \(source) · \(cached ? "من الكاش" : "مباشر")")
            .font(.caption2).foregroundStyle(Theme.muted.opacity(0.7))
            .padding(.vertical, 10)
    }
}

struct AsyncImageLogo: View {
    let url: String?
    var size: CGFloat = 24
    var body: some View {
        AsyncImage(url: url.flatMap(URL.init(string:))) { phase in
            if let image = phase.image {
                image.resizable().scaledToFit()
            } else {
                Image(systemName: "shield.fill").resizable().scaledToFit().foregroundStyle(Theme.line)
            }
        }
        .frame(width: size, height: size)
    }
}

#Preview {
    RootView().environment(\.layoutDirection, .rightToLeft)
}
