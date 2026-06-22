import ActivityKit
import Foundation

/// Manages Live Activities for live matches (lock screen + Dynamic Island).
/// Updates are pushed locally while the app polls; APNs push is a future step.
@MainActor
final class LiveActivityController {
    static let shared = LiveActivityController()

    func isActive(matchId: String) -> Bool {
        Activity<MatchActivityAttributes>.activities.contains { $0.attributes.matchId == matchId }
    }

    func start(match: Match) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        guard !isActive(matchId: match.id) else { return }

        let attributes = MatchActivityAttributes(
            matchId: match.id,
            homeName: match.home.team.name,
            awayName: match.away.team.name,
            competition: ""
        )
        let content = ActivityContent(state: state(from: match), staleDate: nil)
        do {
            _ = try Activity.request(attributes: attributes, content: content)
        } catch {
            print("Live Activity start failed: \(error)")
        }
    }

    func update(with match: Match) {
        let content = ActivityContent(state: state(from: match), staleDate: nil)
        let id = match.id
        let ended = match.state != .live
        Task {
            for activity in Activity<MatchActivityAttributes>.activities where activity.attributes.matchId == id {
                if ended {
                    await activity.end(content, dismissalPolicy: .after(.now + 60))
                } else {
                    await activity.update(content)
                }
            }
        }
    }

    func end(matchId: String) {
        Task {
            for activity in Activity<MatchActivityAttributes>.activities where activity.attributes.matchId == matchId {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
    }

    private func state(from match: Match) -> MatchActivityAttributes.ContentState {
        let isLive = match.state == .live
        let minute = match.currentMinute
        let status: String
        switch match.state {
        case .live: status = minute.map { "\($0)′" } ?? "مباشر"
        case .finished: status = "انتهت"
        case .scheduled: status = "لم تبدأ"
        default: status = ""
        }
        return .init(
            homeScore: match.home.score ?? 0,
            awayScore: match.away.score ?? 0,
            minute: minute,
            statusText: status,
            isLive: isLive
        )
    }
}
