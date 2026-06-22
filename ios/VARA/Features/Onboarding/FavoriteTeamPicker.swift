import SwiftUI

@MainActor
@Observable
final class TeamPickerViewModel {
    enum State { case loading, loaded, failed(String) }
    var state: State = .loading
    var teams: [TeamProfile] = []
    var query = ""

    private let client = VaraClient()

    var filtered: [TeamProfile] {
        guard !query.isEmpty else { return teams }
        return teams.filter { $0.team.name.localizedCaseInsensitiveContains(query) }
    }

    func load() async {
        state = .loading
        do {
            let env = try await client.teams(competitionId: FavoritesModel.worldCupId)
            teams = env.data
                .filter { Self.isRealTeam($0.team.name) }
                .sorted { $0.team.name.localizedCompare($1.team.name) == .orderedAscending }
            state = .loaded
        } catch {
            state = .failed((error as? LocalizedError)?.errorDescription ?? error.localizedDescription)
        }
    }

    /// Drops knockout placeholders like "1st Group A" / "Winner Match 73".
    private static func isRealTeam(_ name: String) -> Bool {
        let lower = name.lowercased()
        if let first = name.first, first.isNumber { return false }
        for token in ["group", "winner", "loser", "runner", "place", "match", "/"] where lower.contains(token) {
            return false
        }
        return true
    }
}

/// First-launch screen: pick a favourite national team to personalise the World Cup hub.
struct FavoriteTeamPicker: View {
    @Bindable var favorites: FavoritesModel
    @State private var vm = TeamPickerViewModel()

    private let columns = [GridItem(.adaptive(minimum: 100), spacing: 12)]

    var body: some View {
        ZStack {
            RadialGradient(colors: [Color(hex: 0x10202B), Theme.bg], center: .top, startRadius: 10, endRadius: 700)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                header
                searchField
                content
            }
        }
        .task { if vm.teams.isEmpty { await vm.load() } }
    }

    private var header: some View {
        VStack(spacing: 8) {
            HStack(spacing: 0) {
                Text("VA").foregroundStyle(Theme.text)
                Text("R").foregroundStyle(Theme.accent)
                Text("A").foregroundStyle(Theme.text)
            }
            .font(.system(size: 34, weight: .heavy, design: .rounded))
            .environment(\.layoutDirection, .leftToRight)

            Text("اختر منتخبك المفضّل في كأس العالم")
                .font(.title3.weight(.bold)).foregroundStyle(Theme.text)
            Text("نخصّص لك مبارياته ومركزه في المجموعة والمتابعة المباشرة")
                .font(.footnote).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
        }
        .padding(.top, 24).padding(.horizontal, 24).padding(.bottom, 12)
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(Theme.muted)
            TextField("ابحث عن منتخب…", text: $vm.query)
                .foregroundStyle(Theme.text)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 14).padding(.vertical, 11)
        .background(RoundedRectangle(cornerRadius: 12).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.line, lineWidth: 1))
        .padding(.horizontal, 16).padding(.bottom, 10)
    }

    @ViewBuilder
    private var content: some View {
        switch vm.state {
        case .loading:
            Spacer(); ProgressView().tint(Theme.accent); Spacer()
        case .failed(let msg):
            Spacer()
            VStack(spacing: 12) {
                Text(msg).foregroundStyle(Theme.muted).font(.footnote).multilineTextAlignment(.center)
                Button("إعادة المحاولة") { Task { await vm.load() } }
                    .buttonStyle(.borderedProminent).tint(Theme.accentDim)
                skipButton
            }.padding(32)
            Spacer()
        case .loaded:
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(vm.filtered) { profile in
                        Button {
                            favorites.setFavorite(profile.team)
                            favorites.completeOnboarding()
                        } label: {
                            TeamPickCard(team: profile.team)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                skipButton.padding(.vertical, 18)
            }
        }
    }

    private var skipButton: some View {
        Button("تخطّي الآن") { favorites.completeOnboarding() }
            .font(.subheadline).foregroundStyle(Theme.muted)
            .buttonStyle(.plain)
    }
}

private struct TeamPickCard: View {
    let team: Team
    var body: some View {
        VStack(spacing: 8) {
            AsyncImageLogo(url: team.logo, size: 46)
            Text(team.name)
                .font(.caption.weight(.semibold)).foregroundStyle(Theme.text)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(RoundedRectangle(cornerRadius: 16).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line, lineWidth: 1))
    }
}
