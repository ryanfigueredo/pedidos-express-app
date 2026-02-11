export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface WhatsAppWebhookPayload {
  customer_name: string
  customer_phone: string
  items: OrderItem[]
  total_price: number
  payment_method?: string
}
