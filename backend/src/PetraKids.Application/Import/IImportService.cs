using PetraKids.Application.Dtos;

namespace PetraKids.Application.Import;

public interface IImportService
{
    Task<ImportResult> ImportAsync(ImportInput input, CancellationToken ct = default);
}
