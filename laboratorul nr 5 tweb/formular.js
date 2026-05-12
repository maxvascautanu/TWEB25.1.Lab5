/**
 * formular.js — Validare JavaScript + trimitere AJAX
 * Real Madrid CF — Înregistrare Fan
 */

(function () {
    "use strict";

    function initFanFormPage() {

    /* ────────────────────────────────
       Utilități
    ──────────────────────────────── */

    /** Setează starea unui câmp (ok / err / neutru) */
    function setFieldState(id, errId, isOk, msg) {
        const el = document.getElementById(id);
        const errEl = document.getElementById(errId);
        if (!el) return;

        el.classList.remove("ok", "err");
        if (isOk === true)  { el.classList.add("ok");  errEl.textContent = ""; }
        if (isOk === false) { el.classList.add("err"); errEl.textContent = msg || ""; }
    }

    /** Validare email cu regex */
    function isValidEmail(val) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
    }

    /** Validare telefon (opțional, dar dacă e completat trebuie să fie corect) */
    function isValidPhone(val) {
        if (!val.trim()) return true; // opțional
        return /^\+?[\d\s\-().]{7,20}$/.test(val.trim());
    }

    /* ────────────────────────────────
       Reguli de validare per câmp
    ──────────────────────────────── */

    const rules = {
        prenume: () => {
            const v = document.getElementById("prenume").value.trim();
            if (!v)            return "Prenumele este obligatoriu.";
            if (v.length < 2)  return "Prenumele trebuie să aibă cel puțin 2 caractere.";
            if (v.length > 50) return "Prenumele este prea lung (max 50 caractere).";
            if (!/^[\p{L}\s\-']+$/u.test(v)) return "Prenumele poate conține doar litere, spații și cratime.";
            return null;
        },
        nume: () => {
            const v = document.getElementById("nume").value.trim();
            if (!v)            return "Numele de familie este obligatoriu.";
            if (v.length < 2)  return "Numele trebuie să aibă cel puțin 2 caractere.";
            if (v.length > 60) return "Numele este prea lung (max 60 caractere).";
            if (!/^[\p{L}\s\-']+$/u.test(v)) return "Numele poate conține doar litere, spații și cratime.";
            return null;
        },
        email: () => {
            const v = document.getElementById("email").value.trim();
            if (!v)              return "Adresa de email este obligatorie.";
            if (!isValidEmail(v)) return "Adresa de email nu este validă (ex: fan@email.com).";
            return null;
        },
        telefon: () => {
            const v = document.getElementById("telefon").value.trim();
            if (!isValidPhone(v)) return "Numărul de telefon nu este valid.";
            return null;
        },
        tara: () => {
            const v = document.getElementById("tara").value;
            if (!v) return "Te rugăm să selectezi țara.";
            return null;
        },
        varsta: () => {
            const v = parseInt(document.getElementById("varsta").value, 10);
            if (!document.getElementById("varsta").value.trim()) return "Vârsta este obligatorie.";
            if (isNaN(v) || v < 5)   return "Vârsta minimă este 5 ani.";
            if (v > 120)             return "Vârstă invalidă (max 120 ani).";
            return null;
        },
        jucator: () => {
            const v = document.getElementById("jucator").value;
            if (!v) return "Te rugăm să selectezi un jucător favorit.";
            return null;
        },
        ani: () => {
            const raw = document.getElementById("ani").value.trim();
            const v = parseInt(raw, 10);
            if (raw === "") return "Câmpul este obligatoriu.";
            if (isNaN(v) || v < 0)  return "Valoarea minimă este 0.";
            if (v > 100)            return "Valoarea maximă este 100 ani.";
            return null;
        },
        rating: () => {
            const checked = document.querySelector('input[name="rating"]:checked');
            if (!checked) return "Te rugăm să acorzi o notă.";
            return null;
        },
        competitii: () => {
            const checked = document.querySelectorAll('input[name="competitii"]:checked');
            if (checked.length === 0) return "Selectează cel puțin o competiție.";
            return null;
        },
        mesaj: () => {
            const v = document.getElementById("mesaj").value.trim();
            if (v.length > 500) return "Mesajul poate avea maxim 500 de caractere.";
            return null;
        },
        termeni: () => {
            const v = document.getElementById("termeni").checked;
            if (!v) return "Trebuie să accepți termenii și condițiile.";
            return null;
        }
    };

    /* ────────────────────────────────
       Validare individuală (live)
    ──────────────────────────────── */

    function validateField(fieldKey) {
        const errId = "err-" + fieldKey;
        const error = rules[fieldKey]();
        const el = document.getElementById(fieldKey);

        // Câmpurile fără un singur element (rating, competitii, termeni)
        if (fieldKey === "rating" || fieldKey === "competitii" || fieldKey === "termeni") {
            const errEl = document.getElementById(errId);
            if (errEl) errEl.textContent = error || "";
            return !error;
        }

        setFieldState(fieldKey, errId, !error, error);
        return !error;
    }

    /* ────────────────────────────────
       Validare completă la submit
    ──────────────────────────────── */

    function validateAll() {
        const keys = Object.keys(rules);
        let allOk = true;
        keys.forEach(k => {
            if (!validateField(k)) allOk = false;
        });
        return allOk;
    }

    /* ────────────────────────────────
       Contor caractere textarea
    ──────────────────────────────── */

    const mesajEl   = document.getElementById("mesaj");
    const charCount = document.getElementById("charCount");
    if (mesajEl && charCount) {
        mesajEl.addEventListener("input", () => {
            const len = mesajEl.value.length;
            charCount.textContent = len;
            charCount.style.color = len > 450 ? "#f87171" : "";
        });
    }

    /* ────────────────────────────────
       Live validation (blur)
    ──────────────────────────────── */

    ["prenume","nume","email","telefon","tara","varsta","jucator","ani","mesaj"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("blur",  () => validateField(id));
            el.addEventListener("input", () => {
                // Curăță eroarea la primul keystroke
                if (el.classList.contains("err")) validateField(id);
            });
        }
    });

    // Rating și checkbox live
    document.querySelectorAll('input[name="rating"]').forEach(r =>
        r.addEventListener("change", () => validateField("rating"))
    );
    document.querySelectorAll('input[name="competitii"]').forEach(c =>
        c.addEventListener("change", () => validateField("competitii"))
    );
    const termeniEl = document.getElementById("termeni");
    if (termeniEl) termeniEl.addEventListener("change", () => validateField("termeni"));

    /* ────────────────────────────────
       Submit — AJAX fetch
    ──────────────────────────────── */

    const form       = document.getElementById("fanForm");
    const successMsg = document.getElementById("successMsg");
    const btnSubmit  = form ? form.querySelector(".btn-submit") : null;

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            // PHP/XAMPP nu poate procesa request-uri pornite din file://
            if (window.location.protocol === "file:") {
                alert(
                    "⚠️ Ai deschis pagina ca fișier local (file://).\n\n" +
                    "Deschide site-ul prin XAMPP (Apache), de exemplu:\n" +
                    "http://localhost/laboratorul%20nr%205%20tweb/index.html#/formular"
                );
                return;
            }

            // 1. Validare completă
            if (!validateAll()) {
                // Scroll la primul câmp cu eroare
                const firstErr = form.querySelector(".err");
                if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }

            // 2. Dezactivează butonul
            btnSubmit.disabled = true;
            btnSubmit.textContent = "⏳ Se trimite...";

            // 3. Trimite cu fetch (AJAX)
            const formData = new FormData(form);

            const actionUrl = new URL(form.action, window.location.href).href;

            fetch(actionUrl, {
                method: "POST",
                body: formData
            })
            .then(res => {
                return res.text().then(bodyText => {
                    if (!res.ok) {
                        throw new Error(`Server error ${res.status}: ${bodyText || "Fara detalii"}`);
                    }
                    return bodyText;
                });
            })
            .then(responseText => {
                console.log("Server response:", responseText);
                // Ascunde formularul, arată mesajul de succes
                form.style.display = "none";
                successMsg.style.display = "block";

                // Extrage și afișează datele confirmate de server (dacă sunt în răspuns)
                try {
                    const data = JSON.parse(responseText);
                    if (data.mesaj) {
                        successMsg.querySelector("p").textContent = data.mesaj;
                    }
                } catch (_) { /* răspuns HTML simplu, ignoră */ }
            })
            .catch(err => {
                console.error("Fetch error:", err);
                alert("⚠️ Trimiterea a eșuat.\n\nDetalii: " + err.message + "\n\nVerifică că rulezi din http://localhost/... și că Apache din XAMPP este pornit.");
            })
            .finally(() => {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "✉️ Trimite Înregistrarea";
            });
        });
    }

    /* ────────────────────────────────
       An curent în footer
    ──────────────────────────────── */

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initFanFormPage);
    } else {
        initFanFormPage();
    }
    window.initFanFormPage = initFanFormPage;

})();
