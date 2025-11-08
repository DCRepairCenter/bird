package database

import (
	"fmt"

	"bird/models"
)

// ScoreRepository handles score database operations
type ScoreRepository struct {
	db *DB
}

// NewScoreRepository creates a new score repository
func NewScoreRepository(db *DB) *ScoreRepository {
	return &ScoreRepository{db: db}
}

// Create creates a new score entry
func (r *ScoreRepository) Create(score *models.Score) error {
	query := `INSERT INTO scores 
		(nickname, score, difficulty, game_duration, obstacles_passed, user_agent, ip_address)
		VALUES (?, ?, ?, ?, ?, ?, ?)`

	result, err := r.db.Exec(
		query,
		score.Nickname,
		score.Score,
		score.Difficulty,
		score.GameDuration,
		score.ObstaclesPassed,
		score.UserAgent,
		score.IPAddress,
	)
	if err != nil {
		return fmt.Errorf("failed to create score: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}
	score.ID = id

	return nil
}

// GetLeaderboard retrieves the leaderboard for a specific difficulty
func (r *ScoreRepository) GetLeaderboard(difficulty string, limit int) ([]models.LeaderboardEntry, error) {
	query := `
		SELECT 
			ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
			nickname,
			score,
			difficulty,
			game_duration,
			obstacles_passed,
			datetime(created_at) as created_at
		FROM (
			SELECT 
				nickname,
				MAX(score) as score,
				difficulty,
				MAX(game_duration) as game_duration,
				MAX(obstacles_passed) as obstacles_passed,
				MAX(created_at) as created_at
			FROM scores
			WHERE difficulty = ?
			GROUP BY nickname
		)
		ORDER BY score DESC
		LIMIT ?
	`

	rows, err := r.db.Query(query, difficulty, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []models.LeaderboardEntry
	for rows.Next() {
		var entry models.LeaderboardEntry
		var createdAt string
		err := rows.Scan(
			&entry.Rank,
			&entry.Nickname,
			&entry.Score,
			&entry.Difficulty,
			&entry.GameDuration,
			&entry.ObstaclesPassed,
			&createdAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan leaderboard entry: %w", err)
		}
		entries = append(entries, entry)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating leaderboard rows: %w", err)
	}

	return entries, nil
}

// GetUserBestScores retrieves user's best scores for each difficulty
func (r *ScoreRepository) GetUserBestScores(nickname string) (map[string]int, error) {
	query := `
		SELECT difficulty, MAX(score) as best_score
		FROM scores
		WHERE nickname = ?
		GROUP BY difficulty
	`

	rows, err := r.db.Query(query, nickname)
	if err != nil {
		return nil, fmt.Errorf("failed to query user best scores: %w", err)
	}
	defer rows.Close()

	bestScores := make(map[string]int)
	for rows.Next() {
		var difficulty string
		var score int
		if err := rows.Scan(&difficulty, &score); err != nil {
			return nil, fmt.Errorf("failed to scan best score: %w", err)
		}
		bestScores[difficulty] = score
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating best scores rows: %w", err)
	}

	return bestScores, nil
}

// GetRecentScores retrieves recent scores for a user
func (r *ScoreRepository) GetRecentScores(nickname string, limit int) ([]models.Score, error) {
	query := `
		SELECT id, nickname, score, difficulty, game_duration, obstacles_passed, datetime(created_at) as created_at
		FROM scores
		WHERE nickname = ?
		ORDER BY created_at DESC
		LIMIT ?
	`

	rows, err := r.db.Query(query, nickname, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent scores: %w", err)
	}
	defer rows.Close()

	var scores []models.Score
	for rows.Next() {
		var score models.Score
		var createdAt string
		err := rows.Scan(
			&score.ID,
			&score.Nickname,
			&score.Score,
			&score.Difficulty,
			&score.GameDuration,
			&score.ObstaclesPassed,
			&createdAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan score: %w", err)
		}
		scores = append(scores, score)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating scores rows: %w", err)
	}

	return scores, nil
}
