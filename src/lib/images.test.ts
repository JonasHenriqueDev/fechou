import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, isStoredImageUrl, parseImageDataUrl } from "./images";

const png = "data:image/png;base64," + Buffer.from("fake-png").toString("base64");

describe("parseImageDataUrl", () => {
  it("aceita PNG/JPEG/WebP em base64", () => {
    expect(parseImageDataUrl(png)).toMatchObject({ mime: "image/png", ext: "png" });
    expect(parseImageDataUrl(png.replace("png", "jpeg"))?.ext).toBe("jpg");
  });
  it("recusa SVG, HTML e lixo", () => {
    expect(parseImageDataUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(parseImageDataUrl("data:text/html;base64,PGI+")).toBeNull();
    expect(parseImageDataUrl("javascript:alert(1)")).toBeNull();
  });
  it("recusa imagens grandes demais", () => {
    const big = "data:image/png;base64," + Buffer.alloc(MAX_IMAGE_BYTES + 1).toString("base64");
    expect(parseImageDataUrl(big)).toBeNull();
  });
});

describe("isStoredImageUrl", () => {
  it("só aceita o Vercel Blob público via https", () => {
    expect(isStoredImageUrl("https://abc123.public.blob.vercel-storage.com/x/logos/a.png")).toBe(true);
    expect(isStoredImageUrl("http://abc123.public.blob.vercel-storage.com/a.png")).toBe(false);
    expect(isStoredImageUrl("https://evil.com/a.png")).toBe(false);
    expect(isStoredImageUrl("https://public.blob.vercel-storage.com.evil.com/a.png")).toBe(false);
    expect(isStoredImageUrl("não é url")).toBe(false);
  });
});
