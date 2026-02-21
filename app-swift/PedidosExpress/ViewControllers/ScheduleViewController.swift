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
    private var timelineTableView: UITableView!
    private var refreshControl: UIRefreshControl!
    private var currentTimeLineView: UIView!
    private var currentTimeLineTopConstraint: NSLayoutConstraint?
    private var progressIndicator: UIActivityIndicatorView!
    private var emptyStateView: UIView!

    private static let slotHeight: CGFloat = 72
    private static let dateHeaderHeight: CGFloat = 56
    private static let startHour = 8
    private static let endHour = 20
    private static let slotCount: Int = (endHour - startHour) * 2

    override func viewDidLoad() {
        super.viewDidLoad()
        title = BusinessProvider.isBarber ? "Agenda" : "Minha Agenda"
        view.backgroundColor = .scheduleBackground
        navigationItem.largeTitleDisplayMode = .never
        navigationItem.rightBarButtonItems = []
        navigationItem.leftBarButtonItems = []

        // Nav Bar: blur + grafite #121212 (glassmorphism, conteúdo passa por baixo)
        let nav = navigationController?.navigationBar
        nav?.barTintColor = .barberChrome
        nav?.tintColor = .barberPrimary
        nav?.isTranslucent = true
        let appearance = UINavigationBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundEffect = UIBlurEffect(style: .dark)
        appearance.backgroundColor = UIColor.barberChrome.withAlphaComponent(0.72)
        appearance.titleTextAttributes = [.foregroundColor: UIColor.barberPrimary]
        nav?.standardAppearance = appearance
        nav?.scrollEdgeAppearance = appearance
        nav?.compactAppearance = appearance

        setupDateHeader()
        setupTimeline()
        setupCurrentTimeLine()
        setupEmptyState()
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
        let alert = UIAlertController(
            title: "Novo agendamento",
            message: "Cliente que está agendando pessoalmente (fora do WhatsApp).",
            preferredStyle: .alert
        )
        alert.addTextField { field in
            field.placeholder = "Nome do cliente"
            field.autocapitalizationType = .words
        }
        alert.addTextField { field in
            field.placeholder = "Telefone (opcional)"
            field.keyboardType = .phonePad
        }
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        alert.addAction(UIAlertAction(title: "Escolher horário", style: .default) { [weak self] _ in
            guard let self = self else { return }
            let name = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespaces) ?? "Cliente"
            let phone = alert.textFields?.last?.text?.trimmingCharacters(in: .whitespaces) ?? ""
            self.showTimePickerForManualAppointment(customerName: name, customerPhone: phone)
        })
        present(alert, animated: true)
    }

    private func showTimePickerForManualAppointment(customerName: String, customerPhone: String) {
        let slots = (0..<Self.slotCount).map { index in
            (index, slotTimeString(at: index))
        }
        let alert = UIAlertController(title: "Horário", message: "Selecione o horário para o dia \(headerDateFormatter.string(from: selectedDate))", preferredStyle: .actionSheet)
        for (index, timeStr) in slots {
            alert.addAction(UIAlertAction(title: timeStr, style: .default) { [weak self] _ in
                self?.createManualAppointment(customerName: customerName, customerPhone: customerPhone, slotIndex: index)
            })
        }
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        if let popover = alert.popoverPresentationController {
            popover.barButtonItem = navigationItem.rightBarButtonItem
            popover.sourceView = view
        }
        present(alert, animated: true)
    }

    private func createManualAppointment(customerName: String, customerPhone: String, slotIndex: Int) {
        let hour = Self.startHour + (slotIndex / 2)
        let minute = (slotIndex % 2) * 30
        let startOfDay = calendar.startOfDay(for: selectedDate)
        guard let appointmentDate = calendar.date(bySettingHour: hour, minute: minute, second: 0, of: startOfDay) else {
            showMessage("Não foi possível definir o horário.")
            return
        }
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let appointmentDateString = isoFormatter.string(from: appointmentDate)

        Task {
            do {
                try await apiService.createAppointment(customerName: customerName, customerPhone: customerPhone, appointmentDate: appointmentDateString)
                await MainActor.run {
                    showMessage("Agendamento adicionado.")
                    loadOrders()
                }
            } catch let err as ApiError {
                await MainActor.run {
                    showMessage(err.localizedDescription)
                }
            } catch {
                await MainActor.run {
                    showMessage("Não foi possível criar o agendamento. Tente novamente.")
                }
            }
        }
    }

    private func showMessage(_ message: String) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        updateCurrentTimeLinePosition()
    }

    // MARK: - Cabeçalho de data (Squire: [<] Nome do dia e data [>])
    private func setupDateHeader() {
        dateHeaderContainer = UIView()
        dateHeaderContainer.translatesAutoresizingMaskIntoConstraints = false
        dateHeaderContainer.backgroundColor = .scheduleBackground
        view.addSubview(dateHeaderContainer)

        let leftButton = UIButton(type: .system)
        leftButton.setImage(UIImage(systemName: "chevron.left"), for: .normal)
        leftButton.tintColor = .barberPrimary
        leftButton.translatesAutoresizingMaskIntoConstraints = false
        leftButton.addTarget(self, action: #selector(previousDay), for: .touchUpInside)

        dateLabel = UILabel()
        dateLabel.font = .boldSystemFont(ofSize: 18)
        dateLabel.textColor = .scheduleTextPrimary
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
        timelineTableView.reloadData()
        loadOrders()
    }

    @objc private func nextDay() {
        guard let d = calendar.date(byAdding: .day, value: 1, to: selectedDate) else { return }
        selectedDate = d
        updateDateLabel()
        filterAppointmentsForSelectedDay()
        updateEmptyState()
        timelineTableView.reloadData()
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
        timelineTableView.backgroundView = appointmentsForSelectedDay.isEmpty ? emptyStateView : nil
    }

    private func setupTimeline() {
        timelineTableView = UITableView(frame: .zero, style: .plain)
        timelineTableView.backgroundColor = .scheduleBackground
        timelineTableView.separatorColor = .scheduleSeparator
        timelineTableView.separatorInset = UIEdgeInsets(top: 0, left: 16, bottom: 0, right: 16)
        timelineTableView.delegate = self
        timelineTableView.dataSource = self
        timelineTableView.register(ScheduleTimeCell.self, forCellReuseIdentifier: ScheduleTimeCell.reuseId)
        timelineTableView.rowHeight = Self.slotHeight
        timelineTableView.translatesAutoresizingMaskIntoConstraints = false
        timelineTableView.contentInset = UIEdgeInsets(top: 8, left: 0, bottom: 24, right: 0)
        view.addSubview(timelineTableView)

        refreshControl = UIRefreshControl()
        refreshControl.tintColor = .barberPrimary
        refreshControl.addTarget(self, action: #selector(refreshSchedule), for: .valueChanged)
        timelineTableView.refreshControl = refreshControl

        progressIndicator = UIActivityIndicatorView(style: .large)
        progressIndicator.color = .barberPrimary
        progressIndicator.translatesAutoresizingMaskIntoConstraints = false
        progressIndicator.hidesWhenStopped = true
        view.addSubview(progressIndicator)

        NSLayoutConstraint.activate([
            timelineTableView.topAnchor.constraint(equalTo: dateHeaderContainer.bottomAnchor, constant: 8),
            timelineTableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            timelineTableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            timelineTableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            progressIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            progressIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
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
            currentTimeLineView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
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
        let slotIndex = totalMinutes / 30
        let fraction = CGFloat((totalMinutes % 30)) / 30.0
        let y = Self.dateHeaderHeight + 8 + CGFloat(slotIndex) * Self.slotHeight + fraction * Self.slotHeight + Self.slotHeight / 2 - 1
        currentTimeLineTopConstraint?.constant = y
    }

    private func loadOrders() {
        progressIndicator.startAnimating()
        Task { [weak self] in
            guard let self = self else { return }
            do {
                let response = try await self.apiService.getAllOrders(page: 1, limit: 200)
                await MainActor.run {
                    self.allOrders = response.orders
                    self.filterAppointmentsForSelectedDay()
                    self.updateEmptyState()
                    self.timelineTableView.reloadData()
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
        appointmentsForSelectedDay = allOrders.filter { order in
            let dateToUse: Date?
            if let apt = order.appointmentDate, !apt.isEmpty {
                dateToUse = dateFormatter.date(from: String(apt.prefix(19)))
                    ?? ISO8601DateFormatter().date(from: apt)
            } else {
                dateToUse = ISO8601DateFormatter().date(from: order.createdAt)
            }
            guard let d = dateToUse else { return false }
            return d >= startOfSelected && d < endOfSelected
        }.sorted { o1, o2 in
            let t1 = timeForOrder(o1) ?? 0
            let t2 = timeForOrder(o2) ?? 0
            return t1 < t2
        }
    }

    /// Minutos desde meia-noite (para ordenação)
    private func timeForOrder(_ order: Order) -> Int? {
        let dateToUse: Date?
        if let apt = order.appointmentDate, !apt.isEmpty {
            dateToUse = dateFormatter.date(from: String(apt.prefix(19)))
                ?? ISO8601DateFormatter().date(from: apt)
        } else {
            dateToUse = ISO8601DateFormatter().date(from: order.createdAt)
        }
        guard let d = dateToUse else { return nil }
        return calendar.component(.hour, from: d) * 60 + calendar.component(.minute, from: d)
    }

    private func orderForSlot(index: Int) -> Order? {
        let slotStartMinutes = Self.startHour * 60 + index * 30
        return appointmentsForSelectedDay.first { order in
            guard let min = timeForOrder(order) else { return false }
            return min >= slotStartMinutes && min < slotStartMinutes + 30
        }
    }

    private func slotTimeString(at index: Int) -> String {
        let hour = Self.startHour + (index / 2)
        let min = (index % 2) * 30
        return String(format: "%02d:%02d", hour, min)
    }
}

extension ScheduleViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return Self.slotCount
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: ScheduleTimeCell.reuseId, for: indexPath) as! ScheduleTimeCell
        let timeStr = slotTimeString(at: indexPath.row)
        let order = orderForSlot(index: indexPath.row)
        cell.configure(time: timeStr, order: order)
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        guard let order = orderForSlot(index: indexPath.row) else { return }
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

    private func markFinished(_ order: Order) {
        Task {
            do {
                try await apiService.updateOrderStatus(orderId: order.id, status: "finished")
                await MainActor.run { loadOrders() }
            } catch { }
        }
    }
}

// MARK: - Célula da timeline (hora + card opcional)
private final class ScheduleTimeCell: UITableViewCell {
    static let reuseId = "ScheduleTimeCell"

    private let timeLabel: UILabel = {
        let l = UILabel()
        l.font = .monospacedSystemFont(ofSize: 14, weight: .semibold)
        l.textColor = .scheduleTimeLabel
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()
    private let cardContainer: UIView = {
        let v = UIView()
        v.backgroundColor = .scheduleCard
        v.layer.cornerRadius = 10
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()
    private let nameLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 15, weight: .semibold)
        l.textColor = .scheduleTextPrimary
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()
    private let serviceLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13, weight: .regular)
        l.textColor = .scheduleTextSecondary
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()
    private let badgeLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 11, weight: .medium)
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        backgroundColor = .scheduleBackground
        contentView.backgroundColor = .scheduleBackground
        contentView.addSubview(timeLabel)
        contentView.addSubview(cardContainer)
        cardContainer.addSubview(nameLabel)
        cardContainer.addSubview(serviceLabel)
        cardContainer.addSubview(badgeLabel)
        NSLayoutConstraint.activate([
            timeLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 12),
            timeLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            timeLabel.widthAnchor.constraint(equalToConstant: 52),
            cardContainer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 72),
            cardContainer.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            cardContainer.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 6),
            cardContainer.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -6),
            nameLabel.topAnchor.constraint(equalTo: cardContainer.topAnchor, constant: 10),
            nameLabel.leadingAnchor.constraint(equalTo: cardContainer.leadingAnchor, constant: 12),
            nameLabel.trailingAnchor.constraint(lessThanOrEqualTo: badgeLabel.leadingAnchor, constant: -8),
            serviceLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 4),
            serviceLabel.leadingAnchor.constraint(equalTo: cardContainer.leadingAnchor, constant: 12),
            serviceLabel.trailingAnchor.constraint(equalTo: cardContainer.trailingAnchor, constant: -12),
            serviceLabel.bottomAnchor.constraint(equalTo: cardContainer.bottomAnchor, constant: -10),
            badgeLabel.trailingAnchor.constraint(equalTo: cardContainer.trailingAnchor, constant: -12),
            badgeLabel.centerYAnchor.constraint(equalTo: nameLabel.centerYAnchor),
        ])
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    func configure(time: String, order: Order?) {
        timeLabel.text = time
        if let order = order {
            cardContainer.isHidden = false
            nameLabel.text = order.customerName
            let services = order.items.map { "\($0.name)" }.joined(separator: " + ")
            serviceLabel.text = services.isEmpty ? "Serviço" : services
            let confirmed = order.status == "printed" || order.status == "out_for_delivery" || order.status == "finished"
            badgeLabel.text = confirmed ? "Confirmado" : "Pendente"
            badgeLabel.textColor = confirmed ? .scheduleBadgeConfirmed : .scheduleBadgePending
        } else {
            cardContainer.isHidden = true
        }
    }
}
