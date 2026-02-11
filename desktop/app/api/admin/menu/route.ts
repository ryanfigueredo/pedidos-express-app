import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import {
  getMenuItems,
  updateMenuItem,
  addMenuItem,
  removeMenuItem,
  getMenuItemsRef,
} from "@/lib/menu-data";

// GET - Listar cardápio
export async function GET(request: NextRequest) {
  // Permitir acesso via sessão (web), API key ou Basic Auth (app)
  const { getSession } = await import("@/lib/auth-session");
  const session = await getSession();
  const authValidation = await validateApiKey(request);
  
  // Verificar Basic Auth (para apps mobile)
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  let userFromAuth: any = null;
  
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [username, password] = credentials.split(":");
      
      if (username && password) {
        const { verifyCredentials } = await import("@/lib/auth-session");
        userFromAuth = await verifyCredentials(username, password);
      }
    } catch (error) {
      // Ignorar erro de parsing
      console.error("Erro ao processar Basic Auth:", error);
    }
  }

  // Verificar se pelo menos uma forma de autenticação é válida
  if (!session && !authValidation.isValid && !userFromAuth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const items = getMenuItems();
  return NextResponse.json({ items }, { status: 200 });
}

// PUT - Atualizar item do cardápio
export async function PUT(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import("@/lib/auth-session").then((m) =>
    m.getSession(),
  );
  const authValidation = await validateApiKey(request);

  if (!session && !authValidation.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, price, available } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID do item é obrigatório" },
        { status: 400 },
      );
    }

    const updated = updateMenuItem(id, { name, price, available });
    if (!updated) {
      return NextResponse.json(
        { message: "Item não encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        success: true,
        item: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao atualizar cardápio:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar cardápio", error: String(error) },
      { status: 500 },
    );
  }
}

// POST - Adicionar novo item
export async function POST(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import("@/lib/auth-session").then((m) =>
    m.getSession(),
  );
  const authValidation = await validateApiKey(request);

  if (!session && !authValidation.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, price, category, available } = body;

    if (!id || !name || price === undefined || !category) {
      return NextResponse.json(
        { message: "Campos obrigatórios: id, name, price, category" },
        { status: 400 },
      );
    }

    const existing = getMenuItems().find((item) => item.id === id);
    if (existing) {
      return NextResponse.json(
        { message: "Item com este ID já existe" },
        { status: 400 },
      );
    }

    const newItem = addMenuItem({
      id,
      name,
      price: Number(price),
      category,
      available: available !== undefined ? available : true,
    });

    return NextResponse.json(
      {
        success: true,
        item: newItem,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao adicionar item ao cardápio:", error);
    return NextResponse.json(
      { message: "Erro ao adicionar item", error: String(error) },
      { status: 500 },
    );
  }
}

// DELETE - Deletar item do cardápio
export async function DELETE(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import("@/lib/auth-session").then((m) =>
    m.getSession(),
  );
  const authValidation = await validateApiKey(request);

  if (!session && !authValidation.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID do item é obrigatório" },
        { status: 400 },
      );
    }

    const removed = removeMenuItem(id);
    if (!removed) {
      return NextResponse.json(
        { message: "Item não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Item deletado com sucesso",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return NextResponse.json(
      { message: "Erro ao deletar item", error: String(error) },
      { status: 500 },
    );
  }
}

// PATCH - Reordenar itens
export async function PATCH(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import("@/lib/auth-session").then((m) =>
    m.getSession(),
  );
  const authValidation = await validateApiKey(request);

  if (!session && !authValidation.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items } = body; // Array de { id, order }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { message: "items deve ser um array" },
        { status: 400 },
      );
    }

    // Atualizar order de cada item
    items.forEach(({ id, order }: { id: string; order: number }) => {
      updateMenuItem(id, { order });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Itens reordenados com sucesso",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao reordenar itens:", error);
    return NextResponse.json(
      { message: "Erro ao reordenar itens", error: String(error) },
      { status: 500 },
    );
  }
}
