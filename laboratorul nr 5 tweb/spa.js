/**
 * Laborator 5 — navigare SPA + încărcare conținut prin AJAX (fetch)
 * Toate paginile fragment sunt în același folder cu index.html (fără subfolder data/).
 */
(function () {
    "use strict";

    var CONTENT_ID = "spa-content";

    /** Pagina „Acasă” e în acasa.html ca să nu înlocuiască shell-ul index.html */
    var FILE_BY_SLUG = {
        home: "acasa.html",
        prezentare: "prezentare.html",
        "date-cheie": "date-cheie.html",
        palmares: "palmares.html",
        lot: "lot.html",
        formular: "formular.html"
    };

    var HASH_BY_FILE = {
        "index.html": "#/home",
        "acasa.html": "#/home",
        "prezentare.html": "#/prezentare",
        "date-cheie.html": "#/date-cheie",
        "palmares.html": "#/palmares",
        "lot.html": "#/lot",
        "formular.html": "#/formular"
    };

    function slugFromHash() {
        var raw = (location.hash || "#/home").replace(/^#\/?/, "") || "home";
        return raw.split("/")[0] || "home";
    }

    function fileForSlug(slug) {
        return FILE_BY_SLUG[slug] || FILE_BY_SLUG.home;
    }

    function rewriteHtmlNavLinks(html) {
        var out = html;
        Object.keys(HASH_BY_FILE).forEach(function (file) {
            var h = HASH_BY_FILE[file];
            out = out.split('href="' + file + '"').join('href="' + h + '"');
            out = out.split("href='" + file + "'").join('href="' + h + '"');
        });
        return out;
    }

    function fixDuplicateYearIds(html) {
        return html.replace(/\bid="year"/g, 'class="spa-year"');
    }

    function injectFormularStyles(doc) {
        if (document.getElementById("spa-formular-head-styles")) return;
        var tag = doc.querySelector("head style");
        if (!tag || !tag.textContent.trim()) return;
        var s = document.createElement("style");
        s.id = "spa-formular-head-styles";
        s.textContent = tag.textContent;
        document.head.appendChild(s);
    }

    function loadScriptOnce(src) {
        return new Promise(function (resolve, reject) {
            var sel = 'script[data-spa-src="' + src.replace(/"/g, "") + '"]';
            if (document.querySelector(sel)) {
                resolve();
                return;
            }
            var s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.dataset.spaSrc = src;
            s.onload = function () {
                resolve();
            };
            s.onerror = function () {
                reject(new Error("Nu s-a putut încărca scriptul: " + src));
            };
            document.body.appendChild(s);
        });
    }

    function setActiveNav(slug) {
        document.querySelectorAll("[data-spa-nav]").forEach(function (a) {
            a.classList.toggle("spa-nav-active", a.getAttribute("data-spa-nav") === slug);
        });
    }

    function updateYearFooters() {
        var y = String(new Date().getFullYear());
        document.querySelectorAll("#shell-year, #" + CONTENT_ID + " .spa-year").forEach(function (el) {
            el.textContent = y;
        });
    }

    function fixFormAction(container) {
        container.querySelectorAll("form[action]").forEach(function (form) {
            var a = form.getAttribute("action");
            if (!a || /^https?:/i.test(a) || a.charAt(0) === "/") return;
            form.action = new URL(a.replace(/^\.\//, ""), location.href).href;
        });
    }

    function interceptContentClicks(container) {
        container.addEventListener("click", function (e) {
            var a = e.target.closest("a[href^='#/']");
            if (!a || !container.contains(a)) return;
            e.preventDefault();
            location.hash = a.getAttribute("href").replace(/^#/, "");
        });
    }

    var navigating = false;
    var lastNavSlug = "";

    async function navigate() {
        var slug = slugFromHash();
        if (lastNavSlug === "lot" && slug !== "lot" && typeof window.__clearSquadCache === "function") {
            window.__clearSquadCache();
        }
        lastNavSlug = slug;

        var file = fileForSlug(slug);
        setActiveNav(slug);

        var mount = document.getElementById(CONTENT_ID);
        if (!mount) return;

        document.body.classList.add("spa-is-loading");
        mount.innerHTML = '<p class="muted" style="padding:24px">Se încarcă conținutul…</p>';

        try {
            var res = await fetch(file, { cache: "no-store" });
            if (!res.ok) throw new Error(res.status + " " + res.statusText);
            var html = await res.text();
            var doc = new DOMParser().parseFromString(html, "text/html");

            if (file === "formular.html") injectFormularStyles(doc);

            var main = doc.querySelector("main");
            var inner = main ? main.innerHTML : "<p>Fragment lipsă.</p>";
            inner = fixDuplicateYearIds(inner);
            inner = rewriteHtmlNavLinks(inner);
            mount.innerHTML = inner;
            fixFormAction(mount);
            updateYearFooters();

            if (file === "lot.html") {
                if (!window.__spaAppJsLoaded) {
                    await loadScriptOnce("app.js");
                    window.__spaAppJsLoaded = true;
                } else if (window.realMadridAppBoot) {
                    window.realMadridAppBoot();
                }
            }

            if (file === "formular.html") {
                if (!window.__spaFanFormJsLoaded) {
                    await loadScriptOnce("formular.js");
                    window.__spaFanFormJsLoaded = true;
                } else if (window.initFanFormPage) {
                    window.initFanFormPage();
                }
            }
        } catch (err) {
            mount.innerHTML =
                '<section class="wrap"><div class="card"><h2>Eroare AJAX</h2><p class="muted">' +
                String(err.message || err) +
                "</p><p class=\"small\">Rulează site-ul prin Apache (XAMPP), nu din file://</p></div></section>";
        } finally {
            document.body.classList.remove("spa-is-loading");
        }
    }

    function onHashChange() {
        if (navigating) return;
        navigating = true;
        navigate().finally(function () {
            navigating = false;
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var host = document.getElementById(CONTENT_ID);
        if (host && !host.dataset.spaClickBound) {
            host.dataset.spaClickBound = "1";
            interceptContentClicks(host);
        }

        var sy = document.getElementById("shell-year");
        if (sy) sy.textContent = String(new Date().getFullYear());

        window.addEventListener("hashchange", onHashChange);
        if (!location.hash || location.hash === "#") {
            location.hash = "#/home";
        } else {
            onHashChange();
        }
    });
})();
