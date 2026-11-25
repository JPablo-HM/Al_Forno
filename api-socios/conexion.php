<?php
// =====================================================================
// API DE SOCIOS · conexion.php
//
// Lee el archivo .env, abre la conexión a la base al_forno y ejecuta los
// procedimientos almacenados (CALL). Igual que la API de Node, esta API
// NO escribe consultas SQL: solo llama a los procedimientos.
// =====================================================================

// Lee api-socios/.env (líneas NOMBRE=valor) y devuelve un arreglo.
function leerEnv(): array
{
    $ruta = __DIR__ . '/.env';
    if (!file_exists($ruta)) {
        responder(500, ['mensaje' => 'Falta el archivo .env (copie .env.example como .env)']);
    }
    $config = [];
    foreach (file($ruta, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
        $linea = trim($linea);
        if ($linea === '' || $linea[0] === '#' || !str_contains($linea, '=')) continue;
        [$nombre, $valor] = explode('=', $linea, 2);
        $config[trim($nombre)] = trim($valor);
    }
    return $config;
}

// Una sola conexión para toda la petición.
function conexion(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $env = CONFIG;
        $dsn = "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname=al_forno;charset=utf8mb4";
        $pdo = new PDO($dsn, $env['DB_USER'], $env['DB_PASSWORD'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // los errores lanzan excepción
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // filas como arreglos con nombres
        ]);
        $pdo->exec("SET time_zone = '-06:00'"); // hora de Costa Rica, igual que Node
    }
    return $pdo;
}

// Ejecuta un procedimiento y devuelve las filas de su primer resultado.
// Ejemplo: llamar('sp_ListarOcupacion', ['2026-11-25'])
//          → CALL sp_ListarOcupacion(?)
function llamar(string $procedimiento, array $parametros = []): array
{
    $signos = implode(', ', array_fill(0, count($parametros), '?'));
    $consulta = conexion()->prepare("CALL $procedimiento($signos)");
    $consulta->execute($parametros);  // los ? evitan la inyección SQL
    $filas = $consulta->columnCount() > 0 ? $consulta->fetchAll() : [];
    $consulta->closeCursor();         // libera la conexión para el siguiente CALL
    return $filas;
}

// Los procedimientos avisan los errores del negocio con SIGNAL:
//   MYSQL_ERRNO 5409 → 409 (conflicto, ej. "esa hora ya está llena")
//   MYSQL_ERRNO 5404 → 404 (no existe)
// Es la misma regla del middleware de errores de la API de Node.
function errorDeBase(PDOException $e): void
{
    $codigo = $e->errorInfo[1] ?? 0;
    if ($codigo === 5409 || $codigo === 5404) {
        $mensaje = $e->errorInfo[2];
        responder($codigo === 5409 ? 409 : 404, ['mensaje' => $mensaje]);
    }
    error_log($e->getMessage()); // el detalle solo se ve en la consola
    responder(500, ['mensaje' => 'Error interno de la API de socios']);
}
