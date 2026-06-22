import SwiftUI
import Observation

@MainActor
@Observable
final class ScorersViewModel {
    enum LoadState { case idle, loading, loaded, failed(String) }

    private let client = VaraClient()
    var state: LoadState = .idle
    var scorers: [TopScorer] = []
    var metric: String = "goals"

    func load(competitionId: String, metric: String) async {
        self.metric = metric
        state = .loading
        do {
            let resp = try await client.topScorers(competitionId: competitionId, metric: metric)
            scorers = resp.data
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct ScorersView: View {
    let competitionId: String
    @State private var vm = ScorersViewModel()
    @State private var metric = "goals"

    var body: some View {
        VStack(spacing: 12) {
            Picker("", selection: $metric) {
                Text("الأهداف").tag("goals")
                Text("صناعة الأهداف").tag("assists")
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)

            content
        }
        .task(id: "\(competitionId)-\(metric)") {
            await vm.load(competitionId: competitionId, metric: metric)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch vm.state {
        case .idle, .loading:
            Spacer(); ProgressView().tint(Theme.accent); Spacer()
        case .failed(let msg):
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle").foregroundStyle(Theme.draw)
                Text(msg).font(.footnote).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
            }.padding(24)
            Spacer()
        case .loaded:
            if vm.scorers.isEmpty {
                Spacer(); Text("لا توجد بيانات").foregroundStyle(Theme.muted); Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(vm.scorers) { s in
                            NavigationLink(value: s.player) {
                                ScorerRow(scorer: s, unit: vm.metric == "assists" ? "صناعة" : "هدف")
                            }
                            .buttonStyle(.plain)
                            if s.id != vm.scorers.last?.id { Divider().overlay(Theme.line) }
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
                    .padding(.horizontal, 16)
                }
            }
        }
    }
}

private struct ScorerRow: View {
    let scorer: TopScorer
    let unit: String

    private var isTop: Bool { scorer.rank <= 3 }

    var body: some View {
        HStack(spacing: 12) {
            Text("\(scorer.rank)")
                .font(.system(.subheadline, weight: .heavy))
                .frame(width: 26, height: 26)
                .background(RoundedRectangle(cornerRadius: 8).fill(isTop ? Theme.accentDim : Theme.surface2))
                .foregroundStyle(isTop ? Color(hex: 0xD8FFF3) : Theme.text)

            PlayerAvatar(url: scorer.player.photo, size: 38)

            VStack(alignment: .leading, spacing: 2) {
                Text(scorer.player.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.text).lineLimit(1)
                HStack(spacing: 6) {
                    AsyncImageLogo(url: scorer.team.logo, size: 14)
                    Text(scorer.team.name).font(.caption2).foregroundStyle(Theme.muted)
                }
            }
            Spacer()
            HStack(spacing: 4) {
                Text("\(scorer.total)")
                    .font(.system(.title3, weight: .heavy)).foregroundStyle(Theme.accent)
                Text(unit).font(.caption2).foregroundStyle(Theme.muted)
            }
            Image(systemName: "chevron.left").font(.caption2).foregroundStyle(Theme.muted)
        }
        .padding(.horizontal, 12).padding(.vertical, 11)
        .contentShape(Rectangle())
    }
}

/// Round player photo with graceful fallback.
struct PlayerAvatar: View {
    let url: String?
    var size: CGFloat = 40
    var body: some View {
        AsyncImage(url: url.flatMap(URL.init(string:))) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
            } else {
                Image(systemName: "person.fill").resizable().scaledToFit().padding(size * 0.22).foregroundStyle(Theme.muted)
            }
        }
        .frame(width: size, height: size)
        .background(Theme.surface2)
        .clipShape(Circle())
        .overlay(Circle().stroke(Theme.line, lineWidth: 1))
    }
}
