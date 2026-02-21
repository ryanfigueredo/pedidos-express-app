import UIKit
import Combine
import os.log

class SettingsViewController: UIViewController {
    private var settingsTableView: UITableView!
    
    private let authService = AuthService()
    private let printerHelper = PrinterHelper()
    
    private var cancellables = Set<AnyCancellable>()
    
    private let settingsItems = [
        "Impressora Bluetooth",
        "Sobre",
        "Sair"
    ]

    /// Itens exibidos: em modo barbeiro não mostramos nada de impressora.
    private var visibleSettingsItems: [String] {
        let isBarber = BusinessProvider.isBarber || authService.getUser()?.businessType?.uppercased() == "BARBEIRO"
        if isBarber {
            return settingsItems.filter { $0 != "Impressora Bluetooth" }
        }
        return settingsItems
    }
    
    private var user: User?
    private var tenantName: String = "Loja"
    
    private let logger = Logger(subsystem: "com.pedidosexpress", category: "SettingsViewController")
    
    override func viewDidLoad() {
        super.viewDidLoad()
        if BusinessProvider.isBarber {
            overrideUserInterfaceStyle = .dark
        }
        title = "Configurações"
        navigationItem.largeTitleDisplayMode = .never
        user = authService.getUser()
        tenantName = user?.tenantId ?? "Loja"
        setupUI()
        setupTableView()
        if !BusinessProvider.isBarber {
            observePrinterHelper()
        }
    }

    private func observePrinterHelper() {
        guard !BusinessProvider.isBarber else { return }
        printerHelper.$availablePrinters
            .receive(on: DispatchQueue.main)
            .sink { [weak self] printers in
                self?.logger.info("📱 SettingsViewController: \(printers.count) impressoras disponíveis")
            }
            .store(in: &cancellables)
        printerHelper.$isConnected
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isConnected in
                self?.logger.info("🔌 SettingsViewController: Impressora conectada: \(isConnected)")
            }
            .store(in: &cancellables)
        printerHelper.$isScanning
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isScanning in
                if !isScanning {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self?.showPrinterScanResults()
                    }
                }
            }
            .store(in: &cancellables)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        user = authService.getUser()
        tenantName = user?.tenantId ?? "Loja"
        settingsTableView.reloadData()
    }
    
    private func setupUI() {
        view.backgroundColor = BusinessProvider.backgroundColor
        
        settingsTableView = UITableView(frame: .zero, style: .insetGrouped)
        settingsTableView.translatesAutoresizingMaskIntoConstraints = false
        settingsTableView.backgroundColor = BusinessProvider.backgroundColor
        view.addSubview(settingsTableView)
        
        NSLayoutConstraint.activate([
            settingsTableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            settingsTableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            settingsTableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            settingsTableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    private func setupTableView() {
        settingsTableView.delegate = self
        settingsTableView.dataSource = self
        settingsTableView.register(UITableViewCell.self, forCellReuseIdentifier: "SettingCell")
    }
    
    private func showPrinterSettings() {
        let statusMessage = printerHelper.isConnected ? "Conectada" : "Desconectada"
        let printerCount = printerHelper.availablePrinters.count
        let message = "Status: \(statusMessage)\nImpressoras encontradas: \(printerCount)"
        
        let alert = UIAlertController(title: "Impressora Bluetooth", message: message, preferredStyle: .actionSheet)
        
        alert.addAction(UIAlertAction(title: "Buscar Impressoras", style: .default) { [weak self] _ in
            let logMsg = "🔍 SettingsViewController: Usuário solicitou busca de impressoras"
            self?.logger.info("\(logMsg)")
            print("\(logMsg)")
            self?.printerHelper.scanForPrinters()
            
            // Mostrar feedback imediato
            let scanningAlert = UIAlertController(
                title: "Buscando Impressoras...",
                message: "Por favor, aguarde. Isso pode levar até 10 segundos.",
                preferredStyle: .alert
            )
            self?.present(scanningAlert, animated: true)
            
            // O alerta será fechado quando o scan terminar (via observePrinterHelper)
            DispatchQueue.main.asyncAfter(deadline: .now() + 10.5) {
                scanningAlert.dismiss(animated: true)
            }
        })
        
        // Mostrar lista de impressoras disponíveis
        if !printerHelper.availablePrinters.isEmpty {
            for printer in printerHelper.availablePrinters {
                let printerName = printer.name ?? "Impressora sem nome"
                let isCurrentPrinter = printer.identifier == printerHelper.connectedPeripheral?.identifier
                let actionTitle = isCurrentPrinter ? "\(printerName) ✓" : printerName
                
                alert.addAction(UIAlertAction(title: actionTitle, style: .default) { [weak self] _ in
                    self?.logger.info("🔌 SettingsViewController: Conectando à impressora: \(printerName)")
                    self?.printerHelper.connectToPrinter(printer)
                    
                    let connectingAlert = UIAlertController(
                        title: "Conectando...",
                        message: "Conectando à \(printerName)",
                        preferredStyle: .alert
                    )
                    self?.present(connectingAlert, animated: true)
                    
                    // Aguardar conexão (máximo 10 segundos)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
                        connectingAlert.dismiss(animated: true)
                        if self?.printerHelper.isConnected == true {
                            self?.showAlert(title: "Conectado", message: "Impressora conectada com sucesso!")
                        } else {
                            self?.showAlert(title: "Erro", message: "Não foi possível conectar à impressora. Verifique se ela está ligada e próxima.")
                        }
                    }
                })
            }
        }
        
        alert.addAction(UIAlertAction(title: "Teste de Impressão", style: .default) { [weak self] _ in
            guard let self = self else { return }
            if self.printerHelper.isConnected {
                self.logger.info("🖨️ SettingsViewController: Teste de impressão solicitado")
                self.printerHelper.testPrint()
                self.showAlert(title: "Enviado", message: "Comando de teste enviado para a impressora.")
            } else {
                self.showAlert(title: "Não Conectado", message: "Conecte uma impressora primeiro.")
            }
        })
        
        if printerHelper.isConnected {
            alert.addAction(UIAlertAction(title: "Desconectar", style: .destructive) { [weak self] _ in
                self?.logger.info("🔌 SettingsViewController: Desconectando impressora")
                self?.printerHelper.disconnect()
                self?.showAlert(title: "Desconectado", message: "Impressora desconectada.")
            })
        }
        
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        
        // Para iPad
        if let popover = alert.popoverPresentationController {
            popover.sourceView = view
            popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        
        present(alert, animated: true)
    }
    
    private func showPrinterScanResults() {
        let count = printerHelper.availablePrinters.count
        if count > 0 {
            let message = "Encontradas \(count) impressora(s).\n\nToque em 'Impressora Bluetooth' novamente para ver a lista e conectar."
            showAlert(title: "Busca Concluída", message: message)
        } else {
            showAlert(
                title: "Nenhuma Impressora Encontrada",
                message: "Não foram encontradas impressoras Bluetooth próximas.\n\nCertifique-se de que:\n• A impressora está ligada\n• O Bluetooth está ativado\n• A impressora está próxima ao dispositivo"
            )
        }
    }
    
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    private func showAbout() {
        let alert = UIAlertController(
            title: "Pedidos Express",
            message: "Versão 1.0.1\n\nApp para gerenciamento de pedidos e atendimentos.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    private func logout() {
        let alert = UIAlertController(title: "Sair", message: "Deseja realmente sair?", preferredStyle: .alert)
        
        alert.addAction(UIAlertAction(title: "Sair", style: .destructive) { [weak self] _ in
            self?.authService.logout()
            
            // Criar LoginViewController programaticamente
            let loginVC = LoginViewController()
            let navController = UINavigationController(rootViewController: loginVC)
            navController.modalPresentationStyle = .fullScreen
            self?.present(navController, animated: true)
        })
        
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        
        present(alert, animated: true)
    }
    
}

// MARK: - UITableViewDataSource, UITableViewDelegate
extension SettingsViewController: UITableViewDataSource, UITableViewDelegate {
    func numberOfSections(in tableView: UITableView) -> Int {
        return 2
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        if section == 0 {
            return "Informações"
        }
        return nil
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if section == 0 {
            return 3
        }
        return visibleSettingsItems.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "SettingCell", for: indexPath)
        
        cell.textLabel?.text = nil
        cell.textLabel?.numberOfLines = 1
        cell.textLabel?.textColor = BusinessProvider.textPrimaryColor
        cell.detailTextLabel?.text = nil
        cell.detailTextLabel?.textColor = BusinessProvider.textSecondaryColor
        cell.accessoryType = .none
        cell.backgroundColor = BusinessProvider.cardBackgroundColor
        cell.selectionStyle = .default
        
        if indexPath.section == 0 {
            configureInfoCell(cell, at: indexPath)
        } else {
            cell.textLabel?.text = visibleSettingsItems[indexPath.row]
            cell.accessoryType = .disclosureIndicator
        }
        
        return cell
    }
    
    private func configureInfoCell(_ cell: UITableViewCell, at indexPath: IndexPath) {
        // Garantir que o user está atualizado
        if user == nil {
            user = authService.getUser()
            tenantName = user?.tenantId ?? "Loja"
        }
        
        switch indexPath.row {
        case 0:
            cell.textLabel?.text = "Nome da Loja"
            let displayName = tenantName.replacingOccurrences(of: "-", with: " ").capitalized
            cell.detailTextLabel?.text = displayName.isEmpty ? "Loja" : displayName
            cell.accessoryType = .none
            cell.selectionStyle = .none
        case 1:
            cell.textLabel?.text = "Usuário"
            cell.detailTextLabel?.text = user?.name ?? "N/A"
            cell.accessoryType = .none
            cell.selectionStyle = .none
        case 2:
            cell.textLabel?.text = "Conta"
            let username = user?.username ?? "N/A"
            cell.detailTextLabel?.text = "@\(username)"
            cell.accessoryType = .none
            cell.selectionStyle = .none
        default:
            break
        }
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        if indexPath.section == 0 {
            return
        }
        handleSettingsAction(at: indexPath.row)
    }
    
    private func handleSettingsAction(at index: Int) {
        guard index < visibleSettingsItems.count else { return }
        let item = visibleSettingsItems[index]
        switch item {
        case "Impressora Bluetooth":
            showPrinterSettings()
        case "Sobre":
            showAbout()
        case "Sair":
            logout()
        default:
            break
        }
    }
}
    