using Microsoft.EntityFrameworkCore;

namespace GuitarTrek.Api.Data;

// Representa o banco. Cada DbSet<T> vira uma tabela (entram a partir do módulo #4).
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{

    
}
