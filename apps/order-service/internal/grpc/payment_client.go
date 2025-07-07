package grpc

import (
	"context"
	"fmt"
	"log/slog"

	pb "order-service/github.com/ecom/packages/proto/payment"
	"google.golang.org/grpc"
)

type PaymentClient struct {
	service pb.PaymentServiceClient
	logger  *slog.Logger
}

func NewPaymentClient(conn *grpc.ClientConn, logger *slog.Logger) *PaymentClient {
	return &PaymentClient{
		service: pb.NewPaymentServiceClient(conn),
		logger:  logger,
	}
}

func (pc *PaymentClient) CreatePaymentIntent(orderId string, amount float64) (string, error) {
	pc.logger.Info("creating payment intent", "orderId", orderId, "amount", amount)
	res, err := pc.service.CreatePaymentIntent(context.Background(), &pb.CreatePaymentIntentRequest{
		OrderId: orderId,
		Amount:  amount,
	})
	if err != nil {
		pc.logger.Error("failed to create payment intent", "error", err)
		return "", fmt.Errorf("failed to create payment intent: %w", err)
	}
	pc.logger.Info("payment intent created successfully", "orderId", orderId)
	return res.ClientSecret, nil
}
