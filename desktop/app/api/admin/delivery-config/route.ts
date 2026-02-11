import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { validateApiKey, validateBasicAuth } from "@/lib/auth";
import { getDeliveryConfig, updateDeliveryConfig } from "@/lib/delivery-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const apiKey = await validateApiKey(request);
  const basicAuth = await validateBasicAuth(request);

  if (!session && !apiKey.isValid && !basicAuth.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const config = getDeliveryConfig();
  return NextResponse.json({ config }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  const apiKey = await validateApiKey(request);
  const basicAuth = await validateBasicAuth(request);

  if (!session && !apiKey.isValid && !basicAuth.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      restaurantAddress,
      deliveryBaseFee,
      deliveryFeePerKm,
      maxDeliveryKm,
    } = body;

    const config = updateDeliveryConfig({
      ...(restaurantAddress !== undefined && {
        restaurantAddress: String(restaurantAddress),
      }),
      ...(deliveryBaseFee !== undefined && {
        deliveryBaseFee: Number(deliveryBaseFee) || 0,
      }),
      ...(deliveryFeePerKm !== undefined && {
        deliveryFeePerKm: Number(deliveryFeePerKm) || 0,
      }),
      ...(maxDeliveryKm !== undefined && {
        maxDeliveryKm: Number(maxDeliveryKm) || 0,
      }),
    });

    return NextResponse.json({ success: true, config }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar config de entregas:", error);
    return NextResponse.json(
      { message: "Erro ao salvar", error: String(error) },
      { status: 500 }
    );
  }
}
