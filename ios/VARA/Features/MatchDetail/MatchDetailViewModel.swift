import SwiftUI
import Observation

@MainActor
@Observable
final class MatchDetailViewModel {
    enum LoadState { case loading, loaded, failed(String) }

    private let client = VaraClient()
    let matchId: String
    /// Seed from the list so the header renders instantly while detail loads.
    let seed: Match?

    var state: LoadState = .loading
    var detail: MatchDetail?
    /// True while a background live-refresh loop is running.
    var isLivePolling = false

    init(matchId: String, seed: Match? = nil) {
        self.matchId = matchId
        self.seed = seed
    }

    var isLive: Bool { (detail?.match ?? seed)?.state == .live }

    func load() async {
        state = .loading
        do {
            detail = try await client.matchDetail(id: matchId).data
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    /// Load once, then refresh every ~10s while the match is live. Auto-cancels
    /// when the owning `.task` is torn down (view dismissed).
    func loadAndPoll() async {
        await load()
        isLivePolling = true
        defer { isLivePolling = false }
        while !Task.isCancelled, detail?.match.state == .live {
            try? await Task.sleep(for: .seconds(10))
            if Task.isCancelled { break }
            if let fresh = try? await client.matchDetail(id: matchId).data {
                detail = fresh
                state = .loaded
                LiveActivityController.shared.update(with: fresh.match)
                if fresh.match.state != .live { break }
            }
        }
    }
}
