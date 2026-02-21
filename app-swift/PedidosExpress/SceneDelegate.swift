import UIKit

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    
    var window: UIWindow?
    
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else {
            print("⚠️ SceneDelegate: Não foi possível obter UIWindowScene")
            return
        }
        
        print("🚀 SceneDelegate: Configurando cena...")
        applyGlobalNavigationBarAppearance()
        
        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = .black
        
        let authService = AuthService()
        let isLoggedIn = authService.isLoggedIn()
        print("🔐 Usuário logado: \(isLoggedIn)")
        
        if isLoggedIn {
            window?.rootViewController = AppRouter.showMainInterface()
            print("✅ AppRouter: interface principal (tabs) definida como root")
        } else {
            let loginVC = LoginViewController()
            print("✅ LoginViewController criado programaticamente")
            window?.rootViewController = UINavigationController(rootViewController: loginVC)
        }
        
        window?.makeKeyAndVisible()
        print("✅ Window configurado e visível")
    }
    
    /// Configuração global da NavBar: fundo preto/grafite, títulos claros, opaco (evita telas “vazando” e barra branca).
    private func applyGlobalNavigationBarAppearance() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 1.0) // #000000
        appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        
        let navBar = UINavigationBar.appearance()
        navBar.standardAppearance = appearance
        navBar.scrollEdgeAppearance = appearance
        navBar.compactAppearance = appearance
        navBar.isTranslucent = false
        navBar.barTintColor = .black
        navBar.tintColor = .white
    }
}
