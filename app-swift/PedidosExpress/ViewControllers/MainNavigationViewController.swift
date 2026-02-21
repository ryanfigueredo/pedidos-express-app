import UIKit

class MainNavigationViewController: UITabBarController {

    /// Último valor de isBarber conhecido; usado em viewWillAppear para detectar mudança e recarregar abas.
    private var lastKnownIsBarber: Bool?

    override func viewDidLoad() {
        super.viewDidLoad()
        lastKnownIsBarber = BusinessProvider.isBarber
        if viewControllers == nil || viewControllers?.isEmpty == true {
            setupTabBar()
        }
        applyThemeForCurrentBusinessType()
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
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.pedidosOrange]

        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        UINavigationBar.appearance().tintColor = .pedidosOrange
        UINavigationBar.appearance().prefersLargeTitles = false
    }

    private func applyBarberTheme() {
        tabBar.tintColor = .barberPrimary
        tabBar.unselectedItemTintColor = .barberTextSecondary
        tabBar.backgroundColor = .barberBackground
        tabBar.barTintColor = .barberBackground

        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .barberBackground
        appearance.titleTextAttributes = [.foregroundColor: UIColor.barberPrimary]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.barberPrimary]

        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        UINavigationBar.appearance().tintColor = .barberPrimary
        UINavigationBar.appearance().prefersLargeTitles = false
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
