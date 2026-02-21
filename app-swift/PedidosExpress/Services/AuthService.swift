import Foundation

class AuthService {
    private let userDefaults = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private let userKey = "saved_user"
    private let usernameKey = "saved_username"
    private let passwordKey = "saved_password"
    private let isLoggedInKey = "is_logged_in"
    private let businessTypeKey = "saved_business_type"
    private let shouldSavePasswordKey = "should_save_password"

    /// Credenciais em memória para a sessão atual; evitam race em que a API é chamada antes do UserDefaults ser visível.
    private static var sessionCredentials: (username: String, password: String)?

    /// Salva usuário e credenciais e atualiza o cache de sessão para que getCredentials() retorne imediatamente.
    func saveUser(_ user: User, username: String, password: String) {
        var effectiveBusinessType = user.businessType
        if effectiveBusinessType == nil, username.lowercased().contains("barber") {
            effectiveBusinessType = "BARBEIRO"
            print("💾 AuthService: business_type inferido (BARBEIRO) a partir do username")
        }
        print("💾 AuthService: Salvando credenciais para usuário: \(username), business_type: \(effectiveBusinessType ?? "nil")")
        Self.sessionCredentials = (username, password)
        if let userData = try? encoder.encode(user) {
            userDefaults.set(userData, forKey: userKey)
        } else {
            print("⚠️ AuthService: Erro ao codificar dados do usuário")
        }
        if let bt = effectiveBusinessType {
            userDefaults.set(bt, forKey: businessTypeKey)
        }
        userDefaults.set(username, forKey: usernameKey)
        userDefaults.set(password, forKey: passwordKey)
        userDefaults.set(true, forKey: shouldSavePasswordKey)
        userDefaults.set(true, forKey: isLoggedInKey)
        userDefaults.synchronize()
        print("✅ AuthService: Credenciais salvas (UserDefaults) - username: \(username)")
    }

    /// Atualiza user/username sem persistir a senha no disco. Mantém sessionCredentials em memória para a sessão atual (API continuar funcionando).
    func saveUserWithoutPassword(_ user: User, username: String, passwordForSession: String) {
        Self.sessionCredentials = (username, passwordForSession)
        if let userData = try? encoder.encode(user) {
            userDefaults.set(userData, forKey: userKey)
        }
        if let bt = user.businessType {
            userDefaults.set(bt, forKey: businessTypeKey)
        }
        userDefaults.set(username, forKey: usernameKey)
        userDefaults.removeObject(forKey: passwordKey)
        userDefaults.set(false, forKey: shouldSavePasswordKey)
        userDefaults.set(true, forKey: isLoggedInKey)
        userDefaults.synchronize()
    }

    func getUser() -> User? {
        guard let userData = userDefaults.data(forKey: userKey) else {
            return nil
        }
        return try? decoder.decode(User.self, from: userData)
    }

    /// business_type do usuário; considera o valor salvo em saved_business_type quando o User não traz o campo.
    func getBusinessType() -> String? {
        getUser()?.businessType ?? userDefaults.string(forKey: businessTypeKey)
    }

    func getCredentials() -> (username: String, password: String)? {
        if let session = Self.sessionCredentials, !session.password.isEmpty {
            return session
        }
        guard let username = userDefaults.string(forKey: usernameKey),
              let password = userDefaults.string(forKey: passwordKey),
              !password.isEmpty else {
            return nil
        }
        Self.sessionCredentials = (username, password)
        return (username, password)
    }

    func isLoggedIn() -> Bool {
        return userDefaults.bool(forKey: isLoggedInKey) && getUser() != nil
    }

    func logout() {
        Self.sessionCredentials = nil
        userDefaults.removeObject(forKey: userKey)
        userDefaults.removeObject(forKey: usernameKey)
        userDefaults.removeObject(forKey: passwordKey)
        userDefaults.removeObject(forKey: businessTypeKey)
        userDefaults.removeObject(forKey: shouldSavePasswordKey)
        userDefaults.set(false, forKey: isLoggedInKey)
        userDefaults.synchronize()
    }
}
