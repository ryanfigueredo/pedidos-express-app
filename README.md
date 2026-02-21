# Pedidos Express

Sistema completo de gestão de pedidos para restaurantes, incluindo aplicativos mobile (Android/iOS), bot WhatsApp automatizado e dashboard web.

## 📦 Estrutura do Projeto

Este repositório contém múltiplos projetos que compõem o ecossistema Pedidos Express:

```
PedidosExpress/
├── desktop/          # API & Web Dashboard (Next.js)
├── app-kotlin/       # App Android (Kotlin)
├── app-swift/        # App iOS (Swift)
└── bot/              # Bot WhatsApp (Node.js)
```

## 🗂️ Repositórios

Cada componente possui seu próprio repositório Git:

- **API & Web**: [pedidos-express-api](https://github.com/ryanfigueredo/pedidos-express-api) (contém a pasta `desktop/`)
- **Android App**: [pedidos-express-android](https://github.com/ryanfigueredo/pedidos-express-android) (sugerido)
- **iOS App**: [pedidos-express-ios](https://github.com/ryanfigueredo/pedidos-express-ios) (sugerido)
- **WhatsApp Bot**: [pedidos-express-bot](https://github.com/ryanfigueredo/pedidos-express-bot) (sugerido)

## 🚀 Início Rápido

### API & Web Dashboard

```bash
cd desktop
npm install
npm run dev
```

### App Android

```bash
cd app-kotlin/android
# Abra no Android Studio
```

### App iOS

```bash
cd app-swift
open PedidosExpress.xcodeproj
```

### Bot WhatsApp

```bash
cd bot
npm install
npm start
```

## 📚 Documentação

Cada projeto possui seu próprio README com instruções detalhadas:

- [API & Web Dashboard](./desktop/README.md)
- [App Android](./app-kotlin/README.md)
- [App iOS](./app-swift/README.md)
- [Bot WhatsApp](./bot/README.md)

## 🔧 Tecnologias Principais

- **Backend**: Next.js, TypeScript, Prisma, PostgreSQL
- **Mobile Android**: Kotlin, Android SDK
- **Mobile iOS**: Swift, UIKit
- **Bot**: Node.js, Baileys, DynamoDB
- **Cloud**: AWS (S3, DynamoDB), Vercel

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Equipe

Desenvolvido por Ryan Figueredo

---

**Última atualização**: 2025
