using PetraKids.Application.Dtos;
using PetraKids.Domain.Entities;

namespace PetraKids.Application;

public static class Mappings
{
    public static SectionDto ToDto(this Section s) =>
        new(s.Id, s.Name, s.Slug, s.Color, s.Icon, s.CodePrefix, s.DisplayOrder, s.Lessons?.Count ?? 0);

    public static AgeGroupDto ToDto(this AgeGroup a) =>
        new(a.Id, a.Name, a.Code, a.MinAge, a.DisplayOrder);

    public static LessonFileDto ToDto(this LessonFile f) =>
        new(f.Id, f.AgeGroupId, f.AgeGroup?.Name ?? "", f.AgeGroup?.Code ?? "", f.Url);

    public static LessonDto ToDto(this Lesson l) =>
        new(l.Id, l.SectionId, l.Section?.Name ?? "", l.Section?.Color ?? "#6366F1",
            l.Number, l.Title, l.DisplayOrder,
            l.Files.OrderBy(f => f.AgeGroup?.DisplayOrder ?? 0).Select(f => f.ToDto()).ToList());
}
