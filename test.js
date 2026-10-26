const initialData = [
  { label: "YouTube ads", value: 45, color: "#06b6d4" },
  { label: "Sponsorships", value: 20, color: "#7c3aed" },
  { label: "Courses", value: 18, color: "#f97316" },
  { label: "Freelance", value: 12, color: "#ef4444" },
  { label: "Other", value: 5, color: "#94a3b8" },
];

const size = 240;
const strokeRadius = 80;
const center = { x: 160, y: 160 };

const svg = document.getElementById("pie");
const group = document.querySelector("g");
const legend = document.getElementById("legend");
const tooltip = document.getElementById("tooltip");

let data = JSON.parse(JSON.stringify(initialData));

function render() {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  group.innerHTML = "";
  legend.innerHTML = "";

  const radius = strokeRadius;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  data.forEach((d, i) => {
    const pct = Math.max(0, d.value) / total;
    const dash = +(pct * circumference).toFixed(2);
    const empty = +(circumference - dash).toFixed(2);

    // Create a circle for this slice
    const slice = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    slice.setAttribute("r", String(radius));
    slice.setAttribute("cx", "0");
    slice.setAttribute("cy", "0");
    slice.setAttribute("fill", "transparent");
    slice.setAttribute("stroke", d.color || randomColor(i));
    slice.setAttribute("stroke-width", String(radius));
    slice.setAttribute("stroke-linecap", "butt");
    slice.setAttribute("class", "slice");
    slice.dataset.index = i;
    slice.dataset.label = d.label;
    slice.dataset.value = d.value;

    // stroke positions and animate
    slice.style.transition =
      "stroke-dasharray .6s cubic-bezier(.22,.9,.2,1), stroke-dashoffset .6s cubic-bezier(.22,.9,.2,1)";
    slice.setAttribute("stroke-dasharray", `${dash} ${empty}`);
    slice.setAttribute("stroke-dashoffset", String(-offset));

    // pointer interactions
    slice.setAttribute("cursor", "pointer");

    slice.addEventListener("mouseenter", onEnter);
    slice.addEventListener("mouseleave", onLeave);
    slice.addEventListener("mousemove", onMove);
    slice.addEventListener("click", () => toggleHighlight(i));

    group.appendChild(slice);

    // legend row
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<div class="swatch" style="background:${d.color}"></div>
                          <div class="meta"><div class="label">${escapeHtml(d.label)}</div>
                          <div class="value">${d.value} (${(pct * 100).toFixed(1)}%)</div></div>`;
    item.addEventListener("mouseenter", () => highlightSlice(i, true));
    item.addEventListener("mouseleave", () => highlightSlice(i, false));
    item.addEventListener("click", () => toggleSliceVisibility(i));
    legend.appendChild(item);

    offset += dash;
  });
  // draw center label
  drawCenterlabel(total);
}

function drawCenterlabel(total) {
  // remove old center
  const prev = svg.querySelector("#centerLabel");
  if (prev) prev.remove();

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("id", "centerLabel");
  g.setAttribute("transform", "translate(160,160)");

  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("y", "-6");
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("font-size", "14");
  title.setAttribute("fill", "#e6eef8");
  title.textContent = "Total";

  const val = document.createElementNS("http://www.w3.org/2000/svg", "text");
  val.setAttribute("y", "18");
  val.setAttribute("text-anchor", "middle");
  val.setAttribute("font-size", "18");
  val.setAttribute("font-weight", "700");
  val.setAttribute("fill", "#fff");
  val.textContent = total;

  g.appendChild(title);
  g.appendChild(val);
  svg.appendChild(g);
}

function onEnter(e) {
  const t = e.currentTarget;
  const label = t.dataset.label;
  const value = t.dataset.value;
  tooltip.innerHTML = `<strong style="color:#fff;">${escapeHtml(label)}</strong><div style="margin-top:4px">${value}</div>`;
  tooltip.classList.add("show");
  tooltip.setAttribute("aria-hidden", "false");
}
function onLeave(e) {
  tooltip.classList.remove("show");
  tooltip.setAttribute("aria-hidden", "true");
}
function onMove(e) {
  const rect = svg.getBoundingClientRect();
  const left = e.clientX - rect.left;
  const top = e.clientY - rect.top;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
function highlightSlice(index, enter) {
  const slice = group.querySelectorAll(".slice")[index];
  if (!slice) return;
  if (enter) slice.style.transform = "scale(1.06)";
  else slice.style.transform = "";
}

function toggleHighlight(index) {
  const slice = group.querySelectorAll(".slice")[index];
  if (!slice) return;
  slice.style.filter = slice.style.filter
    ? ""
    : "drop-shadow(0 6px 16px rgba(12,18,40,0.6))";
}

function toggleSliceVisibility(index) {
  // toggle to zero value
  data[index].hidden = !data[index].hidden;
  if (data[index].hidden)
    ((data[index].prevValue = data[index].value), (data[index].value = 0));
  else data[index].value = data[index].prevValue || data[index].value;
  render();
}

// Buttons
document.getElementById("randomize").addEventListener("click", () => {
  data = data.map((d) => ({ ...d, value: Math.round(Math.random() * 80) + 5 }));
  render();
});
document.getElementById("add").addEventListener("click", () => {
  const label = `New ${data.length + 1}`;
  data.push({
    label,
    value: Math.round(Math.random() * 30) + 5,
    color: randomColor(data.length),
  });
  render();
});
document.getElementById("reset").addEventListener("click", () => {
  data = JSON.parse(JSON.stringify(initialData));
  render();
});

function randomColor(i) {
  const palette = [
    "#06b6d4",
    "#7c3aed",
    "#f97316",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#fb7185",
  ];
  return palette[i % palette.length];
}

function escapeHtml(s) {
  return String(s).replace(/[&<>\"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '\"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}

// Public helper to update chart with new data
window.updatePie = function (newData) {
  // newData: [{label, value, color?}, ...]
  if (!Array.isArray(newData)) return;
  data = newData.map((d) => ({
    label: d.label || "Item",
    value: Number(d.value) || 0,
    color: d.color,
  }));
  render();
};

// Initial render
render();
