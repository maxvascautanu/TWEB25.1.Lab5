// ===== Lot: date încărcate prin AJAX din squad.json (JSON) =====
let squad = [];

function $(id) {
    return document.getElementById(id);
}

function sortFn(mode) {
    if (mode === "NO_ASC") return (a, b) => a.no - b.no;
    if (mode === "NO_DESC") return (a, b) => b.no - a.no;
    if (mode === "NAME_ASC") return (a, b) => a.player.localeCompare(b.player);
    if (mode === "NAME_DESC") return (a, b) => b.player.localeCompare(a.player);
    return (a, b) => a.no - b.no;
}

function renderSquadTable() {
    const qEl = $("q");
    const posEl = $("pos");
    const sortEl = $("sort");
    const tbody = $("tbody");
    const empty = $("empty");

    if (!qEl || !posEl || !sortEl || !tbody || !empty) return;

    const q = qEl.value.trim().toLowerCase();
    const pos = posEl.value;
    const sort = sortEl.value;

    let rows = squad.filter(p => {
        const okPos = (pos === "ALL") ? true : (p.pos === pos);
        const okQ = (q === "") ? true : (
            p.player.toLowerCase().includes(q) ||
            p.nation.toLowerCase().includes(q) ||
            String(p.no).includes(q)
        );
        return okPos && okQ;
    });

    rows = rows.slice().sort(sortFn(sort));

    tbody.innerHTML = "";
    empty.style.display = rows.length ? "none" : "block";

    rows.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${p.no}</b></td>
            <td>${p.pos}</td>
            <td>${p.nation}</td>
            <td>${p.player}</td>
            <td>${p.notes || "-"}</td>
        `;
        tbody.appendChild(tr);
    });
}

/** Delegare evenimente (evită listeneri duplicați la navigare SPA) */
function bindLotDelegationOnce() {
    if (window.__rmLotDelegation) return;
    window.__rmLotDelegation = true;

    document.addEventListener("input", function (e) {
        if (e.target && e.target.id === "q") renderSquadTable();
    });
    document.addEventListener("change", function (e) {
        if (e.target && (e.target.id === "pos" || e.target.id === "sort")) renderSquadTable();
    });
    document.addEventListener("click", function (e) {
        if (e.target && e.target.id === "reset") {
            const q = $("q");
            const pos = $("pos");
            const sort = $("sort");
            if (q && pos && sort) {
                q.value = "";
                pos.value = "ALL";
                sort.value = "NO_ASC";
                renderSquadTable();
            }
        }
    });
}

function loadSquadFromAjax() {
    const status = $("squadAjaxStatus");
    const showStatus = (t) => {
        if (status) status.textContent = t || "";
    };

    if (!($("q") && $("tbody"))) return;

    bindLotDelegationOnce();

    if (squad.length > 0) {
        renderSquadTable();
        return;
    }

    showStatus("Se încarcă lotul prin AJAX (GET squad.json)…");

    fetch("squad.json", { cache: "no-store" })
        .then((r) => {
            if (!r.ok) throw new Error(r.status + " " + r.statusText);
            return r.json();
        })
        .then((data) => {
            squad = Array.isArray(data.players) ? data.players : [];
            const meta = data.meta && data.meta.asOf ? " (actualizare: " + data.meta.asOf + ")" : "";
            showStatus("✓ Lot încărcat prin AJAX: " + squad.length + " jucători" + meta + ".");
            renderSquadTable();
        })
        .catch((err) => {
            showStatus("✗ Eroare AJAX la squad.json: " + err.message);
            const tbody = $("tbody");
            if (tbody) tbody.innerHTML = "";
            const empty = $("empty");
            if (empty) {
                empty.style.display = "block";
                empty.textContent = "Nu s-au putut încărca datele lotului. Verifică rețeaua sau fișierul squad.json.";
            }
        });
}

function realMadridAppBoot() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    if ($("q") && $("pos") && $("sort") && $("reset") && $("tbody")) {
        loadSquadFromAjax();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", realMadridAppBoot);
} else {
    realMadridAppBoot();
}

window.realMadridAppBoot = realMadridAppBoot;

/** Apelat din spa.js la navigare: la revenire pe Lot se reface request-ul AJAX */
window.__clearSquadCache = function () {
    squad = [];
};
