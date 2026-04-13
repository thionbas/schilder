const { jsPDF } = window.jspdf;

// GHS UI Generator
const ghsPicker = document.getElementById('ghsPicker');
for (let i = 1; i <= 9; i++) {
    const id = i.toString().padStart(3, '0'); 
    const fileName = `ghs_${id}.png`; 
    
    const div = document.createElement('div');
    div.className = "flex flex-col items-center p-2 border-2 rounded bg-white hover:border-[#064e3b] transition cursor-pointer";
    div.innerHTML = `
        <img src="${fileName}" class="w-10 h-10 object-contain mb-1" onerror="this.style.opacity='0.3';">
        <div class="flex items-center gap-1">
            <input type="checkbox" value="${id}" class="ghs-check cursor-pointer">
            <span class="text-[9px] font-bold">GHS ${i}</span>
        </div>
    `;
    
    div.onclick = (e) => {
        if(e.target.tagName !== 'INPUT') {
            const cb = div.querySelector('input');
            const selected = document.querySelectorAll('.ghs-check:checked');
            if(!cb.checked && selected.length >= 5) {
                alert("Maximal 5 Symbole erlaubt.");
                return;
            }
            cb.checked = !cb.checked;
            updatePreview();
        }
    };
    ghsPicker.appendChild(div);
}

const ARROWS = {
    none: '',
    right: '<path d="M10,40 h50 v-20 l40,30 l-40,30 v-20 h-50 z"/>',
    left:  '<path d="M90,40 h-50 v-20 l-40,30 l40,30 v-20 h50 z"/>',
    up:    '<path d="M40,90 v-50 h-20 l30,-40 l30,40 h-20 v50 z"/>',
    down:  '<path d="M40,10 v50 h-20 l30,40 l30,-40 h-20 v-50 z"/>'
};

function updatePreview() {
    const subClass = document.getElementById('subClass').value;
    let text = document.getElementById('mainText').value || "TEXT";
    const textCase = document.getElementById('textCase').value;
    const signal = document.getElementById('signal').value;
    const arrow = document.getElementById('arrowDir').value;
    const fontSize = document.getElementById('textSize').value;
    
    document.getElementById('fontSizeVal').innerText = fontSize;

    if(textCase === 'upper') text = text.toUpperCase();
    else if(textCase === 'lower') text = text.toLowerCase();

    const card = document.getElementById('previewCard');
    card.className = `label-box bg-${subClass}`;
    document.getElementById('pText').innerText = text;
    document.getElementById('pSignal').innerText = signal;
    document.getElementById('previewArrowSvg').innerHTML = ARROWS[arrow];

    const textEl = document.getElementById('pText');
    textEl.style.fontSize = (fontSize / 10) + "rem";

    const ghsZone = document.getElementById('pGhs');
    ghsZone.innerHTML = '';
    document.querySelectorAll('.ghs-check:checked').forEach(cb => {
        const img = document.createElement('img');
        img.src = `ghs_${cb.value}.png`;
        ghsZone.appendChild(img);
    });
}

document.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updatePreview));

document.getElementById('pdfBtn').onclick = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const subClass = document.getElementById('subClass').value;
    let text = document.getElementById('mainText').value || "TEXT";
    const textCase = document.getElementById('textCase').value;
    const signal = document.getElementById('signal').value;
    const arrow = document.getElementById('arrowDir').value;
    const fontSize = parseInt(document.getElementById('textSize').value);
    const selectedGhs = Array.from(document.querySelectorAll('.ghs-check:checked')).map(cb => cb.value);

    // NEU: Startposition und Anzahl lesen
    const startPos = parseInt(document.getElementById('startPos').value) || 1;
    const printCount = parseInt(document.getElementById('printCount').value) || 12;

    if(textCase === 'upper') text = text.toUpperCase();
    else if(textCase === 'lower') text = text.toLowerCase();

    const colors = { 
        white:[255,255,255], yellow:[255,255,0], red:[255,0,0], 
        brown:[139,69,19], green:[0,128,0], blue:[0,0,255], violet:[128,0,128] 
    };

    // Berechnung des Druckbereichs
    const startIdx = startPos - 1; // 0-basiert
    const endIdx = Math.min(startIdx + printCount, 12); // Nicht über 12 hinausgehen

    for (let i = startIdx; i < endIdx; i++) {
        const x = 6.4 + (i % 2 * 99.1);
        const y = 21.6 + (Math.floor(i / 2) * 42.3);

        doc.setFillColor(...colors[subClass]);
        doc.rect(x, y, 99.1, 42.3, 'F');
        
        const isDark = !['white', 'yellow'].includes(subClass);
        doc.setTextColor(isDark ? 255 : 0);

        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        doc.text(text, x + 49.5, y + 18, { align: 'center', maxWidth: 90 });

        doc.setFontSize(10);
        doc.setFont("helvetica", "bolditalic");
        doc.text(signal, x + 65, y + 36, { align: 'center' });

        for(let g = 0; g < selectedGhs.length; g++) {
            try {
                doc.addImage(`ghs_${selectedGhs[g]}.png`, 'PNG', x + 5 + (g * 10), y + 29, 9, 9);
            } catch(e) {}
        }

        if(arrow !== 'none') {
            doc.setFillColor(isDark ? 255 : 0);
            const ax = x + 85; const ay = y + 34;
            if(arrow === 'right') { doc.rect(ax-4, ay-1.5, 6, 3, 'F'); doc.triangle(ax+2, ay-4, ax+2, ay+4, ax+7, ay, 'F'); }
            else if(arrow === 'left') { doc.rect(ax-2, ay-1.5, 6, 3, 'F'); doc.triangle(ax-2, ay-4, ax-2, ay+4, ax-7, ay, 'F'); }
            else if(arrow === 'up') { doc.rect(ax-1.5, ay, 3, 6, 'F'); doc.triangle(ax-4, ay, ax+4, ay, ax, ay-5, 'F'); }
            else if(arrow === 'down') { doc.rect(ax-1.5, ay-6, 3, 6, 'F'); doc.triangle(ax-4, ay, ax+4, ay, ax, ay+5, 'F'); }
        }
    }
    doc.save("AP_Rohrleitungs_Schilder.pdf");
};

updatePreview();
