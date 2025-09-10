using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CoreService.Common.Helpers
{
    public class JwtTokenHelper
    {
        private readonly IConfiguration _config;
        private readonly IDriverRepository _driverRepo;
        private readonly IParkingLotOperatorRepository _operatorRepo;
        private readonly ICityAdminRepository _adminRepo;

        public JwtTokenHelper(
            IConfiguration config,
            IDriverRepository driverRepo,
            IParkingLotOperatorRepository operatorRepo,
            ICityAdminRepository adminRepo)
        {
            _config = config;
            _driverRepo = driverRepo;
            _operatorRepo = operatorRepo;
            _adminRepo = adminRepo;
        }

        public string GenerateToken(Account acc)
        {
            string roleName = acc.RoleId switch
            {
                "68bee20c00a9410adb97d3a1" => "Driver",
                "68bee1f500a9410adb97d3a0" => "Operator",
                "68bee1c000a9410adb97d39f" => "Admin",
                _ => null
            };

            var claims = new List<Claim>
            {
                new Claim("id", acc.Id.ToString()),
                new Claim("email", acc.Email),
                new Claim("role", roleName),
                new Claim("phoneNumber", acc.PhoneNumber)
            };

            // Gắn thêm thông tin chi tiết dựa vào role
            if (roleName == "Driver")
            {
                var driver = _driverRepo.GetByAccountIdAsync(acc.Id).Result;
                if (driver != null)
                {
                    claims.Add(new Claim("driverId", driver.Id ?? ""));
                    claims.Add(new Claim("fullName", driver.FullName ?? ""));
                    claims.Add(new Claim("gender", driver.Gender.ToString()));
                    claims.Add(new Claim("licenseNumber", driver.DrivingLicenseNumber ?? ""));
                }
            }
            else if (roleName == "Operator")
            {
                var op = _operatorRepo.GetByAccountIdAsync(acc.Id).Result;
                if (op != null)
                {
                    claims.Add(new Claim("operatorId", op.Id ?? ""));
                    claims.Add(new Claim("fullName", op.FullName ?? ""));
                    claims.Add(new Claim("taxCode", op.TaxCode ?? ""));
                    claims.Add(new Claim("companyName", op.CompanyName ?? ""));
                    claims.Add(new Claim("contactEmail", op.ContactEmail ?? ""));
                }
            }
            else if (roleName == "Admin")
            {
                var admin = _adminRepo.GetByAccountIdAsync(acc.Id).Result;
                if (admin != null)
                {
                    claims.Add(new Claim("adminId", admin.Id ?? ""));
                    claims.Add(new Claim("fullName", admin.FullName ?? ""));
                    claims.Add(new Claim("department", admin.Department ?? ""));
                    claims.Add(new Claim("position", admin.Position ?? ""));
                }
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
