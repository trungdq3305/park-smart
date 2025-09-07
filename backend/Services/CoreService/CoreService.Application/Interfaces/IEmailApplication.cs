using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IEmailApplication
    {
        Task SendEmailConfirmationAsync(string email, string confirmationLink);
        Task SendPasswordResetAsync(string email, string resetLink);
        Task SendPasswordChangeConfirmationAsync(string email, string confirmationLink);
        Task SendEmailAsync(string toEmail, string subject, string body);
    }
}
