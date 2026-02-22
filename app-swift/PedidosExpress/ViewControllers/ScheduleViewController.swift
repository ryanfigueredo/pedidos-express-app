import UIKit

/// View de agenda (timeline). Estilo dashboard (Hoje/Amanhã, 6h–24h) para barbeiro; 24h para outros.
final class ScheduleViewController: UIViewController {

    private let apiService = ApiService()
    private var allOrders: [Order] = []
    private var selectedDate: Date = Date()
    private var appointmentsForSelectedDay: [Order] = []
    private let calendar: Calendar = {
        var cal = Calendar.current
        cal.timeZone = TimeZone(identifier: "America/Sao_Paulo") ?? .current
        return cal
    }()

    private let headerDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "EEEE, d 'de' MMM"
        f.timeZone = TimeZone(identifier: "America/Sao_Paulo")
        return f
    }()

    private var dateHeaderContainer: UIView!
    private var dateLabel: UILabel!
    private var dashboardTitleLabel: UILabel!
    private var dashboardSubtitleLabel: UILabel!
    private var hojeButton: UIButton!
    private var amanhaButton: UIButton!
    private var timelineScrollView: UIScrollView!
    private var timelineCardContainer: UIView!
    private var timeRulerView: UIView!
    private var dayColumnView: UIView!
    private var refreshControl: UIRefreshControl!
    private var currentTimeLineView: UIView!
    private var currentTimeLineTopConstraint: NSLayoutConstraint?
    private var progressIndicator: UIActivityIndicatorView!
    private var emptyStateView: UIView!

    private static let dateHeaderHeight: CGFloat = 56
    private static let pointsPerHour: CGFloat = 60
    private static let defaultDurationMinutes: Int = 30
    private static let timeRulerWidth: CGFloat = 56

    private var startHour: Int { BusinessProvider.isBarber ? 6 : 0 }
    private var endHour: Int { BusinessProvider.isBarber ? 24 : 24 }
    private var timelineContentHeight: CGFloat { CGFloat(endHour - startHour) * Self.pointsPerHour }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        NotificationCenter.default.addObserver(self, selector: #selector(onDidLogin), name: .pedidosDidLogin, object: nil)
        loadOrders()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        scrollToCurrentTime()
        loadOrders()
    }

    private func setupUI() {
        title = BusinessProvider.isBarber ? "Agenda" : "Minha Agenda"
        view.backgroundColor = .appBackgroundOffWhite

        if BusinessProvider.isBarber {
            setupDashboardHeader()
        } else {
            setupDateHeader()
        }
        setupEmptyState()
        setupTimeline()
        setupCurrentTimeLine()
        updateDateLabel()
        updateHojeAmanhaSelection()

        if BusinessProvider.isBarber {
            navigationItem.rightBarButtonItem = UIBarButtonItem(
                image: UIImage(systemName: "plus.circle.fill"),
                style: .plain,
                target: self,
                action: #selector(addManualAppointment)
            )
            navigationItem.rightBarButtonItem?.tintColor = .appPrimaryBlack
        }

        progressIndicator = UIActivityIndicatorView(style: .large)
        progressIndicator.color = .appPrimaryBlack
        progressIndicator.translatesAutoresizingMaskIntoConstraints = false
        progressIndicator.hidesWhenStopped = true
        view.addSubview(progressIndicator)
        NSLayoutConstraint.activate([
            progressIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            progressIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }

    private func scrollToCurrentTime() {
        let hour = calendar.component(.hour, from: Date())
        let minHour = startHour
        if hour > minHour + 1 {
            let yOffset = CGFloat(hour - minHour - 1) * Self.pointsPerHour
            timelineScrollView?.setContentOffset(CGPoint(x: 0, y: yOffset), animated: true)
        }
    }

    // MARK: - Agendamento manual (+)
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

        let digits = customerPhone.filter("0123456789".contains)
        let finalPhone = digits.hasPrefix("55") ? digits : "55\(digits)"

        progressIndicator.startAnimating()
        Task {
            do {
                try await apiService.createAppointment(customerName: customerName, customerPhone: finalPhone, appointmentDate: appointmentDateString, service: service)
                await MainActor.run {
                    progressIndicator.stopAnimating()
                    selectedDate = chosenDate
                    updateDateLabel()
                    updateHojeAmanhaSelection()
                    loadOrders()
                }
            } catch {
                await MainActor.run {
                    progressIndicator.stopAnimating()
                    let alert = UIAlertController(title: "Erro", message: "Não foi possível criar o agendamento.", preferredStyle: .alert)
                    alert.addAction(UIAlertAction(title: "OK", style: .default))
                    present(alert, animated: true)
                }
            }
        }
    }

    // MARK: - Header (dashboard estilo desktop para barbeiro; setas para outros)
    private func setupDashboardHeader() {
        dateHeaderContainer = UIView()
        dateHeaderContainer.translatesAutoresizingMaskIntoConstraints = false
        dateHeaderContainer.backgroundColor = .appBackgroundOffWhite
        view.addSubview(dateHeaderContainer)

        dashboardTitleLabel = UILabel()
        dashboardTitleLabel.text = "Agendamentos"
        dashboardTitleLabel.font = .boldSystemFont(ofSize: 28)
        dashboardTitleLabel.textColor = .appTitleBlack
        dashboardTitleLabel.translatesAutoresizingMaskIntoConstraints = false

        dashboardSubtitleLabel = UILabel()
        dashboardSubtitleLabel.text = "Atualização ao abrir a tela • Arraste para atualizar"
        dashboardSubtitleLabel.font = .systemFont(ofSize: 15)
        dashboardSubtitleLabel.textColor = .appSubtitleGray
        dashboardSubtitleLabel.translatesAutoresizingMaskIntoConstraints = false

        hojeButton = UIButton(type: .system)
        hojeButton.setTitle("Hoje", for: .normal)
        hojeButton.titleLabel?.font = .systemFont(ofSize: 16, weight: .medium)
        hojeButton.addTarget(self, action: #selector(selectHoje), for: .touchUpInside)
        hojeButton.translatesAutoresizingMaskIntoConstraints = false

        amanhaButton = UIButton(type: .system)
        amanhaButton.setTitle("Amanhã", for: .normal)
        amanhaButton.titleLabel?.font = .systemFont(ofSize: 16, weight: .medium)
        amanhaButton.addTarget(self, action: #selector(selectAmanha), for: .touchUpInside)
        amanhaButton.translatesAutoresizingMaskIntoConstraints = false

        let buttonStack = UIStackView(arrangedSubviews: [hojeButton, amanhaButton])
        buttonStack.axis = .horizontal
        buttonStack.spacing = 12
        buttonStack.translatesAutoresizingMaskIntoConstraints = false

        dateHeaderContainer.addSubview(dashboardTitleLabel)
        dateHeaderContainer.addSubview(dashboardSubtitleLabel)
        dateHeaderContainer.addSubview(buttonStack)

        NSLayoutConstraint.activate([
            dateHeaderContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            dateHeaderContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            dateHeaderContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            dashboardTitleLabel.topAnchor.constraint(equalTo: dateHeaderContainer.topAnchor, constant: 16),
            dashboardTitleLabel.leadingAnchor.constraint(equalTo: dateHeaderContainer.leadingAnchor, constant: 20),
            dashboardTitleLabel.trailingAnchor.constraint(lessThanOrEqualTo: dateHeaderContainer.trailingAnchor, constant: -20),
            dashboardSubtitleLabel.topAnchor.constraint(equalTo: dashboardTitleLabel.bottomAnchor, constant: 4),
            dashboardSubtitleLabel.leadingAnchor.constraint(equalTo: dateHeaderContainer.leadingAnchor, constant: 20),
            dashboardSubtitleLabel.trailingAnchor.constraint(lessThanOrEqualTo: dateHeaderContainer.trailingAnchor, constant: -20),
            buttonStack.topAnchor.constraint(equalTo: dashboardSubtitleLabel.bottomAnchor, constant: 16),
            buttonStack.leadingAnchor.constraint(equalTo: dateHeaderContainer.leadingAnchor, constant: 20),
            hojeButton.widthAnchor.constraint(equalToConstant: 88),
            amanhaButton.widthAnchor.constraint(equalToConstant: 88),
            dateHeaderContainer.bottomAnchor.constraint(equalTo: buttonStack.bottomAnchor, constant: 12)
        ])
    }

    private func setupDateHeader() {
        dateHeaderContainer = UIView()
        dateHeaderContainer.translatesAutoresizingMaskIntoConstraints = false
        dateHeaderContainer.backgroundColor = .appCardWhite
        view.addSubview(dateHeaderContainer)

        let leftButton = UIButton(type: .system)
        leftButton.setImage(UIImage(systemName: "chevron.left"), for: .normal)
        leftButton.tintColor = .appPrimaryBlack
        leftButton.addTarget(self, action: #selector(previousDay), for: .touchUpInside)

        dateLabel = UILabel()
        dateLabel.font = .boldSystemFont(ofSize: 18)
        dateLabel.textColor = .appTitleBlack
        dateLabel.textAlignment = .center

        let rightButton = UIButton(type: .system)
        rightButton.setImage(UIImage(systemName: "chevron.right"), for: .normal)
        rightButton.tintColor = .appPrimaryBlack
        rightButton.addTarget(self, action: #selector(nextDay), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [leftButton, dateLabel, rightButton])
        stack.axis = .horizontal
        stack.distribution = .equalSpacing
        stack.translatesAutoresizingMaskIntoConstraints = false
        dateHeaderContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            dateHeaderContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            dateHeaderContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            dateHeaderContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            dateHeaderContainer.heightAnchor.constraint(equalToConstant: Self.dateHeaderHeight),
            stack.centerXAnchor.constraint(equalTo: dateHeaderContainer.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: dateHeaderContainer.centerYAnchor),
            stack.widthAnchor.constraint(equalTo: dateHeaderContainer.widthAnchor, multiplier: 0.9),
            leftButton.widthAnchor.constraint(equalToConstant: 44),
            rightButton.widthAnchor.constraint(equalToConstant: 44)
        ])
    }

    @objc private func selectHoje() {
        selectedDate = calendar.startOfDay(for: Date())
        updateDateLabel()
        updateHojeAmanhaSelection()
        filterAppointmentsForSelectedDay()
        updateTimelineBlocks()
        updateEmptyState()
        updateCurrentTimeLinePosition()
    }

    @objc private func selectAmanha() {
        selectedDate = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: Date())) ?? selectedDate
        updateDateLabel()
        updateHojeAmanhaSelection()
        filterAppointmentsForSelectedDay()
        updateTimelineBlocks()
        updateEmptyState()
        updateCurrentTimeLinePosition()
    }

    private func updateHojeAmanhaSelection() {
        guard BusinessProvider.isBarber, let hojeButton = hojeButton, let amanhaButton = amanhaButton else { return }
        let isHoje = calendar.isDateInToday(selectedDate)
        hojeButton.backgroundColor = isHoje ? .appPrimaryBlack : .appCardWhite
        hojeButton.setTitleColor(isHoje ? .appCardWhite : .appSubtitleGray, for: .normal)
        hojeButton.layer.cornerRadius = 8
        hojeButton.layer.borderWidth = isHoje ? 0 : 1
        hojeButton.layer.borderColor = UIColor.appGridLineLight.cgColor
        amanhaButton.backgroundColor = isHoje ? .appCardWhite : .appPrimaryBlack
        amanhaButton.setTitleColor(isHoje ? .appSubtitleGray : .appCardWhite, for: .normal)
        amanhaButton.layer.cornerRadius = 8
        amanhaButton.layer.borderWidth = isHoje ? 1 : 0
        amanhaButton.layer.borderColor = UIColor.appGridLineLight.cgColor
    }

    private func setupTimeline() {
        timelineScrollView = UIScrollView()
        timelineScrollView.translatesAutoresizingMaskIntoConstraints = false
        timelineScrollView.backgroundColor = .clear
        view.addSubview(timelineScrollView)

        refreshControl = UIRefreshControl()
        refreshControl.tintColor = .appPrimaryBlack
        refreshControl.addTarget(self, action: #selector(refreshSchedule), for: .valueChanged)
        timelineScrollView.refreshControl = refreshControl

        timelineCardContainer = UIView()
        timelineCardContainer.translatesAutoresizingMaskIntoConstraints = false
        timelineCardContainer.backgroundColor = .appCardWhite
        timelineCardContainer.layer.cornerRadius = 12
        timelineCardContainer.layer.borderWidth = 1
        timelineCardContainer.layer.borderColor = UIColor.appGridLineLight.cgColor
        timelineCardContainer.layer.shadowColor = UIColor.appShadowColor.cgColor
        timelineCardContainer.layer.shadowOpacity = 0.06
        timelineCardContainer.layer.shadowOffset = CGSize(width: 0, height: 2)
        timelineCardContainer.layer.shadowRadius = 4
        timelineScrollView.addSubview(timelineCardContainer)

        let contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        contentView.backgroundColor = .clear
        contentView.layer.cornerRadius = 12
        contentView.clipsToBounds = true
        timelineCardContainer.addSubview(contentView)

        timeRulerView = UIView()
        timeRulerView.translatesAutoresizingMaskIntoConstraints = false
        timeRulerView.backgroundColor = UIColor.appGridLineLight.withAlphaComponent(0.5)
        timeRulerView.layer.cornerRadius = 12
        contentView.addSubview(timeRulerView)

        dayColumnView = UIView()
        dayColumnView.translatesAutoresizingMaskIntoConstraints = false
        dayColumnView.backgroundColor = .appCardWhite
        contentView.addSubview(dayColumnView)

        NSLayoutConstraint.activate([
            timelineScrollView.topAnchor.constraint(equalTo: dateHeaderContainer.bottomAnchor, constant: 8),
            timelineScrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            timelineScrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            timelineScrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            timelineCardContainer.topAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.topAnchor, constant: 8),
            timelineCardContainer.leadingAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.leadingAnchor),
            timelineCardContainer.trailingAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.trailingAnchor),
            timelineCardContainer.bottomAnchor.constraint(equalTo: timelineScrollView.contentLayoutGuide.bottomAnchor, constant: -8),
            timelineCardContainer.widthAnchor.constraint(equalTo: timelineScrollView.frameLayoutGuide.widthAnchor),
            contentView.topAnchor.constraint(equalTo: timelineCardContainer.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: timelineCardContainer.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: timelineCardContainer.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: timelineCardContainer.bottomAnchor),
            contentView.heightAnchor.constraint(equalToConstant: timelineContentHeight),
            timeRulerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            timeRulerView.topAnchor.constraint(equalTo: contentView.topAnchor),
            timeRulerView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
            timeRulerView.widthAnchor.constraint(equalToConstant: Self.timeRulerWidth),
            dayColumnView.leadingAnchor.constraint(equalTo: timeRulerView.trailingAnchor),
            dayColumnView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            dayColumnView.topAnchor.constraint(equalTo: contentView.topAnchor),
            dayColumnView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])

        buildTimeRulerLabels()
        buildHourGridLines()
    }

    private func buildTimeRulerLabels() {
        for hour in startHour..<endHour {
            let label = UILabel()
            label.font = .monospacedSystemFont(ofSize: 12, weight: .medium)
            label.textColor = .appSubtitleGray
            label.text = String(format: "%02d:00", hour)
            label.translatesAutoresizingMaskIntoConstraints = false
            timeRulerView.addSubview(label)
            let y = CGFloat(hour - startHour) * Self.pointsPerHour
            NSLayoutConstraint.activate([
                label.trailingAnchor.constraint(equalTo: timeRulerView.trailingAnchor, constant: -8),
                label.topAnchor.constraint(equalTo: timeRulerView.topAnchor, constant: y + 4)
            ])
        }
    }

    private func buildHourGridLines() {
        for hour in startHour..<endHour {
            let line = UIView()
            line.backgroundColor = .appGridLineLight
            line.translatesAutoresizingMaskIntoConstraints = false
            dayColumnView.addSubview(line)
            let y = CGFloat(hour - startHour) * Self.pointsPerHour
            NSLayoutConstraint.activate([
                line.leadingAnchor.constraint(equalTo: dayColumnView.leadingAnchor),
                line.trailingAnchor.constraint(equalTo: dayColumnView.trailingAnchor),
                line.topAnchor.constraint(equalTo: dayColumnView.topAnchor, constant: y),
                line.heightAnchor.constraint(equalToConstant: 0.5)
            ])
        }
    }

    // MARK: - Data (ISO8601 + fallback; Z = UTC, depois calendar em SP dá hora local)
    private func dateForOrder(_ order: Order) -> Date? {
        guard let raw = order.appointmentDate else { return nil }
        let apt = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !apt.isEmpty else { return nil }

        // 1. ISO8601 com milissegundos (.000Z) – formato que o servidor manda
        let isoWithMillis = ISO8601DateFormatter()
        isoWithMillis.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        isoWithMillis.timeZone = TimeZone(secondsFromGMT: 0)
        if let date = isoWithMillis.date(from: apt) { return date }

        // 2. ISO8601 sem milissegundos
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        if let date = isoFormatter.date(from: apt) { return date }

        // 3. DateFormatter com formato explícito (UTC quando tem Z)
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.timeZone = apt.uppercased().hasSuffix("Z") ? TimeZone(secondsFromGMT: 0) : TimeZone(identifier: "America/Sao_Paulo")
        for format in ["yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", "yyyy-MM-dd'T'HH:mm:ss'Z'", "yyyy-MM-dd'T'HH:mm:ss", "yyyy-MM-dd HH:mm:ss"] {
            df.dateFormat = format
            if let date = df.date(from: apt) { return date }
        }
        // 4. Fallback: strip T/Z e pegar primeiros 19 chars
        let cleaned = apt.replacingOccurrences(of: "T", with: " ")
            .replacingOccurrences(of: "Z", with: "")
            .prefix(19)
        df.dateFormat = "yyyy-MM-dd HH:mm:ss"
        df.timeZone = apt.uppercased().hasSuffix("Z") ? TimeZone(secondsFromGMT: 0) : TimeZone(identifier: "America/Sao_Paulo")
        return df.date(from: String(cleaned))
    }

    private func filterAppointmentsForSelectedDay() {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "America/Sao_Paulo")
        let selectedStr = df.string(from: selectedDate)

        appointmentsForSelectedDay = allOrders.filter { order in
            guard let d = dateForOrder(order) else { return false }
            return df.string(from: d) == selectedStr
        }.sorted { (timeForOrder($0) ?? 0) < (timeForOrder($1) ?? 0) }
    }

    private func timeForOrder(_ order: Order) -> Int? {
        guard let d = dateForOrder(order) else { return nil }
        let comps = calendar.dateComponents([.hour, .minute], from: d)
        return (comps.hour ?? 0) * 60 + (comps.minute ?? 0)
    }

    private static let blockTimeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "HH:mm"
        f.timeZone = TimeZone(identifier: "America/Sao_Paulo")
        return f
    }()

    private func updateTimelineBlocks() {
        dayColumnView.subviews.filter { $0 is ScheduleAppointmentBlockView }.forEach { $0.removeFromSuperview() }
        for order in appointmentsForSelectedDay {
            guard let startMinutes = timeForOrder(order), let aptDate = dateForOrder(order) else { continue }
            let y = (CGFloat(startMinutes) / 60.0 - CGFloat(startHour)) * Self.pointsPerHour
            let duration = CGFloat(order.estimatedTime ?? Self.defaultDurationMinutes)
            let height = (duration / 60.0) * Self.pointsPerHour
            let blockHeight = max(height - 4, 44)
            let timeString = blockHeight >= 56 ? Self.blockTimeFormatter.string(from: aptDate) : nil

            let block = ScheduleAppointmentBlockView(frame: .zero)
            block.configure(with: order, timeString: timeString)
            block.translatesAutoresizingMaskIntoConstraints = false
            dayColumnView.addSubview(block)

            NSLayoutConstraint.activate([
                block.leadingAnchor.constraint(equalTo: dayColumnView.leadingAnchor, constant: 8),
                block.trailingAnchor.constraint(equalTo: dayColumnView.trailingAnchor, constant: -8),
                block.topAnchor.constraint(equalTo: dayColumnView.topAnchor, constant: y + 2),
                block.heightAnchor.constraint(equalToConstant: min(blockHeight, (CGFloat(endHour - startHour) * Self.pointsPerHour) - 4))
            ])
            block.onTap = { [weak self] in self?.showAppointmentActions(for: order) }
        }
    }

    // MARK: - API e estado
    private func loadOrders() {
        progressIndicator.startAnimating()
        Task {
            do {
                let response = try await apiService.getAllOrders(page: 1, limit: 300, agendaDays: 7)
                await MainActor.run {
                    allOrders = response.orders
                    filterAppointmentsForSelectedDay()
                    updateTimelineBlocks()
                    updateEmptyState()
                    updateCurrentTimeLinePosition()
                    progressIndicator.stopAnimating()
                    refreshControl.endRefreshing()
                }
            } catch {
                await MainActor.run {
                    progressIndicator.stopAnimating()
                    refreshControl.endRefreshing()
                }
            }
        }
    }

    private func updateDateLabel() {
        guard dateLabel != nil else { return }
        if calendar.isDateInToday(selectedDate) {
            let df = DateFormatter()
            df.locale = Locale(identifier: "pt_BR")
            df.dateFormat = "EEEE"
            dateLabel.text = "Hoje, \(df.string(from: selectedDate).capitalized)"
        } else {
            dateLabel.text = headerDateFormatter.string(from: selectedDate).capitalized
        }
    }

    @objc private func previousDay() { moveDay(by: -1) }
    @objc private func nextDay() { moveDay(by: 1) }
    private func moveDay(by value: Int) {
        selectedDate = calendar.date(byAdding: .day, value: value, to: selectedDate) ?? selectedDate
        updateDateLabel()
        updateHojeAmanhaSelection()
        filterAppointmentsForSelectedDay()
        updateTimelineBlocks()
        updateEmptyState()
        updateCurrentTimeLinePosition()
    }

    private func setupEmptyState() {
        emptyStateView = UIView()
        emptyStateView.translatesAutoresizingMaskIntoConstraints = false
        let label = UILabel()
        label.text = "Nenhum agendamento"
        label.textColor = .appSubtitleGray
        label.font = .systemFont(ofSize: 16, weight: .medium)
        label.translatesAutoresizingMaskIntoConstraints = false
        emptyStateView.addSubview(label)
        view.addSubview(emptyStateView)
        NSLayoutConstraint.activate([
            emptyStateView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            emptyStateView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            label.centerXAnchor.constraint(equalTo: emptyStateView.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: emptyStateView.centerYAnchor)
        ])
    }

    private func updateEmptyState() {
        emptyStateView.isHidden = !appointmentsForSelectedDay.isEmpty
    }

    @objc private func refreshSchedule() { loadOrders() }

    private func setupCurrentTimeLine() {
        currentTimeLineView = UIView()
        currentTimeLineView.backgroundColor = .systemRed
        currentTimeLineView.translatesAutoresizingMaskIntoConstraints = false
        dayColumnView.addSubview(currentTimeLineView)
        currentTimeLineTopConstraint = currentTimeLineView.topAnchor.constraint(equalTo: dayColumnView.topAnchor)
        NSLayoutConstraint.activate([
            currentTimeLineTopConstraint!,
            currentTimeLineView.leadingAnchor.constraint(equalTo: dayColumnView.leadingAnchor),
            currentTimeLineView.trailingAnchor.constraint(equalTo: dayColumnView.trailingAnchor),
            currentTimeLineView.heightAnchor.constraint(equalToConstant: 2)
        ])
    }

    private func updateCurrentTimeLinePosition() {
        guard calendar.isDateInToday(selectedDate) else {
            currentTimeLineView.isHidden = true
            return
        }
        let now = Date()
        let totalMinutes = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
        let hourFraction = CGFloat(totalMinutes) / 60.0
        if hourFraction < CGFloat(startHour) || hourFraction >= CGFloat(endHour) {
            currentTimeLineView.isHidden = true
            return
        }
        currentTimeLineView.isHidden = false
        currentTimeLineTopConstraint?.constant = (hourFraction - CGFloat(startHour)) * Self.pointsPerHour
    }

    private func showAppointmentActions(for order: Order) {
        let alert = UIAlertController(title: order.customerName, message: nil, preferredStyle: .actionSheet)
        alert.addAction(UIAlertAction(title: "WhatsApp", style: .default) { _ in
            let phone = order.customerPhone.filter("0123456789".contains)
            let clean = phone.hasPrefix("55") ? phone : "55\(phone)"
            if let url = URL(string: "https://wa.me/\(clean)") { UIApplication.shared.open(url) }
        })
        alert.addAction(UIAlertAction(title: "Concluir", style: .default) { _ in
            Task {
                try? await self.apiService.updateOrderStatus(orderId: order.id, status: "finished")
                await MainActor.run { self.loadOrders() }
            }
        })
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        present(alert, animated: true)
    }

    @objc private func onDidLogin() { loadOrders() }
}

// MARK: - Bloco de agendamento (estilo desktop: card branco, borda sutil, hora quando alto)
private final class ScheduleAppointmentBlockView: UIView {
    var onTap: (() -> Void)?
    private let nameLabel = UILabel()
    private let serviceLabel = UILabel()
    private let timeLabel = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .appCardWhite
        layer.cornerRadius = 12
        layer.borderWidth = 1
        layer.borderColor = UIColor.appGridLineLight.cgColor
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.08
        layer.shadowOffset = CGSize(width: 0, height: 2)
        layer.shadowRadius = 4

        nameLabel.font = .systemFont(ofSize: 14, weight: .semibold)
        nameLabel.textColor = .appTitleBlack
        nameLabel.lineBreakMode = .byTruncatingTail
        serviceLabel.font = .systemFont(ofSize: 12)
        serviceLabel.textColor = .appSubtitleGray
        serviceLabel.lineBreakMode = .byTruncatingTail
        timeLabel.font = .systemFont(ofSize: 12, weight: .medium)
        timeLabel.textColor = .appPrimaryBlack

        let stack = UIStackView(arrangedSubviews: [nameLabel, serviceLabel, timeLabel])
        stack.axis = .vertical
        stack.alignment = .leading
        stack.spacing = 2
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: bottomAnchor, constant: -8)
        ])
        addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(handleTap)))
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    @objc private func handleTap() { onTap?() }

    func configure(with order: Order, timeString: String? = nil) {
        nameLabel.text = order.customerName
        serviceLabel.text = order.items.first?.name ?? "Serviço"
        timeLabel.text = timeString
        timeLabel.isHidden = timeString == nil
    }
}
