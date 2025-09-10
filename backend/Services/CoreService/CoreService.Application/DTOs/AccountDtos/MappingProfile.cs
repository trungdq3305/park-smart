using AutoMapper;
using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Account → AccountDetailDto (map cơ bản)
            CreateMap<Account, AccountDetailDto>()
                .ForMember(dest => dest.RoleName, opt => opt.Ignore()) // set thủ công
                .ForMember(dest => dest.DriverDetail, opt => opt.Ignore())
                .ForMember(dest => dest.OperatorDetail, opt => opt.Ignore())
                .ForMember(dest => dest.AdminDetail, opt => opt.Ignore());

            // Driver → DriverDto
            CreateMap<Driver, DriverDto>();

            // Operator → OperatorDto
            CreateMap<ParkingLotOperator, OperatorDto>();

            // Admin → AdminDto
            CreateMap<CityAdmin, AdminDto>();
        }
    }
}
