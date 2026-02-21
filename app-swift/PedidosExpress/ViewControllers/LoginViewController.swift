import UIKit

class LoginViewController: UIViewController {

    // MARK: - Subviews
    private var scrollView: UIScrollView!
    private var contentView: UIView!
    private var logoImageView: UIImageView!
    private var usernameTextField: UITextField!
    private var passwordTextField: UITextField!
    private var passwordToggleButton: UIButton!
    private var forgotPasswordButton: UIButton!
    private var savePasswordSwitch: UISwitch!
    private var savePasswordLabel: UILabel!
    private var loginButton: UIButton!
    private var progressIndicator: UIActivityIndicatorView!

    private let apiService = ApiService()
    private let authService = AuthService()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupKeyboardHandling()
        loadSavedCredentials()
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if self.authService.isLoggedIn() {
                self.navigateToMain()
            }
        }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        registerKeyboardNotifications()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        unregisterKeyboardNotifications()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .default }

    deinit {
        unregisterKeyboardNotifications()
    }

    private func setupUI() {
        view.backgroundColor = UIColor(red: 249/255, green: 249/255, blue: 249/255, alpha: 1) // #F9F9F9 off-white

        scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.keyboardDismissMode = .interactive
        scrollView.showsVerticalScrollIndicator = false
        view.addSubview(scrollView)

        contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)

        // Logo DMTN centralizada (preta para contraste em fundo claro)
        logoImageView = UIImageView(image: UIImage(named: "DMTNLogo"))
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.tintColor = .black
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(logoImageView)

        usernameTextField = makeModernTextField(placeholder: "Usuário")
        usernameTextField.autocapitalizationType = .none
        usernameTextField.autocorrectionType = .no
        usernameTextField.returnKeyType = .next
        usernameTextField.delegate = self
        contentView.addSubview(usernameTextField)

        passwordTextField = makeModernTextField(placeholder: "Senha")
        passwordTextField.isSecureTextEntry = true
        passwordTextField.returnKeyType = .go
        passwordTextField.delegate = self
        passwordToggleButton = UIButton(type: .system)
        passwordToggleButton.setImage(UIImage(systemName: "eye.slash"), for: .normal)
        passwordToggleButton.tintColor = .darkGray
        passwordToggleButton.addTarget(self, action: #selector(togglePasswordVisibility), for: .touchUpInside)
        passwordToggleButton.frame = CGRect(x: 0, y: 0, width: 44, height: 44)
        passwordTextField.rightView = passwordToggleButton
        passwordTextField.rightViewMode = .always
        contentView.addSubview(passwordTextField)

        forgotPasswordButton = UIButton(type: .system)
        forgotPasswordButton.setTitle("Esqueci minha senha", for: .normal)
        forgotPasswordButton.setTitleColor(.systemBlue, for: .normal)
        forgotPasswordButton.titleLabel?.font = .systemFont(ofSize: 14, weight: .medium)
        forgotPasswordButton.addTarget(self, action: #selector(forgotPasswordTapped), for: .touchUpInside)
        forgotPasswordButton.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(forgotPasswordButton)

        savePasswordLabel = UILabel()
        savePasswordLabel.text = "Salvar senha"
        savePasswordLabel.font = .systemFont(ofSize: 16)
        savePasswordLabel.textColor = .black
        savePasswordLabel.translatesAutoresizingMaskIntoConstraints = false

        savePasswordSwitch = UISwitch()
        savePasswordSwitch.onTintColor = .black
        savePasswordSwitch.thumbTintColor = .white
        savePasswordSwitch.isOn = false
        savePasswordSwitch.translatesAutoresizingMaskIntoConstraints = false

        let savePasswordStack = UIStackView(arrangedSubviews: [savePasswordLabel, savePasswordSwitch])
        savePasswordStack.axis = .horizontal
        savePasswordStack.spacing = 12
        savePasswordStack.alignment = .center
        savePasswordStack.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(savePasswordStack)

        loginButton = UIButton(type: .system)
        loginButton.setTitle("Entrar", for: .normal)
        loginButton.setTitleColor(.white, for: .normal)
        loginButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        loginButton.backgroundColor = .black
        loginButton.layer.cornerRadius = 12
        loginButton.addTarget(self, action: #selector(loginButtonTapped), for: .touchUpInside)
        loginButton.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(loginButton)

        progressIndicator = UIActivityIndicatorView(style: .medium)
        progressIndicator.color = .black
        progressIndicator.hidesWhenStopped = true
        progressIndicator.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(progressIndicator)

        // Layout
        let margin: CGFloat = 32
        let fieldHeight: CGFloat = 52
        let buttonHeight: CGFloat = 52

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

            logoImageView.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            logoImageView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 48),
            logoImageView.widthAnchor.constraint(equalToConstant: 200),
            logoImageView.heightAnchor.constraint(equalToConstant: 80),

            usernameTextField.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: margin),
            usernameTextField.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -margin),
            usernameTextField.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 48),
            usernameTextField.heightAnchor.constraint(equalToConstant: fieldHeight),

            passwordTextField.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: margin),
            passwordTextField.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -margin),
            passwordTextField.topAnchor.constraint(equalTo: usernameTextField.bottomAnchor, constant: 16),
            passwordTextField.heightAnchor.constraint(equalToConstant: fieldHeight),

            forgotPasswordButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -margin),
            forgotPasswordButton.topAnchor.constraint(equalTo: passwordTextField.bottomAnchor, constant: 10),

            savePasswordStack.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: margin),
            savePasswordStack.topAnchor.constraint(equalTo: forgotPasswordButton.bottomAnchor, constant: 24),

            loginButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: margin),
            loginButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -margin),
            loginButton.topAnchor.constraint(equalTo: savePasswordStack.bottomAnchor, constant: 28),
            loginButton.heightAnchor.constraint(equalToConstant: 52),

            progressIndicator.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            progressIndicator.topAnchor.constraint(equalTo: loginButton.bottomAnchor, constant: 20),
            progressIndicator.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -40),
        ])
    }

    private func makeModernTextField(placeholder: String) -> UITextField {
        let tf = UITextField()
        tf.placeholder = placeholder
        tf.borderStyle = .none
        tf.backgroundColor = .white
        tf.textColor = .black
        tf.font = .systemFont(ofSize: 16)
        tf.translatesAutoresizingMaskIntoConstraints = false
        tf.layer.cornerRadius = 12
        tf.layer.borderWidth = 1
        tf.layer.borderColor = UIColor(red: 0.9, green: 0.9, blue: 0.92, alpha: 1).cgColor
        tf.layer.shadowColor = UIColor.black.cgColor
        tf.layer.shadowOffset = CGSize(width: 0, height: 1)
        tf.layer.shadowRadius = 2
        tf.layer.shadowOpacity = 0.06
        tf.clipsToBounds = false
        tf.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 20))
        tf.leftViewMode = .always
        tf.attributedPlaceholder = NSAttributedString(
            string: placeholder,
            attributes: [.foregroundColor: UIColor.darkGray.withAlphaComponent(0.7)]
        )
        return tf
    }

    @objc private func togglePasswordVisibility() {
        passwordTextField.isSecureTextEntry.toggle()
        let name = passwordTextField.isSecureTextEntry ? "eye.slash" : "eye"
        passwordToggleButton.setImage(UIImage(systemName: name), for: .normal)
    }

    /// Preparado para integração futura com Resend.
    @objc private func forgotPasswordTapped() {
        let alert = UIAlertController(
            title: "Esqueci minha senha",
            message: "Em breve você poderá redefinir sua senha por e-mail.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    private func loadSavedCredentials() {
        if let credentials = authService.getCredentials() {
            usernameTextField.text = credentials.username
            passwordTextField.text = credentials.password
            savePasswordSwitch.isOn = true
        } else {
            usernameTextField.text = nil
            passwordTextField.text = nil
            savePasswordSwitch.isOn = false
        }
    }

    private func setupKeyboardHandling() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        tap.cancelsTouchesInView = false
        view.addGestureRecognizer(tap)
    }

    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }

    private func registerKeyboardNotifications() {
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
    }

    private func unregisterKeyboardNotifications() {
        NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
    }

    @objc private func keyboardWillShow(_ notification: Notification) {
        guard let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
              let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double else { return }
        let insets = UIEdgeInsets(top: 0, left: 0, bottom: frame.height, right: 0)
        UIView.animate(withDuration: duration) {
            self.scrollView.contentInset = insets
            self.scrollView.scrollIndicatorInsets = insets
            if self.usernameTextField.isFirstResponder || self.passwordTextField.isFirstResponder {
                let active: UIView = self.passwordTextField.isFirstResponder ? self.passwordTextField : self.usernameTextField
                self.scrollView.scrollRectToVisible(active.convert(active.bounds, to: self.scrollView), animated: false)
            }
        }
    }

    @objc private func keyboardWillHide(_ notification: Notification) {
        guard let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double else { return }
        UIView.animate(withDuration: duration) {
            self.scrollView.contentInset = .zero
            self.scrollView.scrollIndicatorInsets = .zero
        }
    }

    @objc private func loginButtonTapped() {
        guard let username = usernameTextField.text?.trimmingCharacters(in: .whitespaces),
              let password = passwordTextField.text,
              !username.isEmpty, !password.isEmpty else {
            showAlert(title: "Erro", message: "Preencha usuário e senha")
            return
        }
        performLogin(username: username, password: password)
    }

    private func performLogin(username: String, password: String) {
        loginButton.isEnabled = false
        progressIndicator.startAnimating()
        Task {
            do {
                let user = try await apiService.login(username: username, password: password)
                await MainActor.run {
                    if self.savePasswordSwitch.isOn {
                        authService.saveUser(user, username: username, password: password)
                    } else {
                        authService.saveUserWithoutPassword(user, username: username, passwordForSession: password)
                    }
                    progressIndicator.stopAnimating()
                    loginButton.isEnabled = true
                    navigateToMain()
                }
            } catch {
                await MainActor.run {
                    progressIndicator.stopAnimating()
                    loginButton.isEnabled = true
                    let msg = (error as? ApiError)?.localizedDescription ?? error.localizedDescription
                    showAlert(title: "Erro no Login", message: msg)
                }
            }
        }
    }

    private func navigateToMain() {
        guard isViewLoaded, view.window != nil else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in self?.navigateToMain() }
            return
        }
        AppRouter.setRootToMainInterface()
    }

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - UITextFieldDelegate
extension LoginViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        if textField == usernameTextField {
            passwordTextField.becomeFirstResponder()
        } else {
            textField.resignFirstResponder()
            loginButtonTapped()
        }
        return true
    }
}
