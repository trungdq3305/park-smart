using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Common.Helpers
{
    public static class OtpHelper
    {
        // Lưu ý: đặt trong config 1 "pepper" (bí mật server)
        public static string ComputeHash(string code, string accountId, string pepper)
        {
            // hash = SHA256(pepper + ":" + accountId + ":" + code)
            using var sha = SHA256.Create();
            var raw = $"{pepper}:{accountId}:{code}";
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes); // uppercase hex
        }

        public static string Generate6DigitCode()
        {
            // Giữ số 0 ở đầu (ví dụ 004231) – luôn 6 ký tự
            Span<byte> buf = stackalloc byte[4];
            RandomNumberGenerator.Fill(buf);
            // Lấy giá trị 0..999999
            int val = BitConverter.ToInt32(buf) & 0x7FFFFFFF;
            val %= 1_000_000;
            return val.ToString("D6");
        }

        public static bool FixedTimeEquals(string aHex, string bHex)
        {
            if (aHex == null || bHex == null || aHex.Length != bHex.Length) return false;
            int diff = 0;
            for (int i = 0; i < aHex.Length; i++)
                diff |= aHex[i] ^ bHex[i];
            return diff == 0;
        }
    }
    public class AppSecurityOptions
    {
        public string EmailOtpPepper { get; set; }
    }
}
