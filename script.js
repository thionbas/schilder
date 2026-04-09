const { jsPDF } = window.jspdf;

const GHS_PATH = "https://upload.wikimedia.org/wikipedia/commons/";
const ghsIcons = [
    { id: "ghs01", src: "3/3f/GHS-pictogram-explos.svg" },
    { id: "ghs02", src: "a/a2/GHS-pictogram-flamme.svg" },
    { id: "ghs03", src: "e/ee/GHS-pictogram-rondflam.svg" },
    { id: "ghs04", src: "1/1b/GHS-pictogram-bottle.svg" },
    { id: "ghs05", src: "1/1a/GHS-pictogram-acid.svg" },
    { id: "ghs06", src: "3/3c/GHS-pictogram-skull.svg" },
    { id: "ghs07", src: "a/a7/GHS-pictogram-exclam.svg" },
    { id: "ghs08", src: "d/d7/GHS-pictogram-silhouette.svg" },
    { id: "ghs09", src: "9/93/GHS-pictogram-pollut.svg" }
];

// UI Initialisieren
const ghsContainer = document.getElementById('ghsSelectors');
ghsIcons.forEach(icon => {
    const div = document.createElement('label');
    div.className = "flex flex-col items-center cursor-pointer";
    div.innerHTML = `
        <img src="${GHS_PATH}${icon.src}" class="w-8 h-8 mb-1">
        <input type="checkbox" value="${icon.id}" class="ghs-checkbox">
    `;
    ghsContainer.appendChild(div);
});

function updatePreview() {
    const container = document.getElementById('previewContainer');
    const text = document.getElementById('labelText').value || "VORSCHAU TEXT";
    const subClass = document.getElementById('substanceClass').value;
    const flow = document.querySelector('input[name="flow"]:checked').value;
    const signal = document.getElementById('signalWord').value;
    const selectedGHS = Array.from(document.querySelectorAll('.ghs-checkbox:checked'));

    container.className = `w-full max-w-[500px] border shadow-2xl relative aspect-[99.1/42.3] overflow-hidden class-${subClass}`;
    
    // Pfeil Logik
    let arrowHtml = "";
    let arrowStyle = "";
    if (flow === 'left') { arrowHtml = "←"; arrowStyle = "bottom: 5px;"; }
    else if (flow === 'right') { arrowHtml = "→"; arrowStyle = "bottom: 5px;"; }
    else if (flow === 'up') { arrowHtml = "↑"; arrowStyle = "right: 10px; top: 40%;"; }
    else if (flow === 'down') { arrowHtml = "↓"; arrowStyle = "right: 10px; top: 40%;"; }

    container.innerHTML = `
        <div class="preview-text" id="autoText">${text}</div>
        <div class="preview-bottom">
            <div class="preview-ghs">
                ${selectedGHS.map(cb => `<img src="${cb.previousElementSibling.src}">`).join('')}
            </div>
            <div class="preview-signal">${signal}</div>
            <div class="preview-arrow" style="${arrowStyle}">${arrowHtml}</div>
        </div>
    `;

    // Schriftgrößen-Anpassung
    const textEl = document.getElementById('autoText');
    let size = 40;
    textEl.style.fontSize = size + "px";
    while (textEl.scrollHeight > textEl.offsetHeight && size > 8) {
        size--;
        textEl.style.fontSize = size + "px";
    }
}

async function generatePDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    // Avery L4776REV Maße
    const labelW = 99.1;
    const labelH = 42.3;
    const marginTop = 21.6;
    const marginLeft = 6.4;
    
    const count = Math.min(parseInt(document.getElementById('quantity').value), 12);
    const subClass = document.getElementById('substanceClass').value;
    const text = document.getElementById('labelText').value;
    const signal = document.getElementById('signalWord').value;
    const flow = document.querySelector('input[name="flow"]:checked').value;
    const selectedGHS = Array.from(document.querySelectorAll('.ghs-checkbox:checked'));

    const colors = {
        white: [255,255,255], yellow: [255,255,0], red: [255,0,0], 
        brown: [139,69,19], green: [0,128,0], blue: [0,0,255], violet: [128,0,128]
    };

    for (let i = 0; i < count; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = marginLeft + (col * labelW);
        const y = marginTop + (row * labelH);

        // Hintergrund
        doc.setFillColor(...colors[subClass]);
        doc.rect(x, y, labelW, labelH, 'F');
        
        // Rahmen (optional für Schnittkante)
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, labelW, labelH, 'S');

        // Text
        doc.setTextColor(subClass === 'yellow' || subClass === 'white' ? 0 : 255);
        let fontSize = 28;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        
        // Text Wrap & Scale
        while(doc.getTextWidth(text) > (labelW - 10) && fontSize > 8) {
            fontSize--;
            doc.setFontSize(fontSize);
        }
        doc.text(text, x + labelW/2, y + 15, { align: 'center', maxWidth: labelW - 10 });

        // GHS Symbole (wir zeichnen Quadrate als Platzhalter, echte SVGs brauchen Base64)
        let ghsX = x + (labelW/2) - (selectedGHS.length * 6);
        for(let g = 0; g < selectedGHS.length; g++) {
            doc.setDrawColor(255, 0, 0); // GHS Roter Rand
            doc.setLineWidth(0.5);
            // In der Praxis hier doc.addImage nutzen.
            doc.rect(ghsX + (g * 12), y + 22, 10, 10, 'S'); 
            doc.setFontSize(6);
            doc.text("GHS", ghsX + (g * 12) + 5, y + 28, {align:'center'});
        }

        // Signalwort
        doc.setFontSize(10);
        doc.text(signal, x + labelW/2, y + 36, { align: 'center' });

        // Pfeil Zeichnen (Vektoren für maximale Sichtbarkeit)
        doc.setLineWidth(1.5);
        doc.setDrawColor(subClass === 'yellow' || subClass === 'white' ? 0 : 255);
        
        if (flow === 'right' || flow === 'left') {
            const py = y + labelH - 5;
            const xStart = x + 20;
            const xEnd = x + labelW - 20;
            if (flow === 'right') {
                doc.line(xStart, py, xEnd, py);
                doc.line(xEnd, py, xEnd - 4, py - 2);
                doc.line(xEnd, py, xEnd - 4, py + 2);
            } else {
                doc.line(xStart, py, xEnd, py);
                doc.line(xStart, py, xStart + 4, py - 2);
                doc.line(xStart, py, xStart + 4, py + 2);
            }
        } else {
            const px = x + labelW - 8;
            const yStart = y + 10;
            const yEnd = y + labelH - 10;
            if (flow === 'up') {
                doc.line(px, yStart, px, yEnd);
                doc.line(px, yStart, px - 2, yStart + 4);
                doc.line(px, yStart, px + 2, yStart + 4);
            } else {
                doc.line(px, yStart, px, yEnd);
                doc.line(px, yEnd, px - 2, yEnd - 4);
                doc.line(px, yEnd, px + 2, yEnd - 4);
            }
        }
    }

    doc.save(`AP_Schilder_Avery_L4776.pdf`);
}

document.addEventListener('input', updatePreview);
document.getElementById('downloadBtn').addEventListener('click', generatePDF);
updatePreview();
