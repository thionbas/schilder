const { jsPDF } = window.jspdf;

// DOM Elemente
const inputs = ['substanceClass', 'labelHeading', 'signalWord', 'quantity'];
const preview = document.getElementById('previewLabel');

// GHS Icons Map (Wikimedia URLs)
const ghsIcons = {
    ghs01: "https://upload.wikimedia.org/wikipedia/commons/3/3f/GHS-pictogram-explos.svg",
    ghs02: "https://upload.wikimedia.org/wikipedia/commons/a/a2/GHS-pictogram-flamme.svg",
    ghs03: "https://upload.wikimedia.org/wikipedia/commons/e/ee/GHS-pictogram-rondflam.svg",
    ghs05: "https://upload.wikimedia.org/wikipedia/commons/1/1a/GHS-pictogram-acid.svg",
    ghs06: "https://upload.wikimedia.org/wikipedia/commons/3/3c/GHS-pictogram-skull.svg",
    ghs07: "https://upload.wikimedia.org/wikipedia/commons/a/a7/GHS-pictogram-exclam.svg"
};

// Update Vorschau
function updatePreview() {
    const text = document.getElementById('labelHeading').value || "TEXT";
    const bgClass = "bg-" + document.getElementById('substanceClass').value;
    const direction = document.querySelector('input[name="direction"]:checked').value;
    const signal = document.getElementById('signalWord').value;
    const selectedGHS = Array.from(document.querySelectorAll('#ghsContainer input:checked')).map(i => i.value);

    preview.className = `w-full aspect-[991/423] border border-gray-400 shadow-lg relative overflow-hidden flex flex-col ${bgClass}`;
    
    // HTML für Vorschau bauen
    let html = `
        <div class="text-container" id="previewText">${text}</div>
        <div class="bottom-container">
            <div class="ghs-row">
                ${selectedGHS.map(id => `<img src="${ghsIcons[id]}">`).join('')}
            </div>
            <div class="signal-word">${signal}</div>
    `;

    // Pfeil Logik
    let arrowChar = "→";
    let arrowStyle = "";
    if(direction === 'left') arrowChar = "←";
    if(direction === 'up') { arrowChar = "↑"; arrowStyle = "right: 5px; top: 25%;"; }
    else if(direction === 'down') { arrowChar = "↓"; arrowStyle = "right: 5px; top: 25%;"; }
    else { arrowStyle = "bottom: 2px;"; }

    html += `<div class="arrow" style="${arrowStyle}">${arrowChar}</div></div>`;
    preview.innerHTML = html;

    // Font-Size Auto-Scaling in der Vorschau
    const textDiv = document.getElementById('previewText');
    let fontSize = 40;
    textDiv.style.fontSize = fontSize + 'px';
    while (textDiv.scrollHeight > textDiv.offsetHeight || textDiv.scrollWidth > textDiv.offsetWidth) {
        fontSize--;
        textDiv.style.fontSize = fontSize + 'px';
        if(fontSize < 8) break;
    }
}

// PDF Generierung
async function generatePDF() {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const labelW = 99.1;
    const labelH = 42.3;
    const count = parseInt(document.getElementById('quantity').value);
    const bgClass = document.getElementById('substanceClass').value;
    const text = document.getElementById('labelHeading').value;
    const direction = document.querySelector('input[name="direction"]:checked').value;
    const signal = document.getElementById('signalWord').value;
    const selectedGHS = Array.from(document.querySelectorAll('#ghsContainer input:checked')).map(i => i.value);

    // Farbtabelle für PDF
    const colorMap = {
        white: [255,255,255], yellow: [255,255,0], red: [255,0,0], 
        brown: [139,69,19], green: [0,128,0], blue: [0,0,255], violet: [128,0,128]
    };

    for (let i = 0; i < count; i++) {
        const col = i % 2; // 0 oder 1
        const row = Math.floor(i / 2); // 0 bis 5
        const x = col * labelW + (col * 2); // Leichte Korrektur für Avery Abstände
        const y = row * labelH;

        // Hintergrund zeichnen
        const rgb = colorMap[bgClass];
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(x, y, labelW, labelH, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, labelW, labelH, 'S');

        // Textfarbe wählen (Kontrast)
        const textColor = ['yellow', 'white'].includes(bgClass) ? 0 : 255;
        doc.setTextColor(textColor);

        // Schriftgröße berechnen
        let fontSize = 24;
        doc.setFontSize(fontSize);
        while(doc.getTextWidth(text) > (labelW - 10) && fontSize > 6) {
            fontSize--;
            doc.setFontSize(fontSize);
        }
        doc.text(text, x + (labelW/2), y + 15, { align: 'center' });

        // GHS Symbole
        let ghsX = x + (labelW/2) - (selectedGHS.length * 5);
        for(const ghsId of selectedGHS) {
            // Hinweis: In einer echten Umgebung müssten Bilder als Base64 geladen werden.
            // Der Einfachheit halber platzieren wir hier Text-Platzhalter oder laden Icons.
            doc.setFontSize(8);
            doc.text("[GHS]", ghsX, y + 30);
            ghsX += 10;
        }

        // Signalwort
        doc.setFontSize(10);
        doc.text(signal, x + (labelW/2), y + 35, { align: 'center' });

        // Pfeil
        let pfeil = "->";
        if(direction === 'left') pfeil = "<-";
        if(direction === 'up') pfeil = "^";
        if(direction === 'down') pfeil = "v";

        if(['up', 'down'].includes(direction)) {
            doc.text(pfeil, x + labelW - 10, y + (labelH/2));
        } else {
            doc.text(pfeil, x + (labelW/2), y + labelH - 5, { align: 'center' });
        }
    }

    doc.save("Etiketten_AP_Schilder.pdf");
}

// Event Listener
document.addEventListener('input', updatePreview);
document.getElementById('generateBtn').addEventListener('click', generatePDF);

// Initialisierung
updatePreview();
