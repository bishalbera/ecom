package database

import (
	"context"
	"fmt"
	"log/slog"
	"order-service/internal/model"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Service represents a service that interacts with a database.
type Service interface {
	// Health returns a map of health status information.
	// The keys and values in the map are service-specific.
	Health() map[string]string

	// Close terminates the database connection.
	// It returns an error if the connection cannot be closed.
	Close() error
	CreateOrder(order *model.Order) (*model.Order, error)
	GetOrder(id string) (*model.Order, error)
	GetAllOrders(userId string) ([]*model.Order, error)
	UpdateOrderStatus(id string, status string) error
}

type service struct {
	db     *gorm.DB
	logger *slog.Logger
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

func New(logger *slog.Logger) Service {
	// Reuse Connection
	if dbInstance != nil {
		return dbInstance
	}

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable&search_path=%s", username, password, host, port, database, schema)
	db, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if err != nil {
		// This will not be a connection error, but a DSN parse error or
		// another initialization error.
		logger.Error("failed to open database connection", "error", err)
		os.Exit(1)
	}

	if err := db.AutoMigrate(&model.Order{}, &model.OrderItems{}); err != nil {
		logger.Error("failed to migrate database", "error", err)
		os.Exit(1)
	}

	dbInstance = &service{
		db:     db,
		logger: logger,
	}
	return dbInstance
}

func (s *service) UpdateOrderStatus(id string, status string) error {
	var order model.Order
	if err := s.db.Model(&order).Where("id = ?", id).Update("orderStatus", status).Error; err != nil {
		s.logger.Error("failed to update order status", "error", err)
		return err
	}
	return nil
}

func (s *service) GetAllOrders(userId string) ([]*model.Order, error) {
	var orders []*model.Order
	if err := s.db.Preload("Items").Where("user_id = ?", userId).Find(&orders).Error; err != nil {
		s.logger.Error("failed to get all orders", "error", err)
		return nil, err
	}
	return orders, nil
}

func (s *service) GetOrder(id string) (*model.Order, error) {
	var order model.Order
	if err := s.db.Preload("Items").First(&order, "id = ?", id).Error; err != nil {
		s.logger.Error("failed to get order", "error", err)
		return nil, err
	}
	return &order, nil
}

func (s *service) CreateOrder(order *model.Order) (*model.Order, error) {

	if err := s.db.Create(order).Error; err != nil {
		s.logger.Error("failed to create order", "error", err)
		return nil, err

	}

	return order, nil
}

// Health checks the health of the database connection by pinging the database.
// It returns a map with keys indicating various health statistics.
func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	sqlDB, err := s.db.DB()

	// Ping the db
	err = sqlDB.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		s.logger.Error("db down", "error", err) // Log the error and terminate the program
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
		s.logger.Error("failed to retrieve sql.DB for closing", "error", err)
		return fmt.Errorf("failed to retrieve sql.DB for closing: %w", err)
	}
	s.logger.Info("Disconnected from database", "database", database)
	return sqlDB.Close()
}
