# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj và restore
COPY backend/Gateway/OcelotGateway/OcelotGateway/OcelotGateway.csproj ./OcelotGateway/
RUN dotnet restore ./OcelotGateway/OcelotGateway.csproj

# Copy toàn bộ source
COPY backend/Gateway/OcelotGateway/OcelotGateway ./OcelotGateway/

# Publish
WORKDIR /src/OcelotGateway
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "OcelotGateway.dll"]
