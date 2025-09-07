using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dotnet.Shared.RabbitMQ
{
    public interface IRabbitMQPublisher
    {
        void Publish<T>(string queueName, T message);
    }
}
