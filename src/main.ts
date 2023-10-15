import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticker Sketchpad";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.backgroundColor = "white";
canvas.style.border = "2px solid black";
canvas.style.borderRadius = "15px";
canvas.style.boxShadow = "10px 10px 10px rgba(220, 198, 255, 0.7)";
app.append(canvas);