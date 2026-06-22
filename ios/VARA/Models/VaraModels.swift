import Foundation

// Mirrors the VARA Edge unified schema (server/src/types.ts).

enum Sport: String, Codable {
    case football, esports
    case unknown
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Sport(rawValue: raw) ?? .unknown
    }
}

enum MatchState: String, Codable {
    case scheduled, live, finished, postponed, cancelled
    case unknown
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = MatchState(rawValue: raw) ?? .unknown
    }
}

struct Team: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let shortName: String?
    let logo: String?
}

struct Competition: Codable, Hashable {
    let id: String
    let name: String
    let country: String?
    let logo: String?
}

struct StandingRow: Codable, Identifiable, Hashable {
    var id: String { team.id }
    let rank: Int
    let team: Team
    let played: Int
    let win: Int
    let draw: Int
    let lose: Int
    let goalsFor: Int
    let goalsAgainst: Int
    let goalsDiff: Int
    let points: Int
    let form: String?
    let group: String?
}

struct Standings: Codable {
    let competition: Competition
    let rows: [StandingRow]
    let grouped: Bool?
}

struct MatchSide: Codable, Hashable {
    let team: Team
    let score: Int?
}

struct Match: Codable, Identifiable, Hashable {
    let id: String
    let competitionId: String
    let sport: Sport
    let state: MatchState
    let minute: Int?
    let liveStartedAt: Double?
    let liveBase: Int?
    let startTime: String
    let round: String?
    let venue: String?
    let home: MatchSide
    let away: MatchSide

    /// Real-time live minute computed locally from the ticking period's start, so the
    /// clock advances every second with zero caching/polling lag. Falls back to the
    /// server snapshot when the timestamp is unavailable.
    var currentMinute: Int? {
        guard state == .live else { return minute }
        guard let started = liveStartedAt, let base = liveBase else { return minute }
        let elapsed = Int((Date().timeIntervalSince1970 - started) / 60)
        return base + max(0, elapsed)
    }
}

enum MatchEventType: String, Codable {
    case goal, card, subst, varCheck = "var", other
    case unknown
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = MatchEventType(rawValue: raw) ?? .unknown
    }
}

enum Side: String, Codable {
    case home, away
}

struct MatchEvent: Codable, Identifiable, Hashable {
    var id: String { "\(minute)-\(side.rawValue)-\(detail)-\(player ?? "")" }
    let minute: Int
    let extraMinute: Int?
    let side: Side
    let type: MatchEventType
    let detail: String
    let player: String?
    let assist: String?
    let isVar: Bool
}

struct MatchStat: Codable, Identifiable, Hashable {
    var id: String { key }
    let key: String
    let label: String
    let home: StatValue?
    let away: StatValue?
}

/// API returns stat values as either numbers ("62") or percent strings ("62%").
enum StatValue: Codable, Hashable {
    case number(Double)
    case text(String)

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let d = try? c.decode(Double.self) { self = .number(d) }
        else if let s = try? c.decode(String.self) { self = .text(s) }
        else { self = .text("-") }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .number(let d): try c.encode(d)
        case .text(let s): try c.encode(s)
        }
    }

    var display: String {
        switch self {
        case .number(let d): return d == d.rounded() ? String(Int(d)) : String(format: "%.2f", d)
        case .text(let s): return s
        }
    }
    /// Numeric magnitude for comparison bars (handles "62%" → 62).
    var magnitude: Double {
        switch self {
        case .number(let d): return d
        case .text(let s): return Double(s.replacingOccurrences(of: "%", with: "").trimmingCharacters(in: .whitespaces)) ?? 0
        }
    }
}

struct LineupPlayer: Codable, Identifiable, Hashable {
    var id: String { "\(number ?? 0)-\(name)" }
    let number: Int?
    let name: String
    let pos: String?
}

struct Lineup: Codable, Hashable {
    let side: Side
    let formation: String?
    let startXI: [LineupPlayer]
    let substitutes: [LineupPlayer]
    let coach: String?
}

struct Lineups: Codable, Hashable {
    let home: Lineup?
    let away: Lineup?
}

struct TeamPair: Codable, Hashable {
    let home: Double?
    let away: Double?
}

struct MatchDetail: Codable {
    let match: Match
    let competitionName: String
    let events: [MatchEvent]
    let stats: [MatchStat]
    let lineups: Lineups
    let xg: TeamPair?
    let pressure: TeamPair?
}

struct MatchDetailResponse: Codable {
    let source: String
    let cached: Bool
    let data: MatchDetail
}

// ——— Catalog models ———

struct CompetitionSummary: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let shortName: String?
    let country: String?
    let logo: String?
    let currentSeason: CodableValue?
}

/// currentSeason may be a string ("2026/2027") or a number.
enum CodableValue: Codable, Hashable {
    case string(String), number(Double), none
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let s = try? c.decode(String.self) { self = .string(s) }
        else if let d = try? c.decode(Double.self) { self = .number(d) }
        else { self = .none }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .number(let d): try c.encode(d)
        case .none: try c.encodeNil()
        }
    }
    var display: String {
        switch self {
        case .string(let s): return s
        case .number(let d): return d == d.rounded() ? String(Int(d)) : String(d)
        case .none: return ""
        }
    }
}

struct PlayerRef: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let photo: String?
}

struct TopScorer: Codable, Identifiable, Hashable {
    var id: String { "\(rank)-\(player.id)" }
    let rank: Int
    let player: PlayerRef
    let team: Team
    let total: Int
    let metric: String
}

struct PlayerStatItem: Codable, Identifiable, Hashable {
    var id: String { key }
    let key: String
    let label: String
    let value: StatValue
}

struct PlayerSeasonStats: Codable, Hashable {
    let seasonId: String
    let seasonName: String?
    let competition: String?
    let items: [PlayerStatItem]
}

struct PlayerProfile: Codable, Hashable {
    let id: String
    let name: String
    let photo: String?
    let position: String?
    let detailedPosition: String?
    let nationality: String?
    let dateOfBirth: String?
    let age: Int?
    let height: Int?
    let weight: Int?
    let teams: [String]
    let stats: PlayerSeasonStats?
}

struct Venue: Codable, Hashable {
    let name: String?
    let city: String?
    let capacity: Int?
}

struct TeamProfile: Codable, Hashable, Identifiable {
    var id: String { team.id }
    let team: Team
    let founded: Int?
    let country: String?
    let venue: Venue?
}

struct SquadPlayer: Codable, Identifiable, Hashable {
    var id: String { player.id }
    let player: PlayerRef
    let number: Int?
    let position: String?
    let nationality: String?
    let captain: Bool?
}

struct TeamSquad: Codable, Hashable {
    let team: Team
    let players: [SquadPlayer]
}

// ——— Match-day (today / by-date / live) ———

struct MatchDayCompetition: Codable, Hashable, Identifiable {
    let id: String
    let name: String
    let logo: String?
}

struct MatchDayGroup: Codable, Hashable, Identifiable {
    var id: String { competition.id }
    let competition: MatchDayCompetition
    let matches: [Match]
}

// ——— World Cup: bracket + favourite team ———

struct BracketStage: Codable, Hashable, Identifiable {
    let id: String
    let name: String
    let matches: [Match]
}

struct TeamFixtures: Codable, Hashable {
    let team: Team
    let competition: String?
    let group: String?
    let rank: Int?
    let fixtures: [Match]
}

// Generic envelope for the catalog endpoints.
struct VaraEnvelope<T: Codable>: Codable {
    let source: String
    let cached: Bool
    let data: T
}

// Envelope shapes returned by VARA Edge.
struct OverviewData: Codable {
    let standings: Standings
    let results: [Match]
}

struct OverviewResponse: Codable {
    let source: String
    let fetchedAt: String
    let cached: Bool
    let data: OverviewData
}
