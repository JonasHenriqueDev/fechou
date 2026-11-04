import type { Company } from "@prisma/client";
import type { EditorValue } from "@/components/DocumentEditor";
import { db } from "./db";
import { inputDate } from "./format";

type ItemLike = { id: string; catalogItemId: string | null; type: string; name: string; description: string | null; unit: string; quantity: number; unitPrice: number; photo: string | null };

const toItems = (items: ItemLike[]) =>
  items.map((i) => ({
    key: i.id, catalogItemId: i.catalogItemId, type: (i.type === "SERVICE" ? "SERVICE" : "PRODUCT") as "SERVICE" | "PRODUCT",
    name: i.name, description: i.description ?? "", unit: i.unit, quantity: i.quantity, unitPrice: i.unitPrice, photo: i.photo,
  }));

export function emptyEditor(company: Company, clientId = ""): EditorValue {
  const valid = new Date();
  valid.setDate(valid.getDate() + company.defaultValidityDays);
  return {
    clientId, newClientName: "", newClientPhone: "", title: "",
    issueDate: inputDate(new Date()), validUntil: inputDate(valid),
    executionTerm: "", paymentConditions: company.defaultConditions ?? "", warranty: company.defaultWarranty ?? "",
    notes: company.defaultNotes ?? "", discountType: "VALUE", discountValue: 0, deliveryFee: 0,
    kind: "ORDER", scheduledDate: "", items: [], photos: [],
  };
}

export function quoteToEditor(q: {
  clientId: string | null; title: string | null; issueDate: Date; validUntil: Date | null; executionTerm: string | null;
  paymentConditions: string | null; warranty: string | null; notes: string | null; discountType: string; discountValue: number;
  deliveryFee: number; items: ItemLike[]; photos: { id: string; image: string; caption: string | null }[];
}): EditorValue {
  return {
    clientId: q.clientId ?? "", newClientName: "", newClientPhone: "", title: q.title ?? "",
    issueDate: inputDate(q.issueDate), validUntil: inputDate(q.validUntil), executionTerm: q.executionTerm ?? "",
    paymentConditions: q.paymentConditions ?? "", warranty: q.warranty ?? "", notes: q.notes ?? "",
    discountType: q.discountType === "PERCENT" ? "PERCENT" : "VALUE", discountValue: q.discountValue, deliveryFee: q.deliveryFee,
    kind: "ORDER", scheduledDate: "",
    items: toItems([...q.items].sort((a, b) => ((a as { position?: number }).position ?? 0) - ((b as { position?: number }).position ?? 0))),
    photos: q.photos.map((p) => ({ key: p.id, image: p.image, caption: p.caption ?? "" })),
  };
}

export function orderToEditor(o: {
  clientId: string | null; title: string | null; createdAt: Date; scheduledDate: Date | null; notes: string | null; kind: string;
  discountType: string; discountValue: number; deliveryFee: number; items: (ItemLike & { position: number })[];
}): EditorValue {
  return {
    clientId: o.clientId ?? "", newClientName: "", newClientPhone: "", title: o.title ?? "",
    issueDate: inputDate(o.createdAt), validUntil: "", executionTerm: "", paymentConditions: "", warranty: "",
    notes: o.notes ?? "", discountType: o.discountType === "PERCENT" ? "PERCENT" : "VALUE", discountValue: o.discountValue,
    deliveryFee: o.deliveryFee, kind: o.kind, scheduledDate: inputDate(o.scheduledDate),
    items: toItems([...o.items].sort((a, b) => a.position - b.position)), photos: [],
  };
}

/** Listas para os selects do editor. */
export async function editorOptions(companyId: string) {
  const [clients, catalog] = await Promise.all([
    db.client.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
    db.catalogItem.findMany({
      where: { companyId, active: true }, orderBy: { name: "asc" },
      select: { id: true, type: true, name: true, description: true, unit: true, price: true, photo: true, stock: true, trackStock: true },
    }),
  ]);
  return { clients, catalog };
}
