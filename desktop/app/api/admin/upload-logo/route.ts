import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadLogo, isS3Configured } from "@/lib/s3";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST - Upload de logo do tenant para S3
 * FormData: file (imagem)
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Master não possui tenant" },
        { status: 403 }
      );
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "S3 não configurado. Defina S3_BUCKET_LOGO, AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const fileOrBlob = formData.get("file") as File | Blob | null;

    if (!fileOrBlob) {
      return NextResponse.json(
        { success: false, error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    const file = fileOrBlob instanceof File ? fileOrBlob : null;
    const blob = fileOrBlob instanceof Blob ? fileOrBlob : fileOrBlob;
    const contentType = file?.type || (blob as any)?.type || "image/jpeg";
    const arrayBuffer = await (file || blob).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo inválido. Use JPEG, PNG ou WebP.",
        },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Arquivo muito grande (máx 2MB)" },
        { status: 400 }
      );
    }

    const url = await uploadLogo(
      buffer,
      contentType,
      authUser.tenant_id
    );

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Erro ao enviar para S3" },
        { status: 500 }
      );
    }

    await prisma.tenant.update({
      where: { id: authUser.tenant_id },
      data: { logo_url: url },
    });

    return NextResponse.json({
      success: true,
      logo_url: url,
    });
  } catch (error) {
    console.error("[upload-logo] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}
