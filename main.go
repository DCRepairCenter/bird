package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "modernc.org/sqlite"
)

type User struct {
	Nickname string `json:"nickname"`
}

type ScoreEntry struct {
	Nickname   string `json:"nickname"`
	Score      int    `json:"score"`
	Difficulty string `json:"difficulty"`
}

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("sqlite", "./bird.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Initialize database tables
	err = initDB()
	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServer(http.Dir("./public"))
	http.Handle("/", fs)

	http.HandleFunc("/api/register", registerHandler)
	http.HandleFunc("/api/scores", scoresHandler)
	http.HandleFunc("/api/leaderboard", leaderboardHandler)

	log.Println("Listening on :12300...")
	err = http.ListenAndServe(":12300", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func initDB() error {
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		nickname TEXT PRIMARY KEY
	);`

	createScoresTable := `
	CREATE TABLE IF NOT EXISTS scores (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nickname TEXT NOT NULL,
		score INTEGER NOT NULL,
		difficulty TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (nickname) REFERENCES users(nickname)
	);`

	createIndexes := `
	CREATE INDEX IF NOT EXISTS idx_scores_difficulty ON scores(difficulty);
	CREATE INDEX IF NOT EXISTS idx_scores_nickname ON scores(nickname);`

	_, err := db.Exec(createUsersTable)
	if err != nil {
		return err
	}

	_, err = db.Exec(createScoresTable)
	if err != nil {
		return err
	}

	_, err = db.Exec(createIndexes)
	if err != nil {
		return err
	}

	return nil
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if user exists
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE nickname = ?)", user.Nickname).Scan(&exists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if exists {
		// User exists, treat as login
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(user)
		return
	}

	// New user, create and register
	_, err = db.Exec("INSERT INTO users (nickname) VALUES (?)", user.Nickname)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func scoresHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var score ScoreEntry
	if err := json.NewDecoder(r.Body).Decode(&score); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := db.Exec("INSERT INTO scores (nickname, score, difficulty) VALUES (?, ?, ?)",
		score.Nickname, score.Score, score.Difficulty)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func leaderboardHandler(w http.ResponseWriter, r *http.Request) {
	difficulty := r.URL.Query().Get("difficulty")
	if difficulty == "" {
		http.Error(w, "Difficulty parameter is required", http.StatusBadRequest)
		return
	}

	// Query to get the highest score for each user in the specified difficulty
	query := `
		SELECT nickname, MAX(score) as score, difficulty
		FROM scores
		WHERE difficulty = ?
		GROUP BY nickname
		ORDER BY score DESC
	`

	rows, err := db.Query(query, difficulty)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var leaderboard []ScoreEntry
	for rows.Next() {
		var entry ScoreEntry
		if err := rows.Scan(&entry.Nickname, &entry.Score, &entry.Difficulty); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		leaderboard = append(leaderboard, entry)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if leaderboard == nil {
		leaderboard = []ScoreEntry{}
	}

	json.NewEncoder(w).Encode(leaderboard)
}
