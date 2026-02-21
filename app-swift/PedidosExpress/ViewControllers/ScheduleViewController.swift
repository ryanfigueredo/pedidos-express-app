import UIKit

/// View de agenda (timeline) para barbeiro. Estilo Squire: cabeçalho de data centralizado [<] Data [>], timeline full width.
final class ScheduleViewController: UIViewController {

    private let apiService = ApiService()
    private var allOrders: [Order] = []
    private var selectedDate: Date = Date()
    private var appointmentsForSelectedDay: [Order] = []
    private let calendar = Calendar.current
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        return f
    }()
    private let headerDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "EEEE, d 'de' MMM" // "Quarta, 21 de Fev"
        return f
    }()

    private var dateHeaderContainer: UIView!
    private var dateLabel: UILabel!
    private var timelineScrollView: UIScrollView!
    private var timelineContentStack: UIStackView!
    private var timeRulerView: UIView!
    private var dayColumnView: UIView!
    private var refreshControl: UIRefreshControl!
    private var currentTimeLineView: UIView!
    private var currentTimeLineTopConstraint: NSLayoutConstraint?
    private var progressIndicator: UIActivityIndicatorView!
    private var emptyStateView: UIView!

    /// Timeline estilo Google Agenda: altura por hora e duração padrão do bloco
    private static let dateHeaderHeight: CGFloat = 56
    private static let startHour = 8
    private static let endHour = 20
    private static let pointsPerHour: CGFloat = 60
    private static let defaultDurationMinutes: Int = 30
    private static let timeRulerWidth: CGFloat = 56
    private static var timelineContentHeight: CGFloat {
        CGFloat(endHour - startHour) * pointsPerHour
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        if BusinessProvider.isBarber {
            overrideUserInterfaceStyle = .dark
        }
        title = BusinessProvider.isBarber ? "Agenda" : "Minha Agenda"
        view.backgroundColor = .scheduleBackground
        navigationItem.largeTitleDisplayMode = .never
        navigationItem.rightBarButtonItems = []
        navigationItem.leftBarButtonItems = []

        // Nav Bar: preto opaco, títulos dourados (tema barbeiro)
        let nav = navigationController?.navigationBar
        nav?.barTintColor = .barberNavBackground
        nav?.tintColor = .barberPrimary
        nav?.isTranslucent = false
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .barberNavBackground
        appearance.titleTextAttributes = [.foregroundColor: UIColor.barberPrimary]
        nav?.standardAppearance = appearance
        nav?.scrollEdgeAppearance = appearance
        nav?.compactAppearance = appearance

        setupDateHeader()
        setupEmptyState()
        setupTimeline()
        setupCurrentTimeLine()
        updateDateLabel()
        if BusinessProvider.isBarber {
            navigationItem.rightBarButtonItem = UIBarButtonItem(
                image: UIImage(systemName: "plus.circle.fill"),
                style: .plain,
                target: self,
                action: #selector(addManualAppointment)
            )
            navigationItem.rightBarButtonItem?.tintColor = .barberPrimary
        }
        NotificationCenter.default.addObserver(self, selector: #selector(onDidLogin), name: .pedidosDidLogin, object: nil)
        loadOrders()
    }

    @objc private func onDidLogin() {
        loadOrders()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationItem.largeTitleDisplayMode = .never
        if BusinessProvider.isBarber {
            navigationItem.rightBarButtonItem = UIBarButtonItem(
                image: UIImage(systemName: "plus.circle.fill"),
                style: .plain,
                target: self,
                action: #selector(addManualAppointment)
            )
            navigationItem.rightBarButtonItem?.tintColor = .barberPrimary
        }
    }

    @objc private func addManualAppointment() {
        let sheet = ManualAppointmentSheetViewController()
        sheet.onSave = { [weak self] name, phone, chosenDate, service in
            self?.createManualAppointment(customerName: name, customerPhone: phone, appointmentDate: chosenDate, service: service)
        }
        let nav = UINavigationController(rootViewController: sheet)
        nav.modalPresentationStyle = .pageSheet
        if let sheet = nav.sheetPresentationController {
            sheet.detents = [.medium(), .large()]
            sheet.prefersGrabberVisible = true
        }
        present(nav, animated: true)
    }

    private func createManualAppointment(customerName: String, customerPhone: String, appointmentDate chosenDate: Date, service: MenuItem?) {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let appointmentDateString = isoFormatter.string(from: chosenDate)
        let phoneNormalized = ManualAppointmentSheetViewController.normalizePhone(customerPhone)
        let phoneForApi = phoneNormalized.isEmpty ? "" : (phoneNormalized.hasPrefix("55") ? phoneNormalized : "55\(phoneNormalized)")

        progressIndicator.startAnimating()
        Task {
            do {
                try await apiService.createAppointment(customerName: customerName, customerPhone: phoneForApi, appointmentDate: appointmentDateString, service: service)
                await MainActor.run {
                    progressIndicator.stopAnimating()
                    selectedDate = chosenDate
                    updateDateLabel()
                    filterAppointmentsForSelectedDay()
                    updateEmptyState()
                    updateTimelineBlocks()
                    loadOrders()
                    showMessage("Agendamento adicionado.") { [weak self] in
                        self?.loadOrders(for: chosenDate)
                    }
                }
            } catch let err as ApiError {
                await MainActor.run {
                    progressIndicator.stopAnimating()
                    showMessage(err.localizedDescription)
                }
            } catch {
                await MainActor.run {
                    progressIndicator.stopAnimating()
                    showMessage("Não foi possível criar o agendamento. Tente novamente.")
                }
            }
        }
    }

    /// Mostra um alerta. Se onDismiss for passado, é chamado quando o usuário toca em OK (útil para recarregar a lista após criar agendamento).
    private func showMessage(_ message: String, onDismiss: (() -> Void)? = nil) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            onDismiss?()
        })
        present(alert, animated: true)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        updateCurrentTimeLinePosition()
    }

    // MARK: - Cabeçalho de data (Squire: [<] Nome do dia e data [>]) — fundo escuro, letras douradas
    private func setupDateHeader() {
        dateHeaderContainer = UIView()
        dateHeaderContainer.translatesAutoresizingMaskIntoConstraints = false
        dateHeaderContainer.backgroundColor = .barberNavBackground
        view.addSubview(dateHeaderContainer)

        let leftButton = UIButton(type: .system)
        leftButton.setImage(UIImage(systemName: "chevron.left"), for: .normal)
        leftButton.tintColor = .barberPrimary
        leftButton.translatesAutoresizingMaskIntoConstraints = false
        leftButton.addTarget(self, action: #selector(previousDay), for: .touchUpInside)

        dateLabel = UILabel()
        dateLabel.font = .boldSystemFont(ofSize: 18)
        dateLabel.textColor = .barberPrimary
        dateLabel.textAlignment = .center
        dateLabel.translatesAutoresizingMaskIntoConstraints = false

        let rightButton = UIButton(type: .system)
        rightButton.setImage(UIImage(systemName: "chevron.right"), for: .normal)
        rightButton.tintColor = .barberPrimary
        rightButton.translatesAutoresizingMaskIntoConstraints = false
        rightButton.addTarget(self, action: #selector(nextDay), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [leftButton, dateLabel, rightButton])
        stack.axis = .horizontal
        stack.alignment = .center
        stack.distribution = .equalSpacing
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        dateHeaderContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            dateHeaderContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            dateHeaderContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            dateHeaderContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            dateHeaderContainer.heightAnchor.constraint(equalToConstant: Self.dateHeaderHeight),
            stack.centerXAnchor.constraint(equalTo: dateHeaderContainer.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: dateHeaderContainer.centerYAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: dateHeaderContainer.leadingAnchor, constant: 16),
            dateHeaderContainer.trailingAnchor.constraint(greaterThanOrEqualTo: stack.trailingAnchor, constant: 16),
            leftButton.widthAnchor.constraint(equalToConstant: 44),
            leftButton.heightAnchor.constraint(equalToConstant: 44),
            rightButton.widthAnchor.constraint(equalToConstant: 44),
            rightButton.heightAnchor.constraint(equalToConstant: 44),
        ])
    }

    private func updateDateLabel() {
        if calendar.isDateInToday(selectedDate) {
            let dayNameFormatter = DateFormatter()
            dayNameFormatter.locale = Locale(identifier: "pt_BR")
            dayNameFormatter.dateFormat = "EEEE"
            let dayName = dayNameFormatter.string(from: selectedDate)
            dateLabel.text = "Hoje, \(dayName)"
        } else {
            dateLabel.text = headerDateFormatter.string(from: selectedDate)
        }
    }

    @objc private func previousDay() {
        guard let d = calendar.date(byAdding: .day, value: -1, to: selectedDate) else { return }
        selectedDate = d
        updateDateLabel()
        filterAppointmentsForSelectedDay()
        updateEmptyState()
        updateTimelineBlocks()
        loadOrders()
    }

    @objc private func nextDay() {
        guard let d = calendar.date(byAdding: .day, value: 1, to: selectedDate) else { return }
        selectedDate = d
        updateDateLabel()
        filterAppointmentsForSelectedDay()
        updateEmptyState()
        updateTimelineBlocks()
        loadOrders()
    }

    private func setupEmptyState() {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        let icon = UIImageView(image: UIImage(systemName: "calendar"))
        icon.tintColor = .barberTextSecondary
        icon.contentMode = .scaleAspectFit
        icon.translatesAutoresizingMaskIntoConstraints = false
        let label = UILabel()
        label.text = "Nenhum agendamento para este dia"
        label.font = .systemFont(ofSize: 16, weight: .medium)
        label.textColor = .barberTextSecondary
        label.textAlignment = .center
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(icon)
        container.addSubview(label)
        NSLayoutConstraint.activate([
            icon.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            icon.widthAnchor.constraint(equalToConstant: 48),
            icon.heightAnchor.constraint(equalToConstant: 48),
            label.topAnchor.constraint(equalTo: icon.bottomAnchor, constant: 12),
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -24),
            icon.centerYAnchor.constraint(equalTo: container.centerYAnchor, constant: -40),
        ])
        emptyStateView = container
    }

    private func updateEmptyState() {
        let isEmpty = appointmentsForSelectedDay.isEmpty
        emptyStateView.isHidden = !isEmpty
        if !isEmpty { return }
        timelineScrollView.bringSubviewToFront(emptyStateView)
    }

    private func setupTimeline() {
        timelineScrollView = UIScrollView()
        timelineScrollView.translatesAutoresizingMaskIntoConstraints = false
        timelineScrollView.backgroundColor = .scheduleBackground
        timelineScrollView.showsVerticalScrollIndicator = true
        timelineScrollView.alwaysBounceVertical = true
        view.addSubview(timelineScrollView)

        refreshControl = UIRefreshControl()
        refreshControl.tintColor = .barberPrimary
        refreshControl.addTarget(self, action: #selector(refreshSchedule), for: .valueChanged)
        timelineScrollView.refreshControl = refreshControl

        let contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        contentView.backgroundColor = .scheduleBackground
        timelineScrollView.addSubview(contentView)

        timeRulerView = UIView()
        timeRulerView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(timeRulerView)

        dayColumnView = UIView()
        dayColumnView.translatesAutoresizingMaskIntoConstraints = false
        dayColumnView.backgroundColor = .scheduleBackground
        contentView.addSubview(dayColumnView)

        buildTimeRulerLabels()
        buildHourGridLines()

        progressIndicator = UIActivityIndicatorView(style: .large)
        progressIndicator.color = .barberPrimary
        progressIndicator.translatesAutoresizingMaskIntoConstraints = false
        progressIndicator.hidesWhenStopped = true
        view.addSubview(progressIndicator)

        if let empty = emptyStateView {
            empty.isHidden = true
            timelineScrollView.addSubview(empty)
            empty.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                empty.centerXAnchor.constraint(equalTo: timelineScrollView.centerXAnchor),
                empty.centerYAnchor.constraint(equalTo: timelineScrollView.centerYAnchor, constant: 40),
                empty.leadingAnchor.constraint(greaterThanOrEqualTo: timelineScrollView.leadingAnchor, constant: 24),
                timelineScrollView.trailingAnchor.constraint(greaterThanOrEqualTo: empty.trailingAnchor, constant: 24),
            ])
        }

        NSLayoutConstraint.activate([
            timelineScrollView.topAnchor.constraint(equalTo: dateHeaderContainer.bottomAnchor, constant: 8),
            timelineScrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            timelineScrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            timelineScrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            contentView.topAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: timelineScrollView.frameLayoutGuide.widthAnchor),
            contentView.heightAnchor.constraint(equalToConstant: Self.timelineContentHeight),
            timeRulerView.topAnchor.constraint(equalTo: contentView.topAnchor),
            timeRulerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            timeRulerView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
            timeRulerView.widthAnchor.constraint(equalToConstant: Self.timeRulerWidth),
            dayColumnView.topAnchor.constraint(equalTo: contentView.topAnchor),
            dayColumnView.leadingAnchor.constraint(equalTo: timeRulerView.trailingAnchor),
            dayColumnView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            dayColumnView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
            progressIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            progressIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    private func buildTimeRulerLabels() {
        timeRulerView.subviews.forEach { $0.removeFromSuperview() }
        for hour in Self.startHour..<Self.endHour {
            let label = UILabel()
            label.font = .monospacedSystemFont(ofSize: 12, weight: .medium)
            label.textColor = .barberTextSecondary
            label.text = String(format: "%02d:00", hour)
            label.translatesAutoresizingMaskIntoConstraints = false
            timeRulerView.addSubview(label)
            let y = CGFloat(hour - Self.startHour) * Self.pointsPerHour
            NSLayoutConstraint.activate([
                label.leadingAnchor.constraint(equalTo: timeRulerView.leadingAnchor, constant: 8),
                label.topAnchor.constraint(equalTo: timeRulerView.topAnchor, constant: y + 4),
            ])
        }
    }

    private func buildHourGridLines() {
        dayColumnView.subviews.filter { $0.tag == 999 }.forEach { $0.removeFromSuperview() }
        for hour in Self.startHour..<Self.endHour {
            let line = UIView()
            line.tag = 999
            line.backgroundColor = .scheduleSeparator
            line.translatesAutoresizingMaskIntoConstraints = false
            dayColumnView.addSubview(line)
            let y = CGFloat(hour - Self.startHour) * Self.pointsPerHour
            NSLayoutConstraint.activate([
                line.leadingAnchor.constraint(equalTo: dayColumnView.leadingAnchor),
                line.trailingAnchor.constraint(equalTo: dayColumnView.trailingAnchor),
                line.topAnchor.constraint(equalTo: dayColumnView.topAnchor, constant: y),
                line.heightAnchor.constraint(equalToConstant: 1),
            ])
        }
    }

    /// Remove blocos antigos e cria um bloco por agendamento, posicionado por horário e duração.
    private func updateTimelineBlocks() {
        dayColumnView.subviews.filter { $0 is ScheduleAppointmentBlockView }.forEach { $0.removeFromSuperview() }
        for order in appointmentsForSelectedDay {
            guard let startMinutes = timeForOrder(order) else { continue }
            let startOffsetMinutes = startMinutes - Self.startHour * 60
            if startOffsetMinutes < 0 { continue }
            let durationMinutes = Self.defaultDurationMinutes
            let y = CGFloat(startOffsetMinutes) / 60.0 * Self.pointsPerHour
            let height = CGFloat(durationMinutes) / 60.0 * Self.pointsPerHour
            let block = ScheduleAppointmentBlockView()
            block.configure(with: order)
            block.translatesAutoresizingMaskIntoConstraints = false
            dayColumnView.addSubview(block)
            let margin: CGFloat = 6
            NSLayoutConstraint.activate([
                block.leadingAnchor.constraint(equalTo: dayColumnView.leadingAnchor, constant: margin),
                block.trailingAnchor.constraint(equalTo: dayColumnView.trailingAnchor, constant: -margin),
                block.topAnchor.constraint(equalTo: dayColumnView.topAnchor, constant: y + margin),
                block.heightAnchor.constraint(equalToConstant: max(height - margin * 2, 28)),
            ])
            block.onTap = { [weak self] in self?.showAppointmentActions(for: order) }
        }
    }

    private func showAppointmentActions(for order: Order) {
        let alert = UIAlertController(title: order.customerName, message: nil, preferredStyle: .actionSheet)
        let phone = order.customerPhone.trimmingCharacters(in: CharacterSet.decimalDigits.inverted)
        if !phone.isEmpty {
            alert.addAction(UIAlertAction(title: "Chamar no WhatsApp", style: .default) { _ in
                let clean = phone.hasPrefix("55") ? phone : "55\(phone)"
                if let url = URL(string: "https://wa.me/\(clean)") {
                    UIApplication.shared.open(url)
                }
            })
        }
        alert.addAction(UIAlertAction(title: "Concluir", style: .default) { [weak self] _ in
            self?.markFinished(order)
        })
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        present(alert, animated: true)
    }

    private func setupCurrentTimeLine() {
        currentTimeLineView = UIView()
        currentTimeLineView.backgroundColor = .barberPrimary
        currentTimeLineView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(currentTimeLineView)
        let top = currentTimeLineView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 0)
        currentTimeLineTopConstraint = top
        NSLayoutConstraint.activate([
            top,
            currentTimeLineView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: Self.timeRulerWidth),
            currentTimeLineView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            currentTimeLineView.heightAnchor.constraint(equalToConstant: 2),
        ])
        updateCurrentTimeLinePosition()
    }

    private func updateCurrentTimeLinePosition() {
        guard calendar.isDateInToday(selectedDate) else {
            currentTimeLineView.isHidden = true
            return
        }
        currentTimeLineView.isHidden = false
        let now = Date()
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        let totalMinutes = (hour - Self.startHour) * 60 + minute
        if totalMinutes < 0 || totalMinutes > (Self.endHour - Self.startHour) * 60 {
            currentTimeLineView.isHidden = true
            return
        }
        let y = Self.dateHeaderHeight + 8 + CGFloat(totalMinutes) / 60.0 * Self.pointsPerHour - 1
        currentTimeLineTopConstraint?.constant = y
    }

    /// Recarrega a lista e opcionalmente navega para o dia informado (ex.: após criar agendamento em outro dia).
    private func loadOrders(for date: Date? = nil) {
        if let date = date {
            selectedDate = date
            updateDateLabel()
        }
        loadOrders()
    }

    private func loadOrders() {
        let authService = AuthService()
        guard authService.isLoggedIn(), authService.getCredentials() != nil else {
            progressIndicator.stopAnimating()
            refreshControl.endRefreshing()
            return
        }
        progressIndicator.startAnimating()
        Task { [weak self] in
            guard let self = self else { return }
            do {
                let response = try await self.apiService.getAllOrders(page: 1, limit: 200)
                await MainActor.run {
                    self.allOrders = response.orders
                    self.filterAppointmentsForSelectedDay()
                    self.updateTimelineBlocks()
                    self.updateEmptyState()
                    self.progressIndicator.stopAnimating()
                    self.refreshControl.endRefreshing()
                }
            } catch {
                await MainActor.run {
                    self.progressIndicator.stopAnimating()
                    self.refreshControl.endRefreshing()
                }
            }
        }
    }

    @objc private func refreshSchedule() {
        loadOrders()
    }

    private func filterAppointmentsForSelectedDay() {
        let startOfSelected = calendar.startOfDay(for: selectedDate)
        let endOfSelected = calendar.date(byAdding: .day, value: 1, to: startOfSelected)!
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        appointmentsForSelectedDay = allOrders.filter { order in
            let dateToUse: Date? = dateForOrder(order, isoFormatter: iso)
            guard let d = dateToUse else { return false }
            return d >= startOfSelected && d < endOfSelected
        }.sorted { o1, o2 in
            let t1 = timeForOrder(o1) ?? 0
            let t2 = timeForOrder(o2) ?? 0
            return t1 < t2
        }
    }

    /// Data/hora do agendamento (appointment_date em UTC ou created_at). Usa ISO8601 para não trocar horário.
    private func dateForOrder(_ order: Order, isoFormatter: ISO8601DateFormatter? = nil) -> Date? {
        let iso = isoFormatter ?? {
            let f = ISO8601DateFormatter()
            f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            return f
        }()
        if let apt = order.appointmentDate, !apt.isEmpty {
            return iso.date(from: apt)
                ?? iso.date(from: apt.replacingOccurrences(of: "Z", with: "+00:00"))
                ?? dateFormatter.date(from: String(apt.prefix(19)))
        }
        return iso.date(from: order.createdAt)
    }

    /// Minutos desde meia-noite (para ordenação)
    private func timeForOrder(_ order: Order) -> Int? {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let d = dateForOrder(order, isoFormatter: iso) else { return nil }
        return calendar.component(.hour, from: d) * 60 + calendar.component(.minute, from: d)
    }

    private func markFinished(_ order: Order) {
        Task {
            do {
                try await apiService.updateOrderStatus(orderId: order.id, status: "finished")
                await MainActor.run { loadOrders() }
            } catch { }
        }
    }
}

// MARK: - Bloco de agendamento (estilo Google Agenda: card com nome + serviço centralizados)
private final class ScheduleAppointmentBlockView: UIView {
    var onTap: (() -> Void)?

    private let nameLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 15, weight: .semibold)
        l.textColor = .white
        l.textAlignment = .center
        l.numberOfLines = 1
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()
    private let serviceLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13, weight: .regular)
        l.textColor = .white.withAlphaComponent(0.9)
        l.textAlignment = .center
        l.numberOfLines = 1
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor.barberPrimary.withAlphaComponent(0.85)
        layer.cornerRadius = 8
        clipsToBounds = true
        let stack = UIStackView(arrangedSubviews: [nameLabel, serviceLabel])
        stack.axis = .vertical
        stack.spacing = 2
        stack.alignment = .center
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: centerYAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: leadingAnchor, constant: 8),
            trailingAnchor.constraint(greaterThanOrEqualTo: stack.trailingAnchor, constant: 8),
        ])
        let t = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        addGestureRecognizer(t)
        isUserInteractionEnabled = true
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    @objc private func handleTap() {
        onTap?()
    }

    func configure(with order: Order) {
        nameLabel.text = order.customerName
        let services = order.items.map { $0.name }.joined(separator: " + ")
        serviceLabel.text = services.isEmpty ? "—" : services
    }
}
