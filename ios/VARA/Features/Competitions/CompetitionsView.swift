import SwiftUI
import Observation

@MainActor
@Observable
final class CompetitionsViewModel {
    enum LoadState { case idle, loading, loaded, failed(String) }

    private let client = VaraClient()
    var state: LoadState = .idle
    var competitions: [CompetitionSummary] = []

    func load() async {
        state = .loading
        do {
            competitions = try await client.competitions().data
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct CompetitionsView: View {
    @Bindable var app: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var vm = CompetitionsViewModel()

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
                    LazyVStack(spacing: 0) {
                        ForEach(vm.competitions) { comp in
                            Button {
                                app.activeCompetitionId = comp.id
                                app.activeCompetitionName = comp.name
                                dismiss()
                            } label: {
                                CompetitionRow(comp: comp, active: comp.id == app.activeCompetitionId)
                            }
                            .buttonStyle(.plain)
                            if comp.id != vm.competitions.last?.id { Divider().overlay(Theme.line) }
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
                    .padding(16)
                }
            }
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("البطولات")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
    }
}

private struct CompetitionRow: View {
    let comp: CompetitionSummary
    let active: Bool

    var body: some View {
        HStack(spacing: 12) {
            AsyncImageLogo(url: comp.logo, size: 34)
            VStack(alignment: .leading, spacing: 2) {
                Text(comp.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.text)
                if let season = comp.currentSeason?.display, !season.isEmpty {
                    Text("موسم \(season)").font(.caption2).foregroundStyle(Theme.muted)
                }
            }
            Spacer()
            if active {
                Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}
