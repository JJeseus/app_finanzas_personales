// lib/db-mappers.ts
import type { PaymentMethod } from "./types";

export function uiMethodToDb(method: PaymentMethod): "cash" | "card" | "transfer" | "other" {
  switch (method) {
    case "efectivo": return "cash";
    case "tarjeta": return "card";
    case "transferencia": return "transfer";
    default: return "other";
  }
}

export function dbMethodToUi(method: string): PaymentMethod {
  switch (method) {
    case "cash": return "efectivo";
    case "card": return "tarjeta";
    case "transfer": return "transferencia";
    default: return "otro";
  }
}
