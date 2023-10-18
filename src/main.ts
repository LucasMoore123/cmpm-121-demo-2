import "./style.css";
const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticker Sketchpad";
document.title = gameName;

// Game Name Creation
const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

// Thin Button Creation
let isThinMarkerSelected = true;
const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
// Updates the buttons so thin is the one selected.
thinButton.addEventListener("click", () => {
    isThinMarkerSelected = true;
    thinButton.classList.add("selected-button");
    thickButton.classList.remove("selected-button");
    thinButton.classList.remove("deselected-button");
    thickButton.classList.add("deselected-button");
});
app.append(thinButton);

// Thick Button Creation
const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
// Updates the buttons so thick is the one selected.
thickButton.addEventListener("click", () => {
    isThinMarkerSelected = false;
    thickButton.classList.add("selected-button");
    thinButton.classList.remove("selected-button");
    thickButton.classList.remove("deselected-button");
    thinButton.classList.add("deselected-button");
});
app.append(thickButton);

// Makes thin button highlighted at start
thinButton.classList.add("selected-button");
thickButton.classList.remove("selected-button");
thinButton.classList.remove("deselected-button");
thickButton.classList.add("deselected-button");

// Canvas Creation
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.backgroundColor = "white";
canvas.style.border = "2px solid black";
canvas.style.borderRadius = "15px";
canvas.style.boxShadow = "10px 10px 10px rgba(220, 198, 255, 0.7)";
app.append(canvas);

// Initial design based on ideas from: https://shoddy-paint.glitch.me/paint2.html
// Initializes canvas and commands
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let cursorCommand: CursorCommand | null = null;

// Creates event bus to handle all event calls
const bus: EventTarget = new EventTarget();

function notify(name: string) {
    bus.dispatchEvent(new Event(name));
}

// Redraws the canvas
function redraw() {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    if (ctx) {
        commands.forEach((cmd) => {
            ctx.lineWidth = cmd.markerThickness;
            cmd.display(ctx);
        });
        if (toolPreview) {
            toolPreview.draw(ctx);
        }
        if (cursorCommand) {
            cursorCommand.display(ctx);
        }
    }
}

// Sends commands based on drawing and cursor movement
bus.addEventListener("drawing-changed", () => redraw());
bus.addEventListener("cursor-changed", () => redraw());
bus.addEventListener("tool-moved", () => redraw());

// Creates preview of drawing tool
class ToolPreview {
    x: number;
    y: number;
    markerThickness: number;
    constructor(x: number, y: number, markerThickness: number) {
        this.x = x;
        this.y = y;
        this.markerThickness = markerThickness;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const radius = this.markerThickness / 2;
        ctx.ellipse(this.x, this.y, radius, radius, 0, 0, 2 * Math.PI);
        ctx.lineWidth = this.markerThickness;
        ctx.stroke();
    }
}

let toolPreview: ToolPreview | null = null;

class LineCommand {
    private points: { x: number; y: number }[];
    public markerThickness: number;

    constructor(initialX: number, initialY: number, thickness: number) {
        this.points = [{ x: initialX, y: initialY }];
        this.markerThickness = thickness;
    }
    display(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const { x, y } = this.points[0];
        ctx.moveTo(x, y);
        ctx.lineWidth = this.markerThickness;
        for (const { x, y } of this.points) {
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    drag(x: number, y: number) {
        this.points.push({ x, y });
    }
}


class CursorCommand {
    x: number;
    y: number;
    constructor(initialX: number, initialY: number) {
        this.x = initialX;
        this.y = initialY;
    }
    display(ctx: CanvasRenderingContext2D) {
        ctx.font = "16px monospace";
        ctx.fillText(".", this.x-4, this.y);
    }
}

let currentLineCommand: LineCommand | null = null;

function handleToolMovement(x: number, y: number) {
    if (!toolPreview) {
        toolPreview = new ToolPreview(x, y, isThinMarkerSelected ? 2 : 5);
    } else {
        toolPreview.x = x;
        toolPreview.y = y;
    }
    bus.dispatchEvent(new Event("tool-moved"));
}

canvas.addEventListener("mouseout", () => {
    cursorCommand = null;
    notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
    notify("cursor-changed");
});

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (e.buttons === 0) {
        handleToolMovement(x, y);
    }

    if (e.buttons == 1) {
        if (currentLineCommand) {
            currentLineCommand.drag(x, y);
            notify("drawing-changed");
        }
    }
});

canvas.addEventListener("mousedown", (e) => {
    const markerThickness = isThinMarkerSelected ? 2 : 5;
    currentLineCommand = new LineCommand(e.offsetX, e.offsetY, markerThickness);
    commands.push(currentLineCommand);
    redoCommands.splice(0, redoCommands.length);
    notify("cursor-changed");

    if (e.buttons == 1) {
        if (currentLineCommand) {
            if (toolPreview) {
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                toolPreview = null;
            }
            currentLineCommand.drag(e.offsetX, e.offsetY);
            notify("drawing-changed");
        }
    }
});

canvas.addEventListener("mouseup", () => {
    currentLineCommand = null;
    notify("drawing-changed");
});

// Separate canvas and clear
app.append(document.createElement("br"));

// Clear Button Creation
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
    commands.splice(0, commands.length);
    notify("drawing-changed");
});
app.append(clearButton);

// Undo Button Creation
// CHAT GPT PROMPT: Why do I get this error? (pasted error message when no ! at end of redoCommands.push(commands.pop()!);)
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
    if (commands.length > 0) {
        redoCommands.push(commands.pop()!);
        notify("drawing-changed");
    }
});
app.append(undoButton);

// Clear Button Creation
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
    if (redoCommands.length > 0) {
        commands.push(redoCommands.pop()!);
        notify("drawing-changed");
    }
});
app.append(redoButton);