import SwiftUI

@MainActor
@Observable
final class BracketViewModel {
    enum State { case loading, loaded, failed(String) }
    var state: State = .loading
    var stages: [BracketStage] = []
    var selected = 0

    private let client = VaraClient()

    func load(competitionId: String) async {
        state = .loading
        do {
            let env = try await client.bracket(competitionId: competitionId)
            stages = env.data
            // Default to the first round that still has unfinished ties.
            selected = stages.firstIndex { $0.matches.contains { $0.state != .finished } } ?? 0
            state = .loaded
        } catch {
            state = .failed((error as? LocalizedError)?.errorDescription ?? error.localizedDescription)
        }
    }
}

struct BracketView: View {
    let competitionId: String
    @State private var vm = BracketViewModel()

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            switch vm.state {
            case .loading:
                ProgressView().tint(Theme.accent)
            case .failed(let msg):
                VStack(spacing: 12) {
                    Text(msg).foregroundStyle(Theme.muted).font(.footnote).multilineTextAlignment(.center)
                    Button("إعادة المحاولة") { Task { await vm.load(competitionId: competitionId) } }
                        .buttonStyle(.borderedProminent).tint(Theme.accentDim)
                }.padding(32)
            case .loaded:
                if vm.stages.isEmpty {
                    Text("لم تبدأ الأدوار الإقصائية بعد").foregroundStyle(Theme.muted)
                } else {
                    loaded
                }
            }
        }
        .navigationTitle("الأدوار الإقصائية")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(competitionId: competitionId) }
    }

    private var loaded: some View {
        VStack(spacing: 12) {
            roundChips
            ScrollView {
                VStack(spacing: 10) {
                    ForEach(vm.stages[vm.selected].matches) { match in
                        NavigationLink(value: match) { TieCard(match: match) }
                            .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16).padding(.bottom, 16)
            }
        }
        .padding(.top, 8)
    }

    private var roundChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(vm.stages.enumerated()), id: \.element.id) { idx, stage in
                    Button {
                        withAnimation(.snappy) { vm.selected = idx }
                    } label: {
                        Text(stage.name)
                            .font(.caption.weight(.bold))
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(Capsule().fill(vm.selected == idx ? Theme.accent : Theme.surface))
                            .overlay(Capsule().stroke(vm.selected == idx ? Theme.accent : Theme.line, lineWidth: 1))
                            .foregroundStyle(vm.selected == idx ? Color(hex: 0x08110D) : Theme.muted)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }
}

private struct TieCard: View {
    let match: Match

    var body: some View {
        HStack(spacing: 12) {
            teamRow(match.home, score: match.home.score)
            VStack(spacing: 2) {
                Text(centerText).font(.caption.weight(.heavy)).foregroundStyle(centerColor)
                    .environment(\.layoutDirection, .leftToRight)
                if match.state == .scheduled { Text(dayLabel).font(.system(size: 9)).foregroundStyle(Theme.muted) }
            }
            .frame(width: 60)
            teamRow(match.away, score: match.away.score)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(match.state == .live ? Theme.lose.opacity(0.5) : Theme.line, lineWidth: 1))
        .contentShape(Rectangle())
    }

    private func teamRow(_ s: MatchSide, score: Int?) -> some View {
        HStack(spacing: 8) {
            AsyncImageLogo(url: s.team.logo, size: 26)
            Text(s.team.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.text)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var centerText: String {
        switch match.state {
        case .scheduled: return kickoff
        default: return "\(match.away.score.map(String.init) ?? "-") : \(match.home.score.map(String.init) ?? "-")"
        }
    }
    private var centerColor: Color { match.state == .live ? Theme.accent : Theme.text }

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
        let f = DateFormatter(); f.locale = Locale(identifier: "ar"); f.dateFormat = "d MMM"
        return f.string(from: d)
    }
}
