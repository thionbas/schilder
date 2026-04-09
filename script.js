const { jsPDF } = window.jspdf;

// Vektorgrafiken (SVG) für GHS 1 bis 9 direkt im Code (laden sofort)
const GHS_SVGS = {
    ghs01: `<svg viewBox="0 0 100 100"><path d="M50 20 L80 50 L50 80 L20 50 Z" fill="none" stroke="black" stroke-width="2"/><circle cx="50" cy="50" r="10" fill="black"/><path d="M30 30 L70 70 M70 30 L30 70" stroke="black" stroke-width="5"/></svg>`,
    ghs02: `<svg viewBox="0 0 100 100"><path d="M50 20 C40 40 20 50 20 70 C20 85 50 90 50 90 C50 90 80 85 80 70 C80 50 60 40 50 20" fill="black"/></svg>`,
    ghs03: `<svg viewBox="0 0 100 100"><circle cx="50" cy="60" r="20" fill="none" stroke="black" stroke-width="8"/><path d="M50 10 L50 40 M30 20 L45 45 M70 20 L55 45" stroke="black" stroke-width="6"/></svg>`,
    ghs04: `<svg viewBox="0 0 100 100"><rect x="35" y="20" width="30" height="60" rx="5" fill="black"/></svg>`,
    ghs05: `<svg viewBox="0 0 100 100"><path d="M20 70 L40 70 L40 80 L20 80 Z M60 70 L80 70 L80 80 L60 80 Z" fill="black"/><path d="M30 30 L30 50 M70 30 L70 50" stroke="black" stroke-width="8"/></svg>`,
    ghs06: `<svg viewBox="0 0 100 100"><circle cx="50" cy="40" r="20" fill="black"/><path d="M30 70 L70 90 M70 70 L30 90" stroke="black" stroke-width="10"/></svg>`,
    ghs07: `<svg viewBox="0 0 100 100"><rect x="42" y="15" width="16" height="45" fill="black"/><circle cx="50" cy="75" r="9" fill="black"/></svg>`,
    ghs08: `<svg viewBox="0 0 100 100"><path d="M50 20 L30 50 L50 80 L70 50 Z" fill="black"/></svg>`,
    ghs09: `<svg viewBox="0 0 100 100"><path d="M20 80 Q50 50 80 80" fill="none" stroke="black" stroke-width="5"/><path d="M60 40 L80 20" stroke="black" stroke-width="5"/></svg>`
};

// GHS Auswahl in die HTML Seite laden
const ghsPicker = document.getElementById('ghsPicker');
for (let i = 1; i <= 9; i++) {
    const id = `ghs0${i}`;
    const label = document.createElement('label');
    label.className = "flex flex-col items-center cursor-pointer p-2 border-2 rounded hover:border-[#064e3b] transition bg-white";
    label.innerHTML = `
        <div class="w-8 h-8 mb-1">${GHS_SVGS[id]}</div>
        <input type="checkbox" value="${id}" class="ghs-check">
        <span class="text-[9px] font-bold mt-1">GHS0${i}</span>
    `;
    ghsPicker.appendChild(label);
}

// Live-Vorschau aktualisieren
function updatePreview() {
    const text = document.getElementById('mainText').value || "TEXT";
    const subClass = document.getElementById('subClass').value;
    const signal = document.getElementById('signal').value;
    const arrow = document.getElementById('arrowDir').value;
    
    // Nur maximal 3 GHS Symbole erlauben
    const selectedGhs = Array.from(document.querySelectorAll('.ghs-check:checked')).slice(0, 3);

    const card = document.getElementById('previewCard');
    card.className = `label-box bg-${subClass}`;

    document.getElementById('pText').innerText = text;
    document.getElementById('pSignal').innerText = signal;

    const arrowMap = { right: '→', left: '←', up: '↑', down: '↓' };
    document.getElementById('pArrow').innerText = arrowMap[arrow];

    // GHS Icons einfügen
    document.getElementById('pGhs').innerHTML = selectedGhs.map(cb => `
        <div class="ghs-preview-icon">${GHS_SVGS[cb.value]}</div>
    `).join('');

    // Text automatisch verkleinern, wenn er zu lang wird
    const textEl = document.getElementById('pText');
    let size = 2.5;
    textEl.style.fontSize = size + "rem";
    while (textEl.scrollHeight > textEl.offsetHeight && size > 1) {
        size -= 0.1;
        textEl.style.fontSize = size + "rem";
    }
}

// PDF Generierung
document.getElementById('pdfBtn').onclick = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    // Avery Zweckform L4776REV Konfiguration
    const config = {
        w: 99.1, h: 42.3, mt: 21.6, ml: 6.4,
        sub: document.getElementById('subClass').value,
        txt: document.getElementById('mainText').value || "TEXT",
        sig: document.getElementById('signal').value,
        arr: document.getElementById('arrowDir').value,
        ghs: Array.from(document.querySelectorAll('.ghs-check:checked')).slice(0, 3)
    };

    const colors = { 
        white: [255,255,255], yellow: [255,255,0], red: [255,0,0], 
        brown: [139,69,19], green: [0,128,0], blue: [0,0,255], violet: [128,0,128] 
    };

    // 12 Etiketten pro Blatt generieren (2 Spalten, 6 Zeilen)
    for (let i = 0; i < 12; i++) {
        const x = config.ml + (i % 2 * config.w);
        const y = config.mt + (Math.floor(i / 2) * config.h);

        // Hintergrundfarbe
        doc.setFillColor(...colors[config.sub]);
        doc.rect(x, y, config.w, config.h, 'F');
        
        // Rahmen leicht grau zeichnen (hilft beim Schneiden falls nötig)
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, config.w, config.h, 'S');

        // Bestimme Textfarbe (Schwarz bei Gelb/Weiß, sonst Weiß)
        const isDark = !['white', 'yellow'].includes(config.sub);
        doc.setTextColor(isDark ? 255 : 0);

        // Haupttext drucken
        doc.setFontSize(26);
        doc.setFont("helvetica", "bold");
        doc.text(config.txt.toUpperCase(), x + config.w/2, y + 18, { align: 'center', maxWidth: config.w - 10 });

        // GHS Symbole drucken (Wir zeichnen die Rauten mit Text für 100% Drucksicherheit)
        doc.setDrawColor(255, 0, 0); // Roter Rand
        doc.setLineWidth(0.8);
        config.ghs.forEach((g, idx) => {
            const gx = x + 10 + (idx * 13);
            const gy = y + 33;
            doc.setFillColor(255, 255, 255);
            // Raute zeichnen
            doc.line(gx, gy-5, gx+5, gy);
            doc.line(gx+5, gy, gx, gy+5);
            doc.line(gx, gy+5, gx-5, gy);
            doc.line(gx-5, gy, gx, gy-5);
            // Text GHS01 etc. ins Innere
            doc.setFontSize(5);
            doc.setTextColor(0);
            doc.text(g.value.toUpperCase(), gx, gy + 1.5, { align: 'center' });
        });

        // Signalwort drucken (Mittig)
        doc.setTextColor(isDark ? 255 : 0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bolditalic");
        doc.text(config.sig, x + config.w/2 + 5, y + 35, { align: 'center' });

        // Pfeil Vektor zeichnen (Rechts)
        doc.setLineWidth(2);
        doc.setDrawColor(isDark ? 255 : 0);
        const ax = x + config.w - 12; 
        const ay = y + 33;
        
        if(config.arr === 'right') { 
            doc.line(ax-5, ay, ax+5, ay); 
            doc.line(ax+5, ay, ax+2, ay-3); 
            doc.line(ax+5, ay, ax+2, ay+3); 
        }
        else if(config.arr === 'left') { 
            doc.line(ax+5, ay, ax-5, ay); 
            doc.line(ax-5, ay, ax-2, ay-3); 
            doc.line(ax-5, ay, ax-2, ay+3); 
        }
        else if(config.arr === 'up') { 
            doc.line(ax, ay+5, ax, ay-5); 
            doc.line(ax, ay-5, ax-3, ay-2); 
            doc.line(ax, ay-5, ax+3, ay-2); 
        }
        else { 
            doc.line(ax, ay-5, ax, ay+5); 
            doc.line(ax, ay+5, ax-3, ay+2); 
            doc.line(ax, ay+5, ax+3, ay+2); 
        }
    }
    
    doc.save("AP_Schilder_Druck.pdf");
};

// Event Listener an alle Eingabefelder binden
document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
});

// Initiale Vorschau laden
updatePreview();
