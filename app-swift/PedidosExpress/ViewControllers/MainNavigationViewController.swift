import UIKit

class MainNavigationViewController: UITabBarController, UITabBarControllerDelegate {

    private var lastKnownIsBarber: Bool?

    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self
        lastKnownIsBarber = BusinessProvider.isBarber
        if viewControllers == nil || viewControllers?.isEmpty == true {
            setupTabBar()
        }
        applyThemeForCurrentBusinessType()
        applyThemeToCurrentTab()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        let currentIsBarber = BusinessProvider.isBarber
        if let last = lastKnownIsBarber, last != currentIsBarber {
            lastKnownIsBarber = currentIsBarber
            reloadTabBar()
        } else {
            lastKnownIsBarber = currentIsBarber
        }
        applyThemeToCurrentTab()
    }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        applyThemeToCurrentTab()
    }

    /// Garante que a nav bar da aba atual mantenha o tema (barbeiro = dourado/escuro).
    private func applyThemeToCurrentTab() {
        guard let nav = selectedViewController as? UINavigationController else { return }
        if BusinessProvider.isBarber {
            nav.navigationBar.tintColor = .barberPrimary
            nav.navigationBar.barTintColor = .barberChrome
            nav.navigationBar.isTranslucent = true
            nav.navigationBar.overrideUserInterfaceStyle = .dark
            let appearance = UINavigationBarAppearance()
            appearance.configureWithTransparentBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .dark)
            appearance.backgroundColor = UIColor.barberChrome.withAlphaComponent(0.72)
            appearance.titleTextAttributes = [.foregroundColor: UIColor.barberPrimary]
            nav.navigationBar.standardAppearance = appearance
            nav.navigationBar.scrollEdgeAppearance = appearance
            nav.navigationBar.compactAppearance = appearance
        }
    }

    /// Remove todas as abas e reconstrói com cores e labels corretas (Agenda, Serviços, Atendimento para barbeiro).
    func reloadTabBar() {
        viewControllers = nil
        setupTabBar()
        applyThemeForCurrentBusinessType()
    }

    /// Aplica tema (TabBar + NavBar) conforme BusinessProvider.isBarber.
    func applyThemeForCurrentBusinessType() {
        if BusinessProvider.isBarber {
            applyBarberTheme()
        } else {
            applyOrangeTheme()
        }
    }

    private func applyOrangeTheme() {
        tabBar.tintColor = .pedidosOrange
        tabBar.unselectedItemTintColor = .pedidosTextSecondary
        tabBar.backgroundColor = .systemBackground

        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .systemBackground
        appearance.titleTextAttributes = [.foregroundColor: UIColor.pedidosOrange]

        for case let nav as UINavigationController in viewControllers ?? [] {
            nav.navigationBar.standardAppearance = appearance
            nav.navigationBar.scrollEdgeAppearance = appearance
            nav.navigationBar.compactAppearance = appearance
            nav.navigationBar.tintColor = .pedidosOrange
            nav.navigationBar.barTintColor = .systemBackground
            nav.navigationBar.isTranslucent = false
            nav.navigationBar.prefersLargeTitles = false
        }
    }

    private func applyBarberTheme() {
        // Tab Bar: cinza grafite #121212 (separação do conteúdo preto)
        tabBar.tintColor = .barberPrimary
        tabBar.unselectedItemTintColor = .barberTextSecondary
        tabBar.backgroundColor = .barberChrome
        tabBar.barTintColor = .barberChrome

        // Nav Bar: blur (glassmorphism) + grafite #121212 – estilo Luxe/Apple
        let appearance = UINavigationBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundEffect = UIBlurEffect(style: .dark)
        appearance.backgroundColor = UIColor.barberChrome.withAlphaComponent(0.72)
        appearance.titleTextAttributes = [.foregroundColor: UIColor.barberPrimary]

        for case let nav as UINavigationController in viewControllers ?? [] {
            nav.navigationBar.standardAppearance = appearance
            nav.navigationBar.scrollEdgeAppearance = appearance
            nav.navigationBar.compactAppearance = appearance
            nav.navigationBar.tintColor = .barberPrimary
            nav.navigationBar.barTintColor = .barberChrome
            nav.navigationBar.isTranslucent = true
            nav.navigationBar.prefersLargeTitles = false
            nav.navigationBar.overrideUserInterfaceStyle = .dark
        }
    }
    
    /// Monta as abas (Agenda ou Pedidos, Dashboard, Serviços/Cardápio, Atendimento/Suporte, Config) conforme business_type.
    func setupTabBar() {
        let authService = AuthService()
        let user = authService.getUser()

        // Barbeiro: primeira aba = Schedule (Agenda). Restaurante/Dentista: Orders
        let firstVC: UIViewController
        let firstTabTitle: String
        if BusinessProvider.isBarber {
            firstVC = ScheduleViewController()
            firstTabTitle = BusinessTypeHelper.agendaTabLabel(for: user)
        } else {
            firstVC = OrdersViewController()
            firstTabTitle = BusinessTypeHelper.ordersLabel(for: user)
        }
        firstVC.tabBarItem = UITabBarItem(title: firstTabTitle, image: UIImage(systemName: "list.bullet"), tag: 0)

        let dashboardVC = DashboardViewController()
        dashboardVC.tabBarItem = UITabBarItem(title: "Dashboard", image: UIImage(systemName: "chart.bar"), tag: 1)

        let menuVC = MenuViewController()
        let menuLabel = BusinessTypeHelper.menuLabel(for: user)
        menuVC.tabBarItem = UITabBarItem(title: menuLabel, image: UIImage(systemName: "menucard"), tag: 2)

        let supportVC = SupportViewController()
        let supportTabTitle = BusinessTypeHelper.supportTabLabel(for: user)
        supportVC.tabBarItem = UITabBarItem(title: supportTabTitle, image: UIImage(systemName: "message"), tag: 3)

        let settingsVC = SettingsViewController()
        settingsVC.tabBarItem = UITabBarItem(title: "Config", image: UIImage(systemName: "gearshape"), tag: 4)

        viewControllers = [
            UINavigationController(rootViewController: firstVC),
            UINavigationController(rootViewController: dashboardVC),
            UINavigationController(rootViewController: menuVC),
            UINavigationController(rootViewController: supportVC),
            UINavigationController(rootViewController: settingsVC)
        ]

        selectedIndex = 0
    }
}
