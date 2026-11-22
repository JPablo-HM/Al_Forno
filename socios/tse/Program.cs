// =====================================================================
// TSE SIMULADO                           C# .NET (Minimal API) · puerto 5004
//
// Simula el Tribunal Supremo de Elecciones: con el tipo y el número de
// identificación devuelve el nombre completo de la persona. Tiene su
// PROPIA base de datos (tse_simulado), aparte de la base de AL FORNO.
// Solo lo llama la API de AL FORNO (Node); la app nunca habla con él.
//
// Métodos:
//   GET /personas/{tipo}/{numero}   tipo: cedula, dimex o pasaporte
//   GET /                           el TSE está activo (para revisar que corre)
//
// Respuestas:
//   200 { tipo, numero, nombre_completo }   la persona existe
//   404 { mensaje }                          no hay nadie con esa identificación
//   400 { mensaje }                          tipo o número con formato incorrecto
//
// Cómo arrancarlo (en socios/tse/):
//   dotnet run
// =====================================================================
using System.Text.RegularExpressions;
using MySqlConnector;

DotNetEnv.Env.Load(); // lee socios/tse/.env (usuario y contraseña de MySQL)

var cadenaConexion = new MySqlConnectionStringBuilder
{
    Server = Variable("DB_HOST", "localhost"),
    Port = uint.Parse(Variable("DB_PORT", "3306")),
    UserID = Variable("DB_USER", "root"),
    Password = Variable("DB_PASSWORD", ""),
    Database = "tse_simulado",
}.ConnectionString;

// Formato de cada tipo de identificación: (expresión regular, mensaje si no cumple)
var formatos = new Dictionary<string, (string regla, string mensaje)>
{
    ["cedula"] = ("^[1-9][0-9]{8}$", "La cédula debe tener 9 dígitos, sin guiones"),
    ["dimex"] = ("^[0-9]{11,12}$", "El DIMEX debe tener 11 o 12 dígitos"),
    ["pasaporte"] = ("^[A-Z0-9]{6,12}$", "El pasaporte debe tener de 6 a 12 letras o números"),
};

var app = WebApplication.CreateBuilder(args).Build();

// Valor del .env (o el valor por defecto si no está)
string Variable(string nombre, string porDefecto) =>
    Environment.GetEnvironmentVariable(nombre) ?? porDefecto;


// GET / · el TSE está activo
app.MapGet("/", () => Results.Json(new { servicio = "TSE Simulado", estado = "activo" }));


// GET /personas/{tipo}/{numero} · nombre de la persona
app.MapGet("/personas/{tipo}/{numero}", async (string tipo, string numero) =>
{
    tipo = tipo.ToLowerInvariant();
    numero = numero.Trim().ToUpperInvariant(); // pasaporte: 'a1234567' → 'A1234567'

    // 1. Formato según el tipo
    if (!formatos.TryGetValue(tipo, out var formato))
        return Results.Json(new { mensaje = "Tipo de identificación no válido" }, statusCode: 400);
    if (!Regex.IsMatch(numero, formato.regla))
        return Results.Json(new { mensaje = formato.mensaje }, statusCode: 400);

    // 2. Buscar en el padrón
    await using var conexion = new MySqlConnection(cadenaConexion);
    await conexion.OpenAsync();
    await using var comando = new MySqlCommand(
        "SELECT nombre_completo FROM persona WHERE tipo = @tipo AND numero = @numero", conexion);
    comando.Parameters.AddWithValue("@tipo", tipo);
    comando.Parameters.AddWithValue("@numero", numero);
    var nombre = (string?)await comando.ExecuteScalarAsync();

    if (nombre is null)
        return Results.Json(new { mensaje = "No existe una persona con esa identificación" }, statusCode: 404);
    return Results.Json(new { tipo, numero, nombre_completo = nombre });
});


app.Run($"http://localhost:{Variable("PUERTO", "5004")}");
