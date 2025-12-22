using Dotnet.Shared.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PaymentDtos
{
    namespace CoreService.Application.DTOs.PaymentDtos
    {
        public class BalanceDto
        {
            public string Currency { get; set; } = "VND";
            public long Available { get; set; }           // số dư hiện dùng được
            public long? Pending { get; set; }            // (nếu API trả)
            public string AccountType { get; set; } = "CASH";
            public DateTime FetchedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        }

        public class TransactionItemDto
        {
            [JsonPropertyName("_id")]
            public string Id { get; set; }
            public string Type { get; set; }              // Payment, TopUp, Disbursement...
            public string Channel { get; set; }           // Cards, EWallet, Other...
            public long Amount { get; set; }
            public string Currency { get; set; }
            public string Status { get; set; }            // SUCCEEDED / PENDING / FAILED
            public string Reference { get; set; }         // external_id / reference
            public DateTime Created { get; set; }
            public string SettlementStatus { get; set; }  // Settled / Pending (nếu có)
        }

        public class TransactionListDto
        {
            public int Count { get; set; }
            public IEnumerable<TransactionItemDto> Data { get; set; }
        }
        public class PaymentTotalsDto
        {
            public long Incoming { get; set; }
            public long Outgoing { get; set; }
            public string Currency { get; set; } = "VND";
            public int CountIncoming { get; set; }
            public int CountOutgoing { get; set; }
        }
    }

}
