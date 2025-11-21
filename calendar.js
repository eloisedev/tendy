
let events = [];
let selectedDate = null;

async function loadEvents() {
    const res = await fetch("ice_times.json");
    events = await res.json();
    initializeUI();
}

function initializeUI() {
    const uniqueDates = [...new Set(events.map(e => e.date))].sort();
    const datesDiv = document.getElementById("dates");

    uniqueDates.forEach(date => {
        const el = document.createElement("div");
        el.className = "date-item";
        el.textContent = date;
        el.dataset.date = date;
        el.onclick = () => selectDate(date);
        datesDiv.appendChild(el);
    });

    const rinkSelect = document.getElementById("rinkFilter");
    const uniqueRinks = [...new Set(events.map(e => e.location))].sort();
    uniqueRinks.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        opt.textContent = r;
        rinkSelect.appendChild(opt);
    });

    document.getElementById("rinkFilter").onchange = renderEvents;
    document.getElementById("timeFilter").onchange = renderEvents;
}

function selectDate(date) {
    selectedDate = date;

    document.querySelectorAll(".date-item").forEach(i => {
        i.classList.toggle("selected", i.dataset.date === date);
    });

    renderEvents();
}

function renderEvents() {
    const eventsDiv = document.getElementById("events");
    eventsDiv.innerHTML = "";
    if (!selectedDate) return;

    let filtered = events.filter(e => e.date === selectedDate);

    const rinkVal = document.getElementById("rinkFilter").value;
    const timeVal = document.getElementById("timeFilter").value;

    if (rinkVal) {
        filtered = filtered.filter(e => e.location === rinkVal);
    }

    if (timeVal) {
        filtered = filtered.filter(e => {
            const startTime = parseTime(e.time.split("-")[0].trim());
            if (timeVal === "morning") return startTime < 12;
            if (timeVal === "afternoon") return startTime >= 12 && startTime < 17;
            if (timeVal === "evening") return startTime >= 17;
        });
    }

    filtered.forEach(e => {
        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
            <strong>${e.title}</strong><br>
            ${e.time}<br>
            ${e.location}<br>
            ${e.price}<br>
            <a href="${e.link}" target="_blank">Register</a>
        `;
        eventsDiv.appendChild(card);
    });
}

function parseTime(str) {
    const m = str.match(/(\d+):?(\d*)\s*(AM|PM)/i);
    if (!m) return 0;
    let hour = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour + min / 60;
}

loadEvents();

