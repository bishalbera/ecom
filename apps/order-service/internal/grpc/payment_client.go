package grpc

import (
	"context"
	"fmt"

	pb "order-service/github.com/ecom/packages/proto/payment"
	"google.golang.org/grpc"
)

type PaymentClient struct {
	service pb.PaymentServiceClient
}

func NewPaymentClient(conn *grpc.ClientConn) *PaymentClient {
	return &PaymentClient{
		service: pb.NewPaymentServiceClient(conn),
	}
}

func (pc *PaymentClient) CreatePaymentIntent(orderId string, amount float64) (string, error) {
	res, err := pc.service.CreatePaymentIntent(context.Background(), &pb.CreatePaymentIntentRequest{
		OrderId: orderId,
		Amount:  amount,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create payment intent: %w", err)
	}
	return res.ClientSecret, nil
}
