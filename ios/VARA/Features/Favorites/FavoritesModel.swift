import SwiftUI
import Observation

/// Persists the user's favourite national team and the onboarding flag.
@MainActor
@Observable
final class FavoritesModel {
    static let worldCupId = "732"

    var teamId: String?
    var teamName: String?
    var teamLogo: String?
    var didOnboard: Bool

    private enum Key {
        static let id = "fav.team.id"
        static let name = "fav.team.name"
        static let logo = "fav.team.logo"
        static let onboarded = "fav.onboarded"
    }

    init() {
        let d = UserDefaults.standard
        teamId = d.string(forKey: Key.id)
        teamName = d.string(forKey: Key.name)
        teamLogo = d.string(forKey: Key.logo)
        didOnboard = d.bool(forKey: Key.onboarded)
    }

    var hasFavorite: Bool { teamId != nil }

    var favoriteTeam: Team? {
        guard let teamId, let teamName else { return nil }
        return Team(id: teamId, name: teamName, shortName: nil, logo: teamLogo)
    }

    func setFavorite(_ team: Team) {
        teamId = team.id
        teamName = team.name
        teamLogo = team.logo
        let d = UserDefaults.standard
        d.set(team.id, forKey: Key.id)
        d.set(team.name, forKey: Key.name)
        d.set(team.logo, forKey: Key.logo)
    }

    func clearFavorite() {
        teamId = nil; teamName = nil; teamLogo = nil
        let d = UserDefaults.standard
        d.removeObject(forKey: Key.id)
        d.removeObject(forKey: Key.name)
        d.removeObject(forKey: Key.logo)
    }

    func completeOnboarding() {
        didOnboard = true
        UserDefaults.standard.set(true, forKey: Key.onboarded)
    }
}
