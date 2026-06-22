import SwiftUI
import Observation

@MainActor
@Observable
final class TeamDetailViewModel {
    enum LoadState { case idle, loading, loaded, failed(String) }

    private let client = VaraClient()
    var state: LoadState = .idle
    var profile: TeamProfile?
    var squad: TeamSquad?

    func load(teamId: String) async {
        state = .loading
        do {
            async let profileTask = client.team(id: teamId)
            async let squadTask = client.squad(teamId: teamId)
            profile = try await profileTask.data
            squad = try await squadTask.data
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct TeamDetailView: View {
    let teamId: String
    let seed: Team?
    @State private var vm = TeamDetailViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                header
                switch vm.state {
                case .idle, .loading:
                    ProgressView().tint(Theme.accent).padding(.top, 40)
                case .failed(let msg):
                    Text(msg).font(.footnote).foregroundStyle(Theme.muted).padding(24)
                case .loaded:
                    if let p = vm.profile { infoCard(p) }
                    if let squad = vm.squad { squadSection(squad) }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle(vm.profile?.team.name ?? seed?.name ?? "النادي")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(teamId: teamId) }
    }

    private var header: some View {
        VStack(spacing: 12) {
            AsyncImageLogo(url: vm.profile?.team.logo ?? seed?.logo, size: 84)
            Text(vm.profile?.team.name ?? seed?.name ?? "")
                .font(.title2.weight(.heavy)).foregroundStyle(Theme.text)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 12)
    }

    private func infoCard(_ p: TeamProfile) -> some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                if let founded = p.founded { InfoCell(title: "التأسيس", value: "\(founded)") }
                if let cap = p.venue?.capacity { InfoCell(title: "سعة الملعب", value: cap.formatted(.number.grouping(.automatic))) }
                if let country = p.country { InfoCell(title: "الدولة", value: country) }
            }
            if let venue = p.venue?.name {
                Divider().overlay(Theme.line)
                Label(venue, systemImage: "sportscourt.fill")
                    .font(.caption).foregroundStyle(Theme.muted)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 16).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line, lineWidth: 1))
    }

    private func squadSection(_ squad: TeamSquad) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("القائمة (\(squad.players.count))")
                .font(.headline).foregroundStyle(Theme.text)
            VStack(spacing: 0) {
                ForEach(squad.players) { sp in
                    NavigationLink(value: sp.player) {
                        SquadRow(player: sp)
                    }
                    .buttonStyle(.plain)
                    if sp.id != squad.players.last?.id { Divider().overlay(Theme.line) }
                }
            }
            .background(RoundedRectangle(cornerRadius: 16).fill(Theme.surface))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line, lineWidth: 1))
        }
    }
}

private struct InfoCell: View {
    let title: String
    let value: String
    var body: some View {
        VStack(spacing: 4) {
            Text(value).font(.headline.weight(.heavy)).foregroundStyle(Theme.text)
                .environment(\.layoutDirection, .leftToRight)
            Text(title).font(.caption2).foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct SquadRow: View {
    let player: SquadPlayer
    var body: some View {
        HStack(spacing: 12) {
            Text(player.number.map(String.init) ?? "–")
                .font(.caption.weight(.heavy))
                .frame(width: 28, height: 28)
                .background(RoundedRectangle(cornerRadius: 7).fill(Theme.surface2))
                .foregroundStyle(Theme.muted)
            PlayerAvatar(url: player.player.photo, size: 34)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(player.player.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.text).lineLimit(1)
                    if player.captain == true {
                        Text("C").font(.system(size: 9, weight: .black))
                            .padding(.horizontal, 5).padding(.vertical, 1)
                            .background(Capsule().fill(Theme.draw))
                            .foregroundStyle(Color(hex: 0x08110D))
                    }
                }
                if let pos = player.position, let nat = player.nationality {
                    Text("\(pos) · \(nat)").font(.caption2).foregroundStyle(Theme.muted)
                } else if let pos = player.position {
                    Text(pos).font(.caption2).foregroundStyle(Theme.muted)
                }
            }
            Spacer()
            Image(systemName: "chevron.left").font(.caption2).foregroundStyle(Theme.muted)
        }
        .padding(.horizontal, 12).padding(.vertical, 9)
        .contentShape(Rectangle())
    }
}
