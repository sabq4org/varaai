import SwiftUI

@MainActor
@Observable
final class TodayViewModel {
    enum State { case idle, loading, loaded, failed(String) }

    var state: State = .idle
    var matches: [Match] = []
    var source = ""

    /// Day offset from today (0 = today, -1 = yesterday, +1 = tomorrow).
    var dayOffset = 0
    var liveOnly = false

    private let client = VaraClient()

    var selectedDate: Date {
        Calendar.current.date(byAdding: .day, value: dayOffset, to: Date()) ?? Date()
    }

    private var dateString: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        return f.string(from: selectedDate)
    }

    var dateLabel: String {
        switch dayOffset {
        case 0: return "اليوم"
        case -1: return "أمس"
        case 1: return "غدًا"
        default:
            let f = DateFormatter()
            f.locale = Locale(identifier: "ar")
            f.dateFormat = "EEEE d MMM"
            return f.string(from: selectedDate)
        }
    }

    var visibleMatches: [Match] {
        liveOnly ? matches.filter { $0.state == .live } : matches
    }

    var hasLive: Bool { matches.contains { $0.state == .live } }

    func load(competitionId: String) async {
        state = .loading
        do {
            let env = try await client.competitionMatchDay(competitionId: competitionId, date: dateString)
            matches = env.data
            source = env.source
            state = .loaded
        } catch {
            state = .failed((error as? LocalizedError)?.errorDescription ?? error.localizedDescription)
        }
    }
}

/// Today's fixtures for the ACTIVE competition only (no cross-competition mixing).
struct TodayView: View {
    let competitionId: String
    @State private var vm = TodayViewModel()

    var body: some View {
        VStack(spacing: 12) {
            dateBar
            content
        }
        .task(id: "\(competitionId)-\(vm.dayOffset)") { await vm.load(competitionId: competitionId) }
    }

    private var dateBar: some View {
        HStack(spacing: 10) {
            stepButton(systemName: "chevron.right") { vm.dayOffset -= 1 }
            VStack(spacing: 1) {
                Text(vm.dateLabel).font(.subheadline.weight(.heavy)).foregroundStyle(Theme.text)
                if vm.dayOffset != 0 {
                    Button("العودة لليوم") { vm.dayOffset = 0 }
                        .font(.caption2).foregroundStyle(Theme.accent).buttonStyle(.plain)
                }
            }
            .frame(maxWidth: .infinity)
            stepButton(systemName: "chevron.left") { vm.dayOffset += 1 }
        }
        .padding(.horizontal, 16)
        .overlay(alignment: .trailing) {
            if vm.hasLive {
                liveToggle.padding(.trailing, 16).offset(y: -34)
            }
        }
    }

    private var liveToggle: some View {
        Button {
            withAnimation(.snappy) { vm.liveOnly.toggle() }
        } label: {
            HStack(spacing: 5) {
                Circle().fill(Theme.lose).frame(width: 7, height: 7)
                Text("مباشر").font(.caption2.weight(.bold))
            }
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(Capsule().fill(vm.liveOnly ? Theme.lose.opacity(0.18) : Theme.surface))
            .overlay(Capsule().stroke(vm.liveOnly ? Theme.lose : Theme.line, lineWidth: 1))
            .foregroundStyle(vm.liveOnly ? Theme.lose : Theme.muted)
        }
        .buttonStyle(.plain)
    }

    private func stepButton(systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 13, weight: .bold))
                .frame(width: 34, height: 34)
                .background(Circle().fill(Theme.surface))
                .overlay(Circle().stroke(Theme.line, lineWidth: 1))
                .foregroundStyle(Theme.text)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var content: some View {
        switch vm.state {
        case .idle, .loading:
            Spacer(); ProgressView().tint(Theme.accent); Spacer()
        case .failed(let msg):
            Spacer()
            VStack(spacing: 10) {
                Image(systemName: "wifi.exclamationmark").font(.largeTitle).foregroundStyle(Theme.lose)
                Text(msg).foregroundStyle(Theme.muted).font(.footnote).multilineTextAlignment(.center)
                Button("إعادة المحاولة") { Task { await vm.load(competitionId: competitionId) } }
                    .buttonStyle(.borderedProminent).tint(Theme.accentDim)
            }.padding(32)
            Spacer()
        case .loaded:
            if vm.visibleMatches.isEmpty {
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "calendar.badge.exclamationmark").font(.largeTitle).foregroundStyle(Theme.muted)
                    Text(vm.liveOnly ? "لا توجد مباريات مباشرة الآن" : "لا توجد مباريات في هذا اليوم")
                        .foregroundStyle(Theme.muted).font(.subheadline)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(vm.visibleMatches) { match in
                            NavigationLink(value: match) { HubMatchRow(match: match) }
                                .buttonStyle(.plain)
                            if match.id != vm.visibleMatches.last?.id {
                                Divider().overlay(Theme.line).padding(.horizontal, 12)
                            }
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
                    .padding(.horizontal, 16).padding(.bottom, 8)
                }
            }
        }
    }
}
