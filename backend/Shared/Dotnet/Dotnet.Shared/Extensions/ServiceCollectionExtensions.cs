using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Polly;
using Polly.Extensions.Http;
using Dotnet.Shared.Mongo;
using Dotnet.Shared.ServiceClients;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace Dotnet.Shared.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddHttpClients(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<MongoDbSettings>(configuration.GetSection("MongoDbSettings"));
            services.AddSingleton<IMongoClient>(sp =>
            {
                var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
                return new MongoClient(settings.ConnectionString);
            });

            services.AddScoped(sp =>
            {
                var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
                var client = sp.GetRequiredService<IMongoClient>();
                return client.GetDatabase(settings.DatabaseName);
            });

            //services.AddHttpClient<IProductServiceClient, ProductServiceClient>(client =>
            //{
            //    var baseUrl = configuration["ServiceUrls:CoreService"];
            //    client.BaseAddress = new Uri(baseUrl);
            //})
            //.AddPolicyHandler(HttpPolicyExtensions
            //    .HandleTransientHttpError()
            //    .WaitAndRetryAsync(3, retryAttempt =>
            //        TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)))) // Retry với backoff
            //.AddPolicyHandler(HttpPolicyExtensions
            //    .HandleTransientHttpError()
            //    .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));



            return services;
        }
    }
}
