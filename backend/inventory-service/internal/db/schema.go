package db

import (
	"context"
	"embed"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed ../../../backend/migrations/*.sql
var migrations embed.FS

// InitializeSchema runs all migrations to set up the database schema
func InitializeSchema(ctx context.Context, pool *pgxpool.Pool) error {
	// Read migration file
	migrationSQL, err := migrations.ReadFile("../../../backend/migrations/001_init_schema.sql")
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	// Execute migration
	_, err = pool.Exec(ctx, string(migrationSQL))
	if err != nil {
		return fmt.Errorf("failed to execute migration: %w", err)
	}

	return nil
}
