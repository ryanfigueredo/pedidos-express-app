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

    private func applyThemeToCurrentTab() {
        guard let nav = selectedViewController as? UINavigationController else { return }
        nav.navigationBar.tintColor = .appPrimaryBlack
        nav.navigationBar.barTintColor = .appCardWhite
        nav.navigationBar.isTranslucent = false
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .appCardWhite
        appearance.titleTextAttributes = [.foregroundColor: UIColor.appTitleBlack]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.appTitleBlack]
        nav.navigationBar.standardAppearance = appearance
        nav.navigationBar.scrollEdgeAppearance = appearance
        nav.navigationBar.compactAppearance = appearance
    }

    /// Remove todas as abas e reconstrói com cores e labels corretas (Agenda, Serviços, Atendimento para barbeiro).
    func reloadTabBar() {
        viewControllers = nil
        setupTabBar()
        applyThemeForCurrentBusinessType()
    }

    func applyThemeForCurrentBusinessType() {
        tabBar.tintColor = .appPrimaryBlack
        tabBar.unselectedItemTintColor = .appSubtitleGray
        tabBar.backgroundColor = .appCardWhite
        tabBar.barTintColor = .appCardWhite

        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .appCardWhite
        appearance.titleTextAttributes = [.foregroundColor: UIColor.appTitleBlack]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.appTitleBlack]

        for case let nav as UINavigationController in viewControllers ?? [] {
            nav.navigationBar.standardAppearance = appearance
            nav.navigationBar.scrollEdgeAppearance = appearance
            nav.navigationBar.compactAppearance = appearance
            nav.navigationBar.tintColor = .appPrimaryBlack
            nav.navigationBar.barTintColor = .appCardWhite
            nav.navigationBar.isTranslucent = false
            nav.navigationBar.prefersLargeTitles = false
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
