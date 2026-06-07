// ---------- Общие утилиты ----------
function formatResistance(ohms) {
    if (ohms >= 1e6) return (ohms / 1e6).toFixed(3) + ' МОм';
    if (ohms >= 1e3) return (ohms / 1e3).toFixed(3) + ' кОм';
    if (ohms < 1 && ohms > 0) return (ohms * 1000).toFixed(2) + ' мОм';
    return ohms.toFixed(2) + ' Ом';
}

function formatInductance(uh) {
    if (uh >= 1e6) return (uh / 1e6).toFixed(3) + ' Гн';
    if (uh >= 1e3) return (uh / 1e3).toFixed(3) + ' мГн';
    return uh.toFixed(2) + ' мкГн';
}

function formatFrequency(hz) {
    if (hz >= 1e9) return (hz / 1e9).toFixed(4) + ' ГГц';
    if (hz >= 1e6) return (hz / 1e6).toFixed(4) + ' МГц';
    if (hz >= 1e3) return (hz / 1e3).toFixed(2) + ' кГц';
    return hz.toFixed(2) + ' Гц';
}

// ---------- Маркировка резисторов (4,5,6 полос) ----------
function generateBandSelects(bandsCount) {
    const container = document.getElementById('bandsContainer');
    if (!container) return;
    let html = '';
    // Первые полосы (цифры)
    const digitCount = bandsCount === 4 ? 2 : 3; // для 4 полос – 2 цифры, для 5/6 – 3 цифры
    for (let i = 1; i <= digitCount; i++) {
        html += `<div class="calc-row"><label>Полоса ${i} (${i}-я цифра):</label>
        <select id="band${i}" class="resistor-band">
            <option value="0">Чёрный (0)</option><option value="1">Коричневый (1)</option>
            <option value="2">Красный (2)</option><option value="3">Оранжевый (3)</option>
            <option value="4">Жёлтый (4)</option><option value="5">Зелёный (5)</option>
            <option value="6">Синий (6)</option><option value="7">Фиолетовый (7)</option>
            <option value="8">Серый (8)</option><option value="9">Белый (9)</option>
        </select></div>`;
    }
    // Множитель
    html += `<div class="calc-row"><label>Полоса ${digitCount+1} (множитель):</label>
    <select id="multiplierBand" class="resistor-band">
        <option value="0">Чёрный (×1)</option><option value="1">Коричневый (×10)</option>
        <option value="2">Красный (×100)</option><option value="3">Оранжевый (×1k)</option>
        <option value="4">Жёлтый (×10k)</option><option value="5">Зелёный (×100k)</option>
        <option value="6" selected>Синий (×1M)</option><option value="7">Фиолетовый (×10M)</option>
        <option value="8">Серый (×100M)</option><option value="9">Белый (×1G)</option>
        <option value="-1">Золотой (×0.1)</option><option value="-2">Серебряный (×0.01)</option>
    </select></div>`;
    // Допуск
    html += `<div class="calc-row"><label>Полоса ${digitCount+2} (допуск):</label>
    <select id="toleranceBand" class="resistor-band">
        <option value="1">Коричневый ±1%</option><option value="2">Красный ±2%</option>
        <option value="0.5">Зелёный ±0.5%</option><option value="0.25">Синий ±0.25%</option>
        <option value="0.1">Фиолетовый ±0.1%</option><option value="0.05">Серый ±0.05%</option>
        <option value="5" selected>Золотой ±5%</option><option value="10">Серебряный ±10%</option>
    </select></div>`;
    if (bandsCount === 6) {
        html += `<div class="calc-row"><label>Полоса 6 (ТКС, ppm/°C):</label>
        <select id="tcsBand">
            <option value="100">Коричневый (100)</option><option value="50">Красный (50)</option>
            <option value="15">Оранжевый (15)</option><option value="25">Жёлтый (25)</option>
            <option value="20">Синий (20)</option><option value="10">Фиолетовый (10)</option>
        </select></div>`;
    }
    container.innerHTML = html;
    attachResistorEvents();
    calculateResistorMarking();
}

function attachResistorEvents() {
    const bands = document.querySelectorAll('.resistor-band');
    bands.forEach(band => band.addEventListener('change', calculateResistorMarking));
    const tcsBand = document.getElementById('tcsBand');
    if (tcsBand) tcsBand.addEventListener('change', calculateResistorMarking);
}

function calculateResistorMarking() {
    const bandsCount = parseInt(document.getElementById('bandsCount')?.value || '5');
    const digitCount = bandsCount === 4 ? 2 : 3;
    let digits = [];
    for (let i = 1; i <= digitCount; i++) {
        const val = parseInt(document.getElementById(`band${i}`)?.value);
        if (isNaN(val)) return;
        digits.push(val);
    }
    const multiplierRaw = parseInt(document.getElementById('multiplierBand')?.value);
    const tolerance = parseFloat(document.getElementById('toleranceBand')?.value);
    let multiplier = 1;
    if (multiplierRaw >= 0) multiplier = Math.pow(10, multiplierRaw);
    else if (multiplierRaw === -1) multiplier = 0.1;
    else if (multiplierRaw === -2) multiplier = 0.01;
    let significant = 0;
    for (let d of digits) significant = significant * 10 + d;
    let resistance = significant * multiplier;
    let tcsText = '';
    if (bandsCount === 6) {
        const tcsVal = document.getElementById('tcsBand')?.value;
        if (tcsVal) tcsText = `<br>ТКС: ${tcsVal} ppm/°C`;
    }
    document.getElementById('markingResult').innerHTML = `Сопротивление: ${formatResistance(resistance)}<br>Допуск: ±${tolerance}%${tcsText}`;
}

// ---------- Общее сопротивление (без изменений) ----------
function calculateTotalResistance() {
    const rValues = [];
    for (let i = 1; i <= 5; i++) {
        const val = parseFloat(document.getElementById(`r${i}`)?.value);
        if (!isNaN(val) && val !== 0) rValues.push(val);
    }
    if (rValues.length === 0) {
        document.getElementById('totalResult').innerHTML = 'Общее сопротивление: не указано ни одного резистора';
        return;
    }
    const type = document.getElementById('connectionType').value;
    let total = 0;
    if (type === 'series') {
        total = rValues.reduce((sum, r) => sum + r, 0);
    } else {
        let invSum = 0;
        for (let r of rValues) invSum += 1 / r;
        total = invSum === 0 ? 0 : 1 / invSum;
    }
    document.getElementById('totalResult').innerHTML = `Общее сопротивление: ${formatResistance(total)}`;
}

// ---------- LC-калькулятор ----------
function calculateLCFrequency() {
    let l = parseFloat(document.getElementById('lValue')?.value);
    let lUnit = parseFloat(document.getElementById('lUnit')?.value);
    let c = parseFloat(document.getElementById('cValue')?.value);
    let cUnit = parseFloat(document.getElementById('cUnit')?.value);
    if (isNaN(l) || isNaN(c) || l <= 0 || c <= 0) {
        document.getElementById('lcResult').innerHTML = 'Частота: введите положительные значения L и C';
        return;
    }
    let lHenry = l * lUnit;
    let cFarad = c * cUnit;
    let freq = 1 / (2 * Math.PI * Math.sqrt(lHenry * cFarad));
    document.getElementById('lcResult').innerHTML = `Частота: ${formatFrequency(freq)}`;
}

// ---------- Маркировка дросселей (индуктивность в мкГн) ----------
function generateInductorBands(bandsCount) {
    const container = document.getElementById('inductorBandsContainer');
    if (!container) return;
    let html = '';
    const digitCount = bandsCount === 4 ? 2 : 3;
    for (let i = 1; i <= digitCount; i++) {
        html += `<div class="calc-row"><label>Полоса ${i} (${i}-я цифра):</label>
        <select id="indBand${i}" class="inductor-band">
            <option value="0">Чёрный (0)</option><option value="1">Коричневый (1)</option>
            <option value="2">Красный (2)</option><option value="3">Оранжевый (3)</option>
            <option value="4">Жёлтый (4)</option><option value="5">Зелёный (5)</option>
            <option value="6">Синий (6)</option><option value="7">Фиолетовый (7)</option>
            <option value="8">Серый (8)</option><option value="9">Белый (9)</option>
        </select></div>`;
    }
    html += `<div class="calc-row"><label>Полоса ${digitCount+1} (множитель, мкГн):</label>
    <select id="indMultiplierBand" class="inductor-band">
        <option value="0">Чёрный (×1)</option><option value="1">Коричневый (×10)</option>
        <option value="2">Красный (×100)</option><option value="3">Оранжевый (×1000)</option>
        <option value="4">Жёлтый (×10000)</option>
        <option value="-1">Золотой (×0.1)</option><option value="-2">Серебряный (×0.01)</option>
    </select></div>`;
    html += `<div class="calc-row"><label>Полоса ${digitCount+2} (допуск):</label>
    <select id="indToleranceBand" class="inductor-band">
        <option value="1">Коричневый ±1%</option><option value="2">Красный ±2%</option>
        <option value="0.5">Зелёный ±0.5%</option><option value="0.25">Синий ±0.25%</option>
        <option value="0.1">Фиолетовый ±0.1%</option><option value="0.05">Серый ±0.05%</option>
        <option value="5" selected>Золотой ±5%</option><option value="10">Серебряный ±10%</option>
        <option value="20">Чёрный ±20%</option>
    </select></div>`;
    container.innerHTML = html;
    attachInductorEvents();
    calculateInductorMarking();
}

function attachInductorEvents() {
    const bands = document.querySelectorAll('.inductor-band');
    bands.forEach(band => band.addEventListener('change', calculateInductorMarking));
}

function calculateInductorMarking() {
    const bandsCount = parseInt(document.getElementById('inductorBandsCount')?.value || '5');
    const digitCount = bandsCount === 4 ? 2 : 3;
    let digits = [];
    for (let i = 1; i <= digitCount; i++) {
        const val = parseInt(document.getElementById(`indBand${i}`)?.value);
        if (isNaN(val)) return;
        digits.push(val);
    }
    let multiplierRaw = parseInt(document.getElementById('indMultiplierBand')?.value);
    let multiplier = 1;
    if (multiplierRaw >= 0) multiplier = Math.pow(10, multiplierRaw);
    else if (multiplierRaw === -1) multiplier = 0.1;
    else if (multiplierRaw === -2) multiplier = 0.01;
    let significant = 0;
    for (let d of digits) significant = significant * 10 + d;
    let inductanceUh = significant * multiplier;
    let tolerance = parseFloat(document.getElementById('indToleranceBand')?.value) || 20;
    document.getElementById('inductorMarkingResult').innerHTML = `Индуктивность: ${formatInductance(inductanceUh)}<br>Допуск: ±${tolerance}%`;
}

// ---------- Инициализация при загрузке ----------
document.addEventListener('DOMContentLoaded', function() {
    // Резисторы
    const bandsCountSelect = document.getElementById('bandsCount');
    if (bandsCountSelect) {
        generateBandSelects(parseInt(bandsCountSelect.value));
        bandsCountSelect.addEventListener('change', function() {
            generateBandSelects(parseInt(this.value));
        });
    }
    const calcTotalBtn = document.getElementById('calcTotalBtn');
    if (calcTotalBtn) calcTotalBtn.addEventListener('click', calculateTotalResistance);
    
    // LC-калькулятор
    const calcLcBtn = document.getElementById('calcLcBtn');
    if (calcLcBtn) {
        calcLcBtn.addEventListener('click', calculateLCFrequency);
        // авто-расчёт при изменении полей тоже
        document.getElementById('lValue')?.addEventListener('input', calculateLCFrequency);
        document.getElementById('lUnit')?.addEventListener('change', calculateLCFrequency);
        document.getElementById('cValue')?.addEventListener('input', calculateLCFrequency);
        document.getElementById('cUnit')?.addEventListener('change', calculateLCFrequency);
        calculateLCFrequency(); // первоначальный расчёт
    }
    
    // Дроссели
    const inductorBandsCount = document.getElementById('inductorBandsCount');
    if (inductorBandsCount) {
        generateInductorBands(parseInt(inductorBandsCount.value));
        inductorBandsCount.addEventListener('change', function() {
            generateInductorBands(parseInt(this.value));
        });
    }
});