const { jsPDF } = window.jspdf;

const ghsList = ["GHS01", "GHS02", "GHS03", "GHS05", "GHS07"];
const ghsContainer = document.getElementById('ghsPicker');

ghsList.forEach(g => {
    const div = document.createElement('label');
    div.className = "flex flex-col items-center cursor-pointer p-1 border rounded hover:bg-white";
    div.innerHTML = `<span class="text-[10px] font-bold">${g}</span>
                     <input type="checkbox" value="${g}" class="ghs-check">`;
    ghsContainer.appendChild(div);
});

function update() {
    const sub = document.getElementById('subClass').value;
    const txt = document.getElementById('mainText').value || "TEXT";
    const sig = document.getElementById('signal').value;
    const arr = document.getElementById('arrowDir').value;
    const selectedGhs = Array.from(document.querySelectorAll('.ghs-check:checked')).slice(0, 3);

    const card = document.getElementById('previewInner');
    card.className = `preview-card c-${sub}`;
    
    document.getElementById('pText').innerText = txt;
    document.getElementById('pSignal').innerText = sig;
    
    const arrows = { right: '→', left: '←', up: '↑', down: '↓' };
    document.getElementById('pArrow').innerText = arrows[arr];

    document.getElementById('pGhs').innerHTML = selectedGhs.map(g => 
        `<div class="ghs-mini"><span>${g.value}</span></div>`
    ).join('');
}

function drawGHS(doc, x, y, label) {
    doc.setDrawColor(255, 0, 0);
    doc.setLineWidth(0.6);
    doc.setFillColor(255, 255, 255);
    // Raute zeichnen
    doc.line(x, y - 4, x + 4, y);
    doc.line(x + 4, y, x, y + 4);
    doc.line(x, y + 4, x - 4, y);
    doc.line(x - 4, y, x, y - 4);
    // Text klein hinein
    doc.setFontSize(5);
    doc.setTextColor(0);
    doc.text(label, x, y + 1.5, { align: 'center' });
}

document.getElementById('pdfBtn').onclick = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const config = {
        w: 99.1, h: 42.3, mt: 21.6, ml: 6.4,
        sub: document.getElementById('subClass').value,
        txt: document.getElementById('mainText').value,
        sig: document.getElementById('signal').value,
        arr: document.getElementById('arrowDir').value,
        ghs: Array.from(document.querySelectorAll('.ghs-check:checked')).slice(0,3).map(c => c.value)
    };

    const colors = { white:[255,255,255], yellow:[255,255,0], red:[255,0,0], brown:[139,69,19], green:[0,128,0], blue:[0,0,255], violet:[128,0,128] };

    for (let i = 0; i < 12; i++) {
        const x = config.ml + (i % 2 * config.w);
        const y = config.mt + (Math.floor(i / 2) * config.h);

        // Hintergrund
        doc.setFillColor(...colors[config.sub]);
        doc.rect(x, y, config.w, config.h, 'F');
        
        // Textfarbe
        const isDark = !['white', 'yellow'].includes(config.sub);
        doc.setTextColor(isDark ? 255 : 0);

        // Haupttext
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(config.txt, x + config.w/2, y + 18, { align: 'center', maxWidth: config.w - 10 });

        // GHS (Links)
        config.ghs.forEach((g, idx) => {
            drawGHS(doc, x + 10 + (idx * 11), y + 34, g);
        });

        // Signalwort (Mitte)
        doc.setFontSize(12);
        doc.setTextColor(isDark ? 255 : 0);
        doc.text(config.sig, x + config.w/2, y + 36, { align: 'center' });

        // Pfeil (Rechts)
        doc.setDrawColor(isDark ? 255 : 0);
        doc.setLineWidth(1.5);
        const ax = x + config.w - 12; const ay = y + 34;
        if(config.arr === 'right') { doc.line(ax-4, ay, ax+4, ay); doc.line(ax+4, ay, ax+1, ay-2); doc.line(ax+4, ay, ax+1, ay+2); }
        else if(config.arr === 'left') { doc.line(ax+4, ay, ax-4, ay); doc.line(ax-4, ay, ax-1, ay-2); doc.line(ax-4, ay, ax-1, ay+2); }
        else if(config.arr === 'up') { doc.line(ax, ay+4, ax, ay-4); doc.line(ax, ay-4, ax-2, ay-1); doc.line(ax, ay-4, ax+2, ay-1); }
        else { doc.line(ax, ay-4, ax, ay+4); doc.line(ax, ay+4, ax-2, ay+1); doc.line(ax, ay+4, ax+2, ay+1); }
    }
    doc.save("Etiketten.pdf");
};

document.querySelectorAll('input, select').forEach(el => el.oninput = update);
update();
