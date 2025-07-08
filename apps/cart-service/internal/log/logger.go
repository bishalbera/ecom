package log

import (
	"log/slog"
	"os"
)

var Logger *slog.Logger

func New() {
	Logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelInfo,
	})).With("service", "cart-service")

}
