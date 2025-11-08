package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

// DB wraps the sql.DB connection
type DB struct {
	*sql.DB
}

// NewDB creates a new database connection
func NewDB(path string, maxOpenConns, maxIdleConns int, connMaxLifetime time.Duration) (*DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxIdleConns)
	db.SetConnMaxLifetime(connMaxLifetime)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{db}, nil
}

// InitSchema initializes the database schema
func (db *DB) InitSchema() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			nickname TEXT PRIMARY KEY,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			total_games INTEGER DEFAULT 0,
			total_score INTEGER DEFAULT 0,
			highest_score INTEGER DEFAULT 0
		)`,

		`CREATE TABLE IF NOT EXISTS scores (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			nickname TEXT NOT NULL,
			score INTEGER NOT NULL,
			difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'normal', 'hard')),
			game_duration INTEGER DEFAULT 0,
			obstacles_passed INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			user_agent TEXT,
			ip_address TEXT,
			FOREIGN KEY (nickname) REFERENCES users(nickname) ON DELETE CASCADE
		)`,

		`CREATE INDEX IF NOT EXISTS idx_scores_difficulty ON scores(difficulty)`,
		`CREATE INDEX IF NOT EXISTS idx_scores_nickname ON scores(nickname)`,
		`CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("failed to execute schema query: %w", err)
		}
	}

	return nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}
