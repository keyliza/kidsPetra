# ── Build ────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restaurar por capas para aprovechar la caché
COPY PetraKids.slnx .
COPY src/PetraKids.Domain/*.csproj src/PetraKids.Domain/
COPY src/PetraKids.Application/*.csproj src/PetraKids.Application/
COPY src/PetraKids.Infrastructure/*.csproj src/PetraKids.Infrastructure/
COPY src/PetraKids.Api/*.csproj src/PetraKids.Api/
RUN dotnet restore PetraKids.slnx

COPY . .
RUN dotnet publish src/PetraKids.Api -c Release -o /app --no-restore

# ── Runtime ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "PetraKids.Api.dll"]
