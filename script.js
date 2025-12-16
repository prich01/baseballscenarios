const players = document.querySelectorAll('.player');
const fieldContainer = document.getElementById('field-container');
const excelUpload = document.getElementById('excel-upload');
const notes = document.getElementById('coaching-notes');

const initialPositions = {
    'p': { x: 300, y: 350 }, 'c': { x: 300, y: 530 },
    '1b': { x: 470, y: 330 }, '2b': { x: 380, y: 220 },
    '3b': { x: 130, y: 330 }, 'ss': { x: 220, y: 220 },
    'lf': { x: 100, y: 150 }, 'cf': { x: 300, y: 80 }, 'rf': { x: 500, y: 150 }
};

const baseCoords = { "1st": { x: 455, y: 350 }, "2nd": { x: 300, y: 195 }, "3rd": { x: 145, y: 350 } };

let scenarios = [{ inning: "1st", score: "0-0", outs: "0", runners: "None", bip: "Ready" }];
let activePlayer = null;
let offset = { x: 0, y: 0 };

function setPlayerPosition(player, x, y) {
    player.style.left = (x - (player.offsetWidth || 34) / 2) + 'px';
    player.style.top = (y - (player.offsetHeight || 34) / 2) + 'px';
}

function resetPositions() {
    for (const id in initialPositions) {
        setPlayerPosition(document.getElementById(id), initialPositions[id].x, initialPositions[id].y);
    }
    const reservoir = document.querySelector('.runner-storage');
    document.querySelectorAll('.runner').forEach(r => {
        r.style.position = 'static';
        reservoir.appendChild(r);
    });
}

function displayScenario(s) {
    document.getElementById('disp-inning').innerText = s.inning;
    document.getElementById('disp-score').innerText = s.score;
    document.getElementById('disp-outs').innerText = s.outs;
    document.getElementById('disp-runners').innerText = s.runners;
    document.getElementById('disp-bip').innerText = s.bip;
    autoPositionRunners(s.runners.toString());
}

function autoPositionRunners(text) {
    const runners = Array.from(document.querySelectorAll('.runner'));
    const reservoir = document.querySelector('.runner-storage');
    runners.forEach(r => { r.style.position = 'static'; reservoir.appendChild(r); });

    let idx = 0;
    const place = (base) => {
        if (idx < runners.length) {
            const r = runners[idx++];
            r.style.position = 'absolute';
            fieldContainer.appendChild(r);
            setPlayerPosition(r, baseCoords[base].x, baseCoords[base].y);
        }
    };

    const low = text.toLowerCase();
    if (low.includes("bases loaded")) { ['1st','2nd','3rd'].forEach(place); }
    else {
        if (low.includes("1st")) place("1st");
        if (low.includes("2nd")) place("2nd");
        if (low.includes("3rd")) place("3rd");
    }
}

function handleFileUpload(e) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const workbook = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});
        scenarios = data.slice(1).map(r => ({ inning: r[0], score: r[1], outs: r[2], runners: r[3], bip: r[4] }));
        alert("Scenarios Loaded!");
    };
    reader.readAsArrayBuffer(e.target.files[0]);
}

async function saveFieldAsImage() {
    const captureArea = document.createElement('div');
    captureArea.style.cssText = "padding:20px; background:#f0f0f0; width:640px;";
    
    const notesClone = document.createElement('div');
    notesClone.style.cssText = "margin:15px 0; padding:10px; background:#fff; border-left:5px solid #1976D2; font-style:italic;";
    notesClone.innerText = notes.value || "No coaching notes.";

    captureArea.append(document.getElementById('game-info').cloneNode(true), notesClone, fieldContainer.cloneNode(true));
    document.body.appendChild(captureArea);
    const canvas = await html2canvas(captureArea);
    const link = document.createElement('a');
    link.download = `play-card-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    document.body.removeChild(captureArea);
}

// Initialization & Drag Logic
function init() {
    setTimeout(resetPositions, 50);
    players.forEach(p => {
        p.addEventListener('mousedown', startDrag);
        p.addEventListener('touchstart', startDrag, {passive:false});
    });
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', drag, {passive:false});
    document.addEventListener('touchend', endDrag);

    document.getElementById('new-scenario-btn').addEventListener('click', () => {
        notes.value = "";
        displayScenario(scenarios[Math.floor(Math.random() * scenarios.length)]);
    });
    document.getElementById('reset-btn').addEventListener('click', resetPositions);
    document.getElementById('save-btn').addEventListener('click', saveFieldAsImage);
    document.getElementById('clear-notes-btn').addEventListener('click', () => notes.value = "");
    excelUpload.addEventListener('change', handleFileUpload);
}

function startDrag(e) {
    activePlayer = e.target;
    if (activePlayer.classList.contains('runner') && activePlayer.style.position !== 'absolute') {
        activePlayer.style.position = 'absolute';
        fieldContainer.appendChild(activePlayer);
    }
    const p = (e.touches ? e.touches[0] : e);
    const r = activePlayer.getBoundingClientRect();
    offset = { x: p.clientX - (r.left + r.width/2), y: p.clientY - (r.top + r.height/2) };
    activePlayer.style.zIndex = 100;
}

function drag(e) {
    if (!activePlayer) return;
    e.preventDefault();
    const p = (e.touches ? e.touches[0] : e);
    const r = fieldContainer.getBoundingClientRect();
    let x = Math.max(0, Math.min(p.clientX - r.left - offset.x, r.width));
    let y = Math.max(0, Math.min(p.clientY - r.top - offset.y, r.height));
    setPlayerPosition(activePlayer, x, y);
}

function endDrag() { if(activePlayer) { activePlayer.style.zIndex = 20; activePlayer = null; } }

init();