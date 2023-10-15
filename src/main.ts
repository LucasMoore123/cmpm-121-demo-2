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
const ctx = canvas.getContext("2d");

// Separate canvas and clear
app.append(document.createElement("br"));

// Drawing Logic
// SOURCE: Chat GPT Prompt: "How can I create an array of arrays of points in TypeScript?"
// SOURCE: Inspired heavily by https://shoddy-paint.glitch.me/paint1.html (link in D2 slideshow)
const lines: { x: number, y: number}[][] = []
const redoLines: { x: number, y: number }[][] = [];

let currentLine: { x: number, y: number }[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

const drawingChangedEvent = new Event("drawing-changed");
const clearEvent = new Event("clear");

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine = [];
    lines.push(currentLine);
    redoLines.splice(0, redoLines.length);
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        if (currentLine) {
            currentLine.push({ x: cursor.x, y: cursor.y });
        }
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;
    canvas.dispatchEvent(drawingChangedEvent);
});

// SOURCE: Inspired heavily by https://shoddy-paint.glitch.me/paint1.html (link in D2 slideshow)
function redraw() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const line of lines) {
            if (line.length > 1) {
                ctx.beginPath();
                const { x, y } = line[0];
                ctx.moveTo(x, y);
                for (const { x, y } of line) {
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
    }
}

// Clear Button Creation
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
    lines.length = 0;
    canvas.dispatchEvent(clearEvent);
});
app.append(clearButton);

// Event Listeners
canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("clear", redraw);