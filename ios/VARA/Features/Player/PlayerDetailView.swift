import SwiftUI
import Observation

@MainActor
@Observable
final class PlayerDetailViewModel {
    enum LoadState { case idle, loading, loaded, failed(String) }

    private let client = VaraClient()
    var state: LoadState = .idle
    var profile: PlayerProfile?

    func load(playerId: String) async {
        state = .loading
        do {
            profile = try await client.player(id: playerId).data
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct PlayerDetailView: View {
    let playerId: String
    let seed: PlayerRef?
    @State private var vm = PlayerDetailViewModel()

    private let columns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]

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
                    if let p = vm.profile {
                        bioCard(p)
                        if let stats = p.stats, !stats.items.isEmpty { statsSection(stats) }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle(vm.profile?.name ?? seed?.name ?? "اللاعب")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(playerId: playerId) }
    }

    private var header: some View {
        VStack(spacing: 12) {
            PlayerAvatar(url: vm.profile?.photo ?? seed?.photo, size: 100)
            Text(vm.profile?.name ?? seed?.name ?? "")
                .font(.title2.weight(.heavy)).foregroundStyle(Theme.text)
                .multilineTextAlignment(.center)
            if let p = vm.profile {
                HStack(spacing: 8) {
                    if let pos = p.detailedPosition ?? p.position {
                        Tag(text: pos, color: Theme.accentDim)
                    }
                    if let nat = p.nationality { Tag(text: nat, color: Theme.surface2) }
                }
            }
        }
        .padding(.top, 12)
    }

    private func bioCard(_ p: PlayerProfile) -> some View {
        HStack(spacing: 0) {
            if let age = p.age { InfoCell(title: "العمر", value: "\(age)") }
            if let h = p.height { InfoCell(title: "الطول", value: "\(h) سم") }
            if let w = p.weight { InfoCell(title: "الوزن", value: "\(w) كجم") }
        }
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 16).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line, lineWidth: 1))
    }

    private func statsSection(_ stats: PlayerSeasonStats) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("الأرقام").font(.headline).foregroundStyle(Theme.text)
                Spacer()
                if let comp = stats.competition, let season = stats.seasonName {
                    Text("\(comp) · \(season)").font(.caption2).foregroundStyle(Theme.muted)
                }
            }
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(stats.items) { item in
                    StatTile(label: item.label, value: item.value.display)
                }
            }
        }
    }
}

private struct InfoCell: View {
    let title: String
    let value: String
    var body: some View {
        VStack(spacing: 4) {
            Text(value).font(.headline.weight(.heavy)).foregroundStyle(Theme.text)
            Text(title).font(.caption2).foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct StatTile: View {
    let label: String
    let value: String
    var body: some View {
        VStack(spacing: 6) {
            Text(value).font(.title3.weight(.heavy)).foregroundStyle(Theme.accent)
                .environment(\.layoutDirection, .leftToRight)
            Text(label).font(.caption2).foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center).lineLimit(2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line, lineWidth: 1))
    }
}

private struct Tag: View {
    let text: String
    let color: Color
    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(Capsule().fill(color))
            .foregroundStyle(Theme.text)
    }
}
