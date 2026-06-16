// Marker bit patterns from ARUCO_4X4_1000 dictionary (IDs 0-9)
// Each entry is [byte1, byte2] → 16 bits for 4×4 inner grid
const CODES: [number, number][] = [
  [181, 50], // ID 0
  [15, 154], // ID 1
  [51, 45], // ID 2
  [153, 70], // ID 3
  [84, 158], // ID 4
  [121, 205], // ID 5
  [158, 46], // ID 6
  [196, 242], // ID 7
  [254, 218], // ID 8
  [207, 86], // ID 9
];

function codeToBits(code: [number, number]): string {
  return code[0].toString(2).padStart(8, "0") + code[1].toString(2).padStart(8, "0");
}

// Generates a 4×4 ArUco marker as SVG (6×6 with border, 8×8 with quiet zone)
export function generateMarkerSVG(id: number): string {
  const code = CODES[id];
  if (!code) throw new Error(`ArUco ID ${id} not in range 0–9`);
  const bits = codeToBits(code);
  // viewBox: 8×8 (1 quiet + 1 border + 4 data + 1 border + 1 quiet)
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">`;
  svg += `<rect width="8" height="8" fill="white"/>`;
  svg += `<rect x="1" y="1" width="6" height="6" fill="black"/>`;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (bits[y * 4 + x] === "1") {
        svg += `<rect x="${x + 2}" y="${y + 2}" width="1" height="1" fill="white"/>`;
      }
    }
  }
  svg += `</svg>`;
  return svg;
}

export function markerDataUri(id: number): string {
  return `data:image/svg+xml,${encodeURIComponent(generateMarkerSVG(id))}`;
}
