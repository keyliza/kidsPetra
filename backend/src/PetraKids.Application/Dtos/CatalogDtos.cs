namespace PetraKids.Application.Dtos;

public record AgeGroupDto(int Id, string Name, string Code, int MinAge, int DisplayOrder);

public record SectionDto(int Id, string Name, string Slug, string Color, string Icon, string CodePrefix, int DisplayOrder, int LessonCount);

public record LessonFileDto(int Id, int AgeGroupId, string AgeGroupName, string AgeGroupCode, string? Url);

public record LessonDto(int Id, int SectionId, string SectionName, string SectionColor, int Number, string Title, int DisplayOrder, IReadOnlyList<LessonFileDto> Files);
