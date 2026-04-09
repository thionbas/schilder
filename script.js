const { jsPDF } = window.jspdf;

// GHS Daten (URLs von Wikipedia für die Vorschau)
const GHS_URLS = {
    ghs01: "https://upload.wikimedia.org/wikipedia/commons/3/3f/GHS-pictogram-explos.svg",
    ghs02: "https://upload.wikimedia.org/wikipedia/commons/a/a2/GHS-pictogram-flamme.svg",
    ghs03: "https://upload.wikimedia.org/wikipedia/commons/e/ee/GHS-pictogram-rondflam.svg",
    ghs05: "https://upload.wikimedia.org/wikipedia/commons/1/1a/GHS-pictogram-acid.svg",
    ghs07: "https://upload.wikimedia.org/wikipedia/commons/a/a7/GHS-pictogram-exclam.svg"
};

// GHS Selektoren erstellen
const ghsGrid = document.getElementById('ghsSelectors');
Object.keys(GHS_URLS).forEach(key => {
    const label = document.createElement('label');
    label.className = "flex flex-col items-center cursor-pointer p-1 border rounded hover:bg-white";
    label.innerHTML = `
        <img src="${GHS_URLS[key]}" class="w-8 h-8 mb-1">
        <input type="checkbox" value="${key}" class="ghs-checkbox">
    `;
    ghsGrid.appendChild(label);
});

function updatePreview() {
    const text = document.getElementById('labelText').value || "BEISPIEL TEXT";
    const subClass = document.getElementById('substanceClass').value;
    const signal = document.getElementById('signalWord').value;
    const flow = document.querySelector('input[name="flow"]:checked').value;
    const selectedGhs = Array.from(document.querySelectorAll('.ghs-checkbox:checked'));

    const previewLabel = document.getElementById('previewLabel');
    const prevText = document.getElementById('prevText');
    const prevGHS = document.getElementById('prevGHS');
    const prevSignal = document.getElementById('prevSignal');
    const prevArrow = document.getElementById('prevArrow');

    // Farbe setzen
    previewLabel.className = `preview-label-box bg-${subClass}`;
    
    // Text
    prevText.innerText = text;
    
    // GHS
    prevGHS.innerHTML = selectedGhs.map(cb => `
        <div class="ghs-icon-mini"><img src="${GHS_URLS[cb.value]}"></div>
    `).join('');

    // Signal & Pfeil
    prevSignal.innerText = signal;
    prevArrow.innerText = (flow === 'left' ? '←' : flow === 'right' ? '→' : flow === 'up' ? '↑' : '↓');

    // Auto-Scaling Text
    let size = 40;
    prevText.style.fontSize = size + "px";
    while (prevText.scrollHeight > prevText.offsetHeight && size > 10) {
        size--;
        prevText.style.fontSize = size + "px";
    }
}

async function generatePDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    // Avery L4776 Maße
    const labelW = 99.1;
    const labelH = 42.3;
    const marginTop = 21.6;
    const marginLeft = 6.4;
    
    const count = Math.min(parseInt(document.getElementById('quantity').value), 12);
    const subClass = document.getElementById('substanceClass').value;
    const text = document.getElementById('labelText').value;
    const signal = document.getElementById('signalWord').value;
    const flow = document.querySelector('input[name="flow"]:checked').value;
    const selectedGhs = Array.from(document.querySelectorAll('.ghs-checkbox:checked'));

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
        
        // Kontrastfarbe für Text
        const isDark = !['white', 'yellow'].includes(subClass);
        doc.setTextColor(isDark ? 255 : 0);

        // Haupttext
        doc.setFont("helvetica", "bold");
        let fontSize = 25;
        doc.setFontSize(fontSize);
        // Einfaches Wrapping
        const splitText = doc.splitTextToSize(text, labelW - 10);
        doc.text(splitText, x + labelW/2, y + 15, { align: 'center' });

        // GHS Symbole (Wir zeichnen Rauten, da SVGs im PDF oft Probleme machen ohne Proxy)
        doc.setDrawColor(255, 0, 0);
        doc.setLineWidth(0.5);
        selectedGhs.forEach((ghs, idx) => {
            const gx = x + 10 + (idx * 12);
            const gy = y + 32;
            doc.setFillColor(255,255,255);
            // Raute
            doc.line(gx, gy-4, gx+4, gy);
            doc.line(gx+4, gy, gx, gy+4);
            doc.line(gx, gy+4, gx-4, gy);
            doc.line(gx-4, gy, gx, gy-4);
            doc.setFontSize(4);
            doc.setTextColor(0);
            doc.text(ghs.value.toUpperCase(), gx, gy + 1, {align:'center'});
        });

        // Signalwort
        doc.setTextColor(isDark ? 255 : 0);
        doc.setFontSize(12);
        doc.text(signal, x + labelW - 25, y + 32, { align: 'right' });

        // Pfeil (gezeichnet für Schärfe)
        doc.setDrawColor(isDark ? 255 : 0);
        doc.setLineWidth(1.5);
        const ax = x + labelW - 12;
        const ay = y + 32;
        if(flow === 'right') {
            doc.line(ax-5, ay, ax+5, ay);
            doc.line(ax+5, ay, ax+2, ay-2);
            doc.line(ax+5, ay, ax+2, ay+2);
        } else if(flow === 'left') {
            doc.line(ax+5, ay, ax-5, ay);
            doc.line(ax-5, ay, ax-2, ay-2);
            doc.line(ax-5, ay, ax-2, ay+2);
        } // ... up/down analog
    }

    doc.save("AP_Schilder_Druck.pdf");
}

// Event Listener
document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', updatePreview);
});
document.getElementById('downloadBtn').addEventListener('click', generatePDF);

// Init
updatePreview();
