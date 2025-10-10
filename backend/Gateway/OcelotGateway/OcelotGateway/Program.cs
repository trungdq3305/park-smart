using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ??c c?u hình ocelot.json
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Ho?c các domain khác c?a frontend
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
builder.Services.AddOcelot();

var app = builder.Build();
// Redirect t?t c? HTTP sang HTTPS (gi? 80 ch? ?? redirect)
app.Use(async (ctx, next) =>
{
    if (!ctx.Request.IsHttps)
    {
        var host = ctx.Request.Host.Host;
        var path = $"{ctx.Request.Path}{ctx.Request.QueryString}";
        ctx.Response.Redirect($"https://{host}{path}", permanent: true);
        return;
    }
    await next();
});
app.UseCors("AllowAll");
await app.UseOcelot();   // Ocelot vào pipeline ??u

app.Run();
