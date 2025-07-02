
package grpcserver

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func UserIDInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return handler(ctx, req)
	}

	userID := md.Get("user")
	if len(userID) > 0 {
		ctx = context.WithValue(ctx, "user", userID[0])
	}

	return handler(ctx, req)
}
