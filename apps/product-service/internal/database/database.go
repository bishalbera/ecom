package database

import (
	"context"
	"fmt"
	"product-service/internal/log"
	"os"
	"product-service/internal/models"
	"strconv"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"
)

// Service represents a service that interacts with a database.
type Service interface {
	// Health returns a map of health status information.
	// The keys and values in the map are service-specific.
	Health() map[string]string

	// Close terminates the database connection.
	// It returns an error if the connection cannot be closed.
	Close() error

	GetById(id string) (*models.Products, error)
	UploadMany(products []models.Products) error
	SearchProducts(query string, category string, minPrice, maxPrice float32, sort string, page, limit int) ([]models.Products, error)
}

type service struct {
	db *gorm.DB
}

var (
	database   = os.Getenv("DB_DATABASE")
	password   = os.Getenv("DB_PASSWORD")
	username   = os.Getenv("DB_USERNAME")
	port       = os.Getenv("DB_PORT")
	host       = os.Getenv("DB_HOST")
	schema     = os.Getenv("DB_SCHEMA")
	dbInstance *service
)

func New() Service {
	// Reuse Connection
	if dbInstance != nil {
		return dbInstance
	}
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable&search_path=%s", username, password, host, port, database, schema)
	db, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Logger.Error("db connection error","error",err)
	}
	if err := db.AutoMigrate(&models.Products{}); err != nil {
		log.Logger.Error("failed to migrate database: %v", "error",err)
	}
	dbInstance = &service{
		db: db,
	}
	return dbInstance
}

func (s *service) GetById(id string) (*models.Products, error) {
	var product models.Products
	if err := s.db.Where("id = ?", id).First(&product).Error; err != nil {
		return nil, err

	}
	return &product, nil
}

func (s *service) SearchProducts(query string, category string, minPrice, maxPrice float32, sort string, page, limit int) ([]models.Products, error) {

	var products []models.Products

	db := s.db.Model(&models.Products{})

	// Full-text search
	if query != "" {
		tsQuery := fmt.Sprintf("plainto_tsquery('english', ?)")
		db = db.Where("to_tsvector('english', name || ' ' || description || ' ' || category) @@ "+tsQuery, query)
	}

	// Filters
	if category != "" {
		db = db.Where("category = ?", category)
	}
	if minPrice > 0 {
		db = db.Where("price >= ?", minPrice)
	}
	if maxPrice > 0 {
		db = db.Where("price <= ?", maxPrice)
	}

	// Sorting
	switch sort {
	case "price_asc":
		db = db.Order("price ASC")
	case "price_desc":
		db = db.Order("price DESC")
	case "rating":
		db = db.Order("rating DESC")
	default:
		db = db.Order("rating DESC")

	}

	// Pagination
	offset := (page - 1) * limit
	db = db.Offset(offset).Limit(limit)

	if err := db.Find(&products).Error; err != nil {
		return nil, err
	}

	return products, nil
}

func (s *service) UploadMany(products []models.Products) error {
	return s.db.CreateInBatches(products, 1000).Error
}

// Health checks the health of the database connection by pinging the database.
// It returns a map with keys indicating various health statistics.
func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	// Ping the database
	sqlDB, err := s.db.DB()
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Logger.Error("db down: %v", err) // Log the error and terminate the program
		return stats
	}
	// Ping the database
	err = sqlDB.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Logger.Error("db down: %v", err)
		return stats
	}
	// Database is up, add more statistics
	stats["status"] = "up"
	stats["message"] = "It's healthy"

	// Get database stats (like open connections, in use, idle, etc.)
	dbStats := sqlDB.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()
	stats["max_idle_closed"] = strconv.FormatInt(dbStats.MaxIdleClosed, 10)
	stats["max_lifetime_closed"] = strconv.FormatInt(dbStats.MaxLifetimeClosed, 10)

	// Evaluate stats to provide a health message
	if dbStats.OpenConnections > 40 { // Assuming 50 is the max for this example
		stats["message"] = "The database is experiencing heavy load."
	}

	if dbStats.WaitCount > 1000 {
		stats["message"] = "The database has a high number of wait events, indicating potential bottlenecks."
	}

	if dbStats.MaxIdleClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many idle connections are being closed, consider revising the connection pool settings."
	}

	if dbStats.MaxLifetimeClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many connections are being closed due to max lifetime, consider increasing max lifetime or revising the connection usage pattern."
	}

	return stats
}

// Close closes the database connection.
// It logs a message indicating the disconnection from the specific database.
// If the connection is successfully closed, it returns nil.
// If an error occurs while closing the connection, it returns the error.
func (s *service) Close() error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return fmt.Errorf("failed  to retrieve sql.DB for closing: %w", err)
	}
	log.Logger.Info("Disconnected from database: %s", "info",database)
	return sqlDB.Close()
}