import ActivityKit
import SwiftUI
import WidgetKit

private enum LA {
    static let bg = Color(red: 0x0A / 255, green: 0x0E / 255, blue: 0x14 / 255)
    static let surface = Color(red: 0x12 / 255, green: 0x18 / 255, blue: 0x21 / 255)
    static let text = Color(red: 0xEA / 255, green: 0xF0 / 255, blue: 0xF7 / 255)
    static let muted = Color(red: 0x8B / 255, green: 0x97 / 255, blue: 0xA8 / 255)
    static let accent = Color(red: 0x00 / 255, green: 0xE0 / 255, blue: 0xA4 / 255)
    static let live = Color(red: 0xFF / 255, green: 0x5D / 255, blue: 0x6C / 255)
}

struct MatchLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MatchActivityAttributes.self) { context in
            LockScreenLiveView(context: context)
                .padding(16)
                .background(LA.bg)
                .environment(\.layoutDirection, .rightToLeft)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    teamLabel(context.attributes.homeName)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    teamLabel(context.attributes.awayName)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(scoreText(context.state))
                            .font(.system(size: 22, weight: .heavy))
                            .foregroundStyle(LA.text)
                        Text(context.state.statusText)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(context.state.isLive ? LA.live : LA.muted)
                    }
                }
            } compactLeading: {
                Image(systemName: "soccerball").foregroundStyle(LA.accent)
            } compactTrailing: {
                Text(scoreText(context.state)).font(.system(size: 13, weight: .heavy)).foregroundStyle(LA.text)
            } minimal: {
                Image(systemName: "soccerball").foregroundStyle(LA.accent)
            }
            .widgetURL(URL(string: "vara://match/\(context.attributes.matchId)"))
        }
    }

    private func teamLabel(_ name: String) -> some View {
        Text(name).font(.system(size: 13, weight: .bold)).foregroundStyle(LA.text)
            .lineLimit(1).minimumScaleFactor(0.7)
    }

    private func scoreText(_ s: MatchActivityAttributes.ContentState) -> String {
        "\(s.awayScore) : \(s.homeScore)"
    }
}

private struct LockScreenLiveView: View {
    let context: ActivityViewContext<MatchActivityAttributes>

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 6) {
                if context.state.isLive {
                    Circle().fill(LA.live).frame(width: 7, height: 7)
                }
                Text(context.state.isLive ? "مباشر · \(context.state.statusText)" : context.state.statusText)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(context.state.isLive ? LA.live : LA.muted)
                Spacer()
                Text("VARA").font(.system(size: 11, weight: .heavy)).foregroundStyle(LA.accent)
                    .environment(\.layoutDirection, .leftToRight)
            }
            HStack {
                Text(context.attributes.homeName)
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(LA.text)
                    .lineLimit(1).minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("\(context.state.awayScore) : \(context.state.homeScore)")
                    .font(.system(size: 26, weight: .heavy)).foregroundStyle(LA.text)
                    .environment(\.layoutDirection, .leftToRight)
                Text(context.attributes.awayName)
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(LA.text)
                    .lineLimit(1).minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
    }
}
