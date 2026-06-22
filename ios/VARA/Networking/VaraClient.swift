import Foundation

enum VaraError: LocalizedError {
    case badStatus(Int)
    case server(String)
    var errorDescription: String? {
        switch self {
        case .badStatus(let code): return "خطأ في الخادم (HTTP \(code))"
        case .server(let msg): return msg
        }
    }
}

/// Talks ONLY to VARA Edge — never to data providers directly.
struct VaraClient {
    /// Simulator shares the Mac's network, so localhost reaches the local VARA Edge.
    var baseURL = URL(string: "http://localhost:8787")!

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 20
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: config)
    }()

    private let decoder = JSONDecoder()

    func saudiProLeagueOverview() async throws -> OverviewResponse {
        try await get("v1/saudi-pro-league/overview")
    }

    func matchDetail(id: String) async throws -> MatchDetailResponse {
        try await get("v1/matches/\(id)")
    }

    func standings(competitionId: String) async throws -> VaraEnvelope<Standings> {
        try await get("v1/competitions/\(competitionId)/standings")
    }

    func matches(competitionId: String, status: String = "last", count: Int = 12) async throws -> VaraEnvelope<[Match]> {
        try await get("v1/competitions/\(competitionId)/matches?status=\(status)&count=\(count)")
    }

    func competitions() async throws -> VaraEnvelope<[CompetitionSummary]> {
        try await get("v1/competitions")
    }

    func matchesToday() async throws -> VaraEnvelope<[MatchDayGroup]> {
        try await get("v1/matches/today")
    }

    func matchesOnDate(_ date: String) async throws -> VaraEnvelope<[MatchDayGroup]> {
        try await get("v1/matches/date/\(date)")
    }

    func matchesLive() async throws -> VaraEnvelope<[MatchDayGroup]> {
        try await get("v1/matches/live")
    }

    /// One competition's fixtures on a given day (defaults to today on the server).
    func competitionMatchDay(competitionId: String, date: String? = nil) async throws -> VaraEnvelope<[Match]> {
        let suffix = date.map { "?date=\($0)" } ?? ""
        return try await get("v1/competitions/\(competitionId)/matchday\(suffix)")
    }

    func bracket(competitionId: String) async throws -> VaraEnvelope<[BracketStage]> {
        try await get("v1/competitions/\(competitionId)/bracket")
    }

    func teamFixtures(teamId: String, competition: String) async throws -> VaraEnvelope<TeamFixtures> {
        try await get("v1/teams/\(teamId)/fixtures?competition=\(competition)")
    }

    func topScorers(competitionId: String, metric: String) async throws -> VaraEnvelope<[TopScorer]> {
        try await get("v1/competitions/\(competitionId)/topscorers?metric=\(metric)")
    }

    func teams(competitionId: String) async throws -> VaraEnvelope<[TeamProfile]> {
        try await get("v1/competitions/\(competitionId)/teams")
    }

    func team(id: String) async throws -> VaraEnvelope<TeamProfile> {
        try await get("v1/teams/\(id)")
    }

    func squad(teamId: String) async throws -> VaraEnvelope<TeamSquad> {
        try await get("v1/teams/\(teamId)/squad")
    }

    func player(id: String) async throws -> VaraEnvelope<PlayerProfile> {
        try await get("v1/players/\(id)")
    }

    private func get<T: Decodable>(_ path: String) async throws -> T {
        // Build the URL from a full string so query strings (?status=…) are preserved.
        // (appendingPathComponent percent-encodes "?", which would break query params.)
        guard let url = URL(string: baseURL.absoluteString + "/" + path) else {
            throw VaraError.badStatus(-1)
        }
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse else { throw VaraError.badStatus(-1) }
        guard http.statusCode == 200 else {
            if let err = try? decoder.decode([String: String].self, from: data), let msg = err["error"] {
                throw VaraError.server(msg)
            }
            throw VaraError.badStatus(http.statusCode)
        }
        return try decoder.decode(T.self, from: data)
    }
}
