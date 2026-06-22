import ActivityKit
import Foundation

/// Shared between the app (which starts/updates the activity) and the widget
/// extension (which renders it on the lock screen + Dynamic Island).
struct MatchActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var homeScore: Int
        var awayScore: Int
        var minute: Int?
        /// Localized status, e.g. "45′", "استراحة", "انتهت".
        var statusText: String
        var isLive: Bool
    }

    // Fixed for the lifetime of the activity.
    var matchId: String
    var homeName: String
    var awayName: String
    var competition: String
}
