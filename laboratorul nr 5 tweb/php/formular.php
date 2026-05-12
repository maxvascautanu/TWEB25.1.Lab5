<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "eroare", "eroare" => "Metoda HTTP nu este suportata."], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_text(string $value, int $maxLen = 500): string
{
    $value = trim($value);
    if (str_len($value) > $maxLen) {
        $value = str_sub($value, 0, $maxLen);
    }
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
}

function str_len(string $value): int
{
    if (function_exists("mb_strlen")) {
        return mb_strlen($value, "UTF-8");
    }
    return strlen($value);
}

function str_sub(string $value, int $start, int $length): string
{
    if (function_exists("mb_substr")) {
        return mb_substr($value, $start, $length, "UTF-8");
    }
    return substr($value, $start, $length);
}

function valid_email(string $value): bool
{
    return (bool) filter_var($value, FILTER_VALIDATE_EMAIL);
}

function valid_phone(string $value): bool
{
    if ($value === "") {
        return true;
    }
    return (bool) preg_match('/^\+?[\d\s\-().]{7,20}$/', $value);
}

function valid_int_range(string $value, int $min, int $max): bool
{
    if ($value === "" || !preg_match('/^-?\d+$/', $value)) {
        return false;
    }
    $nr = (int) $value;
    return $nr >= $min && $nr <= $max;
}

$allowedCountries = ["MD", "RO", "ES", "DE", "FR", "GB", "US", "BR", "AR", "OTHER"];
$allowedRating = ["1", "2", "3", "4", "5"];

$data = [
    "prenume" => clean_text((string) ($_POST["prenume"] ?? ""), 50),
    "nume" => clean_text((string) ($_POST["nume"] ?? ""), 60),
    "email" => clean_text((string) ($_POST["email"] ?? ""), 100),
    "telefon" => clean_text((string) ($_POST["telefon"] ?? ""), 25),
    "tara" => clean_text((string) ($_POST["tara"] ?? ""), 10),
    "varsta" => clean_text((string) ($_POST["varsta"] ?? ""), 3),
    "jucator" => clean_text((string) ($_POST["jucator"] ?? ""), 80),
    "ani_fan" => clean_text((string) ($_POST["ani_fan"] ?? ""), 3),
    "rating" => clean_text((string) ($_POST["rating"] ?? ""), 1),
    "mesaj" => clean_text((string) ($_POST["mesaj"] ?? ""), 500),
    "termeni" => clean_text((string) ($_POST["termeni"] ?? ""), 5),
    "competitii" => array_filter(array_map(static function ($item) {
        return clean_text((string) $item, 50);
    }, (array) ($_POST["competitii"] ?? []))),
];

$errors = [];
if ($data["prenume"] === "" || str_len($data["prenume"]) < 2) $errors[] = "Prenumele este obligatoriu (minim 2 caractere).";
if ($data["nume"] === "" || str_len($data["nume"]) < 2) $errors[] = "Numele este obligatoriu (minim 2 caractere).";
if ($data["email"] === "" || !valid_email($data["email"])) $errors[] = "Adresa de email nu este valida.";
if (!valid_phone($data["telefon"])) $errors[] = "Numarul de telefon nu este valid.";
if (!in_array($data["tara"], $allowedCountries, true)) $errors[] = "Te rugam sa selectezi o tara valida.";
if (!valid_int_range($data["varsta"], 5, 120)) $errors[] = "Varsta trebuie sa fie intre 5 si 120.";
if ($data["jucator"] === "") $errors[] = "Te rugam sa selectezi un jucator favorit.";
if (!valid_int_range($data["ani_fan"], 0, 100)) $errors[] = "Ani fan trebuie sa fie intre 0 si 100.";
if (!in_array($data["rating"], $allowedRating, true)) $errors[] = "Te rugam sa selectezi ratingul (1-5).";
if (count($data["competitii"]) === 0) $errors[] = "Selecteaza cel putin o competitie.";
if ($data["termeni"] !== "da") $errors[] = "Trebuie sa accepti termenii si conditiile.";

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["status" => "eroare", "erori" => $errors], JSON_UNESCAPED_UNICODE);
    exit;
}

$projectRoot = dirname(__DIR__);
$dbDir = $projectRoot . DIRECTORY_SEPARATOR . "database";
$csvFile = $dbDir . DIRECTORY_SEPARATOR . "fans.csv";

if (!is_dir($dbDir) && !mkdir($dbDir, 0775, true) && !is_dir($dbDir)) {
    http_response_code(500);
    echo json_encode(["status" => "eroare", "eroare" => "Nu s-a putut crea folderul database."], JSON_UNESCAPED_UNICODE);
    exit;
}

$isNewFile = !file_exists($csvFile);
$handle = fopen($csvFile, "ab");
if ($handle === false) {
    http_response_code(500);
    echo json_encode(["status" => "eroare", "eroare" => "Nu s-a putut deschide fisierul de stocare."], JSON_UNESCAPED_UNICODE);
    exit;
}

$row = [
    date("Y-m-d H:i:s"),
    $data["prenume"],
    $data["nume"],
    $data["email"],
    $data["telefon"],
    $data["tara"],
    $data["varsta"],
    $data["jucator"],
    $data["ani_fan"],
    $data["rating"],
    implode("|", $data["competitii"]),
    $data["mesaj"],
    $_SERVER["REMOTE_ADDR"] ?? "necunoscut",
];

$headers = [
    "timestamp", "prenume", "nume", "email", "telefon",
    "tara", "varsta", "jucator", "ani_fan", "rating",
    "competitii", "mesaj", "ip",
];

if ($isNewFile) {
    fputcsv($handle, $headers);
}
fputcsv($handle, $row);
fclose($handle);

echo json_encode([
    "status" => "ok",
    "mesaj" => "Bun venit, {$data['prenume']} {$data['nume']}! Inregistrarea a fost salvata in baza de date locala."
], JSON_UNESCAPED_UNICODE);

