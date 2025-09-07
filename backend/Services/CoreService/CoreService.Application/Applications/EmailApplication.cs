using CoreService.Application.DTOs.EmailDtos;
using CoreService.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    internal class EmailApplication : IEmailApplication
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailApplication> _logger;

        public EmailApplication(IOptions<EmailSettings> emailSettings, ILogger<EmailApplication> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendEmailConfirmationAsync(string email, string confirmationLink)
        {
            var subject = "Xác nhận tài khoản";
            var body = $@"
                <h2>Xác nhận tài khoản của bạn</h2>
                <p>Chào bạn,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào liên kết bên dưới để xác nhận email:</p>
                <p><a href='{confirmationLink}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Xác nhận Email</a></p>
                <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
                <p>Trân trọng,<br/>{_emailSettings.FromName}</p>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetAsync(string email, string resetLink)
        {
            var subject = "Đặt lại mật khẩu";
            var body = $@"
                <h2>Đặt lại mật khẩu</h2>
                <p>Chào bạn,</p>
                <p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu:</p>
                <p><a href='{resetLink}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Đặt lại mật khẩu</a></p>
                <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordChangeConfirmationAsync(string email, string confirmationLink)
        {
            var subject = "Xác nhận thay đổi mật khẩu";
            var body = $@"
                <h2>Xác nhận thay đổi mật khẩu</h2>
                <p>Chào bạn,</p>
                <p>Nhấn vào liên kết bên dưới để xác nhận thay đổi:</p>
                <p><a href='{confirmationLink}' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Xác nhận</a></p>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
                {
                    EnableSsl = _emailSettings.EnableSsl,
                    Credentials = new NetworkCredential(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail}");
                throw;
            }
        }
    }
}
