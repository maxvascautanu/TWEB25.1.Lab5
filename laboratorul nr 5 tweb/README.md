# Real Madrid CF — Laborator 4 (PHP + XAMPP)
## Instrucțiuni de instalare și rulare
http://localhost/laboratorul%20nr%205%20tweb/index.html#/home
---

## Structura fișierelor

```
proiect/
├── index.html
├── prezentare.html
├── date-cheie.html
├── palmares.html
├── lot.html
├── formular.html        ← Formularul de înregistrare fan (NOU)
├── style.css
├── app.js
├── formular.js          ← Validare JavaScript (NOU)
├── php/
│   └── formular.php     ← Script server-side pentru procesare formular
├── database/
│   └── fans.csv         ← Creat automat la prima trimitere
└── cgi-bin/
    ├── formular.py      ← Varianta CGI Python (opțională)
    └── fans.csv         ← Date pentru varianta CGI
```

---

## Cum rulezi proiectul cu XAMPP (recomandat)

1. Copiază folderul proiectului în `C:\xampp\htdocs\`.
2. Pornește `Apache` din XAMPP Control Panel.
3. Deschide în browser:
   - `http://localhost/laboratorul%20nr%204%20tweb/formular.html`
4. Formularul trimite datele către `php/formular.php`, iar datele se salvează în `database/fans.csv`.

---

## Varianta CGI Python (opțional)

Poți folosi și `cgi-bin/formular.py` dacă rulezi server cu suport CGI.

---

## Fișierul de date (`database/fans.csv`)

Se creează automat în `database/fans.csv` la prima trimitere de formular.

**Coloane CSV:**
| Coloana     | Descriere                          |
|-------------|-------------------------------------|
| timestamp   | Data și ora înregistrării           |
| prenume     | Prenumele fanului                   |
| nume        | Numele de familie                   |
| email       | Adresa de email                     |
| telefon     | Numărul de telefon (opțional)       |
| tara        | Codul țării (MD, RO, ES, ...)       |
| varsta      | Vârsta                              |
| jucator     | Jucătorul favorit                   |
| ani_fan     | Câți ani este fan Real Madrid       |
| rating      | Nota acordată (1-5 stele)           |
| competitii  | Competiții urmărite (separate prin `\|`) |
| mesaj       | Comentariul fanului                 |
| ip          | Adresa IP a vizitatorului           |

**Exemplu fans.csv:**
```csv
"timestamp","prenume","nume","email","telefon","tara","varsta","jucator","ani_fan","rating","competitii","mesaj","ip"
"2026-04-29 14:35:00","Alexandru","Ionescu","alex@email.com","+373 69 111 222","MD","25","Vinícius Júnior","10","5","LaLiga|UCL","Hala Madrid!","127.0.0.1"
```

---

## Funcționalitățile implementate

### 1. Formular HTML (`formular.html`)
- **12 câmpuri**: prenume, nume, email, telefon, țara, vârstă, jucător favorit, ani fan, rating (stele), competiții (checkbox multiplu), mesaj, termeni
- Trimite date prin `method="POST"` la `php/formular.php`
- Funcționează și fără JavaScript (submit tradițional)

### 2. Script PHP (`php/formular.php`)
- Citește datele trimise prin `POST`
- **Validare server-side** completă (dublă față de JS)
- **Salvează** în `database/fans.csv`
- Returnează **JSON** pentru cereri AJAX
- Include **timestamp** și **IP** la fiecare înregistrare

### 3. Validare JavaScript (`formular.js`)
- **Validare live** la evenimentul `blur` (ieșire din câmp)
- **Feedback vizual**: câmpuri verzi (✓) sau roșii (✗) cu mesaje de eroare
- Contor de caractere pentru câmpul „Mesaj"
- **Submit AJAX** cu `fetch()` — fără reîncărcarea paginii
- Banner de succes afișat după trimitere reușită
- Fallback la submit tradițional dacă serverul nu răspunde

---

## Validări implementate

| Câmp          | Reguli de validare                                    |
|---------------|-------------------------------------------------------|
| Prenume       | Obligatoriu, 2-50 caractere, doar litere              |
| Nume          | Obligatoriu, 2-60 caractere, doar litere              |
| Email         | Obligatoriu, format valid (regex)                     |
| Telefon       | Opțional, format internațional                        |
| Țara          | Obligatoriu, din lista predefinită                    |
| Vârstă        | Obligatoriu, număr întreg 5-120                       |
| Jucător       | Obligatoriu, din lista predefinită                    |
| Ani fan       | Obligatoriu, număr întreg 0-100                       |
| Rating        | Obligatoriu, 1-5 stele                               |
| Competiții    | Cel puțin una selectată                              |
| Mesaj         | Opțional, maxim 500 caractere                        |
| Termeni       | Obligatoriu bifat                                    |

---

## Testare rapidă

1. Deschide `formular.html`.
2. Completează date valide și trimite formularul.
3. Verifică dacă apare mesajul de succes în pagină.
4. Verifică dacă a fost creat/actualizat fișierul `database/fans.csv`.
