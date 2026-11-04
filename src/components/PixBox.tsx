import QRCode from "qrcode";
import { pixPayload } from "@/lib/pix";
import { money } from "@/lib/format";
import { CopyButton } from "./client";
import { Icon } from "./Icon";

type PixCompany = { pixKey: string | null; pixName: string | null; pixCity: string | null; name: string; city: string | null };

export function pixAvailable(c: PixCompany) {
  return !!c.pixKey;
}

/** QR Code Pix + copia e cola. Renderizado no servidor. */
export async function PixBox({ company, amount, txid, title = "Pague com Pix" }: { company: PixCompany; amount: number; txid?: string; title?: string }) {
  if (!company.pixKey) return null;
  const payload = pixPayload({
    key: company.pixKey,
    name: company.pixName || company.name,
    city: company.pixCity || company.city || "BRASIL",
    amount,
    txid,
  });
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 280 });
  return (
    <div className="card avoid-break p-4">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <Icon name="pix" className="h-5 w-5 text-emerald-600" /> {title}
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR Code Pix" className="h-44 w-44 rounded-lg border border-slate-200" />
        <div className="w-full min-w-0 flex-1 space-y-2 text-sm">
          <div>
            <div className="text-xs text-slate-500">Valor</div>
            <div className="text-lg font-bold">{money(amount)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Recebedor</div>
            <div className="font-medium">{company.pixName || company.name}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Chave Pix</div>
            <div className="break-all font-medium">{company.pixKey}</div>
          </div>
          <div className="no-print">
            <CopyButton text={payload} label="Copiar Pix copia e cola" className="btn-success btn-sm w-full sm:w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
