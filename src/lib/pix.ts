// Gera o "Pix Copia e Cola" (BR Code estático, padrão EMV do Banco Central).

function field(id: string, value: string) {
  return id + value.length.toString().padStart(2, "0") + value;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const clean = (s: string, max: number) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").trim().slice(0, max) || "NA";

export function pixPayload(opts: {
  key: string;
  name: string;
  city: string;
  amount?: number;
  txid?: string;
  description?: string;
}) {
  const gui =
    field("00", "br.gov.bcb.pix") +
    field("01", opts.key.trim()) +
    (opts.description ? field("02", clean(opts.description, 40)) : "");
  const txid = (opts.txid ?? "***").replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***";
  let p =
    field("00", "01") +
    field("26", gui) +
    field("52", "0000") +
    field("53", "986") +
    (opts.amount && opts.amount > 0 ? field("54", opts.amount.toFixed(2)) : "") +
    field("58", "BR") +
    field("59", clean(opts.name, 25)) +
    field("60", clean(opts.city, 15)) +
    field("62", field("05", txid)) +
    "6304";
  p += crc16(p);
  return p;
}
