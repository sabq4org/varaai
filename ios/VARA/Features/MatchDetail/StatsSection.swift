import SwiftUI

struct StatsSection: View {
    let stats: [MatchStat]

    var body: some View {
        if stats.isEmpty {
            Text("لا توجد إحصائيات").foregroundStyle(Theme.muted).padding(.top, 30)
        } else {
            VStack(spacing: 16) {
                ForEach(stats) { stat in
                    StatBar(stat: stat)
                }
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
        }
    }
}

private struct StatBar: View {
    let stat: MatchStat

    private var homeVal: Double { stat.home?.magnitude ?? 0 }
    private var awayVal: Double { stat.away?.magnitude ?? 0 }
    private var total: Double { max(homeVal + awayVal, 0.0001) }

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(stat.home?.display ?? "-").font(.subheadline.weight(.bold)).foregroundStyle(homeVal >= awayVal ? Theme.accent : Theme.text)
                Spacer()
                Text(stat.label).font(.caption).foregroundStyle(Theme.muted)
                Spacer()
                Text(stat.away?.display ?? "-").font(.subheadline.weight(.bold)).foregroundStyle(awayVal > homeVal ? Theme.accent : Theme.text)
            }
            GeometryReader { geo in
                let homeWidth = geo.size.width * (homeVal / total)
                HStack(spacing: 3) {
                    // Home fills from the right in RTL.
                    Capsule().fill(Theme.accent).frame(width: max(homeWidth - 1.5, 0))
                    Capsule().fill(Theme.surface2).frame(maxWidth: .infinity)
                }
            }
            .frame(height: 6)
        }
    }
}
