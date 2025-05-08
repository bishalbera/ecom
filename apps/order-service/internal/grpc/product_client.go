package grpc

import (
	"context"
	pb "order-service/github.com/ecom/packages/proto/product"

	"google.golang.org/grpc"
)

type ProductClient struct {
	client pb.ProductServiceClient
}

func NewProductClient(conn *grpc.ClientConn) *ProductClient {
	return &ProductClient{
		client: pb.NewProductServiceClient(conn),
	}
}

func (p *ProductClient) GetPrice(productId string) (float64, error) {
	res, err := p.client.GetProductById(context.Background(), &pb.ProductReq{Id: productId})

	if err != nil {
		return 0, err

	}
	return float64(res.Price), nil
}
