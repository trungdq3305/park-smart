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

        public async Task SendEmailConfirmationCodeAsync(string email, string code)
        {
            var subject = "Mã xác nhận tài khoản (OTP)";
            var body = $@"
        <h2>Mã xác nhận tài khoản của bạn</h2>
        <p>Chào bạn,</p>
        <p>Mã xác nhận (OTP) của bạn là:</p>
        <p style='font-size:24px; font-weight:bold; letter-spacing:4px;'>{code}</p>
        <p>Mã có hiệu lực trong 10 phút. Không chia sẻ mã với bất kỳ ai.</p>
        <p>Trân trọng,<br/>{_emailSettings.FromName}</p>";

            await SendEmailAsync(email, subject, body);
        }


        public async Task SendPasswordResetOtpAsync(string email, string code)
        {
            var subject = "Mã OTP đặt lại mật khẩu";
            var body = $@"
        <h2>Đặt lại mật khẩu</h2>
        <p>Chào bạn,</p>
        <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
        <p style='font-size:24px; font-weight:bold; letter-spacing:4px;'>{code}</p>
        <p>Mã có hiệu lực trong 10 phút. Không chia sẻ mã với bất kỳ ai.</p>
        <p>Trân trọng,<br/>{_emailSettings.FromName}</p>";

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
        public async Task SendInitialPasswordAsync(string email, string plainPassword, string note)
        {
            var subject = "Tài khoản ParkSmart – Mật khẩu tạm thời";
            var body = $@"
        <h2>Chào mừng bạn đến với ParkSmart</h2>
        <p>Tài khoản của bạn đã được tạo bằng Google Sign-In.</p>
        <p>Nếu bạn muốn đăng nhập theo cách thông thường (email & mật khẩu), 
        hãy dùng mật khẩu dưới đây và đổi ngay sau khi đăng nhập để bảo mật:</p>
        <p style='font-size:22px; font-weight:bold; letter-spacing:2px;'>{plainPassword}</p>
        <p>{note}</p>
        <p>Trân trọng,<br/>{_emailSettings.FromName}</p>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
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
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                // --- PHẦN XỬ LÝ LOGO TRỰC TIẾP ---
                // Lấy đường dẫn file logo từ project
                string logoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "logo-parksmart.png");

                // Tạo LinkedResource để nhúng ảnh vào HTML
                LinkedResource logoRes = new LinkedResource(logoPath, "image/png");
                logoRes.ContentId = "logo_id"; // ID này dùng để gọi trong thẻ <img src='cid:logo_id'>

                // Tạo nội dung HTML hoàn chỉnh
                string finalHtml = $@"
        <div style='background-color: #f0f4f1; padding: 20px; font-family: Arial, sans-serif;'>
            <table align='center' width='600' style='background: white; border-radius: 15px; overflow: hidden; border: 1px solid #d1e7dd;'>
                <tr style='background-color: #ffffff; text-align: center;'>
                    <td style='padding: 20px;'>
                        <img src='cid:logo_id' width='100' alt='ParkSmart Logo' />
                        <h2 style='color: #2e7d32; margin: 10px 0;'>ParkSmart</h2>
                    </td>
                </tr>
                <tr>
                    <td style='padding: 30px; color: #333;'>
                        {htmlContent}
                    </td>
                </tr>
                <tr style='background-color: #f9fbf9; text-align: center; font-size: 12px; color: #777;'>
                    <td style='padding: 20px;'>
                        <p>© 2025 ParkSmart - Giải pháp đỗ xe thông minh</p>
                    </td>
                </tr>
            </table>
        </div>";

                AlternateView alternateView = AlternateView.CreateAlternateViewFromString(finalHtml, null, "text/html");
                alternateView.LinkedResources.Add(logoRes);
                mailMessage.AlternateViews.Add(alternateView);
                // ---------------------------------

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email sent to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email");
                throw;
            }
        }
    }
}
