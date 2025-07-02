package grpc

import (
	"context"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func UserIDInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	log.Printf("Metadata found: %v, Content: %v", ok, md)
	for k, v := range md {
		log.Printf("Metadata key: %s, value: %v", k, v)
	}
	

	if !ok {
		log.Println("No metadata found in context")
		ctx = context.WithValue(ctx, "user", "")
		return handler(ctx, req)
	}

	userID := md.Get("user")
	log.Printf("User ID from metadata: %v", userID)

	if len(userID) > 0 {
		ctx = context.WithValue(ctx, "user", userID[0])
		log.Printf("Set user in context: %s", userID[0])
	} else {
		log.Println("No user ID found in metadata")
		ctx = context.WithValue(ctx, "user", "")
	}

	return handler(ctx, req)
}
