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
            services.AddScoped<ITermAndPolicyRepository, TermAndPolicyRepository>();
            services.AddScoped<IFaqRepository, FaqRepository>();
            services.AddScoped<ICommentRepository, CommentRepository>();
            services.AddScoped<IFaqStatusRepository, FaqStatusRepository>();
            services.AddScoped<IPointMilestoneRepository, PointMilestoneRepository>();
            services.AddScoped<IOperatorPaymentAccountRepo, OperatorPaymentAccountRepo>();
            services.AddScoped<IPaymentRecordRepo, PaymentRecordRepo>();
            services.AddScoped<IRefundRecordRepo, RefundRecordRepo>();
            services.AddScoped<IImageRepository, ImageRepository>();
            services.AddScoped<IPromotionRepository, PromotionRepository>();
            services.AddScoped<IPromotionRuleRepository, PromotionRuleRepository>();
            services.AddScoped<IEventRepository, EventRepository>();
            services.AddScoped<IBlacklistRepository, BlacklistRepository>();
            services.AddScoped<IFavouriteParkingLotRepository, FavouriteParkingLotRepository>();
            services.AddScoped<IReportCategoryRepository, ReportCategoryRepository>();
            services.AddScoped<IReportRepository, ReportRepository>();
            return services;
        }
    }
}
