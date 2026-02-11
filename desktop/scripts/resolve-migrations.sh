#!/bin/bash
set -e

echo "🔧 Resolvendo migrations..."

# Gerar Prisma Client primeiro (necessário para o build)
echo "📦 Gerando Prisma Client..."
npx prisma generate

# Não aplicar migrations aqui - isso será feito pelo script de build
# As migrations devem ser aplicadas manualmente no banco de produção
# ou via CI/CD antes do deploy

echo "✅ Prisma Client gerado!"
