/*
* Typewritter effect
* Author Lautaro C.
* v1.0.0
*/
(async () => {
    await document.fonts.ready;
    run();
})();
function run() {
    draw(document.getElementById("canvas"), `
  Considerando en frío, imparcialmente,
  que el hombre es triste, tose y, sin embargo,
  se complace en su pecho colorado;
  que lo único que hace es componerse
  de días;
  que es lóbrego mamífero y se peina...
  
  Considerando
  que el hombre procede suavemente del trabajo
  y repercute jefe, suena subordinado;
  que el diagrama del tiempo
  es constante diorama en sus medallas
  y, a medio abrir, sus ojos estudiaron,
  desde lejanos tiempos,
  su fórmula famélica de masa...
  `, true);
}
function draw(canvas, text, textFormatted) {
    let textArea = new TextArea(canvas, "0.5em custom-font");
    textArea.drawText(text, DrawMode.Typewritter, textFormatted, 30);
    canvas.addEventListener("click", () => {
        flipPage(textArea);
        textArea.drawText(text, DrawMode.Typewritter, textFormatted, 30);
    });
}
function flipPage(textArea) {
    textArea.stopDrawing();
    let canvas = textArea.getCanvas();
    let img = canvas.toDataURL("png", 1);
    let page = document.getElementsByClassName("page");
    let pageSegment = document.getElementsByClassName("pageSegment");
    page[0].setAttribute("style", `
    visibility: visible;
    height:${canvas.height}px;
    width:${canvas.width}px;
  `);
    let width = page[0].clientWidth / 9;
    let currWidth = 0;
    for (let i = 0; i < pageSegment.length; i++) {
        pageSegment[i].setAttribute("style", `
      background-image:url(${img}), url("./book-half.png");
      background-position-x:${-currWidth}px;
      background-repeat: no-repeat;
      background-size: cover;
      width:${width + 2}px;
      left:${i == 0 ? 0 : width}px;
    `);
        pageSegment[i].classList.add("flip" + (i));
        currWidth += width;
    }
    // reset canvas
    textArea.clear();
    // reset animation
    window.setTimeout(() => {
        page[0].setAttribute("style", `
    visibility: hidden;
    `);
        for (let i = 0; i < pageSegment.length; i++) {
            pageSegment[i].classList.remove("flip" + (i));
        }
    }, 6000);
}
class TextArea {
    ctx;
    canvas;
    lineSpacingPixels = 3;
    spaceWidth;
    font;
    stop = false;
    typing = 0;
    constructor(canvas, font) {
        this.canvas = canvas;
        // setup canvas
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        // buld class
        this.ctx = canvas.getContext("2d");
        this.font = font;
        this.ctx.font = this.font;
        // measure space width
        this.spaceWidth = this.ctx.measureText(" ").width;
    }
    getCanvas() {
        return this.canvas;
    }
    clear(color) {
        if (color !== undefined) {
            this.ctx.fillStyle = color;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    stopDrawing() {
        if (this.typing != 0)
            this.stop = true;
    }
    // returns height of the drawn text
    drawText(text, mode, textFormatted, margin) {
        this.ctx.font = this.font;
        // check line height
        let metrics = this.ctx.measureText(text);
        let lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        let lines;
        if (textFormatted) {
            lines = this.getLinesUnconstrained(text);
            let textWidth = lines.reduce((p, c) => {
                let metrics = this.ctx.measureText(c);
                let length = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
                if (length > p) {
                    return length;
                }
                return p;
            }, 0);
            // set canvas width to equal longest line
            this.canvas.width = 250; //textWidth + margin
            this.ctx.font = this.font;
        }
        else {
            lines = this.getLinesConstrained(text, margin);
        }
        if (lines.length == 0) {
            return 0;
        }
        let textHeight = ((lines.length - 1) * this.lineSpacingPixels) + (lines.length * lineHeight);
        // set canvas height
        // this.canvas.height = textHeight
        // patch
        this.canvas.height = 319;
        this.ctx.font = this.font;
        switch (mode) {
            case DrawMode.Instant:
                this.fillTextInstant(lines, lineHeight, metrics);
                break;
            case DrawMode.Typewritter:
                this.fillTextTypeWritter(lines, lineHeight, metrics);
                break;
        }
        // height of the html component must be updated
        return textHeight;
    }
    fillTextInstant(lines, lineHeight, metrics) {
        this.ctx.font = this.font;
        lines.forEach((l, i) => {
            this.ctx.fillText(l, 0, (i * lineHeight) + metrics.actualBoundingBoxAscent + (i * this.lineSpacingPixels));
        });
    }
    shouldStop() {
        if (this.stop) {
            this.stop = false;
            return true;
        }
        return false;
    }
    async fillTextTypeWritter(lines, lineHeight, metrics) {
        this.typing++;
        this.ctx.font = this.font;
        for (let i = 0; i < lines.length; i++) {
            let charPos = 0;
            for (let istr = 0; istr < lines[i].length; istr++) {
                if (this.shouldStop()) {
                    return;
                }
                this.ctx.fillText(lines[i][istr], charPos, (i * lineHeight) + metrics.actualBoundingBoxAscent + (i * this.lineSpacingPixels));
                let bleed = this.ctx.measureText(lines[i][istr]).width;
                charPos += bleed;
                await sleep(104);
            }
            await sleep(400);
        }
        this.typing--;
    }
    getLinesUnconstrained(text) {
        return text.split('\n');
    }
    getLinesConstrained(text, margin) {
        let lines = [];
        let currentLineWidth = 0;
        let currentLine = "";
        let words = text.split(' ');
        words.forEach(w => {
            let metrics = this.ctx.measureText(w);
            let wordWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
            if (currentLineWidth + wordWidth > this.canvas.width - margin) {
                lines.push(currentLine);
                currentLineWidth = wordWidth + this.spaceWidth;
                currentLine = w;
            }
            else {
                currentLineWidth += wordWidth + this.spaceWidth;
                currentLine += w + " ";
            }
        });
        // push last line
        lines.push(currentLine);
        return lines;
    }
}
var DrawMode;
(function (DrawMode) {
    DrawMode[DrawMode["Instant"] = 0] = "Instant";
    DrawMode[DrawMode["Typewritter"] = 1] = "Typewritter";
})(DrawMode || (DrawMode = {}));
async function sleep(ms) {
    return new Promise((a) => {
        setTimeout(a, ms);
    });
}
//# sourceMappingURL=background.js.map