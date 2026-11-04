import { randomBytes } from "crypto";

/** Token público não adivinhável usado nos links de portal (orçamento, pedido, recibo). */
export const publicToken = () => randomBytes(16).toString("base64url");

/** Ex.: 7 → "0007-26" */
export const docCode = (seq: number, d = new Date()) =>
  `${String(seq).padStart(4, "0")}-${String(d.getFullYear()).slice(2)}`;
