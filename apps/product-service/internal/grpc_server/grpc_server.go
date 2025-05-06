package grpc_server

import (
	"context"
	"log"
	"net"
	pb "product-service/github.com/ecom/packages/proto/product"
	"product-service/internal/database"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type productServer struct {
	pb.UnimplementedProductServiceServer
	db database.Service
}

func NewGrpcServer(db database.Service) error {
	lis, err := net.Listen("tcp", ":50053")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterProductServiceServer(s, &productServer{db: db})

	return s.Serve(lis)

}

func (s *productServer) GetProductById(ctx context.Context, req *pb.ProductReq) (*pb.ProductRes, error) {
	product, err := s.db.GetById(req.Id)
	if err != nil {
		return nil, err
	}

	return &pb.ProductRes{

		Id:          product.ID.String(),
		Name:        product.Name,
		Description: product.Description,
		Price:       float32(product.Price),
		Stock:       int32(product.Stock),
		Rating:      float32(product.Rating),
		Category:    product.Category,
	}, nil
}

func (s *productServer) SearchProducts(cotx context.Context, req *pb.SearchReq) (*pb.SearchRes, error) {

	products, err := s.db.SearchProducts(
		req.Query,
		req.Category,
		req.MinPrice,
		req.MaxPrice,
		req.Sort,
		int(req.Page),
		int(req.Limit),
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "search failed: %v", err)
	}
	var responseProducts []*pb.Product
	for _, p := range products {
		responseProducts = append(responseProducts, &pb.Product{
			Id:          p.ID.String(),
			Name:        p.Name,
			Description: p.Description,
			Price:       float32(p.Price),
			Stock:       int32(p.Stock),
			Rating:      float32(p.Rating),
			Category:    p.Category,
		})
	}
	return &pb.SearchRes{Products: responseProducts}, nil

}
