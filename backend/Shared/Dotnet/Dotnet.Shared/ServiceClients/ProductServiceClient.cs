using Dotnet.Shared.DTOs;
using Dotnet.Shared.ServiceClients;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;

namespace Dotnet.Shared.ServiceClients
{
    public class ProductServiceClient : IProductServiceClient
    {
        //private readonly HttpClient _httpClient;

        //public ProductServiceClient(HttpClient httpClient)
        //{
        //    _httpClient = httpClient;
        //}

        //public async Task<IEnumerable<ProductDto>> GetProductsAsync()
        //{
        //    var response = await _httpClient.GetFromJsonAsync<IEnumerable<ProductDto>>("/api/products");
        //    return response ?? Enumerable.Empty<ProductDto>();
        //}
    }
}
