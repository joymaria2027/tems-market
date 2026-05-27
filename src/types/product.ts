export interface DbProduct {
  id: string;
  vendor_id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  status: string;
  sponsored: boolean;
  rejection_note: string | null;
  images: string[];
  product_type?: string;
  ticket_meta?: TicketMeta | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
  vendor_name?: string;
}

export interface TicketMeta {
  event_date?: string;
  venue?: string;
  ticket_type?: string;
  valid_from?: string;
  valid_to?: string;
  terms?: string;
}
