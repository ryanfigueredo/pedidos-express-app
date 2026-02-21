import Foundation

/**
 * Helper para obter labels dinâmicos baseados no tipo de negócio.
 * Considera AuthService.getBusinessType() quando o User não traz business_type (ex.: backend não envia).
 */
class BusinessTypeHelper {
    private static var effectiveIsBarber: Bool {
        AuthService().getBusinessType()?.uppercased() == "BARBEIRO"
    }

    private static var effectiveIsDentista: Bool {
        AuthService().getBusinessType()?.uppercased() == "DENTISTA"
    }

    static func getLabel(for user: User?, defaultLabel: String, dentistaLabel: String) -> String {
        let useAgendaLabel = (user?.isDentista ?? effectiveIsDentista) || (user?.isBarbeiro ?? effectiveIsBarber)
        return useAgendaLabel ? dentistaLabel : defaultLabel
    }

    static func ordersLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Pedidos", dentistaLabel: "Agendamentos")
    }

    static func agendaTabLabel(for user: User?) -> String {
        if user?.isBarbeiro == true || effectiveIsBarber { return "Agenda" }
        if user?.isDentista == true || effectiveIsDentista { return "Agendamentos" }
        return "Pedidos"
    }

    static func supportTabLabel(for user: User?) -> String {
        return (user?.isBarbeiro == true || effectiveIsBarber) ? "Atendimento" : "Suporte"
    }

    static func menuLabel(for user: User?) -> String {
        if user?.isBarbeiro == true || effectiveIsBarber { return "Serviços" }
        if user?.isDentista == true || effectiveIsDentista { return "Procedimentos" }
        return "Cardápio"
    }
    
    static func orderLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Pedido", dentistaLabel: "Agendamento")
    }
    
    static func ordersTodayLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Pedidos Hoje", dentistaLabel: "Agendamentos Hoje")
    }
    
    static func itemsLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Itens", dentistaLabel: "Procedimentos")
    }
    
    static func itemLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Item", dentistaLabel: "Procedimento")
    }
    
    // Labels para segmentos
    static func pendingOrdersLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Pedidos", dentistaLabel: "Agendamentos")
    }
    
    static func outForDeliveryLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Rota", dentistaLabel: "Confirmados")
    }
    
    static func finishedOrdersLabel(for user: User?) -> String {
        return getLabel(for: user, defaultLabel: "Entregues", dentistaLabel: "Concluídos")
    }
}
