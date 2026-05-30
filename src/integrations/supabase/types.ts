export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      affiliate_links: {
        Row: {
          affiliate_id: string
          clicks: number
          conversions: number
          created_at: string
          id: string
          listing_id: string
          short_code: string
        }
        Insert: {
          affiliate_id: string
          clicks?: number
          conversions?: number
          created_at?: string
          id?: string
          listing_id: string
          short_code: string
        }
        Update: {
          affiliate_id?: string
          clicks?: number
          conversions?: number
          created_at?: string
          id?: string
          listing_id?: string
          short_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vendor_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          modempay_payout_id: string | null
          momo_reconcile_fee: number | null
          momo_reconcile_job_id: string | null
          momo_reconcile_status: Database["public"]["Enums"]["momo_reconcile_status"]
          momo_reconcile_trust_tier: number | null
          momo_reconcile_verified_at: string | null
          order_id: string
          paid_at: string | null
          recipient_id: string
          recipient_role: Database["public"]["Enums"]["commission_recipient"]
          settlement_batch_id: string | null
          settlement_date: string | null
          status: Database["public"]["Enums"]["commission_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          modempay_payout_id?: string | null
          momo_reconcile_fee?: number | null
          momo_reconcile_job_id?: string | null
          momo_reconcile_status?: Database["public"]["Enums"]["momo_reconcile_status"]
          momo_reconcile_trust_tier?: number | null
          momo_reconcile_verified_at?: string | null
          order_id: string
          paid_at?: string | null
          recipient_id: string
          recipient_role: Database["public"]["Enums"]["commission_recipient"]
          settlement_batch_id?: string | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          modempay_payout_id?: string | null
          momo_reconcile_fee?: number | null
          momo_reconcile_job_id?: string | null
          momo_reconcile_status?: Database["public"]["Enums"]["momo_reconcile_status"]
          momo_reconcile_trust_tier?: number | null
          momo_reconcile_verified_at?: string | null
          order_id?: string
          paid_at?: string | null
          recipient_id?: string
          recipient_role?: Database["public"]["Enums"]["commission_recipient"]
          settlement_batch_id?: string | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "commission_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_ledger_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          discount_applied: number
          id: string
          order_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_applied: number
          id?: string
          order_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_applied?: number
          id?: string
          order_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string
          id: string
          max_uses: number | null
          max_uses_per_user: number | null
          minimum_order_gmd: number | null
          status: Database["public"]["Enums"]["coupon_status"]
          updated_at: string
          uses_so_far: number
          valid_from: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string
          id?: string
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_order_gmd?: number | null
          status?: Database["public"]["Enums"]["coupon_status"]
          updated_at?: string
          uses_so_far?: number
          valid_from: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string
          id?: string
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_order_gmd?: number | null
          status?: Database["public"]["Enums"]["coupon_status"]
          updated_at?: string
          uses_so_far?: number
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount_gmd: number
          balance_after: number
          counterparty_id: string | null
          created_at: string
          id: string
          modempay_payment_id: string | null
          note: string | null
          order_id: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Insert: {
          amount_gmd: number
          balance_after: number
          counterparty_id?: string | null
          created_at?: string
          id?: string
          modempay_payment_id?: string | null
          note?: string | null
          order_id?: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Update: {
          amount_gmd?: number
          balance_after?: number
          counterparty_id?: string | null
          created_at?: string
          id?: string
          modempay_payment_id?: string | null
          note?: string | null
          order_id?: string | null
          type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          balance_gmd: number
          created_at: string
          id: string
          total_spent: number
          total_topped_up: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_gmd?: number
          created_at?: string
          id?: string
          total_spent?: number
          total_topped_up?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_gmd?: number
          created_at?: string
          id?: string
          total_spent?: number
          total_topped_up?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_requests: {
        Row: {
          budget_gmd: number | null
          category: string | null
          created_at: string
          customer_id: string
          description: string
          fulfilled_by: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          budget_gmd?: number | null
          category?: string | null
          created_at?: string
          customer_id: string
          description: string
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          budget_gmd?: number | null
          category?: string | null
          created_at?: string
          customer_id?: string
          description?: string
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "price_stack_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "customer_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_listings: {
        Row: {
          amount_paid: number
          created_at: string
          ends_at: string | null
          id: string
          listing_id: string
          modempay_payment_id: string | null
          plan: Database["public"]["Enums"]["featured_plan"]
          position: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["featured_status"]
          vendor_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          ends_at?: string | null
          id?: string
          listing_id: string
          modempay_payment_id?: string | null
          plan: Database["public"]["Enums"]["featured_plan"]
          position?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["featured_status"]
          vendor_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          listing_id?: string
          modempay_payment_id?: string | null
          plan?: Database["public"]["Enums"]["featured_plan"]
          position?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["featured_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vendor_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_listings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_redemptions: {
        Row: {
          amount_used: number
          gift_card_id: string
          id: string
          order_id: string
          redeemed_at: string
        }
        Insert: {
          amount_used: number
          gift_card_id: string
          id?: string
          order_id: string
          redeemed_at?: string
        }
        Update: {
          amount_used?: number
          gift_card_id?: string
          id?: string
          order_id?: string
          redeemed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_redemptions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          modempay_payment_id: string | null
          personal_message: string | null
          purchased_by: string | null
          recipient_email: string | null
          recipient_name: string | null
          remaining_balance: number
          status: Database["public"]["Enums"]["gift_card_status"]
          value_gmd: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          modempay_payment_id?: string | null
          personal_message?: string | null
          purchased_by?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          remaining_balance: number
          status?: Database["public"]["Enums"]["gift_card_status"]
          value_gmd: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          modempay_payment_id?: string | null
          personal_message?: string | null
          purchased_by?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          remaining_balance?: number
          status?: Database["public"]["Enums"]["gift_card_status"]
          value_gmd?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          token?: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          id: string
          message: string
          sent_at: string
          twilio_sid: string | null
          type: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          id?: string
          message: string
          sent_at?: string
          twilio_sid?: string | null
          type: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          id?: string
          message?: string
          sent_at?: string
          twilio_sid?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          affiliate_link_id: string | null
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string
          customer_id: string
          delivery_address: string
          discounted_total: number
          gift_card_amount: number | null
          gift_card_id: string | null
          id: string
          listing_id: string
          modempay_payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          affiliate_link_id?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string
          customer_id: string
          delivery_address: string
          discounted_total: number
          gift_card_amount?: number | null
          gift_card_id?: string | null
          id?: string
          listing_id: string
          modempay_payment_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          affiliate_link_id?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string
          delivery_address?: string
          discounted_total?: number
          gift_card_amount?: number | null
          gift_card_id?: string | null
          id?: string
          listing_id?: string
          modempay_payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vendor_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      price_layers: {
        Row: {
          admin_id: string
          admin_margin: number | null
          admin_price: number
          created_at: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          admin_margin?: number | null
          admin_price: number
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          admin_margin?: number | null
          admin_price?: number
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_layers_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_layers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "price_stack_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "price_layers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          images: string[]
          inventory_type: Database["public"]["Enums"]["inventory_type"]
          product_type: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          submitted_by_vendor: string | null
          ticket_meta: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          base_price: number
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          images?: string[]
          inventory_type?: Database["public"]["Enums"]["inventory_type"]
          product_type?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          submitted_by_vendor?: string | null
          ticket_meta?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          images?: string[]
          inventory_type?: Database["public"]["Enums"]["inventory_type"]
          product_type?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          submitted_by_vendor?: string | null
          ticket_meta?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_submitted_by_vendor_fkey"
            columns: ["submitted_by_vendor"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_batches: {
        Row: {
          created_at: string
          entry_count: number
          id: string
          modempay_payout_id: string | null
          payout_method: string
          processed_at: string | null
          recipient_id: string
          settlement_date: string
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          entry_count: number
          id?: string
          modempay_payout_id?: string | null
          payout_method: string
          processed_at?: string | null
          recipient_id: string
          settlement_date: string
          status?: string
          total_amount: number
        }
        Update: {
          created_at?: string
          entry_count?: number
          id?: string
          modempay_payout_id?: string | null
          payout_method?: string
          processed_at?: string | null
          recipient_id?: string
          settlement_date?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlement_batches_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_verified: boolean
          commission_payout_preference: Database["public"]["Enums"]["commission_payout_preference"]
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          invited_by: string | null
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          age_verified?: boolean
          commission_payout_preference?: Database["public"]["Enums"]["commission_payout_preference"]
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id: string
          invited_by?: string | null
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          age_verified?: boolean
          commission_payout_preference?: Database["public"]["Enums"]["commission_payout_preference"]
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          invited_by?: string | null
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_listings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          updated_at: string
          vendor_id: string
          vendor_margin: number | null
          vendor_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          updated_at?: string
          vendor_id: string
          vendor_margin?: number | null
          vendor_price: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          updated_at?: string
          vendor_id?: string
          vendor_margin?: number | null
          vendor_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "price_stack_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "vendor_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_listings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          account_number: string | null
          approved_at: string | null
          approved_by: string | null
          business_name: string
          can_create_tickets: boolean
          category: string
          created_at: string
          id: string
          id_document_url: string | null
          id_ocr_text: string | null
          id_structured: Json | null
          modempay_subaccount_id: string | null
          settlement_code: Database["public"]["Enums"]["settlement_code"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          can_create_tickets?: boolean
          category: string
          created_at?: string
          id?: string
          id_document_url?: string | null
          id_ocr_text?: string | null
          id_structured?: Json | null
          modempay_subaccount_id?: string | null
          settlement_code?:
            | Database["public"]["Enums"]["settlement_code"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          can_create_tickets?: boolean
          category?: string
          created_at?: string
          id?: string
          id_document_url?: string | null
          id_ocr_text?: string | null
          id_structured?: Json | null
          modempay_subaccount_id?: string | null
          settlement_code?:
            | Database["public"]["Enums"]["settlement_code"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_sponsored_view: {
        Row: {
          category: string | null
          ends_at: string | null
          featured_id: string | null
          images: string[] | null
          listing_id: string | null
          position: number | null
          title: string | null
          vendor_id: string | null
          vendor_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vendor_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_listings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_stack_view: {
        Row: {
          admin_id: string | null
          admin_margin: number | null
          admin_name: string | null
          admin_price: number | null
          base_price: number | null
          category: string | null
          inventory_type: Database["public"]["Enums"]["inventory_type"] | null
          product_id: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_layers_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          available_balance: number | null
          pending_balance: number | null
          recipient_id: string | null
          recipient_role:
            | Database["public"]["Enums"]["commission_recipient"]
            | null
          total_paid_out: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_ledger_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_or_above: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      update_own_role: {
        Args: { new_role: Database["public"]["Enums"]["user_role"] }
        Returns: undefined
      }
    }
    Enums: {
      commission_payout_preference: "mobile_money" | "credits"
      commission_recipient: "vendor" | "affiliate" | "admin" | "platform"
      commission_status: "pending" | "available" | "paid" | "failed"
      coupon_discount_type: "percentage" | "fixed_gmd"
      coupon_status: "active" | "paused" | "expired"
      credit_transaction_type:
        | "top_up"
        | "purchase"
        | "refund"
        | "bonus"
        | "commission_credit"
        | "gift_card_purchase"
        | "gift_card_redeem"
      featured_plan: "7_days" | "30_days"
      featured_status: "pending_payment" | "active" | "expired"
      gift_card_status: "active" | "partially_used" | "fully_used" | "expired"
      inventory_type: "tems_owned" | "vendor_submitted"
      momo_reconcile_status:
        | "syncing"
        | "pending"
        | "verified"
        | "disputed"
        | "timed_out"
      notification_channel: "sms" | "whatsapp"
      order_status:
        | "placed"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
      payment_method:
        | "qmoney"
        | "afrimoney"
        | "wave"
        | "cash"
        | "credits"
        | "gift_card"
        | "mixed"
      payment_status: "pending" | "pending_cod" | "paid" | "failed" | "refunded"
      product_status: "draft" | "pending_review" | "active" | "inactive"
      request_status: "open" | "sourcing" | "fulfilled" | "declined"
      settlement_code: "wave" | "afrimoney"
      user_role: "superadmin" | "admin" | "vendor" | "affiliate" | "customer"
      user_status: "active" | "pending" | "rejected" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      commission_payout_preference: ["mobile_money", "credits"],
      commission_recipient: ["vendor", "affiliate", "admin", "platform"],
      commission_status: ["pending", "available", "paid", "failed"],
      coupon_discount_type: ["percentage", "fixed_gmd"],
      coupon_status: ["active", "paused", "expired"],
      credit_transaction_type: [
        "top_up",
        "purchase",
        "refund",
        "bonus",
        "commission_credit",
        "gift_card_purchase",
        "gift_card_redeem",
      ],
      featured_plan: ["7_days", "30_days"],
      featured_status: ["pending_payment", "active", "expired"],
      gift_card_status: ["active", "partially_used", "fully_used", "expired"],
      inventory_type: ["tems_owned", "vendor_submitted"],
      momo_reconcile_status: [
        "syncing",
        "pending",
        "verified",
        "disputed",
        "timed_out",
      ],
      notification_channel: ["sms", "whatsapp"],
      order_status: [
        "placed",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ],
      payment_method: [
        "qmoney",
        "afrimoney",
        "wave",
        "cash",
        "credits",
        "gift_card",
        "mixed",
      ],
      payment_status: ["pending", "pending_cod", "paid", "failed", "refunded"],
      product_status: ["draft", "pending_review", "active", "inactive"],
      request_status: ["open", "sourcing", "fulfilled", "declined"],
      settlement_code: ["wave", "afrimoney"],
      user_role: ["superadmin", "admin", "vendor", "affiliate", "customer"],
      user_status: ["active", "pending", "rejected", "suspended"],
    },
  },
} as const

