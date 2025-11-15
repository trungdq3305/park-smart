using CoreService.Application;
using CoreService.Application.Applications;
using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.DTOs.EmailDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Common.PaymentHelper;
using CoreService.Repository;
using Dotnet.Shared.Extensions;
using Dotnet.Shared.Mongo;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using System.Security.Claims;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/keys"))
    .SetApplicationName("CoreServiceAuth");
builder.Services.AddMemoryCache();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
// Add services to the container.
builder.Services.AddHttpContextAccessor();
builder.Services
.AddRepository()
.AddService();
builder.Services.Configure<XenditOptions>(builder.Configuration.GetSection("Xendit"));

builder.Services.AddHttpClient<IXenditClient, XenditClient>((sp, http) =>
{
    var opt = sp.GetRequiredService<IOptions<XenditOptions>>().Value;
    http.BaseAddress = new Uri(opt.ApiBaseUrl);
    var basic = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{opt.SecretKey}:"));
    http.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", basic);
    http.DefaultRequestHeaders.Accept.Add(
        new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Ch? cho phép URL này
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // <-- R?T QUAN TR?NG KHI CÓ XÁC TH?C
    });
});
builder.Services.AddScoped<JwtTokenHelper>();
// Authentication + JWT
builder.Services.Configure<AppSecurityOptions>(
    builder.Configuration.GetSection("AppSecurity"));
// Authentication + JWT + Google + Cookie
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = "email"
    };
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, o =>
{
    o.Cookie.Name = "AuthCookie";
    o.Cookie.SameSite = SameSiteMode.None;
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    o.Cookie.Path = "/";                 // <- THÊM DÒNG NÀY
})
.AddGoogle(o =>
{
    o.ClientId = builder.Configuration["Authentication:Google:ClientId"];
    o.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    o.CallbackPath = "/signin-google";
    o.SaveTokens = true;

    o.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    o.CorrelationCookie.SameSite = SameSiteMode.None;
    o.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    o.CorrelationCookie.Path = "/";

    o.UsePkce = false; // T?M TH?I. Khi ch?y ok thì ??i thành true.

    // Log l?i rõ ràng (không ép redirect_uri!)
    o.Events = new Microsoft.AspNetCore.Authentication.OAuth.OAuthEvents
    {
        OnRemoteFailure = ctx =>
        {
            var msg = Uri.EscapeDataString(ctx.Failure?.Message ?? "unknown");
            ctx.Response.Redirect("/api/auths/google-callback?error=" + msg);
            ctx.HandleResponse();
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAutoMapper(typeof(MappingProfile));
// Swagger + JWT support
builder.Services.AddSwaggerGen(option =>
{
    option.DescribeAllParametersInCamelCase();
    option.ResolveConflictingActions(conf => conf.First());

    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Enter JWT token with **Bearer {your token}**",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    option.OperationFilter<AuthorizeCheckOperationFilter>(); // <-- Thêm dòng này

});

builder.Services.AddHttpClients(builder.Configuration);

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>(); // ? Add filter ?? check ModelState
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddSingleton<IFileStorageService, FileStorageService>();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true; // ? Không ?? framework t? return 400
});
var app = builder.Build();
var uploadRoot = app.Configuration["Upload:RootPath"] ?? "/app/uploads";
Directory.CreateDirectory(uploadRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadRoot),
    RequestPath = app.Configuration["Upload:RequestPath"] ?? "/uploads"
});
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost,
    KnownNetworks = { },   // ch?y Docker nên ?? tr?ng
    KnownProxies = { }
});
app.Use((ctx, next) =>
{
    var proto = ctx.Request.Headers["X-Forwarded-Proto"].ToString();
    var host = ctx.Request.Headers["X-Forwarded-Host"].ToString();
    if (!string.IsNullOrEmpty(proto)) ctx.Request.Scheme = proto;
    if (!string.IsNullOrEmpty(host)) ctx.Request.Host = new HostString(host);
    return next();
});
app.MapGet("/__whoami", (HttpRequest r) => Results.Json(new
{
    r.Scheme,
    Host = r.Host.ToString(),
    XFP = r.Headers["X-Forwarded-Proto"].ToString(),
    XFHost = r.Headers["X-Forwarded-Host"].ToString()
}));

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    MongoCollectionInitializer.InitializeCollections(database, "CoreService.Repository.Models");
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
//app.UseHttpsRedirection();

app.UseCors("AllowSpecificOrigin");
app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();   // ? parse token tr??c
app.UseAuthorization();    // ? check role/claim
//app.UseAuthMiddleware();

app.MapControllers();

app.Run();
