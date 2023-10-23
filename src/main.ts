import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Kitchen Sketchpad";
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

// Splitter
app.append(document.createElement("br"));

// Add Color Slider
// Source: https://www.w3schools.com/howto/howto_js_rangeslider.asp
let lineColor = "hsl(0, 100%, 50%)";
const colorSlider = document.createElement("input");
colorSlider.type = "range";
colorSlider.id = "colorSlider";
colorSlider.min = "0";
colorSlider.max = "360";
colorSlider.value = "0";
// CHATGPT Prompt: "How can I convert a slider input into a color value in typescript?"
colorSlider.addEventListener("input", () => {
  lineColor = `hsl(${colorSlider.value}, 100%, 50%)`;
  if (currentLineCommand) {
    currentLineCommand.updateColor(lineColor);
  }
  if (toolPreview) {
    toolPreview.updateColor(lineColor);
  }
});
const label = document.createElement("label");
label.textContent = "Line Color:";
label.htmlFor = "colorSlider";

app.append(label);
app.append(colorSlider);

// Splitter
app.append(document.createElement("br"));

// Thin Button Creation
let isThinMarkerSelected = true;
const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
// Updates the buttons so thin is the one selected.
thinButton.addEventListener("click", () => {
  isThinMarkerSelected = true;
  selectedSticker = null;
  thinButton.classList.add("selected-button");
  thickButton.classList.remove("selected-button");
  thinButton.classList.remove("deselected-button");
  thickButton.classList.add("deselected-button");
  notify("tool-moved");
  toolPreview = new ToolPreview(0, 0, isThinMarkerSelected ? 2 : 5, lineColor);
});
app.append(thinButton);

// Thick Button Creation
const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
// Updates the buttons so thick is the one selected.
thickButton.addEventListener("click", () => {
  isThinMarkerSelected = false;
  selectedSticker = null;
  thickButton.classList.add("selected-button");
  thinButton.classList.remove("selected-button");
  thickButton.classList.remove("deselected-button");
  thinButton.classList.add("deselected-button");
  notify("tool-moved");
  toolPreview = new ToolPreview(0, 0, isThinMarkerSelected ? 2 : 5, lineColor);
});
app.append(thickButton);

// UI Break
app.append(document.createElement("br"));

// Sticker Button Creation
const stickerButtons = ["🍳", "🥘", "👨‍🍳"];
let selectedSticker: string | null = null;

stickerButtons.forEach((sticker) => {
  const stickerButton = document.createElement("button");
  stickerButton.innerHTML = sticker;
  stickerButton.addEventListener("click", () => {
    selectedSticker = sticker;
    notify("tool-moved");
  });
  app.append(stickerButton);
});

// Custom Sticker Button
const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Create Custom Sticker";
customStickerButton.addEventListener("click", () => {
  const customSticker = prompt("Enter your custom sticker:");
  if (customSticker !== null) {
    selectedSticker = customSticker;
    notify("tool-moved");
  }
});
app.append(customStickerButton);

// UI Break
app.append(document.createElement("br"));

// Export Button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  const scaleFactor = 4;
  exportCanvas.width = canvas.width * scaleFactor;
  exportCanvas.height = canvas.height * scaleFactor;
  const exportContext = exportCanvas.getContext("2d");
  // Scale and create backdrop
  // ChatGPT prompt: "How do I scale my canvas for exporting using TypeScript?"
  if (exportContext) {
    exportContext.scale(scaleFactor, scaleFactor);
    exportContext.fillStyle = "white";
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }
  
  // Draw all actions
  commands.forEach((cmd) => {
    if (!(cmd instanceof ToolPreview)) {
      if (exportContext) {
        cmd.display(exportContext);
      }
    }
  });
  const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
});
app.append(exportButton);

// Makes thin button highlighted at start
thinButton.classList.add("selected-button");
thickButton.classList.remove("selected-button");
thinButton.classList.remove("deselected-button");
thickButton.classList.add("deselected-button");

// Credit: Michael Leung: "Creating your own custom interface is a good idea"
interface Command {
  display(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void; // drag is optional
}

// Initial design based on ideas from: https://shoddy-paint.glitch.me/paint2.html
// Initializes canvas and commands
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
const commands: Command[] = [];
const redoCommands: Command[] = [];

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
      if (cmd instanceof LineCommand) {
        ctx.lineWidth = cmd.markerThickness;
      }
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
  color: string;
  constructor(x: number, y: number, markerThickness: number, color: string) {
    this.x = x;
    this.y = y;
    this.markerThickness = markerThickness;
    this.color = color;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    const radius = this.markerThickness / 2;
    ctx.ellipse(this.x, this.y, radius, radius, 0, 0, 2 * Math.PI);
    ctx.lineWidth = this.markerThickness;
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }
  updateColor(color: string) {
    this.color = color;
  }
}

let toolPreview: ToolPreview | null = null;

class LineCommand implements Command {
  private points: { x: number; y: number }[];
  public markerThickness: number;
  private color: string;
  constructor(initialX: number, initialY: number, thickness: number, color: string) {
    this.points = [{ x: initialX, y: initialY }];
    this.markerThickness = thickness;
    this.color = color;
  }
  updateColor(newColor: string) {
    this.color = newColor;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    const { x, y } = this.points[0];
    ctx.moveTo(x, y);
    ctx.lineWidth = this.markerThickness;
    ctx.strokeStyle = this.color;
    for (const { x, y } of this.points) {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

// New class for sticker previewing
class StickerPreviewCommand {
  x: number;
  y: number;
  sticker: string;
  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "30px monospace";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// New class for sticker placements
class StickerCommand implements Command {
  x: number;
  y: number;
  sticker: string;
  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "30px monospace";
    ctx.fillText(this.sticker, this.x, this.y);
  }
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

let currentStickerCommand: StickerCommand | null = null;

class CursorCommand {
  x: number;
  y: number;
  constructor(initialX: number, initialY: number) {
    this.x = initialX;
    this.y = initialY;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "30px monospace";
  }
}

let currentLineCommand: LineCommand | null = null;

function handleToolMovement(x: number, y: number) {
  const markerThickness = isThinMarkerSelected ? 2 : 5;
  toolPreview = new ToolPreview(x, y, markerThickness, lineColor); // Pass the line color
  bus.dispatchEvent(new Event("tool-moved"));
}

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("cursor-changed");
});

canvas.addEventListener("mouseleave", () => {
  cursorCommand = null;
  notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  if (e.buttons === 0) {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
    notify("cursor-changed");
  }
});

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
  
    // Added sticker handling
    if (selectedSticker && e.buttons === 0) {
      cursorCommand = new StickerPreviewCommand(x, y, selectedSticker);
      notify("cursor-changed");
      toolPreview = null;
      return;
    }
  
    if (e.buttons === 0) {
      handleToolMovement(x, y);
    }
  
    if (e.buttons == 1) {
      // Check if a sticker is selected, and only then allow drawing
      if (!selectedSticker) {
        if (currentLineCommand) {
          currentLineCommand.drag(x, y);
          notify("drawing-changed");
        }
      }
    }
  });

canvas.addEventListener("mousedown", (e) => {
  const markerThickness = isThinMarkerSelected ? 2 : 5;
  const currentColor = `hsl(${colorSlider.value}, 100%, 50%)`;
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY, markerThickness, currentColor);
  commands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  notify("cursor-changed");

  // Added sticker handling
  if (selectedSticker) {
    currentStickerCommand = new StickerCommand(e.offsetX, e.offsetY, selectedSticker);
    commands.push(currentStickerCommand);
    notify("drawing-changed");
    return;
  }
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

// Clear Button Creation
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  notify("drawing-changed");
});
app.append(clearButton);

// Undo Button Creation
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoCommands.push(commands.pop()!);
    notify("drawing-changed");
  }
});
app.append(undoButton);

// Redo Button Creation
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    commands.push(redoCommands.pop()!);
    notify("drawing-changed");
  }
});
app.append(redoButton);