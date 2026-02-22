import UIKit

class DashboardViewController: UIViewController {
    private var scrollView: UIScrollView!
    private var contentView: UIView!
    
    // Labels para KPIs (restaurante: todos; barbeiro: hoje/semana + horários ocupados / próximo cliente)
    private var todayOrdersLabel: UILabel!
    private var todayRevenueLabel: UILabel!
    private var avgTicketLabel: UILabel!
    private var pendingOrdersLabel: UILabel!
    private var occupiedSlotsLabel: UILabel!
    private var nextClientLabel: UILabel!
    private var weekOrdersLabel: UILabel!
    private var weekRevenueLabel: UILabel!
    private var row2Stack: UIStackView?
    
    private var progressIndicator: UIActivityIndicatorView!
    
    private let apiService = ApiService()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Dashboard"
        navigationItem.largeTitleDisplayMode = .never
        setupUI()
        loadStats()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        view.backgroundColor = BusinessProvider.backgroundColor
        if BusinessProvider.isBarber {
            navigationItem.rightBarButtonItem = nil
            navigationItem.rightBarButtonItems = nil
            navigationItem.leftBarButtonItem = nil
            navigationItem.leftBarButtonItems = nil
        }
        applyNavigationBarTheme()
        loadStats()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .default }

    private func applyNavigationBarTheme() {
        guard let navBar = navigationController?.navigationBar else { return }
        navBar.tintColor = .appPrimaryBlack
        navBar.barTintColor = .appCardWhite
        navBar.isTranslucent = false
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .appCardWhite
        appearance.titleTextAttributes = [.foregroundColor: UIColor.appTitleBlack]
        navBar.standardAppearance = appearance
        navBar.scrollEdgeAppearance = appearance
        navBar.compactAppearance = appearance
    }
    
    private func setupUI() {
        view.backgroundColor = BusinessProvider.backgroundColor

        scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.showsVerticalScrollIndicator = false

        contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false

        scrollView.addSubview(contentView)
        view.addSubview(scrollView)

        let kpiStack = UIStackView()
        kpiStack.axis = .vertical
        kpiStack.spacing = 16
        kpiStack.translatesAutoresizingMaskIntoConstraints = false

        let user = AuthService().getUser()
        let isBarber = BusinessProvider.isBarber

        // Primeira linha: Pedidos/Agendamentos Hoje e Receita Hoje
        let row1 = createKPIStack()
        let card1 = createKPICard(
            icon: "cart.fill",
            value: "0",
            title: BusinessTypeHelper.ordersTodayLabel(for: user),
            gradientStart: .appPrimaryBlack,
            gradientEnd: .appPrimaryBlack
        )
        todayOrdersLabel = card1.valueLabel

        let card2 = createKPICard(
            icon: "dollarsign.circle.fill",
            value: "R$ 0,00",
            title: "Receita Hoje",
            gradientStart: .gradientGreenStart,
            gradientEnd: .gradientGreenEnd
        )
        todayRevenueLabel = card2.valueLabel

        row1.addArrangedSubview(card1.container)
        row1.addArrangedSubview(card2.container)

        kpiStack.addArrangedSubview(row1)

        // Segunda linha: Restaurante = Ticket Médio + Pendentes; Barbeiro = Horários Ocupados + Próximo Cliente
        let row2 = createKPIStack()
        row2Stack = row2
        if isBarber {
            let card3 = createKPICard(
                icon: "calendar.badge.clock",
                value: "0",
                title: "Horários Ocupados",
                gradientStart: .appPrimaryBlack,
                gradientEnd: .appPrimaryBlack
            )
            occupiedSlotsLabel = card3.valueLabel

            let card4 = createKPICard(
                icon: "person.fill",
                value: "—",
                title: "Próximo Cliente",
                gradientStart: .appCardWhite,
                gradientEnd: .appCardWhite
            )
            nextClientLabel = card4.valueLabel
            card4.container.backgroundColor = .appCardWhite

            row2.addArrangedSubview(card3.container)
            row2.addArrangedSubview(card4.container)
        } else {
            let card3 = createKPICard(
                icon: "receipt.fill",
                value: "R$ 0,00",
                title: "Ticket Médio",
                gradientStart: .gradientPurpleStart,
                gradientEnd: .gradientPurpleEnd
            )
            avgTicketLabel = card3.valueLabel

            let card4 = createKPICard(
                icon: "clock.fill",
                value: "0",
                title: "Pendentes",
                gradientStart: .gradientRedStart,
                gradientEnd: .gradientRedEnd
            )
            pendingOrdersLabel = card4.valueLabel

            row2.addArrangedSubview(card3.container)
            row2.addArrangedSubview(card4.container)
        }

        kpiStack.addArrangedSubview(row2)

        let weekCard = createWeekCard()

        contentView.addSubview(kpiStack)
        contentView.addSubview(weekCard)
        
        progressIndicator = UIActivityIndicatorView(style: .large)
        progressIndicator.translatesAutoresizingMaskIntoConstraints = false
        progressIndicator.hidesWhenStopped = true
        progressIndicator.color = .appPrimaryBlack
        view.addSubview(progressIndicator)
        
        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            
            kpiStack.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 20),
            kpiStack.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            kpiStack.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            
            weekCard.topAnchor.constraint(equalTo: kpiStack.bottomAnchor, constant: 16),
            weekCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            weekCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            weekCard.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -20),
            
            progressIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            progressIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    private func createKPIStack() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 8
        stack.distribution = .fillEqually
        stack.translatesAutoresizingMaskIntoConstraints = false
        return stack
    }
    
    private func createKPICard(icon: String, value: String, title: String, gradientStart: UIColor, gradientEnd: UIColor) -> (container: UIView, valueLabel: UILabel) {
        let container = UIView()
        container.backgroundColor = BusinessProvider.cardBackgroundColor
        container.layer.cornerRadius = BusinessProvider.cardCornerRadius
        container.layer.shadowColor = UIColor.black.cgColor
        container.layer.shadowOffset = CGSize(width: 0, height: 4)
        container.layer.shadowRadius = 8
        container.layer.shadowOpacity = BusinessProvider.isBarber ? 0.2 : 0.1
        container.translatesAutoresizingMaskIntoConstraints = false

        let gradientView = GradientView()
        gradientView.startColor = gradientStart
        gradientView.endColor = gradientEnd
        gradientView.direction = .diagonal
        gradientView.cornerRadius = BusinessProvider.cardCornerRadius
        gradientView.translatesAutoresizingMaskIntoConstraints = false
        
        let iconImageView = UIImageView()
        iconImageView.image = UIImage(systemName: icon)
        iconImageView.tintColor = .white
        iconImageView.contentMode = .scaleAspectFit
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        
        let valueLabel = UILabel()
        valueLabel.text = value
        valueLabel.font = .systemFont(ofSize: 28, weight: .bold)
        valueLabel.textColor = .white
        valueLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let titleLabel = UILabel()
        titleLabel.text = title
        titleLabel.font = .systemFont(ofSize: 12)
        titleLabel.textColor = .white.withAlphaComponent(0.9)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let contentStack = UIStackView(arrangedSubviews: [iconImageView, valueLabel, titleLabel])
        contentStack.axis = .vertical
        contentStack.spacing = 8
        contentStack.alignment = .leading
        contentStack.translatesAutoresizingMaskIntoConstraints = false

        let iconH = iconImageView.heightAnchor.constraint(equalToConstant: 32)
        let iconW = iconImageView.widthAnchor.constraint(equalToConstant: 32)
        iconW.priority = UILayoutPriority(999)
        NSLayoutConstraint.activate([iconH, iconW])

        container.addSubview(gradientView)
        gradientView.addSubview(contentStack)

        NSLayoutConstraint.activate([
            gradientView.topAnchor.constraint(equalTo: container.topAnchor),
            gradientView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            gradientView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            gradientView.bottomAnchor.constraint(equalTo: container.bottomAnchor),

            contentStack.topAnchor.constraint(equalTo: gradientView.topAnchor, constant: 16),
            contentStack.leadingAnchor.constraint(equalTo: gradientView.leadingAnchor, constant: 16),
            contentStack.trailingAnchor.constraint(lessThanOrEqualTo: gradientView.trailingAnchor, constant: -16),
            contentStack.bottomAnchor.constraint(equalTo: gradientView.bottomAnchor, constant: -16)
        ])
        
        return (container, valueLabel)
    }
    
    private func createWeekCard() -> UIView {
        let card = UIView()
        card.backgroundColor = BusinessProvider.cardBackgroundColor
        card.layer.cornerRadius = BusinessProvider.cardCornerRadius
        card.layer.shadowColor = UIColor.black.cgColor
        card.layer.shadowOffset = CGSize(width: 0, height: 4)
        card.layer.shadowRadius = 8
        card.layer.shadowOpacity = BusinessProvider.isBarber ? 0.2 : 0.1
        card.translatesAutoresizingMaskIntoConstraints = false

        let titleLabel = UILabel()
        titleLabel.text = "Esta Semana"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textColor = BusinessProvider.primaryColor
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        weekOrdersLabel = UILabel()
        weekOrdersLabel.text = "0"
        weekOrdersLabel.font = .systemFont(ofSize: 18, weight: .bold)
        weekOrdersLabel.textColor = BusinessProvider.textPrimaryColor

        weekRevenueLabel = UILabel()
        weekRevenueLabel.text = "R$ 0,00"
        weekRevenueLabel.font = .systemFont(ofSize: 18, weight: .bold)
        weekRevenueLabel.textColor = BusinessProvider.textPrimaryColor
        
        let user = AuthService().getUser()
        let ordersLabel = BusinessTypeHelper.ordersLabel(for: user)
        let ordersRow = createInfoRow(label: "\(ordersLabel):", valueLabel: weekOrdersLabel)
        let revenueRow = createInfoRow(label: "Receita:", valueLabel: weekRevenueLabel)
        
        let stack = UIStackView(arrangedSubviews: [titleLabel, ordersRow, revenueRow])
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        
        card.addSubview(stack)
        
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -20),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -20)
        ])
        
        return card
    }
    
    private func createInfoRow(label: String, valueLabel: UILabel) -> UIView {
        let container = UIView()
        
        let labelView = UILabel()
        labelView.text = label
        labelView.font = .systemFont(ofSize: 16)
        labelView.textColor = BusinessProvider.textSecondaryColor
        
        valueLabel.translatesAutoresizingMaskIntoConstraints = false
        labelView.translatesAutoresizingMaskIntoConstraints = false
        container.translatesAutoresizingMaskIntoConstraints = false
        
        container.addSubview(labelView)
        container.addSubview(valueLabel)
        
        NSLayoutConstraint.activate([
            labelView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            labelView.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            
            valueLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            valueLabel.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            
            container.heightAnchor.constraint(equalToConstant: 24)
        ])
        
        return container
    }
    
    private func loadStats() {
        progressIndicator.startAnimating()
        
        Task {
            do {
                let stats = try await apiService.getStats()
                
                #if DEBUG
                print("📊 Dashboard.loadStats: Recebidos stats - today.orders=\(stats.today.orders), today.revenue=\(stats.today.revenue)")
                #endif
                
                await MainActor.run {
                    self.updateUI(with: stats)
                    self.progressIndicator.stopAnimating()
                }
            } catch {
                await MainActor.run {
                    self.progressIndicator.stopAnimating()
                    
                    // Mensagem mais amigável
                    var errorMessage = "Erro ao carregar estatísticas."
                    if let urlError = error as? URLError {
                        switch urlError.code {
                        case .notConnectedToInternet, .networkConnectionLost:
                            errorMessage = "Sem conexão com a internet. Verifique sua conexão."
                        case .timedOut:
                            errorMessage = "Tempo de conexão esgotado. Tente novamente."
                        default:
                            errorMessage = "Erro de conexão: \(urlError.localizedDescription)"
                        }
                    } else {
                        errorMessage = "Erro: \(error.localizedDescription)"
                    }
                    
                    // Não mostrar alerta se for erro de rede silencioso
                    // Apenas manter valores padrão (0)
                    print("⚠️ Dashboard: \(errorMessage)")
                }
            }
        }
    }
    
    private func updateUI(with stats: DashboardStats) {
        #if DEBUG
        print("📊 Dashboard.updateUI: today.orders=\(stats.today.orders), today.revenue=\(stats.today.revenue)")
        print("   week.orders=\(stats.week.orders), week.revenue=\(stats.week.revenue), pending=\(stats.pendingOrders)")
        #endif

        todayOrdersLabel.text = "\(stats.today.orders)"

        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        formatter.currencySymbol = "R$"

        let todayRevenueText = formatter.string(from: NSNumber(value: stats.today.revenue)) ?? "R$ 0,00"
        todayRevenueLabel.text = todayRevenueText

        weekOrdersLabel.text = "\(stats.week.orders)"
        let weekRevenueText = formatter.string(from: NSNumber(value: stats.week.revenue)) ?? "R$ 0,00"
        weekRevenueLabel.text = weekRevenueText

        if BusinessProvider.isBarber {
            occupiedSlotsLabel?.text = "\(stats.today.orders)"
            nextClientLabel?.text = "—"
        } else {
            pendingOrdersLabel?.text = "\(stats.pendingOrders)"
            let avgTicket = stats.today.orders > 0 ? stats.today.revenue / Double(stats.today.orders) : 0.0
            let avgTicketText = formatter.string(from: NSNumber(value: avgTicket)) ?? "R$ 0,00"
            avgTicketLabel?.text = avgTicketText
        }

        #if DEBUG
        print("   📊 Labels atualizados: hoje=\(todayRevenueText), semana=\(weekRevenueText)")
        #endif
    }
    
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
