using CoreService.Repository.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Common.Helpers
{
    public class JwtTokenHelper
    {
        private readonly IConfiguration _config;

        public JwtTokenHelper(IConfiguration config)
        {
            _config = config;
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
            var claims = new[]
            {
                new Claim("id", acc.Id.ToString()),   
                new Claim("email", acc.Email),        
                new Claim("role", roleName)           
            };

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
