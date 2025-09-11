# ----- Build stage -----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution và tất cả project cần thiết
COPY Services/CoreService/CoreService.sln ./Services/CoreService/
COPY Services/CoreService/ ./Services/CoreService/
COPY Shared/Dotnet/ ./Shared/Dotnet/

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
