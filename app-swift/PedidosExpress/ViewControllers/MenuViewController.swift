import UIKit

class MenuViewController: UIViewController {
    private var menuTableView: UITableView!
    private var progressIndicator: UIActivityIndicatorView!
    private var segmentedControl: UISegmentedControl!
    
    private let apiService = ApiService()
    private var allMenuItems: [MenuItem] = []
    private var filteredMenuItems: [MenuItem] = []
    
    /// Barbeiro: Serviços (Cabelo, Barba, Sobrancelha...) e Combos (ex: Cabelo + Barba + Sobrancelha para o bot oferecer).
    private var categories: [String] {
        BusinessProvider.isBarber ? ["Serviços", "Combos"] : ["Bebidas", "Comidas", "Sobremesas"]
    }
    private var selectedCategoryIndex = 0
    private let maxItemsPerCategory = 9

    override func viewDidLoad() {
        super.viewDidLoad()
        let user = AuthService().getUser()
        title = BusinessTypeHelper.menuLabel(for: user)
        navigationItem.largeTitleDisplayMode = .never

        setupUI()
        setupTableView()
        loadMenu()
        
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .add,
            target: self,
            action: #selector(addMenuItem)
        )
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        loadMenu(silent: true)
    }
    
    private func setupUI() {
        view.backgroundColor = BusinessProvider.backgroundColor

        segmentedControl = UISegmentedControl(items: categories)
        segmentedControl.selectedSegmentIndex = 0
        segmentedControl.backgroundColor = BusinessProvider.cardBackgroundColor
        segmentedControl.selectedSegmentTintColor = BusinessProvider.primaryColor
        segmentedControl.setTitleTextAttributes([.foregroundColor: UIColor.white], for: .selected)
        segmentedControl.setTitleTextAttributes([.foregroundColor: BusinessProvider.textSecondaryColor], for: .normal)
        segmentedControl.addTarget(self, action: #selector(categoryChanged), for: .valueChanged)
        segmentedControl.translatesAutoresizingMaskIntoConstraints = false

        let segmentedContainer = UIView()
        segmentedContainer.backgroundColor = BusinessProvider.backgroundColor
        segmentedContainer.translatesAutoresizingMaskIntoConstraints = false
        segmentedContainer.addSubview(segmentedControl)

        menuTableView = UITableView()
        menuTableView.backgroundColor = BusinessProvider.backgroundColor
        menuTableView.translatesAutoresizingMaskIntoConstraints = false
        
        progressIndicator = UIActivityIndicatorView(style: .large)
        progressIndicator.translatesAutoresizingMaskIntoConstraints = false
        progressIndicator.hidesWhenStopped = true
        progressIndicator.color = BusinessProvider.primaryColor

        view.addSubview(segmentedContainer)
        view.addSubview(menuTableView)
        view.addSubview(progressIndicator)
        
        NSLayoutConstraint.activate([
            segmentedContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            segmentedContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            segmentedContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            segmentedContainer.heightAnchor.constraint(equalToConstant: 44),
            
            segmentedControl.topAnchor.constraint(equalTo: segmentedContainer.topAnchor, constant: 8),
            segmentedControl.leadingAnchor.constraint(equalTo: segmentedContainer.leadingAnchor, constant: 16),
            segmentedControl.trailingAnchor.constraint(equalTo: segmentedContainer.trailingAnchor, constant: -16),
            segmentedControl.bottomAnchor.constraint(equalTo: segmentedContainer.bottomAnchor, constant: -8),
            
            menuTableView.topAnchor.constraint(equalTo: segmentedContainer.bottomAnchor),
            menuTableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            menuTableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            menuTableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            progressIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            progressIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    @objc private func categoryChanged() {
        selectedCategoryIndex = segmentedControl.selectedSegmentIndex
        filterMenuItems()
    }
    
    private func filterMenuItems() {
        let selectedCategory = categories[selectedCategoryIndex]

        let categoryMapping: [String: [String]]
        if BusinessProvider.isBarber {
            categoryMapping = [
                "Serviços": ["serviços", "servicos", "cabelo", "barba", "sobrancelha", "corte", "degradê", "degrade", "barbas", "bigode"],
                "Combos": ["combo", "combos", "pacote", "pacotes", "cabelo e barba", "cabelo barba sobrancelha"]
            ]
        } else {
            categoryMapping = [
                "Bebidas": ["bebida", "bebidas"],
                "Comidas": ["hamburguer", "hamburgueres", "comida", "comidas", "acompanhamento", "acompanhamentos"],
                "Sobremesas": ["sobremesa", "sobremesas", "doce", "doces"]
            ]
        }

        var sourceItems = allMenuItems
        if BusinessProvider.isBarber {
            let restaurantCategories: Set<String> = [
                "bebidas", "bebida", "comidas", "comida", "sobremesas", "sobremesa",
                "acompanhamento", "acompanhamentos", "hamburguer", "hamburgueres", "doce", "doces"
            ]
            sourceItems = allMenuItems.filter { item in
                let c = item.category.trimmingCharacters(in: .whitespaces).lowercased()
                return !c.isEmpty && !restaurantCategories.contains(c)
            }
        }

        var filtered = sourceItems.filter { item in
            let itemCategory = item.category.trimmingCharacters(in: .whitespaces).lowercased()
            let targetCategories = categoryMapping[selectedCategory] ?? [selectedCategory.lowercased()]
            return targetCategories.contains(itemCategory)
        }
        
        // Limitar a 9 itens para não bugar as mensagens do bot
        if filtered.count > maxItemsPerCategory {
            filtered = Array(filtered.prefix(maxItemsPerCategory))
        }
        
        filteredMenuItems = filtered
        menuTableView.reloadData()
    }
    
    private func setupTableView() {
        menuTableView.delegate = self
        menuTableView.dataSource = self
        menuTableView.register(MenuItemTableViewCell.self, forCellReuseIdentifier: "MenuItemCell")
    }
    
    private func loadMenu(silent: Bool = false) {
        if !silent { progressIndicator.startAnimating() }
        
        Task {
            do {
                let items = try await apiService.getMenu()
                
                await MainActor.run {
                    self.allMenuItems = items
                    self.filterMenuItems()
                    if !silent { self.progressIndicator.stopAnimating() }
                    
                    // Se não houver itens, não mostrar erro (é normal)
                    if items.isEmpty {
                        // Opcional: mostrar mensagem informativa
                        // self.showAlert(title: "Info", message: "Nenhum item no cardápio")
                    }
                }
            } catch {
                await MainActor.run {
                    if !silent { self.progressIndicator.stopAnimating() }
                    
                    // Mensagem mais amigável baseada no tipo de erro (apenas quando não for silent)
                    var errorMessage = "Erro ao carregar cardápio."
                    var errorTitle = "Erro"
                    
                    if let apiError = error as? ApiError {
                        switch apiError {
                        case .unauthorized:
                            errorTitle = "Sessão Expirada"
                            errorMessage = "Sua sessão expirou. Faça login novamente."
                        case .loginFailed:
                            errorTitle = "Erro de Login"
                            errorMessage = apiError.localizedDescription ?? "Usuário ou senha incorretos."
                        case .networkError(let message):
                            errorTitle = "Erro de Conexão"
                            errorMessage = message
                        case .requestFailed:
                            errorTitle = "Erro de Conexão"
                            errorMessage = "Erro ao conectar com o servidor. Verifique sua conexão com a internet."
                        default:
                            errorMessage = apiError.localizedDescription ?? "Erro desconhecido."
                        }
                    } else if let urlError = error as? URLError {
                        errorTitle = "Erro de Conexão"
                        switch urlError.code {
                        case .notConnectedToInternet, .networkConnectionLost:
                            errorMessage = "Sem conexão com a internet. Verifique sua conexão."
                        case .timedOut:
                            errorMessage = "Tempo de conexão esgotado. Tente novamente."
                        case .cannotConnectToHost:
                            errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão."
                        default:
                            errorMessage = "Erro de conexão: \(urlError.localizedDescription)"
                        }
                    } else {
                        errorMessage = error.localizedDescription.isEmpty ? "Erro desconhecido ao carregar cardápio." : error.localizedDescription
                    }
                    
                    if !silent { self.showAlert(title: errorTitle, message: errorMessage) }
                }
            }
        }
    }
    
    @objc private func addMenuItem() {
        if BusinessProvider.isBarber {
            // Barbeiro: primeiro escolhe a categoria (Serviços ou Combos), depois nome e preço
            let sheet = UIAlertController(title: "Nova categoria", message: "Onde deseja adicionar o item?", preferredStyle: .actionSheet)
            for cat in categories {
                sheet.addAction(UIAlertAction(title: cat, style: .default) { [weak self] _ in
                    self?.showAddItemAlert(category: cat)
                })
            }
            sheet.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
            if let popover = sheet.popoverPresentationController {
                popover.barButtonItem = navigationItem.rightBarButtonItem
                popover.sourceView = view
            }
            present(sheet, animated: true)
        } else {
            showAddItemAlert(category: nil)
        }
    }

    /// Exibe alerta com Nome e Preço. Para barbeiro, category já vem preenchida; para restaurante, pede categoria no alert.
    private func showAddItemAlert(category: String?) {
        let alert = UIAlertController(title: category ?? "Novo Item", message: category != nil ? "Nome do serviço ou combo e preço." : nil, preferredStyle: .alert)

        alert.addTextField { textField in
            textField.placeholder = category == "Serviços" ? "Ex: Cabelo, Barba, Sobrancelha" : (category == "Combos" ? "Ex: Cabelo + Barba + Sobrancelha" : "Nome")
        }

        alert.addTextField { textField in
            textField.placeholder = "Preço"
            textField.keyboardType = .decimalPad
        }

        if category == nil {
            alert.addTextField { textField in
                textField.placeholder = "Categoria (Bebidas, Comidas, Sobremesas)"
            }
        }

        let finalCategory: String
        if let cat = category {
            finalCategory = cat
        } else {
            finalCategory = "" // will read from text field
        }

        alert.addAction(UIAlertAction(title: "Adicionar", style: .default) { [weak self] _ in
            guard let nameField = alert.textFields?[0],
                  let priceField = alert.textFields?[1],
                  let name = nameField.text?.trimmingCharacters(in: .whitespaces), !name.isEmpty,
                  let priceText = priceField.text,
                  let price = Double(priceText.replacingOccurrences(of: ",", with: ".")), price >= 0 else {
                return
            }
            let cat: String
            if !finalCategory.isEmpty {
                cat = finalCategory
            } else if let categoryField = alert.textFields?[2], let c = categoryField.text?.trimmingCharacters(in: .whitespaces), !c.isEmpty {
                cat = c
            } else {
                return
            }
            self?.createMenuItem(id: UUID().uuidString, name: name, price: price, category: cat)
        })

        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        present(alert, animated: true)
    }
    
    private func createMenuItem(id: String, name: String, price: Double, category: String) {
        progressIndicator.startAnimating()
        
        Task {
            do {
                let newItem = try await apiService.createMenuItem(id: id, name: name, price: price, category: category)
                
                await MainActor.run {
                    self.progressIndicator.stopAnimating()
                    if !self.allMenuItems.contains(where: { $0.id == newItem.id }) {
                        self.allMenuItems.append(newItem)
                        self.filterMenuItems()
                    }
                    self.loadMenu()
                }
            } catch {
                await MainActor.run {
                    self.progressIndicator.stopAnimating()
                    var errorTitle = "Erro"
                    var errorMessage = error.localizedDescription
                    if let apiError = error as? ApiError {
                        switch apiError {
                        case .unauthorized:
                            errorTitle = "Sessão Expirada"
                            errorMessage = "Sua sessão expirou. Faça login novamente."
                        case .networkError(let message):
                            errorTitle = "Erro de Conexão"
                            errorMessage = message
                        case .requestFailed, .invalidURL, .invalidResponse:
                            errorTitle = "Erro de Conexão"
                            errorMessage = "Erro ao conectar com o servidor. Verifique sua conexão com a internet."
                        default:
                            errorMessage = apiError.localizedDescription ?? "Não foi possível adicionar o item."
                        }
                    } else if let urlError = error as? URLError {
                        errorTitle = "Erro de Conexão"
                        switch urlError.code {
                        case .notConnectedToInternet, .networkConnectionLost:
                            errorMessage = "Sem conexão com a internet. Verifique sua conexão."
                        case .timedOut:
                            errorMessage = "Tempo de conexão esgotado. Tente novamente."
                        case .cannotConnectToHost:
                            errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão."
                        default:
                            errorMessage = urlError.localizedDescription
                        }
                    }
                    self.showAlert(title: errorTitle, message: errorMessage)
                }
            }
        }
    }
    
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - UITableViewDataSource, UITableViewDelegate
extension MenuViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return filteredMenuItems.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "MenuItemCell", for: indexPath) as! MenuItemTableViewCell
        cell.configure(with: filteredMenuItems[indexPath.row])
        return cell
    }
    
    func tableView(_ tableView: UITableView, trailingSwipeActionsConfigurationForRowAt indexPath: IndexPath) -> UISwipeActionsConfiguration? {
        let item = filteredMenuItems[indexPath.row]
        
        let toggleAction = UIContextualAction(
            style: .normal,
            title: item.available ? "Desativar" : "Ativar"
        ) { [weak self] _, _, completion in
            self?.toggleItemAvailability(item)
            completion(true)
        }
        toggleAction.backgroundColor = item.available ? .systemOrange : .systemGreen
        
        let deleteAction = UIContextualAction(style: .destructive, title: "Deletar") { [weak self] _, _, completion in
            self?.deleteMenuItem(item)
            completion(true)
        }
        
        return UISwipeActionsConfiguration(actions: [deleteAction, toggleAction])
    }
    
    private func toggleItemAvailability(_ item: MenuItem) {
        Task {
            do {
                _ = try await apiService.updateMenuItem(id: item.id, available: !item.available)
                await MainActor.run {
                    self.loadMenu()
                }
            } catch {
                await MainActor.run {
                    self.showAlert(title: "Erro", message: error.localizedDescription)
                }
            }
        }
    }
    
    private func deleteMenuItem(_ item: MenuItem) {
        let alert = UIAlertController(title: "Confirmar", message: "Deletar \(item.name)?", preferredStyle: .alert)
        
        alert.addAction(UIAlertAction(title: "Deletar", style: .destructive) { [weak self] _ in
            Task {
                do {
                    _ = try await self?.apiService.deleteMenuItem(id: item.id)
                    await MainActor.run {
                        self?.loadMenu()
                    }
                } catch {
                    await MainActor.run {
                        self?.showAlert(title: "Erro", message: error.localizedDescription)
                    }
                }
            }
        })
        
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        
        present(alert, animated: true)
    }
}
