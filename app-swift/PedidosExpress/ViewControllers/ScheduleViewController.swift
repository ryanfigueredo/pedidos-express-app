import UIKit

/// View de agenda (timeline) para barbeiro. Exibe o dia com seletor de datas e timeline vertical.
/// Inspirado no Squire: tema dark, linha do tempo com horários e cards de agendamento.
final class ScheduleViewController: UIViewController {

    private let apiService = ApiService()
    private var allOrders: [Order] = []
    private var selectedDate: Date = Date()
    private var appointmentsForSelectedDay: [Order] = [] // ordenados por horário
    private let calendar = Calendar.current
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        return f
    }()
    private let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()
    private let dayLabelFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "EEE d" // "Seg 10"
        return f
    }()

    private var daySelectorScrollView: UIScrollView!
    private var dayStackView: UIStackView!
    private var timelineTableView: UITableView!
    private var refreshControl: UIRefreshControl!
    private var currentTimeLineView: UIView!
    private var currentTimeLineTopConstraint: NSLayoutConstraint?
    private var progressIndicator: UIActivityIndicatorView!

    private static let slotHeight: CGFloat = 72
    private static let startHour = 8
    private static let endHour = 20
    private static let slotCount: Int = (endHour - startHour) * 2 // 30 min slots

    override func viewDidLoad() {
        super.viewDidLoad()
        title = BusinessProvider.isBarber ? "Agenda" : "Minha Agenda"
        view.backgroundColor = .scheduleBackground
        navigationItem.largeTitleDisplayMode = .never
        // Barra escura para combinar com o tema
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = .scheduleBackground
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor.scheduleTextPrimary]
        navigationController?.navigationBar.standardAppearance = navAppearance
        navigationController?.navigationBar.scrollEdgeAppearance = navAppearance
        navigationController?.navigationBar.tintColor = .barberPrimary
        setupDaySelector()
        setupTimeline()
        setupCurrentTimeLine()
        loadOrders()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        updateCurrentTimeLinePosition()
    }

    private func setupDaySelector() {
        daySelectorScrollView = UIScrollView()
        daySelectorScrollView.showsHorizontalScrollIndicator = false
        daySelectorScrollView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(daySelectorScrollView)

        dayStackView = UIStackView()
        dayStackView.axis = .horizontal
        dayStackView.spacing = 12
        dayStackView.translatesAutoresizingMaskIntoConstraints = false
        daySelectorScrollView.addSubview(dayStackView)

        NSLayoutConstraint.activate([
            dayStackView.topAnchor.constraint(equalTo: daySelectorScrollView.topAnchor),
            dayStackView.leadingAnchor.constraint(equalTo: daySelectorScrollView.leadingAnchor, constant: 16),
            dayStackView.trailingAnchor.constraint(equalTo: daySelectorScrollView.trailingAnchor, constant: -16),
            dayStackView.bottomAnchor.constraint(equalTo: daySelectorScrollView.bottomAnchor),
            dayStackView.heightAnchor.constraint(equalTo: daySelectorScrollView.heightAnchor),
        ])

        // Gerar 14 dias: 7 passados + hoje + 6 futuros
        let todayStart = calendar.startOfDay(for: Date())
        for offset in -7..<7 {
            guard let d = calendar.date(byAdding: .day, value: offset, to: Date()) else { continue }
            let label = UILabel()
            label.text = dayLabelFormatter.string(from: d)
            label.font = .systemFont(ofSize: 14, weight: .medium)
            label.textColor = calendar.isDate(d, inSameDayAs: todayStart) ? .barberBackground : .scheduleTextSecondary
            label.textAlignment = .center
            let container = UIView()
            container.translatesAutoresizingMaskIntoConstraints = false
            container.backgroundColor = calendar.isDate(d, inSameDayAs: todayStart) ? .barberPrimary : .clear
            container.layer.cornerRadius = 20
            container.addSubview(label)
            label.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                label.centerXAnchor.constraint(equalTo: container.centerXAnchor),
                label.centerYAnchor.constraint(equalTo: container.centerYAnchor),
                label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 16),
                label.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -16),
            ])
            container.widthAnchor.constraint(equalToConstant: 56).isActive = true
            container.heightAnchor.constraint(equalToConstant: 40).isActive = true
            let tap = UITapGestureRecognizer(target: self, action: #selector(dayTapped(_:)))
            container.addGestureRecognizer(tap)
            container.isUserInteractionEnabled = true
            container.tag = offset + 7
            dayStackView.addArrangedSubview(container)
        }

        NSLayoutConstraint.activate([
            daySelectorScrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            daySelectorScrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            daySelectorScrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            daySelectorScrollView.heightAnchor.constraint(equalToConstant: 52),
        ])
    }

    @objc private func dayTapped(_ gesture: UITapGestureRecognizer) {
        guard let container = gesture.view else { return }
        let offset = container.tag - 7
        guard let d = calendar.date(byAdding: .day, value: offset, to: Date()) else { return }
        selectedDate = d
        updateDaySelectorAppearance()
        filterAppointmentsForSelectedDay()
        timelineTableView.reloadData()
    }

    private func updateDaySelectorAppearance() {
        let todayStart = calendar.startOfDay(for: Date())
        let selectedStart = calendar.startOfDay(for: selectedDate)
        for (index, subview) in dayStackView.arrangedSubviews.enumerated() {
            guard let container = subview as? UIView, let label = container.subviews.first as? UILabel else { continue }
            let offset = index - 7
            guard let d = calendar.date(byAdding: .day, value: offset, to: Date()) else { continue }
            let isSelected = calendar.isDate(d, inSameDayAs: selectedStart)
            container.backgroundColor = isSelected ? .barberPrimary : .clear
            label.textColor = isSelected ? .barberBackground : .scheduleTextSecondary
        }
    }

    private func setupTimeline() {
        timelineTableView = UITableView(frame: .zero, style: .plain)
        timelineTableView.backgroundColor = .scheduleBackground
        timelineTableView.separatorColor = UIColor.white.withAlphaComponent(0.08)
        timelineTableView.separatorInset = UIEdgeInsets(top: 0, left: 56, bottom: 0, right: 0)
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
            timelineTableView.topAnchor.constraint(equalTo: daySelectorScrollView.bottomAnchor, constant: 8),
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
            currentTimeLineView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 48),
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
        let y: CGFloat = 8 + 52 + 8 + CGFloat(slotIndex) * Self.slotHeight + fraction * Self.slotHeight + Self.slotHeight / 2 - 1
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
        l.font = .monospacedSystemFont(ofSize: 12, weight: .medium)
        l.textColor = .scheduleTextSecondary
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
            timeLabel.widthAnchor.constraint(equalToConstant: 40),
            cardContainer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 56),
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
