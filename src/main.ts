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

// Based on code from: https://shoddy-paint.glitch.me/paint2.html
// Altered to fit our project description and needs
// All code past this point follows the design from link above
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let cursorCommand: CursorCommand | null = null;

const bus: EventTarget = new EventTarget();

function notify(name: string) {
    bus.dispatchEvent(new Event(name));
}

function redraw() {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    if (ctx) {
        commands.forEach((cmd) => cmd.display(ctx));
        if (cursorCommand) {
            cursorCommand.display(ctx);
        }
    }
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("cursor-changed", redraw);

class LineCommand {
    private points: { x: number; y: number }[];

    constructor(initialX: number, initialY: number) {
        this.points = [{ x: initialX, y: initialY }];
    }
    display(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const { x, y } = this.points[0];
        ctx.moveTo(x, y);
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

canvas.addEventListener("mouseout", () => {
    cursorCommand = null;
    notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
    notify("cursor-changed");
});

canvas.addEventListener("mousemove", (e) => {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
    notify("cursor-changed");

    if (e.buttons == 1) {
        if (currentLineCommand) {
            currentLineCommand.drag(e.offsetX, e.offsetY);
            notify("drawing-changed");
        }
    }
});

canvas.addEventListener("mousedown", (e) => {
    currentLineCommand = new LineCommand(e.offsetX, e.offsetY);
    commands.push(currentLineCommand);
    redoCommands.splice(0, redoCommands.length);
    notify("cursor-changed");

    if (e.buttons == 1) {
        if (currentLineCommand) {
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