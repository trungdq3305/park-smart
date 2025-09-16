using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AuthDtos
{
    public class ConfirmForgotRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // OTP 6 số
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

}
