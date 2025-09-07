using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Dotnet.Shared.Mongo
{
    public static class MongoCollectionInitializer
    {
        public static void InitializeCollections(IMongoDatabase database, string modelsNamespace)
        {
            var assembly = Assembly.Load("CoreService.Repository"); // Tên Assembly chứa Models
            var modelTypes = assembly.GetTypes()
                .Where(t => t.IsClass && t.Namespace != null && t.Namespace.StartsWith(modelsNamespace));


            foreach (var type in modelTypes)
            {
                var collectionName = type.Name;

                // Kiểm tra nếu collection chưa tồn tại
                var filter = new BsonDocument("name", collectionName);
                var collections = database.ListCollections(new ListCollectionsOptions { Filter = filter });
                if (!collections.Any())
                {
                    database.CreateCollection(collectionName);
                }
            }
        }
    }
}
