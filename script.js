const { jsPDF } = window.jspdf;

// Alle 9 GHS Symbole als Vektor-Pfade (damit sie sofort ohne Ladefehler funktionieren)
const GHS_ICONS = {
    "01": '<path d="M50 25 A 15 15 0 1 1 50 25.1 Z M40 10 L60 10 M50 10 L50 20" stroke="black" stroke-width="3" fill="none"/><circle cx="50" cy="65" r="15" fill="black"/><path d="M20 40 L35 55 M80 40 L65 55" stroke="black" stroke-width="4"/>', // Bombe (vereinfacht)
    "02": '<path d="M50 20 C 30 40 25 60 25 75 C 25 90 40 95 50 95 C 60 95 75 90 75 75 C 75 60 70 40 50 20 Z" fill="black"/><path d="M50 45 C 40 60 38 75 50 85 C 62 75 60 60 50 45 Z" fill="white"/>', // Flamme
    "03": '<circle cx="50" cy="70" r="15" fill="none" stroke="black" stroke-width="6"/><path d="M50 20 C 35 40 30 50 30 70 M50 20 C 65 40 70 50 70 70 M50 20 L50 55" stroke="black" stroke-width="4" fill="none"/>', // Rundflamme
    "04": '<rect x="35" y="25" width="30" height="60" rx="15" fill="black"/><rect x="42" y="15" width="16" height="15" fill="black"/>', // Gasflasche
    "05": '<rect x="25" y="70" width="20" height="10" fill="black"/><rect x="55" y="70" width="20" height="10" fill="black"/><path d="M35 30 L35 60 M65 30 L65 60" stroke="black" stroke-width="6"/>', // Ätzend
    "06": '<circle cx="50" cy="45" r="18" fill="black"/><path d="M25 75 L75 95 M75 75 L25 95" stroke="black" stroke-width="8"/>', // Totenkopf
    "07": '<rect x="42" y="20" width="16" height="40" fill="black"/><circle cx="50" cy="75" r="9" fill="black"/>', // Ausrufezeichen
    "08": '<path d="M50 15 L35 40 L40 85 L60 85 L65 40 Z" fill="black"/><path d="M50 35 L40 50 L60 50 Z" fill="white"/>', // Gesundheitsgefahr
    "09": '<path d="M20 75 Q 50 40 80 75" fill="none" stroke="black" stroke-width="6"/><circle cx="70" cy="40" r="10" fill="black"/><rect x="30" y="50" width="15" height="25" fill="black"/>' // Umwelt
};

// UI GHS Picker aufbauen (1 bis 9)
const ghsPicker = document.getElementById('ghsPicker');
for (let i = 1; i <= 9; i++) {
    const id = `0${i}`;
    const label = document.createElement('label');
    label.className = "flex flex-col items-center cursor-pointer p-1 border-2 rounded hover:border-gray-400 transition bg-white";
    label.innerHTML = `
        <div class="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 100 100" class="w-full h-full">${GHS_ICONS[id]}</svg>
        </div>
        <input type="checkbox" value="${id}" class="ghs-check mt-1">
        <span class="text-[10px] font-bold mt-1 text-gray-700">GHS0${i}</span>
    `;
    ghsPicker.appendChild(label);
}

// Pfeil-Pfade für die HTML Vorschau
const PREVIEW_ARROWS = {
    right: '<path d="M10,40 h50 v-20 l40,30 l-40,30 v-20 h-50 z"/>',
    left:  '<path d="M90,40 h-50 v-20 l-40,30 l40,30 v-20 h50 z"/>',
    up:    '<path d="M40,90 v-50 h-20 l30,-40 l30,40 h-20 v50 z"/>',
    down:  '<path d="M40,10 v50 h-20 l30,40 l30,-40 h-20 v-50 z"/>'
};

// Update-Funktion: Reagiert auf JEDE Eingabe
function updatePreview() {
    const subClass = document.getElementById('subClass').value;
    const text = document.getElementById('mainText').value || "TEXT";
    const signal = document.getElementById('signal').value;
    const arrow = document.getElementById('arrowDir').value;
    
    // Checkboxen auslesen (Maximal 3)
    const selectedGhs = Array.from(document.querySelectorAll('.ghs-check:checked')).slice(0, 3);

    // Farbe und Text
    const card = document.getElementById('previewCard');
    card.className = `label-box bg-${subClass}`;
    document.getElementById('pText').innerText = text;
    document.getElementById('pSignal').innerText = signal;

    // Pfeil in der Vorschau setzen
    document.getElementById('previewArrowSvg').innerHTML = PREVIEW_ARROWS[arrow];

    // GHS Icons in die Vorschau setzen
    const ghsZone = document.getElementById('pGhs');
    ghsZone.innerHTML = selectedGhs.map(cb => `
        <div class="ghs-diamond">
            <svg viewBox="0 0 100 100" class="ghs-inner-svg">${GHS_ICONS[cb.value]}</svg>
        </div>
    `).join('');

    // Textgröße automatisch anpassen
    const textEl = document.getElementById('pText');
    let size = 2.5;
    textEl.style.fontSize = size + "rem";
    // Reduziere Größe, falls der Text umbricht und zu groß wird
    while (textEl.scrollHeight > textEl.offsetHeight && size > 1) {
        size -= 0.1;
        textEl.style.fontSize = size + "rem";
    }
}

// Listener an ALLE Felder hängen
document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
});

// PDF Generierung
document.getElementById('pdfBtn').addEventListener('click', async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    // Avery L4776 Maße
    const w = 99.1;
    const h = 42.3;
    const mt = 21.6; // Margin Top
    const ml = 6.4;  // Margin Left
    
    const subClass = document.getElementById('subClass').value;
    const text = document.getElementById('mainText').value || "TEXT";
    const signal = document.getElementById('signal').value;
    const arrow = document.getElementById('arrowDir').value;
    const selectedGhs = Array.from(document.querySelectorAll('.ghs-check:checked')).slice(0, 3).map(cb => cb.value);

    // RGB Farbwerte
    const colors = { 
        white: [255,255,255], yellow: [255,255,0], red: [255,0,0], 
        brown: [139,69,19], green: [0,128,0], blue: [0,0,255], violet: [128,0,128] 
    };

    const isDark = !['white', 'yellow'].includes(subClass);

    // Hilfsfunktion: Wandelt SVG in ein ladbares Bild um (für den Druck)
    const renderGhsToPdf = (doc, ghsId, x, y, size) => {
        return new Promise(resolve => {
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/>${GHS_ICONS[ghsId]}</svg>`;
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 100; canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, size, size);
                resolve();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
        });
    };

    // 12 Etiketten zeichnen
    for (let i = 0; i < 12; i++) {
        const x = ml + (i % 2 * w);
        const y = mt + (Math.floor(i / 2) * h);

        // 1. Hintergrund
        doc.setFillColor(...colors[subClass]);
        doc.rect(x, y, w, h, 'F');
        
        // 2. Textfarbe setzen
        doc.setTextColor(isDark ? 255 : 0);

        // 3. Haupttext
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(text.toUpperCase(), x + w/2, y + 18, { align: 'center', maxWidth: w - 10 });

        // 4. Signalwort
        doc.setFontSize(14);
        doc.setFont("helvetica", "bolditalic");
        doc.text(signal, x + w/2 + 5, y + 35, { align: 'center' });

        // 5. GHS Rauten zeichnen (Roter Rand, weiße Füllung)
        doc.setDrawColor(219, 20, 20); // Rot
        doc.setLineWidth(1);
        for(let idx = 0; idx < selectedGhs.length; idx++) {
            const gx = x + 10 + (idx * 14);
            const gy = y + 33;
            doc.setFillColor(255, 255, 255);
            // Raute als Polygon
            doc.lines([[5, -5], [5, 5], [-5, 5], [-5, -5]], gx - 5, gy, [1, 1], 'FD');
            
            // Icon asynchron in die Raute laden
            await renderGhsToPdf(doc, selectedGhs[idx], gx - 3.5, gy - 3.5, 7);
        }

        // 6. SPITZER PFEIL (Schaft + Dreieck)
        doc.setFillColor(isDark ? 255 : 0);
        const ax = x + w - 15; 
        const ay = y + 33;
        
        if(arrow === 'right') { 
            doc.rect(ax - 5, ay - 1.5, 8, 3, 'F'); // Schaft
            doc.triangle(ax + 3, ay - 4, ax + 3, ay + 4, ax + 7, ay, 'F'); // Spitze
        } else if(arrow === 'left') { 
            doc.rect(ax - 3, ay - 1.5, 8, 3, 'F'); 
            doc.triangle(ax - 3, ay - 4, ax - 3, ay + 4, ax - 7, ay, 'F'); 
        } else if(arrow === 'up') { 
            doc.rect(ax - 1.5, ay - 2, 3, 8, 'F'); 
            doc.triangle(ax - 4, ay - 2, ax + 4, ay - 2, ax, ay - 7, 'F'); 
        } else { 
            doc.rect(ax - 1.5, ay - 6, 3, 8, 'F'); 
            doc.triangle(ax - 4, ay + 2, ax + 4, ay + 2, ax, ay + 7, 'F'); 
        }
    }
    
    doc.save("Etiketten_Druckbogen.pdf");
});

// Vorschau direkt beim ersten Laden aufrufen
updatePreview();
