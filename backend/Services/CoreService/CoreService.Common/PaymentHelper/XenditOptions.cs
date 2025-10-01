using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Common.PaymentHelper
{
    public class XenditOptions
    {
        public string SecretKey { get; set; }
        public string PublicKey { get; set; }
        public string ApiBaseUrl { get; set; }
        public string WebhookVerifyToken { get; set; }
    }

}
