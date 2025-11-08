package models

import (
	"time"
)

// User represents a registered user
type User struct {
	Nickname     string    `json:"nickname" db:"nickname"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	LastLoginAt  time.Time `json:"last_login_at" db:"last_login_at"`
	TotalGames   int       `json:"total_games" db:"total_games"`
	TotalScore   int       `json:"total_score" db:"total_score"`
	HighestScore int       `json:"highest_score" db:"highest_score"`
}

// Score represents a game score entry
type Score struct {
	ID              int64     `json:"id" db:"id"`
	Nickname        string    `json:"nickname" db:"nickname"`
	Score           int       `json:"score" db:"score"`
	Difficulty      string    `json:"difficulty" db:"difficulty"`
	GameDuration    int       `json:"game_duration" db:"game_duration"` // in seconds
	ObstaclesPassed int       `json:"obstacles_passed" db:"obstacles_passed"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UserAgent       string    `json:"user_agent,omitempty" db:"user_agent"`
	IPAddress       string    `json:"ip_address,omitempty" db:"ip_address"`
}

// LeaderboardEntry represents an entry in the leaderboard
type LeaderboardEntry struct {
	Rank            int       `json:"rank"`
	Nickname        string    `json:"nickname"`
	Score           int       `json:"score"`
	Difficulty      string    `json:"difficulty"`
	GameDuration    int       `json:"game_duration,omitempty"`
	ObstaclesPassed int       `json:"obstacles_passed,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

// ScoreSubmission represents a score submission from the client
type ScoreSubmission struct {
	Nickname        string `json:"nickname"`
	Score           int    `json:"score"`
	Difficulty      string `json:"difficulty"`
	GameDuration    int    `json:"game_duration"`
	ObstaclesPassed int    `json:"obstacles_passed"`
}

// UserRegistration represents a user registration request
type UserRegistration struct {
	Nickname string `json:"nickname"`
}

// Validate validates the score submission
func (s *ScoreSubmission) Validate() error {
	if s.Nickname == "" {
		return ErrInvalidNickname
	}
	if s.Score < 0 {
		return ErrInvalidScore
	}
	if s.Difficulty != "easy" && s.Difficulty != "normal" && s.Difficulty != "hard" {
		return ErrInvalidDifficulty
	}
	if s.GameDuration < 0 {
		return ErrInvalidDuration
	}
	if s.ObstaclesPassed < 0 {
		return ErrInvalidObstacles
	}
	return nil
}

// Validate validates the user registration
func (u *UserRegistration) Validate() error {
	if u.Nickname == "" {
		return ErrInvalidNickname
	}
	if len(u.Nickname) > 50 {
		return ErrNicknameTooLong
	}
	return nil
}
