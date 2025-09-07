using CoreService.Application.Applications;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Repositories;
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

            return services;
        }
    }
}
