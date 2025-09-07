using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace Dotnet.Shared.RabbitMQ
{
    public class RabbitMQPublisher : IRabbitMQPublisher, IDisposable
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private bool _disposed;

        public RabbitMQPublisher(string hostName = "localhost")
        {
            var factory = new ConnectionFactory()
            {
                HostName = hostName,
                DispatchConsumersAsync = true // tốt hơn cho async consumer
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
        }

        public void Publish<T>(string queueName, T message)
        {
            if (_disposed)
                throw new ObjectDisposedException(nameof(RabbitMQPublisher));

            // Queue durable để giữ lại khi restart
            _channel.QueueDeclare(queue: queueName,
                                  durable: true,
                                  exclusive: false,
                                  autoDelete: false,
                                  arguments: null);

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var props = _channel.CreateBasicProperties();
            props.DeliveryMode = 2; // 2 = Persistent

            _channel.BasicPublish(exchange: "",
                                  routingKey: queueName,
                                  basicProperties: props,
                                  body: body);
        }

        public void Dispose()
        {
            if (_disposed) return;

            _channel?.Close();
            _connection?.Close();
            _channel?.Dispose();
            _connection?.Dispose();
            _disposed = true;
        }
    }
}
