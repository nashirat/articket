import QRCode from "qrcode";

export async function generateQRDataUri(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: { dark: "#000000ff", light: "#ffffffff" },
  });
}
