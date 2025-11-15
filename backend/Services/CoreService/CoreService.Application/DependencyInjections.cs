using CoreService.Application.Applications;
using CoreService.Application.DTOs.CommentDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Common.PaymentHelper;
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
            services.AddScoped<IEmailApplication, EmailApplication>();
            services.AddScoped<IAccountApplication, AccountApplication>();
            services.AddScoped<IDriverApplication, DriverApplication>();
            services.AddScoped<IOperatorApplication, OperatorApplication>();
            services.AddScoped<IAdminApplication, AdminApplication>();
            //services.AddHttpClient<IParkingServiceClient, ParkingServiceClient>(c =>
            //{
            //    c.BaseAddress = new Uri("https://parksmarthcmc.io.vn"); // gọi nội bộ qua docker network
            //    c.Timeout = TimeSpan.FromSeconds(10);
            //});
            services.AddScoped<ITermPolicyApplication, TermPolicyApplication>();
            services.AddScoped<AccountDisplayHelper>();
            services.AddScoped<IFaqApplication, FaqApplication>();
            services.AddScoped<ICommentApplication, CommentApplication>();
            services.AddScoped<IPointMilestoneApplication, PointMilestoneApplication>();
            services.AddScoped<IPaymentApp, PaymentApp>();
            services.AddScoped<IXenditClient, XenditClient>();
            services.AddScoped<IXenditPlatformService, XenditPlatformService>();
            services.AddScoped<IImageApplication, ImageApplication>();
            services.AddScoped<IPromotionApplication, PromotionApplication>();
            services.AddScoped<IEventApplication, EventApplication>();
            services.AddScoped<IBlacklistApplication, BlacklistApplication>();
            services.AddScoped<IFavouriteParkingLotApplication, FavouriteParkingLotApplication>();
            services.AddScoped<IReportCategoryApplication, ReportCategoryApplication>();
            services.AddScoped<IReportApplication, ReportApplication>();
            services.AddScoped<IAddressApiService, AddressApiService>();
            services.AddScoped<IParkingLotApiService, ParkingLotApiService>();
            return services;
        }
    }
}
