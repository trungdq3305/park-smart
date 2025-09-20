using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IEmailApplication
    {
        Task SendEmailConfirmationCodeAsync(string email, string confirmationLink);
        Task SendPasswordResetOtpAsync(string email, string code);
        Task SendPasswordChangeConfirmationAsync(string email, string confirmationLink);
        Task SendInitialPasswordAsync(string email, string plainPassword, string note);
        Task SendEmailAsync(string toEmail, string subject, string body);
    }
}
