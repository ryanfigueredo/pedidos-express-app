import UIKit

/// Define qual interface principal mostrar (abas) e define como root da window.
/// Chamar após login confirmado e no AppDelegate/SceneDelegate após validar credenciais.
enum AppRouter {

    /// Cria o MainNavigationViewController (TabBar) com abas corretas para o business_type atual
    /// (Agenda/Serviços/Atendimento para barbeiro; Pedidos/Cardápio/Suporte para restaurante).
    static func showMainInterface() -> UIViewController {
        let tabBar = MainNavigationViewController()
        tabBar.setupTabBar()
        tabBar.applyThemeForCurrentBusinessType()
        return tabBar
    }

    /// Substitui a root da window pela interface principal (login já validado).
    /// Usar após login bem-sucedido ou quando o app abre com usuário logado.
    static func setRootToMainInterface() {
        guard let window = Self.keyWindow() else { return }
        let main = showMainInterface()
        window.rootViewController = main
        window.makeKeyAndVisible()
    }

    /// Retorna a key window (AppDelegate ou SceneDelegate).
    private static func keyWindow() -> UIWindow? {
        if #available(iOS 13.0, *) {
            return UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }
        }
        return UIApplication.shared.keyWindow
    }
}
