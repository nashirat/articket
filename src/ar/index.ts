import "./ar.css";

const MARKER_COUNT = 10;
const visibleMarkers = new Set<number>();

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

function updateHUD(): void {
  const count = visibleMarkers.size;
  if (count === 0) {
    hud.textContent = "Point camera at ticket…";
  } else {
    hud.textContent = `Markers detected: ${count} / ${MARKER_COUNT}`;
  }
}

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
