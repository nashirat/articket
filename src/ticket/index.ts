import "./ticket.css";
import { markerDataUri } from "./aruco.ts";
import { generateQRDataUri } from "./qr.ts";

const MARKERS = [
  { id: 0, cls: "m-tl" }, // top-left corner
  { id: 1, cls: "m-tr" }, // top-right corner
  { id: 2, cls: "m-bl" }, // bottom-left corner
  { id: 3, cls: "m-br" }, // bottom-right corner
  { id: 4, cls: "m-tc" }, // top center
  { id: 5, cls: "m-bc" }, // bottom center
  { id: 6, cls: "m-l1" }, // left ~33%
  { id: 7, cls: "m-r1" }, // right ~33%
  { id: 8, cls: "m-l2" }, // left ~67%
  { id: 9, cls: "m-r2" }, // right ~67%
];

async function buildTicket(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  const qrUri = await generateQRDataUri("https://articket.dev/poc");

  const markersHtml = MARKERS.map(
    ({ id, cls }) =>
      `<span class="aruco ${cls}"><img src="${markerDataUri(id)}" alt="marker ${id}" /></span>`,
  ).join("");

  app.innerHTML = `
    <div class="controls">
      <button id="print-btn">Print Ticket</button>
      <a href="/ar.html"><button type="button">Open AR Viewer →</button></a>
    </div>
    <div class="ticket-wrapper">
      <div class="ticket">
        ${markersHtml}
        <div class="ticket-content">
          <div class="ticket-brand">Articket</div>
          <div class="ticket-divider"></div>
          <div class="ticket-title">PROOF OF CONCEPT</div>
          <div class="ticket-meta">AR INTERACTIVE TICKET · 2026</div>
          <div class="ticket-qr">
            <img src="${qrUri}" alt="QR Code" />
          </div>
          <div class="ticket-tear"></div>
          <div class="ticket-seat">ROW A &nbsp;·&nbsp; SEAT 12</div>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#print-btn")!.addEventListener("click", () => {
    window.print();
  });
}

void buildTicket();
