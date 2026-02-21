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

    // MARK: - Tema visual

    /// Cor primária (accent): barbeiro = dourado, restaurante = laranja
    static var primaryColor: UIColor {
        isBarber ? .barberPrimary : .pedidosOrange
    }

    /// Fundo da tela: barbeiro = dark, restaurante = claro
    static var backgroundColor: UIColor {
        isBarber ? .barberBackground : .pedidosOrangeLight
    }

    /// Fundo de cards: barbeiro = #1E1E1E, restaurante = systemBackground
    static var cardBackgroundColor: UIColor {
        isBarber ? .barberCard : .systemBackground
    }

    /// Corner radius dos cards: barbeiro = estilo Squire (mais quadrado), restaurante = 16
    static var cardCornerRadius: CGFloat {
        isBarber ? 8 : 16
    }

    /// Cor do texto principal
    static var textPrimaryColor: UIColor {
        isBarber ? .barberTextPrimary : .pedidosTextPrimary
    }

    /// Cor do texto secundário
    static var textSecondaryColor: UIColor {
        isBarber ? .barberTextSecondary : .pedidosTextSecondary
    }
}
