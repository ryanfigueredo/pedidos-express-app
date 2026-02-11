# Bot WhatsApp – Restaurante

## Onde configurar as mensagens que o bot envia

Todas as mensagens enviadas pelo bot (textos, botões, listas) estão em **`handlers-restaurante.js`**. Não há arquivo separado de “traduções” ou config; edite os textos diretamente nesse arquivo.

### Principais pontos de edição

| O que alterar | Onde no arquivo | Exemplo |
|---------------|-----------------|--------|
| Menu principal (“Olá! Como posso ajudar?”, opções) | `sendMenuPrincipal()` | `bodyText`, `button`, `sections[].rows[].title/description` |
| Tela “Ver Cardápio” (comidas / bebidas / sobremesas) | `sendCardapioSoloCategoria()` | `bodyIntro` por categoria (Comidas, Bebidas, Sobremesas), `title`, `buttonLabel` |
| Resumo do pedido e “Onde você vai comer?” | `handleLocalCart()` | `resumo`, texto `"📍 *Onde você vai comer o lanche?*"`, botões "Em casa" / "No restaurante" |
| Após adicionar item (“Quer adicionar bebida/sobremesa?”) | Bloco que trata `qtyadd_ITEMID_N\|CART` | Variável `pergunta` e botões "Sim" / "Não" |
| Outros textos (boas-vindas, status, erro) | Busque por `reply:` ou `body: { text:` no mesmo arquivo | Mensagens de erro, “Carrinho vazio”, etc. |

O estado da conversa (fluxo) é tratado em **`conversation-state.js`** e nos handlers em **`handlers-restaurante.js`** (payloads nos ids dos botões, ex.: `addmore_bebidas|CART`, `local|CART`).

---

## Fluxo “Ver Cardápio” (sincronizado com o app)

O bot segue o mesmo fluxo do aplicativo Android e do desktop:

1. **Ver Cardápio** → envia só **Comidas** (até 9 itens; ex.: “Comidas (4/9)”).
2. Depois de escolher comidas → pergunta “Quer adicionar *bebida*?”  
   - **Sim** → lista **Bebidas** (até 9; ex.: “Bebidas (9/9)”) com opção **Pular**.
3. Depois de bebidas (ou Pular) → se houver sobremesas no cardápio, envia **Sobremesas** com **Pular**; se não houver, vai direto para “Onde você vai comer?”.
4. **Onde você vai comer?** → “Em casa” / “No restaurante” (igual app).

Os itens vêm da mesma fonte que o app: **`/api/bot/menu/public`** (desktop) e **menu-data** ou banco do admin. Categorias: `comida` (inclui hambúrgueres), `bebida`, `sobremesa`. Para o fluxo bater com o app, mantenha as mesmas categorias no cadastro do cardápio (admin/app) e na API do bot.
