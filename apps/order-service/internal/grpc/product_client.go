package grpc

import (
	"context"
	pb "order-service/github.com/ecom/packages/proto/product"

)

type ProductClient struct {
	client pb.ProductServiceClient
}

func NewProductClient(client pb.ProductServiceClient) *ProductClient {
	return &ProductClient{
		client: client,
	}
}

func (p *ProductClient) GetPrice(productId string) (float64, error) {
	res, err := p.client.GetProductById(context.Background(), &pb.ProductReq{Id: productId})

	if err != nil {
		return 0, err

	}
	return float64(res.Price), nil
}
