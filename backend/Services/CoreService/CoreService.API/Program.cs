using CoreService.Application;
using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.DTOs.EmailDtos;
using CoreService.Common.Helpers;
using CoreService.Repository;
using Dotnet.Shared.Extensions;
using Dotnet.Shared.Mongo;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.OAuth;           // + add
using Microsoft.AspNetCore.HttpOverrides;                  // + add
using Microsoft.AspNetCore.WebUtilities;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
// Add services to the container.
builder.Services.AddHttpContextAccessor();
builder.Services
.AddRepository()
.AddService();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddScoped<JwtTokenHelper>();
// Authentication + JWT

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
.AddGoogle(options =>
{
    var googleAuth = builder.Configuration.GetSection("Authentication:Google").Get<GoogleAuthSettings>();
    options.ClientId = googleAuth.ClientId;
    options.ClientSecret = googleAuth.ClientSecret;
    options.CallbackPath = "/signin-google";   // ?úng, KHÔNG ??i
    options.SaveTokens = true;

    // ?? QUAN TR?NG: ép redirect_uri g?i lên Google = domain public (fix d?t ?i?m)
    options.Events = new OAuthEvents
    {
        OnRedirectToAuthorizationEndpoint = ctx =>
        {
            var fixedRedirect = "https://parksmarthcmc.io.vn" + options.CallbackPath;

            var uri = new Uri(ctx.RedirectUri);
            var query = QueryHelpers.ParseQuery(uri.Query);
            var qb = new QueryBuilder();
            foreach (var kv in query)
            {
                if (kv.Key.Equals("redirect_uri", StringComparison.OrdinalIgnoreCase))
                    qb.Add("redirect_uri", fixedRedirect);
                else
                    foreach (var v in kv.Value) qb.Add(kv.Key, v);
            }

            var final = $"{uri.Scheme}://{uri.Host}{uri.AbsolutePath}{qb.ToQueryString()}";
            ctx.Response.Redirect(final);
            return Task.CompletedTask;
        }
    };
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.Name = "AuthCookie";
    options.LoginPath = "/api/auth/login"; // ???ng d?n m?c ??nh khi c?n ??ng nh?p
    options.LogoutPath = "/api/auth/logout"; // ???ng d?n m?c ??nh khi ??ng xu?t
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
});

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true; // ? Không ?? framework t? return 400
});
var app = builder.Build();
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

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();   // ? parse token tr??c
app.UseAuthorization();    // ? check role/claim
//app.UseAuthMiddleware();

app.MapControllers();

app.Run();
