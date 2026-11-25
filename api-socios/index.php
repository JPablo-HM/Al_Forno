<?php
// =====================================================================
// API DE SOCIOS DE AL FORNO                      PHP · puerto 8000
//
// Aquí AL FORNO es el socio comercial: otros negocios consumen ESTA api.
// El socio es el Hotel Las Brumas, que reserva mesas para sus huéspedes.
// Usa la misma base al_forno, solo con procedimientos almacenados.
//
// Métodos (todos piden el encabezado  X-Llave-Socio: <llave del hotel>):
//   GET    /disponibilidad?fecha=AAAA-MM-DD   horas del día con espacios libres
//   POST   /reservas                          crea una reserva
//   GET    /reservas/{id}                     consulta una reserva del hotel
//   DELETE /reservas/{id}                     cancela una reserva del hotel
//
// Cómo arrancarla (en api-socios/):
//   php -S localhost:8000 index.php     (o doble clic en iniciar.bat)
// (index.php recibe TODAS las peticiones, así nadie puede pedir el .env)
// Requisito: extension=pdo_mysql activada en php.ini.
// =====================================================================

date_default_timezone_set('America/Costa_Rica');

require __DIR__ . '/conexion.php';
require __DIR__ . '/reservas.php';

// Responde en JSON y termina la petición.
function responder(int $estado, array $datos): never
{
    http_response_code($estado);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

define('CONFIG', leerEnv());

// 1. Seguridad: el socio debe mandar su llave (la que está en el .env).
//    hash_equals compara sin dar pistas por el tiempo que tarda.
$llave = $_SERVER['HTTP_X_LLAVE_SOCIO'] ?? '';
if (empty(CONFIG['LLAVE_HOTEL']) || !hash_equals(CONFIG['LLAVE_HOTEL'], $llave)) {
    responder(401, ['mensaje' => 'Llave de socio inválida o ausente (encabezado X-Llave-Socio)']);
}

// El id del hotel se busca por su correo con un procedimiento que ya
// existe (sp_ObtenerUsuarioPorCorreo). Debe ser un usuario con rol SOCIO.
try {
    $hotel = llamar('sp_ObtenerUsuarioPorCorreo', [CONFIG['HOTEL_CORREO'] ?? '']);
} catch (PDOException $e) {
    errorDeBase($e);
}
if (!$hotel || $hotel[0]['rol'] !== 'SOCIO') {
    responder(500, ['mensaje' => 'El socio Hotel Las Brumas no está en la base (corra database/actualizar_a_2_5.sql)']);
}
define('HOTEL_USUARIO_ID', (int) $hotel[0]['id']);

// 2. Ruta y método. Ej.: DELETE /reservas/7 → $partes = ['reservas', '7']
$metodo = $_SERVER['REQUEST_METHOD'];
$ruta   = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$partes = $ruta === '' ? [] : explode('/', $ruta);

// El cuerpo JSON (solo en POST)
$cuerpo = [];
if ($metodo === 'POST') {
    $cuerpo = json_decode(file_get_contents('php://input'), true);
    if (!is_array($cuerpo)) responder(400, ['mensaje' => 'El cuerpo debe ser JSON válido']);
}

// 3. Llama al método que corresponde. Los errores de la base (409, 404)
//    se convierten en errorDeBase().
try {
    if ($partes === ['disponibilidad']) {
        if ($metodo !== 'GET') responder(405, ['mensaje' => 'Use GET en /disponibilidad']);
        disponibilidad($_GET['fecha'] ?? null);
    }

    if ($partes === ['reservas']) {
        if ($metodo !== 'POST') responder(405, ['mensaje' => 'Use POST en /reservas']);
        crearReserva($cuerpo);
    }

    if (count($partes) === 2 && $partes[0] === 'reservas' && ctype_digit($partes[1])) {
        $id = (int) $partes[1];
        if ($metodo === 'GET')    obtenerReserva($id);
        if ($metodo === 'DELETE') cancelarReserva($id);
        responder(405, ['mensaje' => 'Use GET o DELETE en /reservas/{id}']);
    }

    responder(404, ['mensaje' => 'La ruta no existe']);
} catch (PDOException $e) {
    errorDeBase($e);
}
