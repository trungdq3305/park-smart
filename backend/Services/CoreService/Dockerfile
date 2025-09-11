# ----- Build stage -----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution và project
COPY backend/Services/CoreService/CoreService.sln ./Services/CoreService/
COPY backend/Services/CoreService/ ./Services/CoreService/
COPY backend/Shared/Dotnet/ ./Shared/Dotnet/

# Restore
WORKDIR /src/Services/CoreService
RUN dotnet restore CoreService.sln

# Build & publish
RUN dotnet publish CoreService.sln -c Release -o /app/publish

# ----- Runtime stage -----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CoreService.API.dll"]
