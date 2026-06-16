import "./ar.css";

const MARKER_COUNT = 10;
const visibleMarkers = new Set<number>();

// Corner IDs in draw order: TL→TR→BR→BL (forms a closed rectangle)
const CORNER_IDS = [0, 1, 3, 2] as const;

// --- Canvas glow border overlay ---

const borderCanvas = document.createElement("canvas");
borderCanvas.style.cssText =
  "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:998;";
document.body.appendChild(borderCanvas);
const ctx = borderCanvas.getContext("2d")!;

function resizeCanvas(): void {
  borderCanvas.width = window.innerWidth;
  borderCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let phase = 0;

function drawBorder(): void {
  requestAnimationFrame(drawBorder);

  const w = borderCanvas.width;
  const h = borderCanvas.height;
  ctx.clearRect(0, 0, w, h);

  // THREE is a global exposed by the A-Frame CDN bundle
  type Vec3 = { x: number; y: number; z: number; project(cam: unknown): Vec3 };
  type ThreeLike = { Vector3: new () => Vec3 };
  type SceneEl = Element & { camera: unknown; renderer: unknown };
  type MarkerEl = Element & { object3D: { getWorldPosition(v: Vec3): void } };

  const THREE = (window as unknown as { THREE: ThreeLike }).THREE;
  const sceneEl = document.querySelector<SceneEl>("#ar-scene");
  if (!THREE || !sceneEl?.camera || !sceneEl.renderer) return;

  const camera = sceneEl.camera;

  // Project each visible corner marker to screen space
  const pts: { x: number; y: number }[] = [];
  for (const id of CORNER_IDS) {
    if (!visibleMarkers.has(id)) continue;
    const markerEl = document.querySelector<MarkerEl>(`a-marker[value="${id}"]`);
    if (!markerEl?.object3D) continue;

    const worldPos = new THREE.Vector3();
    markerEl.object3D.getWorldPosition(worldPos);
    worldPos.project(camera);

    pts.push({
      x: ((worldPos.x + 1) / 2) * w,
      y: ((-worldPos.y + 1) / 2) * h,
    });
  }

  if (pts.length < 2) return;

  phase += 0.025;
  const pulse = 0.55 + 0.45 * Math.sin(phase);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Outer wide glow
  ctx.shadowColor = "#00ffcc";
  ctx.shadowBlur = 36 * pulse;
  ctx.strokeStyle = `rgba(0, 255, 204, ${0.3 * pulse})`;
  ctx.lineWidth = 10;
  tracePath(pts, pts.length === 4);
  ctx.stroke();

  // Inner crisp line
  ctx.shadowBlur = 14 * pulse;
  ctx.strokeStyle = `rgba(0, 255, 204, ${0.75 + 0.25 * pulse})`;
  ctx.lineWidth = 2.5;
  tracePath(pts, pts.length === 4);
  ctx.stroke();

  ctx.restore();
}

function tracePath(pts: { x: number; y: number }[], close: boolean): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (close) ctx.closePath();
}

drawBorder();

// --- Camera picker ---

// Populate the blocker div that's already in the HTML (rendered before A-Frame canvas)
async function showCameraPicker(cancellable: boolean): Promise<void> {
  const blocker = document.getElementById("cam-blocker")!;

  // Request permission first so device labels are populated
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch {
    blocker.innerHTML =
      '<p style="color:#ff6666">Camera permission denied.<br>Please allow camera access and reload.</p>';
    return;
  }

  const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
    (d) => d.kind === "videoinput",
  );

  // Reuse the blocker as the picker surface
  blocker.innerHTML = "";
  blocker.id = "cam-picker";

  const heading = document.createElement("h2");
  heading.textContent = "Select Camera";

  const select = document.createElement("select");
  devices.forEach((d, i) => {
    const opt = document.createElement("option");
    opt.value = d.deviceId;
    opt.textContent = d.label || `Camera ${i + 1}`;
    select.appendChild(opt);
  });

  const current = new URLSearchParams(location.search).get("cam");
  if (current) select.value = current;

  const btnRow = document.createElement("div");
  btnRow.className = "picker-btns";

  const confirm = document.createElement("button");
  confirm.className = "btn-confirm";
  confirm.textContent = "Use This Camera";
  confirm.addEventListener("click", () => {
    const url = new URL(location.href);
    url.searchParams.set("cam", select.value);
    location.href = url.toString();
  });
  btnRow.appendChild(confirm);

  if (cancellable) {
    const cancel = document.createElement("button");
    cancel.className = "btn-cancel";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => blocker.remove());
    btnRow.appendChild(cancel);
  }

  blocker.appendChild(heading);
  blocker.appendChild(select);
  blocker.appendChild(btnRow);
}

// --- HUD + controls ---

const hud = document.createElement("div");
hud.id = "hud";
hud.textContent = "Point camera at ticket…";
document.body.appendChild(hud);

const backBtn = document.createElement("button");
backBtn.id = "back-btn";
backBtn.textContent = "← Ticket";
backBtn.addEventListener("click", () => {
  window.location.href = "/";
});
document.body.appendChild(backBtn);

const camBtn = document.createElement("button");
camBtn.id = "cam-btn";
camBtn.textContent = "Camera";
camBtn.addEventListener("click", () => void showCameraPicker(true));
document.body.appendChild(camBtn);

function updateHUD(): void {
  const count = visibleMarkers.size;
  hud.textContent =
    count === 0 ? "Point camera at ticket…" : `Markers detected: ${count} / ${MARKER_COUNT}`;
}

// --- AR marker events ---

const scene = document.querySelector("#ar-scene");
if (scene) {
  scene.addEventListener("loaded", () => {
    for (let i = 0; i < MARKER_COUNT; i++) {
      const marker = document.querySelector(`a-marker[value="${i}"]`);
      if (!marker) continue;
      const id = i;
      marker.addEventListener("markerFound", () => {
        visibleMarkers.add(id);
        updateHUD();
      });
      marker.addEventListener("markerLost", () => {
        visibleMarkers.delete(id);
        updateHUD();
      });
    }
  });
}

// Blocker is always visible from HTML — either fill it with picker or remove it
if (!new URLSearchParams(location.search).get("cam")) {
  void showCameraPicker(false);
} else {
  document.getElementById("cam-blocker")?.remove();
}
