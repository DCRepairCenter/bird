package models

import "errors"

var (
	// ErrInvalidNickname is returned when nickname is invalid
	ErrInvalidNickname = errors.New("invalid nickname")

	// ErrNicknameTooLong is returned when nickname is too long
	ErrNicknameTooLong = errors.New("nickname too long (max 50 characters)")

	// ErrInvalidScore is returned when score is invalid
	ErrInvalidScore = errors.New("invalid score")

	// ErrInvalidDifficulty is returned when difficulty is invalid
	ErrInvalidDifficulty = errors.New("invalid difficulty (must be: easy, normal, or hard)")

	// ErrInvalidDuration is returned when game duration is invalid
	ErrInvalidDuration = errors.New("invalid game duration")

	// ErrInvalidObstacles is returned when obstacles passed is invalid
	ErrInvalidObstacles = errors.New("invalid obstacles passed count")

	// ErrUserNotFound is returned when user is not found
	ErrUserNotFound = errors.New("user not found")

	// ErrDatabaseError is returned when a database error occurs
	ErrDatabaseError = errors.New("database error")
)
