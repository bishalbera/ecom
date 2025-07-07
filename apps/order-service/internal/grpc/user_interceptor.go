package grpc

import (
	"context"
	"log/slog"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func UserIDInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	logger := slog.With("service", "order-service")
	md, ok := metadata.FromIncomingContext(ctx)
	logger.Info("Metadata found", "ok", ok, "content", md)
	for k, v := range md {
		logger.Info("Metadata key", "key", k, "value", v)
	}

	if !ok {
		logger.Info("No metadata found in context")
		ctx = context.WithValue(ctx, "user", "")
		return handler(ctx, req)
	}

	userID := md.Get("user")
	logger.Info("User ID from metadata", "userID", userID)

	if len(userID) > 0 {
		ctx = context.WithValue(ctx, "user", userID[0])
		logger.Info("Set user in context", "user", userID[0])
	} else {
		logger.Info("No user ID found in metadata")
		ctx = context.WithValue(ctx, "user", "")
	}

	return handler(ctx, req)
}
