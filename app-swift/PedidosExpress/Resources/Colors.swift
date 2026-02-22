import UIKit

// MARK: - Paleta unificada (pedidos.dmtn.com.br – Minimalista Premium)
extension UIColor {
    /// Fundo geral: off-white
    static let appBackgroundOffWhite = UIColor(red: 248/255, green: 249/255, blue: 250/255, alpha: 1.0) // #F8F9FA
    /// Botão primário: preto
    static let appPrimaryBlack = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0) // #000000
    /// Cards / superfícies secundárias: branco puro
    static let appCardWhite = UIColor(red: 1, green: 1, blue: 1, alpha: 1.0) // #FFFFFF
    /// Títulos: preto puro
    static let appTitleBlack = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0) // #000000
    /// Subtítulos: cinza escuro
    static let appSubtitleGray = UIColor(red: 74/255, green: 74/255, blue: 74/255, alpha: 1.0) // #4A4A4A
    /// Grade de horários (Agenda): cinza claríssimo
    static let appGridLineLight = UIColor(red: 233/255, green: 236/255, blue: 239/255, alpha: 1.0) // #E9ECEF
    /// Sombra padrão para cards: opacity 0.05, radius 5, offset (0,2)
    static let appShadowColor = UIColor.black

    // Cores principais do tema laranja (legado – uso apenas logo/tenant se necessário)
    static let pedidosOrange = UIColor(red: 234/255, green: 88/255, blue: 12/255, alpha: 1.0) // #ea580c
    static let pedidosOrangeDark = UIColor(red: 194/255, green: 65/255, blue: 12/255, alpha: 1.0) // #c2410c
    static let pedidosOrangeLight = UIColor(red: 255/255, green: 247/255, blue: 237/255, alpha: 1.0) // #fff7ed
    
    // Gradientes para cards
    static let gradientOrangeStart = UIColor(red: 234/255, green: 88/255, blue: 12/255, alpha: 1.0) // #ea580c
    static let gradientOrangeEnd = UIColor(red: 249/255, green: 115/255, blue: 22/255, alpha: 1.0) // #f97316
    static let gradientGreenStart = UIColor(red: 34/255, green: 197/255, blue: 94/255, alpha: 1.0) // #22c55e
    static let gradientGreenEnd = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0) // #10b981
    static let gradientPurpleStart = UIColor(red: 168/255, green: 85/255, blue: 247/255, alpha: 1.0) // #a855f7
    static let gradientPurpleEnd = UIColor(red: 139/255, green: 92/255, blue: 246/255, alpha: 1.0) // #8b5cf6
    static let gradientRedStart = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0) // #ef4444
    static let gradientRedEnd = UIColor(red: 220/255, green: 38/255, blue: 38/255, alpha: 1.0) // #dc2626
    
    // Cores de texto
    static let pedidosTextPrimary = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0) // #111827
    static let pedidosTextSecondary = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0) // #6b7280

    // Tema escuro – Schedule (Barbeiro): alinhado ao tema barbeiro (preto + #1C1C1E)
    static let scheduleBackground = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0)             // #000000
    static let scheduleCard = UIColor(red: 28/255, green: 28/255, blue: 30/255, alpha: 1.0)  // #1C1C1E
    static let scheduleCurrentTimeLine = UIColor(red: 212/255, green: 175/255, blue: 55/255, alpha: 1.0) // #D4AF37
    static let scheduleTextPrimary = UIColor(red: 1, green: 1, blue: 1, alpha: 1.0) // #FFFFFF
    static let scheduleTextSecondary = UIColor(red: 163/255, green: 163/255, blue: 163/255, alpha: 1.0) // #A3A3A3
    /// Horários da timeline: mais claro que secondary para contraste no preto (#C4C4C4)
    static let scheduleTimeLabel = UIColor(red: 196/255, green: 196/255, blue: 196/255, alpha: 1.0) // #C4C4C4
    /// Linhas entre slots: visível mas sutil (#2E2E2E)
    static let scheduleSeparator = UIColor(red: 46/255, green: 46/255, blue: 46/255, alpha: 1.0) // #2E2E2E
    static let scheduleDaySelected = UIColor(red: 212/255, green: 175/255, blue: 55/255, alpha: 1.0) // #D4AF37
    static let scheduleBadgeConfirmed = UIColor(red: 34/255, green: 197/255, blue: 94/255, alpha: 1.0)
    static let scheduleBadgePending = UIColor(red: 234/255, green: 179/255, blue: 8/255, alpha: 1.0)

    // Tema Barbeiro: fundo preto absoluto, cards #1C1C1E, texto branco / descrição #8E8E93, destaques #D4AF37
    static let barberPrimary = UIColor(red: 212/255, green: 175/255, blue: 55/255, alpha: 1.0)  // #D4AF37 (dourado)
    /// Fundo das telas (preto absoluto)
    static let barberScreenBackground = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0)        // #000000
    /// NavBar e TabBar: preto ou grafite muito escuro (opaco, sem vazamento)
    static let barberNavBackground = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0)           // #000000
    static let barberBackground = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0)               // #000000 (igual tela)
    static let barberChrome = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0)                  // #000000
    /// Cards e listas: cinza escuro (#1C1C1E)
    static let barberCard = UIColor(red: 28/255, green: 28/255, blue: 30/255, alpha: 1.0)    // #1C1C1E
    static let barberTextPrimary = UIColor(red: 1, green: 1, blue: 1, alpha: 1.0)            // #FFFFFF
    /// Descrições e texto secundário
    static let barberTextSecondary = UIColor(red: 142/255, green: 142/255, blue: 147/255, alpha: 1.0) // #8E8E93

    // Login Liquid Glass / DMTN
    static let loginGlassBackgroundDark = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)   // #0f172a
    static let loginGlassBlue = UIColor(red: 30/255, green: 58/255, blue: 138/255, alpha: 1.0)           // #1e3a8a
    static let loginGlassPurple = UIColor(red: 88/255, green: 28/255, blue: 135/255, alpha: 1.0)        // #581c87
    static let loginGlassViolet = UIColor(red: 109/255, green: 40/255, blue: 217/255, alpha: 1.0)       // #6d28d9
    static let dmtnBlue = UIColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0)                 // #2563eb - Azul DMTN
    static let loginInputBackground = UIColor.white.withAlphaComponent(0.1)
    static let loginTextOnGlass = UIColor.white
    static let loginPlaceholderOnGlass = UIColor.white.withAlphaComponent(0.6)
    static let loginForgotPasswordTint = UIColor(red: 147/255, green: 197/255, blue: 253/255, alpha: 1.0) // #93c5fd

    // Dark Modern Glass (Login referência)
    static let loginBackgroundDark = UIColor(red: 13/255, green: 13/255, blue: 13/255, alpha: 1.0) // #0D0D0D
    static let loginOrbPurple = UIColor(red: 180/255, green: 130/255, blue: 255/255, alpha: 1.0)   // lilás/roxo
    static let loginOrbBlue = UIColor(red: 50/255, green: 80/255, blue: 180/255, alpha: 1.0)      // azul profundo
    static let loginInputDark = UIColor.white.withAlphaComponent(0.05)
    static let loginForgotLilac = UIColor(red: 200/255, green: 170/255, blue: 255/255, alpha: 1.0) // lilás claro
    static let loginRoyalBlue = UIColor(red: 65/255, green: 105/255, blue: 225/255, alpha: 1.0)   // Azul Royal #4169E1
}

// Helper para criar gradientes
class GradientView: UIView {
    var startColor: UIColor = .gradientOrangeStart
    var endColor: UIColor = .gradientOrangeEnd
    var direction: GradientDirection = .topToBottom
    var cornerRadius: CGFloat = 16

    enum GradientDirection {
        case topToBottom
        case leftToRight
        case diagonal
    }

    override class var layerClass: AnyClass {
        return CAGradientLayer.self
    }

    override func layoutSubviews() {
        super.layoutSubviews()

        guard let gradientLayer = layer as? CAGradientLayer else { return }

        gradientLayer.colors = [startColor.cgColor, endColor.cgColor]

        switch direction {
        case .topToBottom:
            gradientLayer.startPoint = CGPoint(x: 0.5, y: 0)
            gradientLayer.endPoint = CGPoint(x: 0.5, y: 1)
        case .leftToRight:
            gradientLayer.startPoint = CGPoint(x: 0, y: 0.5)
            gradientLayer.endPoint = CGPoint(x: 1, y: 0.5)
        case .diagonal:
            gradientLayer.startPoint = CGPoint(x: 0, y: 0)
            gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        }

        gradientLayer.cornerRadius = cornerRadius
    }
}
