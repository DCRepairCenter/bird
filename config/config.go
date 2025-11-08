package config

import (
	"time"
)

// Config holds all application configuration
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
}

// ServerConfig contains server-related configuration
type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	PublicDir    string
}

// DatabaseConfig contains database-related configuration
type DatabaseConfig struct {
	Path            string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// GetConfig returns the application configuration
func GetConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         ":12300",
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			PublicDir:    "./public",
		},
		Database: DatabaseConfig{
			Path:            "./bird.db",
			MaxOpenConns:    25,
			MaxIdleConns:    5,
			ConnMaxLifetime: 5 * time.Minute,
		},
	}
}
