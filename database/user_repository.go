package database

import (
	"database/sql"
	"fmt"
	"time"

	"bird/models"
)

// UserRepository handles user database operations
type UserRepository struct {
	db *DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user
func (r *UserRepository) Create(nickname string) error {
	query := `INSERT INTO users (nickname) VALUES (?)`
	_, err := r.db.Exec(query, nickname)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

// Exists checks if a user exists
func (r *UserRepository) Exists(nickname string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE nickname = ?)`
	err := r.db.QueryRow(query, nickname).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}
	return exists, nil
}

// UpdateLastLogin updates the user's last login time
func (r *UserRepository) UpdateLastLogin(nickname string) error {
	query := `UPDATE users SET last_login_at = ? WHERE nickname = ?`
	_, err := r.db.Exec(query, time.Now(), nickname)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}
	return nil
}

// UpdateStats updates user statistics after a game
func (r *UserRepository) UpdateStats(nickname string, score int) error {
	query := `UPDATE users 
		SET total_games = total_games + 1,
		    total_score = total_score + ?,
		    highest_score = MAX(highest_score, ?)
		WHERE nickname = ?`
	_, err := r.db.Exec(query, score, score, nickname)
	if err != nil {
		return fmt.Errorf("failed to update user stats: %w", err)
	}
	return nil
}

// GetByNickname retrieves a user by nickname
func (r *UserRepository) GetByNickname(nickname string) (*models.User, error) {
	var user models.User
	var createdAt, lastLoginAt string
	query := `SELECT nickname, datetime(created_at), datetime(last_login_at), total_games, total_score, highest_score
		FROM users WHERE nickname = ?`
	err := r.db.QueryRow(query, nickname).Scan(
		&user.Nickname,
		&createdAt,
		&lastLoginAt,
		&user.TotalGames,
		&user.TotalScore,
		&user.HighestScore,
	)
	if err == sql.ErrNoRows {
		return nil, models.ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return &user, nil
}
