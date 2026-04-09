const { jsPDF } = window.jspdf;

// GHS Definitionen
const ghsLabels = ["GHS01", "GHS02", "GHS03", "GHS04", "GHS05", "GHS06", "GHS07", "GHS08", "GHS09"];

// UI Setup
const ghsGrid = document.getElementById('ghsSelectors');
ghsLabels.forEach(label => {
    const div = document.createElement('label');
    div.className = "flex flex-col items-center p-1 border rounded hover:bg-gray-100 cursor-pointer text-[10px]";
    div.innerHTML = `
        <div class="ghs-diamond-preview"><span class="ghs-inner-icon">${label}</span></div>
        <input type="checkbox" value="${label}" class="ghs-checkbox mt-1">
    `;
    ghsGrid.appendChild(div);
});

function updatePreview() {
    const container = document.getElementById('previewContainer');
    const text = document.getElementById('labelText').value || "DEIN TEXT HIER";
    const subClass = document.getElementById('substanceClass').value;
    const signal = document.getElementById('signalWord').value;
    const flow = document.querySelector('input[name="flow"]:checked').value;
    const selectedGHS = Array.from(document.querySelectorAll('.ghs-checkbox:checked')).map(cb => cb.value);

    // Farben Mapping
    const colorMap = {
        white: "#ffffff", yellow: "#ffff00", red: "#ff0000", 
        brown: "#8b4513", green: "#008000", blue: "#0000ff", violet: "#800080"
    };
    
    container.style.backgroundColor = colorMap[subClass];
    container.style.color = (['yellow', 'white'].includes(subClass)) ? 'black' : 'white';

    // HTML Inhalt der Vorschau
    container.innerHTML = `
        <div class="flex-1 flex items-center justify-center text-center font-bold text-2xl px-4 overflow-hidden" id="prevText">
            ${text}
        </div>
        <div class="h-1/3 flex items-center justify-between px-2">
            <div class="flex gap-1" id="prevGhs">
                ${selectedGHS.map(g => `<div class="ghs-diamond-preview"><span class="ghs-inner-icon">${g}</span></div>`).join('')}
            </div>
            <div class="text-xl font-black italic mr-10">${signal}</div>
            <div class="text-5xl font-bold" id="prevArrow">${getArrowSymbol(flow)}</div>
        </div>
    `;
}

function getArrowSymbol(dir) {
    if(dir === 'left') return '←';
    if(dir === 'right') return '→';
    if(dir === 'up') return '↑';
    return '↓';
}

async function generatePDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    // Avery L4776REV exakte Maße
    const labelW = 99.1;
    const labelH = 42.3;
    const marginTop = 21.6;
    const marginLeft = 6.4;
    
    const count = parseInt(document.getElementById('quantity').value);
    const subClass = document.getElementById('substanceClass').value;
    const text = document.getElementById('labelText').value;
    const signal = document.getElementById('signalWord').value;
    const flow = document.querySelector('input[name="flow"]:checked').value;
    const selectedGHS = Array.from(document.querySelectorAll('.ghs-checkbox:checked')).map(cb => cb.value);

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
        
        // Textfarbe
        doc.setTextColor( ['yellow', 'white'].includes(subClass) ? 0 : 255);
        
        // Haupttext (mit automatischer Skalierung)
        let fontSize = 24;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        doc.text(text, x + (labelW/2), y + 18, { align: 'center', maxWidth: labelW - 10 });

        // GHS Symbole zeichnen (Rote Rauten)
        doc.setDrawColor(255, 0, 0);
        doc.setLineWidth(0.8);
        selectedGHS.forEach((ghs, index) => {
            const gx = x + 10 + (index * 12);
            const gy = y + 32;
            doc.setFillColor(255,255,255);
            // Raute zeichnen
            doc.line(gx, gy-4, gx+4, gy); // Oben nach Rechts
            doc.line(gx+4, gy, gx, gy+4); // Rechts nach Unten
            doc.line(gx, gy+4, gx-4, gy); // Unten nach Links
            doc.line(gx-4, gy, gx, gy-4); // Links nach Oben
            
            doc.setFontSize(5);
            doc.setTextColor(0);
            doc.text(ghs, gx, gy+1, {align: 'center'});
        });

        // Signalwort
        doc.setFontSize(14);
        doc.setTextColor( ['yellow', 'white'].includes(subClass) ? 0 : 255);
        doc.text(signal, x + labelW - 35, y + 34, { align: 'right' });

        // Fetter Pfeil
        doc.setLineWidth(2);
        doc.setDrawColor(['yellow', 'white'].includes(subClass) ? 0 : 255);
        const ax = x + labelW - 15;
        const ay = y + 32;

        if(flow === 'right') {
            doc.line(ax-8, ay, ax+5, ay);
            doc.line(ax+5, ay, ax+1, ay-3);
            doc.line(ax+5, ay, ax+1, ay+3);
        } else if(flow === 'left') {
            doc.line(ax+5, ay, ax-8, ay);
            doc.line(ax-8, ay, ax-4, ay-3);
            doc.line(ax-8, ay, ax-4, ay+3);
        } else if(flow === 'up') {
            doc.line(ax, ay+5, ax, ay-5);
            doc.line(ax, ay-5, ax-3, ay-1);
            doc.line(ax, ay-5, ax+3, ay-1);
        } else {
            doc.line(ax, ay-5, ax, ay+5);
            doc.line(ax, ay+5, ax-3, ay+1);
            doc.line(ax, ay+5, ax+3, ay+1);
        }
    }
    doc.save(`Etiketten_Avery_L4776.pdf`);
}

document.addEventListener('input', updatePreview);
document.getElementById('downloadBtn').addEventListener('click', generatePDF);
updatePreview();
