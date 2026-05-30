let chart = null;

// Pequeño generador de sonidos (sin archivos externos)
function playBeep(freq = 600, duration = 180, volume = 0.15) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = volume;

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
        osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
        // Si el navegador no soporta AudioContext, simplemente no suena
    }
}

function calcular() {
    const n = parseFloat(document.getElementById("n").value);
    const media = parseFloat(document.getElementById("media").value);
    const desv = parseFloat(document.getElementById("desviacion").value);
    const tipo = document.getElementById("tipo").value;
    const conf = parseInt(document.getElementById("confianza").value);

    if (!n || !media || !desv) {
        alert("Por favor llena todos los campos con valores válidos.");
        playBeep(200, 200, 0.2); // sonido de error suave
        return;
    }

    // Elegir z o t
    let usarZ = (tipo === "poblacional" || n >= 30);
    let valorCritico;

    if (usarZ) {
        if (conf === 90) valorCritico = 1.645;
        if (conf === 95) valorCritico = 1.96;
        if (conf === 99) valorCritico = 2.576;
    } else {
        if (conf === 90) valorCritico = 1.70;
        if (conf === 95) valorCritico = 2.045;
        if (conf === 99) valorCritico = 2.75;
    }

    const errorEstandar = desv / Math.sqrt(n);
    const margen = valorCritico * errorEstandar;

    const limInf = media - margen;
    const limSup = media + margen;

    const res = document.getElementById("resultado");
    res.innerHTML = `
        <h3>Resultados</h3>
        <p><b>Distribución usada:</b> ${usarZ ? "Normal (z)" : "t-Student (t)"}</p>
        <p><b>Valor crítico:</b> ${valorCritico.toFixed(4)}</p>
        <p><b>Error estándar:</b> ${errorEstandar.toFixed(4)}</p>
        <p><b>Margen de error:</b> ${margen.toFixed(4)}</p>
        <p><b>Intervalo de confianza:</b> (${limInf.toFixed(4)}, ${limSup.toFixed(4)})</p>
    `;

    generarGrafica(media, limInf, limSup, conf);

    // Sonido de “éxito”
    playBeep(880, 120, 0.18);
    setTimeout(() => playBeep(1320, 120, 0.16), 120);
}

function generarGrafica(media, limInf, limSup, conf) {
    const ctx = document.getElementById("grafica").getContext("2d");

    if (chart) chart.destroy();

    const labels = [];
    const curva = [];
    const relleno = [];

    const minX = media - 4;
    const maxX = media + 4;

    for (let x = minX; x <= maxX; x += 0.1) {
        labels.push(x.toFixed(2));
        const y = Math.exp(-0.5 * Math.pow((x - media), 2));
        curva.push(y);

        if (x >= limInf && x <= limSup) {
            relleno.push(y);
        } else {
            relleno.push(null);
        }
    }

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Curva Normal",
                    data: curva,
                    borderColor: "#00eaff",
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.35
                },
                {
                    label: `IC ${conf}%`,
                    data: relleno,
                    borderColor: "#00ff66",
                    backgroundColor: "rgba(0,255,102,0.35)",
                    borderWidth: 0,
                    pointRadius: 0,
                    tension: 0.35,
                    fill: true
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: "#00eaff" }
                },
                title: {
                    display: true,
                    text: `Intervalo de Confianza ${conf}%`,
                    color: "#00eaff",
                    font: { size: 16 }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#00eaff" },
                    grid: { color: "rgba(0, 234, 255, 0.2)" }
                },
                y: {
                    display: false
                }
            }
        }
    });
}

function limpiar() {
    document.getElementById("n").value = "";
    document.getElementById("media").value = "";
    document.getElementById("desviacion").value = "";
    document.getElementById("resultado").innerHTML = "";

    if (chart) {
        chart.destroy();
        chart = null;
    }

    // Sonido de “reset”
    playBeep(400, 120, 0.15);
}
