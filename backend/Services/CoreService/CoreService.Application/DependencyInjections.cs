using CoreService.Application.Applications;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Repositories;
using Dotnet.Shared.ServiceClients;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application
{
    public static class DependencyInjections
    {
        public static IServiceCollection AddService(this IServiceCollection services)
        {
            services.AddScoped<IAuthApplication, AuthApplication>();
            services.AddScoped<IEmailApplication, EmailApplication>();
            services.AddScoped<IAccountApplication, AccountApplication>();
            services.AddScoped<IDriverApplication, DriverApplication>();
            services.AddScoped<IOperatorApplication, OperatorApplication>();
            services.AddScoped<IAdminApplication, AdminApplication>();
            services.AddHttpClient<IParkingServiceClient, ParkingServiceClient>(c =>
            {
                c.BaseAddress = new Uri("https://parksmarthcmc.io.vn"); // gọi nội bộ qua docker network
                c.Timeout = TimeSpan.FromSeconds(10);
            });
            return services;
        }
    }
}
