<?php
// =====================================================================
// API DE SOCIOS · reservas.php
//
// Los 4 métodos que usa el socio Hotel Las Brumas para reservar mesas
// para sus huéspedes. Las reglas son las MISMAS de la app (las repite
// reservas.servicio.js de Node):
//   · fecha: hoy, mañana o pasado mañana
//   · una de las horas (6, 7, 8 o 9 p.m.) y, si es hoy, que no haya pasado
//   · de 1 a 8 personas
// La base (sp_CrearReserva) controla el máximo de 2 reservas por hora,
// con el mismo candado GET_LOCK que usan los clientes de la app.
// Así, lo que reserva el hotel le quita espacio a la app y al revés.
// =====================================================================

const HORAS_RESERVA = ['18:00', '19:00', '20:00', '21:00'];
const MAXIMO_POR_HORA = 2;
const DIAS_ANTICIPACION = 2;  // hoy + 2 días = hoy, mañana y pasado mañana

// Revisa la fecha ('YYYY-MM-DD'): que exista y que sea hoy, mañana o pasado mañana.
function validarFecha($fecha): void
{
    $dia = is_string($fecha) ? DateTime::createFromFormat('!Y-m-d', $fecha) : false;
    if (!$dia || $dia->format('Y-m-d') !== $fecha) {
        responder(400, ['mensaje' => 'La fecha debe tener el formato AAAA-MM-DD', 'campo' => 'fecha']);
    }
    $hoy = date('Y-m-d');
    $limite = date('Y-m-d', strtotime('+' . DIAS_ANTICIPACION . ' days'));
    // Las fechas en formato YYYY-MM-DD se pueden comparar como texto.
    if ($fecha < $hoy) {
        responder(400, ['mensaje' => 'No se puede reservar en una fecha pasada', 'campo' => 'fecha']);
    }
    if ($fecha > $limite) {
        responder(400, ['mensaje' => 'Solo se puede reservar para hoy, mañana o pasado mañana', 'campo' => 'fecha']);
    }
}

// true si la fecha es hoy y esa hora ya pasó.
function yaPaso(string $fecha, string $hora): bool
{
    return strtotime("$fecha $hora") < time();
}

// Da forma a una reserva de la base: '18:00:00' → '18:00'.
function armarReserva(array $r): array
{
    return [
        'id'       => (int) $r['id'],
        'fecha'    => $r['fecha'],
        'hora'     => substr($r['hora'], 0, 5),
        'personas' => (int) $r['personas'],
        'estado'   => $r['estado'],
    ];
}

// 1 · GET /disponibilidad?fecha=2026-11-25
// Las 4 horas del día con sus espacios libres.
function disponibilidad($fecha): void
{
    validarFecha($fecha);
    $ocupacion = llamar('sp_ListarOcupacion', [$fecha]);  // solo las horas con reservas

    $horas = [];
    foreach (HORAS_RESERVA as $hora) {
        $ocupadas = 0;
        foreach ($ocupacion as $fila) {
            if (str_starts_with($fila['hora'], $hora)) $ocupadas = (int) $fila['ocupadas'];
        }
        $libres = max(0, MAXIMO_POR_HORA - $ocupadas);  // nunca menos de 0
        $horas[] = [
            'hora'       => $hora,
            'libres'     => $libres,
            'disponible' => $libres > 0 && !yaPaso($fecha, $hora),
        ];
    }
    responder(200, ['fecha' => $fecha, 'horas' => $horas]);
}

// 2 · POST /reservas   cuerpo: { "fecha": "2026-11-25", "hora": "19:00", "personas": 4 }
function crearReserva(array $datos): void
{
    $fecha    = $datos['fecha'] ?? null;
    $hora     = $datos['hora'] ?? null;
    $personas = $datos['personas'] ?? null;

    validarFecha($fecha);
    if (!in_array($hora, HORAS_RESERVA, true)) {
        responder(400, ['mensaje' => 'La hora debe ser una de: ' . implode(', ', HORAS_RESERVA), 'campo' => 'hora']);
    }
    if (yaPaso($fecha, $hora)) {
        responder(400, ['mensaje' => 'Esa hora ya pasó. Escoja otra', 'campo' => 'hora']);
    }
    if (!is_int($personas) || $personas < 1 || $personas > 8) {
        responder(400, ['mensaje' => 'Las personas deben ser un número de 1 a 8', 'campo' => 'personas']);
    }

    $filas = llamar('sp_CrearReserva', [HOTEL_USUARIO_ID, $fecha, $hora, $personas, MAXIMO_POR_HORA]);
    responder(201, armarReserva($filas[0]));
}

// 3 · GET /reservas/{id}   (el hotel solo ve sus propias reservas)
function obtenerReserva(int $id): void
{
    $filas = llamar('sp_ObtenerReserva', [$id, HOTEL_USUARIO_ID]);
    if (!$filas) responder(404, ['mensaje' => 'La reserva no existe']);
    responder(200, armarReserva($filas[0]));
}

// 4 · DELETE /reservas/{id}   cancela la reserva (el espacio queda libre)
function cancelarReserva(int $id): void
{
    $filas = llamar('sp_CancelarReserva', [$id, HOTEL_USUARIO_ID]);
    if ((int) $filas[0]['cancelada'] === 0) {
        responder(404, ['mensaje' => 'La reserva no existe o ya estaba cancelada']);
    }
    responder(200, ['id' => $id, 'estado' => 'Cancelada']);
}
