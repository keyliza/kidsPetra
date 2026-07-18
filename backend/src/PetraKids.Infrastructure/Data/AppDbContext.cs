using Microsoft.EntityFrameworkCore;
using PetraKids.Domain.Entities;

namespace PetraKids.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<AgeGroup> AgeGroups => Set<AgeGroup>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<LessonFile> LessonFiles => Set<LessonFile>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Section>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(140).IsRequired();
            e.Property(x => x.Color).HasMaxLength(9).IsRequired();
            e.Property(x => x.Icon).HasMaxLength(60).IsRequired();
            e.Property(x => x.CodePrefix).HasMaxLength(10);
            e.HasIndex(x => x.Slug).IsUnique();
        });

        b.Entity<AgeGroup>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(60).IsRequired();
            e.Property(x => x.Code).HasMaxLength(2).IsRequired();
            e.HasIndex(x => x.Code).IsUnique();
        });

        b.Entity<Lesson>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Section)
                .WithMany(s => s.Lessons)
                .HasForeignKey(x => x.SectionId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.SectionId, x.Number });
        });

        b.Entity<LessonFile>(e =>
        {
            e.Property(x => x.Url).HasMaxLength(1000);
            e.Property(x => x.StoragePath).HasMaxLength(1000);
            e.HasOne(x => x.Lesson)
                .WithMany(l => l.Files)
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.AgeGroup)
                .WithMany(a => a.Files)
                .HasForeignKey(x => x.AgeGroupId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.LessonId, x.AgeGroupId }).IsUnique();
        });

        b.Entity<User>(e =>
        {
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Role).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
        });

        b.Entity<RefreshToken>(e =>
        {
            e.Property(x => x.Token).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.Token).IsUnique();
        });

        SeedData.Apply(b);
    }
}
