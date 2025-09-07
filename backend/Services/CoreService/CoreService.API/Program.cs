using CoreService.Application;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Common.Helpers;
using CoreService.Repository;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using Dotnet.Shared.Extensions;
using Dotnet.Shared.Mongo;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services
.AddRepository()
.AddService();
builder.Services.AddScoped<JwtTokenHelper>();
// Authentication + JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true, // Nên b?t ?? ki?m tra token h?t h?n
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),

            RoleClaimType = "role",   
            NameClaimType = "email"   //User.Identity.Name = email
        };
    });

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

    //option.AddSecurityRequirement(new OpenApiSecurityRequirement
    //{
    //    {
    //        new OpenApiSecurityScheme
    //        {
    //            Reference = new OpenApiReference
    //            {
    //                Type = ReferenceType.SecurityScheme,
    //                Id = "Bearer"
    //            }
    //        },
    //        Array.Empty<string>()
    //    }
    //});
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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();   // ? parse token tr??c
app.UseAuthorization();    // ? check role/claim
//app.UseAuthMiddleware();

app.MapControllers();

app.Run();
