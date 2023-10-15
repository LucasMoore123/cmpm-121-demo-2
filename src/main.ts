import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticker Sketchpad";
document.title = gameName;

// Game Name Creation
const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

// Canvas Creation
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.backgroundColor = "white";
canvas.style.border = "2px solid black";
canvas.style.borderRadius = "15px";
canvas.style.boxShadow = "10px 10px 10px rgba(220, 198, 255, 0.7)";
app.append(canvas);

// Separate canvas and clear
app.append(document.createElement("br"));

// Clear Button Creation
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
});
app.append(clearButton);

// Drawing Logic
let isDrawing = false;
let lastX = 0;
let lastY = 0;
const ctx = canvas.getContext("2d");

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        ctx?.beginPath();
        ctx?.moveTo(lastX, lastY);
        ctx?.lineTo(e.offsetX, e.offsetY);
        ctx?.stroke();
        lastX = e.offsetX;
        lastY = e.offsetY;
    }
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

canvas.addEventListener("mouseout", () => {
    isDrawing = false;
});