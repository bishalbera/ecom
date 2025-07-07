package grpc

import (
	"context"
	"fmt"
	"log/slog"
	pb "order-service/github.com/ecom/packages/proto/product"
)

type ProductClient struct {
	client pb.ProductServiceClient
	logger *slog.Logger
}

func NewProductClient(client pb.ProductServiceClient, logger *slog.Logger) *ProductClient {
	return &ProductClient{
		client: client,
		logger: logger,
	}
}

func (p *ProductClient) GetPrice(productId string) (float64, error) {
	if productId == "" {
		p.logger.Error("productId cannot be empty")
		return 0, fmt.Errorf("productId cannot be empty")
	}
	p.logger.Info("getting price for product", "productId", productId)
	res, err := p.client.GetProductById(context.Background(), &pb.ProductReq{Id: productId})

	if err != nil {
		p.logger.Error("failed to get price", "error", err)
		return 0, err

	}
	p.logger.Info("price retrieved successfully", "productId", productId, "price", res.Price)
	return float64(res.Price), nil
}
