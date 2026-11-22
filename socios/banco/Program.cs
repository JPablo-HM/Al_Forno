// =====================================================================
// BANCO SIMULADO                         C# .NET (Minimal API) · puerto 5001
//
// Simula un banco que cobra los pedidos de AL FORNO. Tiene su PROPIA base
// de datos (banco_simulado), aparte de la base de AL FORNO.
// Solo lo llama la API de AL FORNO (Node); la app nunca habla con él.
//
// Métodos:
//   POST /pagos/tarjeta  { numero, vencimiento, cvv, monto, descripcion }
//   POST /pagos/sinpe    { telefono, monto, descripcion }
//   GET  /               el banco está activo (para revisar que corre)
//
// Respuestas:
//   200 { aprobado: true, referencia, ... }    pago hecho
//   402 { aprobado: false, mensaje }           pago rechazado (el motivo)
//   400 { aprobado: false, mensaje }           datos con formato incorrecto
//
// Cómo arrancarlo (en socios/banco/):
//   dotnet run
// =====================================================================
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using MySqlConnector;

DotNetEnv.Env.Load(); // lee socios/banco/.env (usuario y contraseña de MySQL)

// Cuenta de AL FORNO: recibe el dinero de cada pago.
const string CUENTA_AL_FORNO = "CR21015201001026284066";

var cadenaConexion = new MySqlConnectionStringBuilder
{
    Server = Variable("DB_HOST", "localhost"),
    Port = uint.Parse(Variable("DB_PORT", "3306")),
    UserID = Variable("DB_USER", "root"),
    Password = Variable("DB_PASSWORD", ""),
    Database = "banco_simulado",
}.ConnectionString;

var app = WebApplication.CreateBuilder(args).Build();


// ---------------------------------------------------------------------
// Funciones de apoyo
// ---------------------------------------------------------------------

// Valor del .env (o el valor por defecto si no está)
string Variable(string nombre, string porDefecto) =>
    Environment.GetEnvironmentVariable(nombre) ?? porDefecto;

async Task<MySqlConnection> Conectar()
{
    var conexion = new MySqlConnection(cadenaConexion);
    await conexion.OpenAsync();
    return conexion;
}

IResult Rechazar(string mensaje, int codigo = 402) =>
    Results.Json(new { aprobado = false, mensaje }, statusCode: codigo);

// La marca sale de los primeros dígitos de la tarjeta.
string? MarcaDe(string numero)
{
    if (numero.Length == 15 && (numero.StartsWith("34") || numero.StartsWith("37")))
        return "American Express";
    if (numero.Length == 16 && numero[0] == '4')
        return "Visa";
    if (numero.Length == 16)
    {
        int dos = int.Parse(numero[..2]), cuatro = int.Parse(numero[..4]);
        if ((dos >= 51 && dos <= 55) || (cuatro >= 2221 && cuatro <= 2720))
            return "MasterCard";
    }
    return null;
}

// '12/28' sirve hasta el último día de diciembre de 2028.
bool EstaVencida(string vencimiento)
{
    int mes = int.Parse(vencimiento[..2]), anio = 2000 + int.Parse(vencimiento[3..]);
    var hoy = DateTime.Today;
    return anio < hoy.Year || (anio == hoy.Year && mes < hoy.Month);
}

// Ejecuta una instrucción SQL con parámetros dentro de la transacción.
MySqlCommand Comando(MySqlConnection conexion, MySqlTransaction transaccion, string sql,
    params (string nombre, object valor)[] parametros)
{
    var comando = new MySqlCommand(sql, conexion, transaccion);
    foreach (var (nombre, valor) in parametros) comando.Parameters.AddWithValue(nombre, valor);
    return comando;
}

// Rebaja el monto de la cuenta del cliente y lo suma a la de AL FORNO.
// Todo en una TRANSACCIÓN: o se hacen los dos movimientos, o ninguno.
// Devuelve la referencia, o null si no hay saldo suficiente.
async Task<string?> Cobrar(MySqlConnection conexion, long cuentaId, int monto, string descripcion)
{
    await using var transaccion = await conexion.BeginTransactionAsync();

    // FOR UPDATE bloquea la cuenta hasta el COMMIT: si llegan dos pagos
    // al mismo tiempo, el segundo espera y ve el saldo ya rebajado.
    var saldo = Convert.ToInt64(await Comando(conexion, transaccion,
        "SELECT saldo FROM cuenta WHERE id = @id FOR UPDATE", ("@id", cuentaId)).ExecuteScalarAsync());
    if (saldo < monto)
    {
        await transaccion.RollbackAsync();
        return null;
    }

    var alFornoId = Convert.ToInt64(await Comando(conexion, transaccion,
        "SELECT id FROM cuenta WHERE iban = @iban", ("@iban", CUENTA_AL_FORNO)).ExecuteScalarAsync());

    var referencia = "BS" + RandomNumberGenerator.GetInt32(100_000_000).ToString("D8");
    await Comando(conexion, transaccion, "UPDATE cuenta SET saldo = saldo - @monto WHERE id = @id",
        ("@monto", monto), ("@id", cuentaId)).ExecuteNonQueryAsync();
    await Comando(conexion, transaccion, "UPDATE cuenta SET saldo = saldo + @monto WHERE id = @id",
        ("@monto", monto), ("@id", alFornoId)).ExecuteNonQueryAsync();
    await Comando(conexion, transaccion,
        @"INSERT INTO movimiento (cuenta_id, tipo, monto, descripcion, referencia)
          VALUES (@cliente, 'DEBITO', @monto, @descripcion, @referencia),
                 (@alForno, 'CREDITO', @monto, @descripcion, @referencia)",
        ("@cliente", cuentaId), ("@alForno", alFornoId), ("@monto", monto),
        ("@descripcion", descripcion), ("@referencia", referencia)).ExecuteNonQueryAsync();

    await transaccion.CommitAsync();
    return referencia;
}

// Descripción del pago: máximo 150 caracteres (como la columna de la base)
string Descripcion(string? texto)
{
    var d = string.IsNullOrEmpty(texto) ? "Pago" : texto;
    return d.Length > 150 ? d[..150] : d;
}


// ---------------------------------------------------------------------
// GET / · el banco está activo
// ---------------------------------------------------------------------
app.MapGet("/", () => Results.Json(new { servicio = "Banco Simulado", estado = "activo" }));


// ---------------------------------------------------------------------
// Pago con tarjeta: número, vencimiento (MM/AA), CVV y monto
// ---------------------------------------------------------------------
app.MapPost("/pagos/tarjeta", async (PagoTarjeta datos) =>
{
    var numero = (datos.Numero ?? "").Replace(" ", "");
    var vencimiento = datos.Vencimiento ?? "";
    var cvv = datos.Cvv ?? "";

    // 1. Formato
    if (!Regex.IsMatch(numero, "^[0-9]{15,16}$"))
        return Rechazar("El número de tarjeta no es válido", 400);
    if (!Regex.IsMatch(vencimiento, "^(0[1-9]|1[0-2])/[0-9]{2}$"))
        return Rechazar("El vencimiento debe ser MM/AA", 400);
    if (datos.Monto is not > 0)
        return Rechazar("El monto no es válido", 400);

    // 2. Marca según los primeros dígitos
    var marca = MarcaDe(numero);
    if (marca is null)
        return Rechazar("Tarjeta no aceptada: solo Visa, MasterCard o American Express");
    if (!Regex.IsMatch(cvv, marca == "American Express" ? "^[0-9]{4}$" : "^[0-9]{3}$"))
        return Rechazar($"El CVV no es válido para una tarjeta {marca}");

    await using var conexion = await Conectar();

    // 3. ¿Existe la tarjeta con esos datos?
    string vencimientoBanco, cvvBanco;
    long cuentaId;
    await using (var comando = new MySqlCommand(
        "SELECT vencimiento, cvv, cuenta_id FROM tarjeta WHERE numero = @numero", conexion))
    {
        comando.Parameters.AddWithValue("@numero", numero);
        await using var fila = await comando.ExecuteReaderAsync();
        if (!await fila.ReadAsync())
            return Rechazar("La tarjeta no existe en el banco");
        vencimientoBanco = fila.GetString(0);
        cvvBanco = fila.GetString(1);
        cuentaId = Convert.ToInt64(fila.GetValue(2));
    }
    if (vencimientoBanco != vencimiento || cvvBanco != cvv)
        return Rechazar("Los datos de la tarjeta no coinciden");
    if (EstaVencida(vencimiento))
        return Rechazar("La tarjeta está vencida");

    // 4. Saldo y cobro
    var referencia = await Cobrar(conexion, cuentaId, datos.Monto.Value, Descripcion(datos.Descripcion));
    if (referencia is null)
        return Rechazar("Saldo insuficiente");
    return Results.Json(new { aprobado = true, referencia, marca, ultimos4 = numero[^4..] });
});


// ---------------------------------------------------------------------
// Pago con SINPE Móvil: número de teléfono y monto
// ---------------------------------------------------------------------
app.MapPost("/pagos/sinpe", async (PagoSinpe datos) =>
{
    var telefono = (datos.Telefono ?? "").Replace("-", "").Replace(" ", "");

    if (!Regex.IsMatch(telefono, "^[0-9]{8}$"))
        return Rechazar("El teléfono debe tener 8 dígitos", 400);
    if (datos.Monto is not > 0)
        return Rechazar("El monto no es válido", 400);

    await using var conexion = await Conectar();

    long cuentaId;
    await using (var comando = new MySqlCommand(
        "SELECT cuenta_id FROM sinpe_movil WHERE telefono = @telefono", conexion))
    {
        comando.Parameters.AddWithValue("@telefono", telefono);
        var resultado = await comando.ExecuteScalarAsync();
        if (resultado is null)
            return Rechazar("Ese teléfono no tiene SINPE Móvil en el banco");
        cuentaId = Convert.ToInt64(resultado);
    }

    var referencia = await Cobrar(conexion, cuentaId, datos.Monto.Value, Descripcion(datos.Descripcion));
    if (referencia is null)
        return Rechazar("Saldo insuficiente");
    return Results.Json(new { aprobado = true, referencia, ultimos4 = telefono[^4..] });
});


app.Run($"http://localhost:{Variable("PUERTO", "5001")}");


// ---------------------------------------------------------------------
// Datos que llegan en el cuerpo (JSON) de cada pago
// ---------------------------------------------------------------------
record PagoTarjeta(string? Numero, string? Vencimiento, string? Cvv, int? Monto, string? Descripcion);
record PagoSinpe(string? Telefono, int? Monto, string? Descripcion);
