using CoreService.Repository.Interfaces;
using CoreService.Repository.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository
{
    public static class DependencyInjections
    {
        public static IServiceCollection AddRepository(this IServiceCollection services)
        {

            services.AddScoped<IAccountRepository, AccountRepository>();
            services.AddScoped<IParkingLotOperatorRepository, ParkingLotOperatorRepository>();
            services.AddScoped<IDriverRepository, DriverRepository>();
            services.AddScoped<ICityAdminRepository, CityAdminRepository>();

            return services;
        }
    }
}
