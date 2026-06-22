import SwiftUI
import Observation

@MainActor
@Observable
final class LeagueViewModel {
    enum LoadState {
        case idle, loading, loaded, failed(String)
    }

    private let client = VaraClient()

    var state: LoadState = .idle
    var competition: Competition?
    var standings: [StandingRow] = []
    var results: [Match] = []
    var source: String = ""
    var cached: Bool = false

    func load(competitionId: String) async {
        state = .loading
        do {
            async let standingsTask = try? client.standings(competitionId: competitionId)
            async let matchesTask = client.matches(competitionId: competitionId, status: "last", count: 12)

            let standingsResp = await standingsTask
            let matchesResp = try await matchesTask

            if let s = standingsResp {
                competition = s.data.competition
                standings = s.data.rows
            } else {
                standings = []
            }
            results = matchesResp.data
            source = standingsResp?.source ?? matchesResp.source
            cached = (standingsResp?.cached ?? true) && matchesResp.cached
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}
