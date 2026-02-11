"use client";

/**
 * Preview do cupom de pedido para impressora 58mm.
 * Mostra como fica na impressão e permite baixar PDF de exemplo.
 */

export default function ImpressaoExemploPage() {
  const downloadPdf = () => {
    window.open("/api/printer/sample-receipt", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Exemplo de impressão 58mm
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Visualização do cupom e botão para baixar o PDF de exemplo.
        </p>

        <button
          onClick={downloadPdf}
          className="w-full mb-6 py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
        >
          Baixar PDF de exemplo (58mm)
        </button>

        {/* Preview: itens maiores; Cliente Nome | Tel; endereço sem End:; sem Obrigado */}
        <div
          className="mx-auto bg-white text-black p-3 font-mono shadow-lg"
          style={{ width: "164px", maxWidth: "100%" }}
        >
          <hr className="border-black border-dashed my-2" />
          <div className="font-bold text-sm">Pedido #42</div>
          <div className="text-[8px]">02/02/2026 14:35</div>
          <hr className="border-black border-dashed my-2" />
          <div className="text-[9px]">
            Cliente: João Silva | (21) 98765-4321
          </div>
          <div className="text-[9px]">Rua das Flores, 123</div>
          <div className="text-[9px] pl-2">Bairro Centro - RJ</div>
          <hr className="border-black border-dashed my-2" />
          <div className="font-bold text-base leading-relaxed">2x X-Tudo</div>
          <div className="text-sm pl-2">Sem cebola</div>
          <div className="font-bold text-base leading-relaxed">
            1x Batata Média
          </div>
          <div className="font-bold text-base leading-relaxed">
            1x Refri Lata
          </div>
          <hr className="border-black border-dashed my-2" />
          <div className="font-bold text-xs">SUBTOTAL ........... R$ 45,00</div>
          <div className="font-bold text-xs">ENTREGA ............ R$ 8,00</div>
          <div className="font-bold text-xs">TOTAL .............. R$ 53,00</div>
          <hr className="border-black border-dashed my-2" />
          <div className="text-[9px]">Pagamento: PIX</div>
          <hr className="border-black border-dashed my-2" />
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          Largura real na impressora: 58mm. Use o PDF para testar na térmica.
        </p>
      </div>
    </div>
  );
}
