/**
 * Cupom de pedido 58mm para controle interno do restaurante.
 * Puxa os dados do último pedido do banco (desktop); se não houver, usa exemplo fixo.
 * Sem logo; fonte grande nos itens; altura real do texto para não sobrepor.
 */

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";

const WIDTH_58MM = 164;
const MARGIN = 8;
const CONTENT_WIDTH = WIDTH_58MM - MARGIN * 2;
const LINE_GAP = 3;

const FONT_SIZE_SMALL = 8;
const FONT_SIZE_NORMAL = 9;
const FONT_SIZE_ITEMS = 14; // itens maiores para leitura na parede
const FONT_SIZE_ORDER = 14;

function formatMoney(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let orderData: {
      display_id: string;
      created_at: string;
      customer_name: string;
      customer_phone: string;
      order_type: string;
      delivery_address: string | null;
      payment_method: string;
      items: { name: string; quantity: number; price: number }[];
      subtotal: number;
      deliveryFee: number;
      total: number;
      change_for?: number;
    } | null = null;

    try {
      const lastOrder = await prisma.order.findFirst({
        orderBy: { created_at: "desc" },
      });
      if (lastOrder) {
        let items =
          typeof lastOrder.items === "string"
            ? JSON.parse(lastOrder.items as string)
            : (lastOrder.items as {
                name: string;
                quantity: number;
                price: number;
              }[]);
        if (!Array.isArray(items)) items = [];
        const totalPrice =
          typeof lastOrder.total_price === "string"
            ? parseFloat(lastOrder.total_price)
            : Number(lastOrder.total_price);
        const subtotal = items.reduce(
          (s: number, i: { quantity?: number; price?: number }) =>
            s +
            (i.quantity || 1) *
              (typeof i.price === "number"
                ? i.price
                : parseFloat(String(i.price || 0))),
          0
        );
        const deliveryFee = Math.max(0, totalPrice - subtotal);
        const isPix = String(lastOrder.payment_method || "")
          .toUpperCase()
          .includes("PIX");
        orderData = {
          display_id:
            lastOrder.display_id ||
            `#${lastOrder.daily_sequence ?? lastOrder.order_number ?? "-"}`,
          created_at: new Date(lastOrder.created_at).toLocaleString("pt-BR"),
          customer_name: lastOrder.customer_name || "Cliente",
          customer_phone: lastOrder.customer_phone || "",
          order_type: lastOrder.order_type || "Restaurante",
          delivery_address: lastOrder.delivery_address,
          payment_method: lastOrder.payment_method || "Não informado",
          items,
          subtotal,
          deliveryFee,
          total: totalPrice,
          change_for: isPix ? undefined : (lastOrder as any).change_for,
        };
      }
    } catch (e) {
      console.warn("[sample-receipt] Erro ao buscar último pedido:", e);
    }

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({
      size: [WIDTH_58MM, 700],
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const x = MARGIN;
    let y = MARGIN;

    const fontsDir = path.join(process.cwd(), "public", "fonts");
    const figtreeRegular = path.join(fontsDir, "Figtree-Regular.ttf");
    const figtreeBold = path.join(fontsDir, "Figtree-Bold.ttf");
    const hasFigtree =
      fs.existsSync(figtreeRegular) && fs.existsSync(figtreeBold);
    if (hasFigtree) {
      doc.registerFont("Figtree", figtreeRegular);
      doc.registerFont("FigtreeBold", figtreeBold);
    }
    const fontRegular = hasFigtree ? "Figtree" : "Helvetica";
    const fontBold = hasFigtree ? "FigtreeBold" : "Helvetica-Bold";

    type WriteOptions = {
      size?: number;
      bold?: boolean;
      align?: "center";
    };

    const writeLine = (text: string, options: WriteOptions = {}) => {
      const size = options.size ?? FONT_SIZE_NORMAL;
      const width = options.align === "center" ? WIDTH_58MM : CONTENT_WIDTH;
      doc.fontSize(size).font(options.bold ? fontBold : fontRegular);
      const height = doc.heightOfString(text, { width });
      if (options.align === "center") {
        doc.text(text, 0, y, { width: WIDTH_58MM, align: "center" });
      } else {
        doc.text(text, x, y, { width: CONTENT_WIDTH });
      }
      y += height + LINE_GAP;
    };

    const writeSeparator = () => {
      doc
        .moveTo(x, y)
        .lineTo(x + CONTENT_WIDTH, y)
        .stroke();
      y += 6;
    };

    writeSeparator();

    if (orderData) {
      writeLine(`Pedido ${orderData.display_id}`, {
        bold: true,
        size: FONT_SIZE_ORDER,
      });
      writeLine(orderData.created_at, { size: FONT_SIZE_SMALL });
      writeSeparator();

      writeLine(
        `Cliente: ${orderData.customer_name} | ${orderData.customer_phone}`
      );
      if (orderData.order_type === "delivery" && orderData.delivery_address) {
        const addr = orderData.delivery_address.substring(0, 60);
        writeLine(addr);
      }
      writeSeparator();

      for (const item of orderData.items) {
        const qty = item.quantity || 1;
        const name = String(item.name || "").trim();
        writeLine(`${qty}x ${name}`, {
          bold: true,
          size: FONT_SIZE_ITEMS,
        });
      }
      writeSeparator();

      writeLine(
        `SUBTOTAL ............... R$ ${formatMoney(orderData.subtotal)}`
      );
      if (orderData.deliveryFee > 0) {
        writeLine(
          `ENTREGA ................ R$ ${formatMoney(orderData.deliveryFee)}`
        );
      }
      writeLine(`TOTAL .................. R$ ${formatMoney(orderData.total)}`);
      writeSeparator();

      writeLine(`Pagamento: ${orderData.payment_method}`);
      if (
        orderData.change_for != null &&
        orderData.change_for > 0 &&
        !String(orderData.payment_method || "")
          .toUpperCase()
          .includes("PIX")
      ) {
        writeLine(
          `Troco para ............. R$ ${formatMoney(orderData.change_for)}`
        );
      }
      writeSeparator();
    } else {
      writeLine("Pedido #42", { bold: true, size: FONT_SIZE_ORDER });
      writeLine("02/02/2026 14:35", { size: FONT_SIZE_SMALL });
      writeSeparator();

      writeLine("Cliente: João Silva | (21) 98765-4321");
      writeLine("Rua das Flores, 123");
      writeLine("Bairro Centro - RJ");
      writeSeparator();

      writeLine("2x X-Tudo", { bold: true, size: FONT_SIZE_ITEMS });
      writeLine("    Sem cebola", { size: FONT_SIZE_ITEMS });
      writeLine("1x Batata Média", { bold: true, size: FONT_SIZE_ITEMS });
      writeLine("1x Refri Lata", { bold: true, size: FONT_SIZE_ITEMS });
      writeSeparator();

      writeLine("SUBTOTAL ............... R$ 45,00");
      writeLine("ENTREGA ................ R$  8,00");
      writeLine("TOTAL .................. R$ 53,00");
      writeSeparator();

      writeLine("Pagamento: PIX");
      writeSeparator();
    }

    doc.end();

    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", reject);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="pedido-exemplo-58mm.pdf"',
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[sample-receipt]", error);
    return NextResponse.json(
      { message: "Erro ao gerar PDF", error: String(error) },
      { status: 500 }
    );
  }
}
