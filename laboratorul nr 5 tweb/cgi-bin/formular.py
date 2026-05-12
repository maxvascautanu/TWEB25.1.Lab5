# -*- coding: utf-8 -*-
"""
#!C:/Users/maxva/AppData/Local/Programs/Python/Python312/python.exe
cgi-bin/formular.py  —  compatibil Python 3.11 – 3.14+
Citeste date POST fara modulul 'cgi' (eliminat in Python 3.13+).
"""

import csv
import html
import json
import os
import re
import sys
from datetime import datetime
from urllib.parse import parse_qs

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
CSV_FILE   = os.path.join(BASE_DIR, "fans.csv")

CSV_FIELDS = [
    "timestamp", "prenume", "nume", "email", "telefon",
    "tara", "varsta", "jucator", "ani_fan", "rating",
    "competitii", "mesaj", "ip"
]

# ─── Citire date POST (fara modulul cgi) ────────────────────────

def parse_multipart(body, boundary):
    fields, lists = {}, {}
    if not boundary:
        return fields, lists
    sep = ("--" + boundary).encode()
    for part in body.split(sep):
        if b"Content-Disposition" not in part:
            continue
        header_end = part.find(b"\r\n\r\n")
        if header_end == -1:
            continue
        header = part[:header_end].decode("utf-8", errors="replace")
        value  = part[header_end + 4:].rstrip(b"\r\n--")
        m = re.search(r'name="([^"]+)"', header)
        if not m:
            continue
        name = m.group(1)
        val  = value.decode("utf-8", errors="replace")
        fields[name] = val
        lists.setdefault(name, []).append(val)
    return fields, lists

def get_post_data():
    method       = os.environ.get("REQUEST_METHOD", "GET").upper()
    content_type = os.environ.get("CONTENT_TYPE", "")
    length       = int(os.environ.get("CONTENT_LENGTH", 0) or 0)
    raw = b""
    if method == "POST" and length > 0:
        raw = sys.stdin.buffer.read(length)

    if "multipart/form-data" in content_type:
        boundary = ""
        for part in content_type.split(";"):
            p = part.strip()
            if p.startswith("boundary="):
                boundary = p[len("boundary="):].strip()
        fields, lists = parse_multipart(raw, boundary)
    else:
        qs     = parse_qs(raw.decode("utf-8", errors="replace"), keep_blank_values=True)
        fields = {k: v[0] for k, v in qs.items()}
        lists  = {k: v    for k, v in qs.items()}

    def get(name, maxlen=500):
        return html.escape(str(fields.get(name, "")).strip())[:maxlen]

    def get_list(name):
        return [html.escape(str(v).strip()) for v in lists.get(name, []) if str(v).strip()]

    return {
        "prenume"    : get("prenume",   50),
        "nume"       : get("nume",      60),
        "email"      : get("email",    100),
        "telefon"    : get("telefon",   25),
        "tara"       : get("tara",      10),
        "varsta"     : get("varsta",     3),
        "jucator"    : get("jucator",   80),
        "ani_fan"    : get("ani_fan",    3),
        "rating"     : get("rating",     1),
        "mesaj"      : get("mesaj",    500),
        "termeni"    : get("termeni",    5),
        "competitii" : get_list("competitii"),
    }

# ─── Validare ───────────────────────────────────────────────────

def valid_email(e):
    return bool(re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$', e))

def valid_phone(t):
    return not t or bool(re.match(r'^\+?[\d\s\-().]{7,20}$', t))

def valid_int(val, lo, hi):
    try:
        return lo <= int(val) <= hi
    except (TypeError, ValueError):
        return False

def valideaza(d):
    erori = []
    if not d["prenume"]:                   erori.append("Prenumele este obligatoriu.")
    elif len(d["prenume"]) < 2:            erori.append("Prenumele trebuie sa aiba cel putin 2 caractere.")
    if not d["nume"]:                      erori.append("Numele de familie este obligatoriu.")
    elif len(d["nume"]) < 2:              erori.append("Numele trebuie sa aiba cel putin 2 caractere.")
    if not d["email"]:                     erori.append("Adresa de email este obligatorie.")
    elif not valid_email(d["email"]):      erori.append("Adresa de email nu este valida.")
    if not valid_phone(d["telefon"]):      erori.append("Numarul de telefon nu este valid.")
    if d["tara"] not in {"MD","RO","ES","DE","FR","GB","US","BR","AR","OTHER"}:
                                           erori.append("Te rugam sa selectezi o tara valida.")
    if not valid_int(d["varsta"], 5, 120): erori.append("Varsta trebuie sa fie intre 5 si 120 de ani.")
    if not d["jucator"]:                   erori.append("Te rugam sa selectezi un jucator favorit.")
    if not valid_int(d["ani_fan"], 0,100): erori.append("Ani fan trebuie sa fie intre 0 si 100.")
    if d["rating"] not in {"1","2","3","4","5"}:
                                           erori.append("Te rugam sa acorzi o nota (1-5 stele).")
    if not d["competitii"]:                erori.append("Selecteaza cel putin o competitie.")
    if d["termeni"] != "da":              erori.append("Trebuie sa accepti termenii si conditiile.")
    return erori

# ─── Salvare CSV ────────────────────────────────────────────────

def salveaza_csv(d):
    nou = not os.path.exists(CSV_FILE)
    with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS, quoting=csv.QUOTE_ALL)
        if nou:
            w.writeheader()
        w.writerow({
            "timestamp"  : datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "prenume"    : d["prenume"],
            "nume"       : d["nume"],
            "email"      : d["email"],
            "telefon"    : d["telefon"],
            "tara"       : d["tara"],
            "varsta"     : d["varsta"],
            "jucator"    : d["jucator"],
            "ani_fan"    : d["ani_fan"],
            "rating"     : d["rating"],
            "competitii" : "|".join(d["competitii"]),
            "mesaj"      : d["mesaj"],
            "ip"         : os.environ.get("REMOTE_ADDR", "necunoscut"),
        })

# ─── Raspunsuri HTTP ────────────────────────────────────────────

def out(s):
    sys.stdout.write(s)
    sys.stdout.flush()

def raspunde_json(code, payload):
    texts = {200:"OK", 400:"Bad Request", 500:"Internal Server Error"}
    out(f"Status: {code} {texts.get(code,'')}\r\n")
    out("Content-Type: application/json; charset=utf-8\r\n\r\n")
    out(json.dumps(payload, ensure_ascii=False))

def raspunde_html(ok, data=None, erori=None):
    out("Content-Type: text/html; charset=utf-8\r\n\r\n")
    css = "body{font-family:system-ui;background:#0b1020;color:#eef2ff;padding:40px;max-width:600px;margin:auto}"
    if ok:
        out(f"""<!doctype html><html lang="ro"><head><meta charset="utf-8">
<title>Succes</title><style>{css}</style></head><body>
<h1>&#10003; Inregistrare reusita!</h1>
<p>Bun venit, <strong>{data['prenume']} {data['nume']}</strong>! Datele au fost salvate.</p>
<a href="../formular.html" style="color:#d4af37">&#8592; Inapoi la formular</a>
</body></html>""")
    else:
        li = "".join(f"<li>{e}</li>" for e in (erori or []))
        out(f"""<!doctype html><html lang="ro"><head><meta charset="utf-8">
<title>Eroare</title><style>{css} ul{{color:#f87171}}</style></head><body>
<h1>&#10007; Date invalide</h1><ul>{li}</ul>
<a href="../formular.html" style="color:#d4af37">&#8592; Inapoi la formular</a>
</body></html>""")

# ─── Main ───────────────────────────────────────────────────────

def main():
    method     = os.environ.get("REQUEST_METHOD", "GET").upper()
    wants_json = "application/json" in os.environ.get("HTTP_ACCEPT", "")

    if method == "GET":
        out("Content-Type: text/html; charset=utf-8\r\n\r\n<p>CGI activ.</p>")
        return

    if method != "POST":
        raspunde_json(400, {"eroare": "Metoda HTTP nu este suportata."}); return

    try:
        data = get_post_data()
    except Exception as ex:
        raspunde_json(500, {"eroare": str(ex)}); return

    erori = valideaza(data)
    if erori:
        if wants_json: raspunde_json(400, {"status":"eroare","erori":erori})
        else:          raspunde_html(False, erori=erori)
        return

    try:
        salveaza_csv(data)
    except Exception as ex:
        if wants_json: raspunde_json(500, {"eroare": str(ex)})
        else:          raspunde_html(False, erori=[str(ex)])
        return

    if wants_json:
        raspunde_json(200, {"status":"ok","mesaj":f"Bun venit, {data['prenume']} {data['nume']}! Inregistrare salvata!"})
    else:
        raspunde_html(True, data=data)

if __name__ == "__main__":
    main()
