import SwiftUI

struct MatchDetailView: View {
    @State private var vm: MatchDetailViewModel
    @State private var section: Section = .events

    init(matchId: String, seed: Match? = nil) {
        _vm = State(initialValue: MatchDetailViewModel(matchId: matchId, seed: seed))
    }

    enum Section: String, CaseIterable {
        case events, stats, lineups
        var title: String {
            switch self {
            case .events: return "الأحداث"
            case .stats: return "الإحصائيات"
            case .lineups: return "التشكيلة"
            }
        }
    }

    private var headerMatch: Match? { vm.detail?.match ?? vm.seed }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    if let m = headerMatch {
                        MatchHeaderCard(match: m, competition: vm.detail?.competitionName, xg: vm.detail?.xg)
                    }
                    if vm.isLive, let m = headerMatch {
                        LiveFollowButton(match: m)
                    }
                    if let pressure = vm.detail?.pressure, let m = vm.detail?.match {
                        PressureCard(pressure: pressure, homeTeam: m.home.team, awayTeam: m.away.team)
                    }
                    sectionPicker
                    sectionContent
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 30)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar)
        .task { await vm.loadAndPoll() }
    }

    private var sectionPicker: some View {
        HStack(spacing: 8) {
            ForEach(Section.allCases, id: \.self) { s in
                Button { withAnimation(.snappy) { section = s } } label: {
                    Text(s.title)
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(RoundedRectangle(cornerRadius: 12).fill(section == s ? Theme.surface2 : Theme.surface))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(section == s ? Theme.accentDim : Theme.line, lineWidth: 1))
                        .foregroundStyle(section == s ? Theme.text : Theme.muted)
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder
    private var sectionContent: some View {
        switch vm.state {
        case .loading:
            ProgressView().tint(Theme.accent).padding(.top, 40)
        case .failed(let msg):
            VStack(spacing: 10) {
                Image(systemName: "exclamationmark.triangle").foregroundStyle(Theme.lose).font(.title)
                Text(msg).font(.footnote).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
                Button("إعادة المحاولة") { Task { await vm.load() } }
                    .buttonStyle(.borderedProminent).tint(Theme.accentDim)
            }
            .padding(.top, 30)
        case .loaded:
            if let detail = vm.detail {
                switch section {
                case .events:
                    EventsTimeline(
                        events: detail.events,
                        homeTeam: detail.match.home.team,
                        awayTeam: detail.match.away.team
                    )
                case .stats: StatsSection(stats: detail.stats)
                case .lineups: LineupsSection(lineups: detail.lineups, match: detail.match)
                }
            }
        }
    }
}

private struct MatchHeaderCard: View {
    let match: Match
    let competition: String?
    var xg: TeamPair? = nil

    var body: some View {
        VStack(spacing: 14) {
            if let competition {
                Text(competition).font(.caption.weight(.semibold)).foregroundStyle(Theme.accent)
            }
            HStack(alignment: .top) {
                teamColumn(match.home)
                VStack(spacing: 4) {
                    // Home is on the right in RTL → render "away : home" (forced LTR).
                    Text("\(scoreText(match.away.score)) : \(scoreText(match.home.score))")
                        .font(.system(size: 34, weight: .heavy))
                        .environment(\.layoutDirection, .leftToRight)
                        .foregroundStyle(match.state == .live ? Theme.accent : Theme.text)
                    if match.state == .live {
                        TimelineView(.periodic(from: .now, by: 1)) { _ in
                            Text(match.currentMinute.map { "\($0)′" } ?? "مباشر")
                                .font(.caption2.weight(.bold)).foregroundStyle(Theme.lose)
                        }
                    } else {
                        Text(statusText).font(.caption2.weight(.bold)).foregroundStyle(Theme.muted)
                    }
                }
                .frame(maxWidth: .infinity)
                teamColumn(match.away)
            }
            if let xg, xg.home != nil || xg.away != nil {
                xgPill(xg)
            }
            if let venue = match.venue {
                Label(venue, systemImage: "mappin.and.ellipse")
                    .font(.caption2).foregroundStyle(Theme.muted)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 20).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.line, lineWidth: 1))
    }

    // xG row under the score, mirroring Sportmonks' "0.23 xG 1.38".
    private func xgPill(_ xg: TeamPair) -> some View {
        HStack(spacing: 10) {
            Text(xgText(xg.home)).font(.footnote.weight(.heavy)).foregroundStyle(Theme.text)
            Text("xG").font(.caption2.weight(.bold)).foregroundStyle(Theme.muted)
            Text(xgText(xg.away)).font(.footnote.weight(.heavy)).foregroundStyle(Theme.text)
        }
        .environment(\.layoutDirection, .leftToRight)
        .padding(.horizontal, 14).padding(.vertical, 6)
        .background(Capsule().fill(Theme.surface2))
        .overlay(Capsule().stroke(Theme.line, lineWidth: 1))
    }

    private func xgText(_ v: Double?) -> String { v.map { String(format: "%.2f", $0) } ?? "-" }

    private func teamColumn(_ side: MatchSide) -> some View {
        VStack(spacing: 8) {
            AsyncImageLogo(url: side.team.logo, size: 52)
            Text(side.team.name).font(.subheadline.weight(.bold)).foregroundStyle(Theme.text)
                .multilineTextAlignment(.center).lineLimit(2)
        }
        .frame(maxWidth: .infinity)
    }

    private func scoreText(_ s: Int?) -> String { s.map(String.init) ?? "-" }

    private var statusText: String {
        switch match.state {
        case .live: return match.minute.map { "\($0)′" } ?? "مباشر"
        case .finished: return "انتهت"
        case .scheduled: return "لم تبدأ"
        case .postponed: return "مؤجّلة"
        case .cancelled: return "ملغاة"
        case .unknown: return ""
        }
    }
}

/// Starts/stops a Live Activity that mirrors the match on the lock screen + Dynamic Island.
private struct LiveFollowButton: View {
    let match: Match
    @State private var following = false

    var body: some View {
        Button {
            if following {
                LiveActivityController.shared.end(matchId: match.id)
                following = false
            } else {
                LiveActivityController.shared.start(match: match)
                following = true
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: following ? "bell.slash.fill" : "lock.iphone")
                Text(following ? "إيقاف المتابعة على القفل" : "تابِع على شاشة القفل")
            }
            .font(.subheadline.weight(.bold))
            .foregroundStyle(following ? Theme.muted : Color(hex: 0x08110D))
            .frame(maxWidth: .infinity).padding(.vertical, 12)
            .background(RoundedRectangle(cornerRadius: 14).fill(following ? Theme.surface : Theme.accent))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(following ? Theme.line : Color.clear, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .onAppear { following = LiveActivityController.shared.isActive(matchId: match.id) }
    }
}

/// Dominance share derived from the Pressure Index — who controlled the match.
private struct PressureCard: View {
    let pressure: TeamPair
    let homeTeam: Team
    let awayTeam: Team

    private var home: Double { pressure.home ?? 0 }
    private var away: Double { pressure.away ?? 0 }
    private var total: Double { max(home + away, 0.0001) }

    var body: some View {
        VStack(spacing: 10) {
            HStack {
                Label("مؤشّر السيطرة", systemImage: "waveform.path.ecg")
                    .font(.caption.weight(.bold)).foregroundStyle(Theme.text)
                Spacer()
                Text("Pressure Index").font(.caption2).foregroundStyle(Theme.muted)
                    .environment(\.layoutDirection, .leftToRight)
            }
            HStack {
                HStack(spacing: 6) {
                    AsyncImageLogo(url: homeTeam.logo, size: 18)
                    Text("\(Int(home))%").font(.subheadline.weight(.heavy))
                        .foregroundStyle(home >= away ? Theme.accent : Theme.text)
                }
                Spacer()
                HStack(spacing: 6) {
                    Text("\(Int(away))%").font(.subheadline.weight(.heavy))
                        .foregroundStyle(away > home ? Theme.accent : Theme.text)
                    AsyncImageLogo(url: awayTeam.logo, size: 18)
                }
            }
            GeometryReader { geo in
                // Leading (right in RTL) = home; trailing (left) = away.
                // Colour the dominant side green so the bar matches the green % label.
                HStack(spacing: 3) {
                    Capsule().fill(home >= away ? Theme.accent : Theme.surface2)
                        .frame(width: max(geo.size.width * (home / total) - 1.5, 0))
                    Capsule().fill(away > home ? Theme.accent : Theme.surface2)
                }
            }
            .frame(height: 8)
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
    }
}
