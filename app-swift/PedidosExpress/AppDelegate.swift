import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    /// Usado apenas quando o app roda sem UIScene (iOS 12 ou config sem cena).
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        print("🚀 AppDelegate: Iniciando aplicação...")
        if #available(iOS 13.0, *) {
            // Window será criada pelo SceneDelegate (UIScene lifecycle)
        } else {
            window = UIWindow(frame: UIScreen.main.bounds)
            window?.backgroundColor = .systemBackground
            let authService = AuthService()
            window?.rootViewController = authService.isLoggedIn()
                ? AppRouter.showMainInterface()
                : UINavigationController(rootViewController: LoginViewController())
            window?.makeKeyAndVisible()
        }
        return true
    }

    /// Conectar cena (iOS 13+): a window é criada pelo SceneDelegate; não criar aqui para adotar UIScene lifecycle.
    @available(iOS 13.0, *)
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return connectingSceneSession.configuration
    }
}
