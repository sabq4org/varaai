import SwiftUI
import Observation

@MainActor
@Observable
final class ClubsViewModel {
    enum LoadState { case idle, loading, loaded, failed(String) }

    private let client = VaraClient()
    var state: LoadState = .idle
    var clubs: [TeamProfile] = []

    func load(competitionId: String) async {
        state = .loading
        do {
            let resp = try await client.teams(competitionId: competitionId)
            clubs = resp.data
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct ClubsView: View {
    let competitionId: String
    @State private var vm = ClubsViewModel()

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        Group {
            switch vm.state {
            case .idle, .loading:
                VStack { Spacer(); ProgressView().tint(Theme.accent); Spacer() }
            case .failed(let msg):
                VStack(spacing: 8) {
                    Spacer()
                    Image(systemName: "exclamationmark.triangle").foregroundStyle(Theme.draw)
                    Text(msg).font(.footnote).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
                    Spacer()
                }.padding(24)
            case .loaded:
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(vm.clubs) { club in
                            NavigationLink(value: club.team) {
                                ClubCard(team: club.team)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
        }
        .task(id: competitionId) { await vm.load(competitionId: competitionId) }
    }
}

private struct ClubCard: View {
    let team: Team
    var body: some View {
        VStack(spacing: 10) {
            AsyncImageLogo(url: team.logo, size: 52)
            Text(team.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.text)
                .lineLimit(1).minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .background(RoundedRectangle(cornerRadius: 16).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line, lineWidth: 1))
    }
}
