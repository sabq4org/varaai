import SwiftUI
import Observation

/// App-wide state: which competition the home screen is currently showing.
@MainActor
@Observable
final class AppModel {
    /// During the tournament, the World Cup hub is the default landing experience.
    var activeCompetitionId: String = "732"
    var activeCompetitionName: String = "كأس العالم"
}
