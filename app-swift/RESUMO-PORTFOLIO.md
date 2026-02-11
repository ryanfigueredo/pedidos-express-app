# Pedidos Express – iOS (Portfólio)

**App nativo iOS em Swift** · Gestão de pedidos para restaurantes · Publicado na App Store

---

## Em uma frase

App iOS completo para restaurantes: pedidos em tempo real, cardápio, dashboard, **impressão Bluetooth** em impressoras térmicas e integração com API REST.

---

## Destaques para entrevista

| Área | O que você fez |
|------|----------------|
| **Swift / UIKit** | App 100% Swift, UIKit, MVC, sem SwiftUI. Vários ViewControllers, tabelas, navegação, formulários. |
| **Rede / API** | `URLSession`, async/await, autenticação Basic Auth, tratamento de 401, erros de rede e mensagens ao usuário. |
| **Bluetooth** | CoreBluetooth: scan, conexão e envio de dados para impressoras térmicas ESC/POS (comandos de impressão). |
| **Persistência** | UserDefaults para credenciais e estado de login; fluxo de logout e redirecionamento. |
| **Arquitetura** | Separação em Models, Services (ApiService, AuthService, PrinterHelper), ViewControllers e Views reutilizáveis. |
| **App Store** | Projeto preparado para build, archive e submissão (já passou por review). |

---

## Stack técnico

- **Linguagem:** Swift 5.9+
- **UI:** UIKit (Storyboard + código)
- **Mínimo:** iOS 15.0
- **Rede:** URLSession, async/await
- **Bluetooth:** CoreBluetooth (BLE)
- **Auth:** Basic Auth + persistência local

---

## Funcionalidades principais

1. **Login** – Autenticação contra API, salvar usuário/senha, redirecionamento quando sessão expira.
2. **Pedidos** – Lista por status (pendentes, em rota, finalizados), ações por pedido (imprimir, enviar para entrega, confirmar entrega).
3. **Impressão** – Conexão Bluetooth com impressora térmica, formatação ESC/POS, impressão de pedido e teste.
4. **Cardápio** – Listagem e edição de itens (nome, preço, quantidade).
5. **Dashboard** – Resumo de pedidos e métricas do dia/semana.
6. **Configurações** – Impressora Bluetooth, sobre, logout.

---

## Estrutura do projeto (resumida)

```
PedidosExpress/
├── Models/          # User, Order, OrderItem, MenuItem, Dashboard...
├── Services/        # ApiService, AuthService, PrinterHelper
├── ViewControllers/ # Login, Orders, Menu, Dashboard, Settings...
├── Views/           # Células customizadas (Order, MenuItem, Logo...)
├── Helpers/         # BusinessTypeHelper
└── Resources/       # Assets, cores, Storyboards, Info.plist
```

---

## Como rodar (para o recrutador)

1. Abrir `PedidosExpress.xcodeproj` no Xcode.
2. Selecionar um simulador ou dispositivo.
3. Configurar **Signing & Capabilities** com uma Apple ID/Team.
4. Rodar (⌘R).  
O app chama uma API; para testar tudo, é preciso backend no ar ou mock.

---

## Links úteis

- Repositório do projeto (se tiver no GitHub)
- App na App Store (se estiver publicado)
- LinkedIn

---

*Documento para uso em processos seletivos e portfólio – Salvador (SSA).*
