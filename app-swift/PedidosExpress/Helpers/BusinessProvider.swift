import UIKit

/// Identifica o tipo de negócio do usuário logado e fornece tema (cores, corner radius).
/// Use para decidir entre interface Restaurante ou Barbeiro sem duplicar lógica.
enum BusinessProvider {
    static var currentUser: User? {
        AuthService().getUser()
    }

    private static var effectiveBusinessType: String? {
        AuthService().getBusinessType()
    }

    static var isBarber: Bool {
        effectiveBusinessType?.uppercased() == "BARBEIRO"
    }

    static var isRestaurant: Bool {
        let bt = effectiveBusinessType?.uppercased()
        return bt == "RESTAURANTE" || bt == nil
    }

    // MARK: - Tema visual (unificado para todos os tenants – apenas logo difere)

    static var primaryColor: UIColor { .appPrimaryBlack }
    static var backgroundColor: UIColor { .appBackgroundOffWhite }
    static var cardBackgroundColor: UIColor { .appCardWhite }
    static var cardCornerRadius: CGFloat { 12 }
    static var textPrimaryColor: UIColor { .appTitleBlack }
    static var textSecondaryColor: UIColor { .appSubtitleGray }
}
