import UIKit

/// Sheet com formulário completo para agendamento manual: nome, telefone (máscara), serviço (picker), data/hora (UIDatePicker).
final class ManualAppointmentSheetViewController: UIViewController {

    var onSave: ((String, String, Date, MenuItem?) -> Void)?
    var onDismiss: (() -> Void)?

    private let apiService = ApiService()
    private var menuItems: [MenuItem] = []
    private var selectedService: MenuItem?

    private var scrollView: UIScrollView!
    private var stackView: UIStackView!
    private var nameField: UITextField!
    private var phoneField: UITextField!
    private var servicePickerField: UITextField!
    private var datePicker: UIDatePicker!
    private var saveButton: UIButton!
    private var loadingIndicator: UIActivityIndicatorView!
    private var servicePicker: UIPickerView!

    override func viewDidLoad() {
        super.viewDidLoad()
        overrideUserInterfaceStyle = .dark
        view.backgroundColor = .scheduleBackground
        title = "Agendamento manual"
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .cancel, target: self, action: #selector(cancelTapped))
        setupForm()
        loadServices()
    }

    private func setupForm() {
        scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.keyboardDismissMode = .interactive
        view.addSubview(scrollView)

        stackView = UIStackView()
        stackView.axis = .vertical
        stackView.spacing = 16
        stackView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(stackView)

        nameField = makeField(placeholder: "Nome do cliente")
        nameField.autocapitalizationType = .words
        stackView.addArrangedSubview(labelFor("Nome do cliente"))
        stackView.addArrangedSubview(nameField)

        phoneField = makeField(placeholder: "(00) 00000-0000")
        phoneField.keyboardType = .numberPad
        phoneField.delegate = self
        stackView.addArrangedSubview(labelFor("Telefone / WhatsApp"))
        stackView.addArrangedSubview(phoneField)

        servicePicker = UIPickerView()
        servicePicker.delegate = self
        servicePicker.dataSource = self
        servicePickerField = makeField(placeholder: "Selecione o serviço")
        servicePickerField.inputView = servicePicker
        servicePickerField.delegate = self
        let serviceToolbar = UIToolbar()
        serviceToolbar.sizeToFit()
        serviceToolbar.items = [
            UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil),
            UIBarButtonItem(title: "OK", style: .done, target: self, action: #selector(servicePickerDone)),
        ]
        servicePickerField.inputAccessoryView = serviceToolbar
        stackView.addArrangedSubview(labelFor("Serviço"))
        stackView.addArrangedSubview(servicePickerField)

        datePicker = UIDatePicker()
        datePicker.datePickerMode = .dateAndTime
        datePicker.preferredDatePickerStyle = .wheels
        datePicker.minimumDate = Date()
        datePicker.locale = Locale(identifier: "pt_BR")
        datePicker.translatesAutoresizingMaskIntoConstraints = false
        datePicker.tintColor = .barberPrimary
        stackView.addArrangedSubview(labelFor("Data e horário"))
        stackView.addArrangedSubview(datePicker)

        saveButton = UIButton(type: .system)
        saveButton.setTitle("Salvar agendamento", for: .normal)
        saveButton.setTitleColor(.white, for: .normal)
        saveButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        saveButton.backgroundColor = .barberPrimary
        saveButton.layer.cornerRadius = 12
        saveButton.addTarget(self, action: #selector(saveTapped), for: .touchUpInside)
        saveButton.translatesAutoresizingMaskIntoConstraints = false
        stackView.addArrangedSubview(saveButton)

        loadingIndicator = UIActivityIndicatorView(style: .medium)
        loadingIndicator.color = .barberPrimary
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(loadingIndicator)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            stackView.topAnchor.constraint(equalTo: scrollView.topAnchor, constant: 20),
            stackView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor, constant: -20),
            stackView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor, constant: -20),
            stackView.widthAnchor.constraint(equalTo: scrollView.widthAnchor, constant: -40),
            nameField.heightAnchor.constraint(equalToConstant: 44),
            phoneField.heightAnchor.constraint(equalToConstant: 44),
            servicePickerField.heightAnchor.constraint(equalToConstant: 44),
            saveButton.heightAnchor.constraint(equalToConstant: 48),
            loadingIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    private func labelFor(_ text: String) -> UILabel {
        let l = UILabel()
        l.text = text
        l.font = .systemFont(ofSize: 14, weight: .medium)
        l.textColor = .barberTextSecondary
        return l
    }

    private func makeField(placeholder: String) -> UITextField {
        let tf = UITextField()
        tf.placeholder = placeholder
        tf.borderStyle = .roundedRect
        tf.backgroundColor = .scheduleCard
        tf.textColor = .barberTextPrimary
        tf.font = .systemFont(ofSize: 16)
        tf.translatesAutoresizingMaskIntoConstraints = false
        tf.layer.cornerRadius = 10
        return tf
    }

    /// Filtra itens do cardápio para exibir no picker: no fluxo barbeiro só Serviços/Combos do tenant.
    private func filterMenuItemsForPicker(_ items: [MenuItem]) -> [MenuItem] {
        guard BusinessProvider.isBarber else { return items }
        let restaurantCategories: Set<String> = [
            "bebidas", "bebida", "comidas", "comida", "sobremesas", "sobremesa",
            "acompanhamento", "acompanhamentos", "hamburguer", "hamburgueres", "doce", "doces"
        ]
        let barberServiceCategories: Set<String> = [
            "serviços", "servicos", "cabelo", "barba", "sobrancelha", "corte", "degradê", "degrade", "barbas", "bigode",
            "combo", "combos", "pacote", "pacotes", "cabelo e barba", "cabelo barba sobrancelha"
        ]
        return items.filter { item in
            let c = item.category.trimmingCharacters(in: .whitespaces).lowercased()
            return !c.isEmpty && !restaurantCategories.contains(c) && barberServiceCategories.contains(c)
        }
    }

    private func loadServices() {
        Task {
            do {
                let items = try await apiService.getMenu()
                let filtered = filterMenuItemsForPicker(items)
                await MainActor.run {
                    self.menuItems = filtered
                    self.servicePicker.reloadAllComponents()
                    self.selectedService = filtered.first
                    self.servicePickerField.text = filtered.first?.name
                    if filtered.isEmpty {
                        self.servicePickerField.placeholder = "Nenhum serviço cadastrado (aba Serviços)"
                    }
                }
            } catch {
                await MainActor.run {
                    self.menuItems = []
                    self.servicePickerField.placeholder = "Nenhum serviço cadastrado"
                }
            }
        }
    }

    @objc private func servicePickerDone() {
        servicePickerField.resignFirstResponder()
    }

    @objc private func cancelTapped() {
        dismiss(animated: true)
        onDismiss?()
    }

    @objc private func saveTapped() {
        let name = nameField.text?.trimmingCharacters(in: .whitespaces) ?? ""
        guard !name.isEmpty else {
            let alert = UIAlertController(title: "Atenção", message: "Informe o nome do cliente.", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
            return
        }
        let phone = Self.normalizePhone(phoneField.text ?? "")
        let chosenDate = datePicker.date
        let service = selectedService
        dismiss(animated: true) { [weak self] in
            self?.onSave?(name, phone, chosenDate, service)
        }
    }

    /// Formata telefone para apenas dígitos (máscara simples).
    static func normalizePhone(_ raw: String) -> String {
        raw.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
    }
}

// MARK: - UITextFieldDelegate (máscara de telefone)
extension ManualAppointmentSheetViewController: UITextFieldDelegate {
    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        guard textField == phoneField else { return true }
        let current = textField.text ?? ""
        let next = (current as NSString).replacingCharacters(in: range, with: string)
        let digits = next.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        let limited = String(digits.prefix(11))
        if limited.count <= 2 {
            textField.text = limited.isEmpty ? "" : "(\(limited)"
        } else if limited.count <= 6 {
            textField.text = "(\(limited.prefix(2))) \(limited.dropFirst(2))"
        } else {
            textField.text = "(\(limited.prefix(2))) \(limited.dropFirst(2).prefix(4))-\(limited.dropFirst(6))"
        }
        return false
    }
}

// MARK: - UIPickerViewDataSource, UIPickerViewDelegate
extension ManualAppointmentSheetViewController: UIPickerViewDataSource, UIPickerViewDelegate {
    func numberOfComponents(in pickerView: UIPickerView) -> Int { 1 }
    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        return max(menuItems.count, 1)
    }
    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
        guard row < menuItems.count else { return "—" }
        return menuItems[row].name
    }
    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        guard row < menuItems.count else { return }
        selectedService = menuItems[row]
        servicePickerField.text = menuItems[row].name
    }
}
