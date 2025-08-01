package grpcserver

import (
	pb "cart-service/github.com/ecom/packages/proto/cart"
	"cart-service/internal/database"
	"cart-service/internal/log"
	"context"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CartGrpcServer struct {
	pb.UnimplementedCartServiceServer
	db database.Service
}

func NewGrpcServer(db database.Service) error {
	lis, err := net.Listen("tcp", ":50054")
	if err != nil {
		log.Logger.Error("Failed to listen", "error", err)
	}
	s := grpc.NewServer(grpc.UnaryInterceptor(UserIDInterceptor))
	pb.RegisterCartServiceServer(s, &CartGrpcServer{db: db})
	return s.Serve(lis)
}

func (s *CartGrpcServer) GetCart(ctx context.Context, req *pb.CartReq) (*pb.CartRes, error) {
	cart, err := s.db.GetCart(req.UserId)
	if err != nil {
		log.Logger.Error("failed to get cart", "error", err)
		return nil, err
	}

	items := make([]*pb.CartItems, 0)
	for _, i := range cart.Items {
		items = append(items, &pb.CartItems{
			ProductId: i.ProductId,
			Quantity:  int32(i.Quantity),
		})
	}

	return &pb.CartRes{
		UserId: cart.UserId,
		Items:  items,
	}, nil
}

func (s *CartGrpcServer) AddItem(ctx context.Context, req *pb.AddItemReq) (*pb.AddItemRes, error) {
	err := s.db.AddItem(req.UserId, req.ProductId, req.Quantity)
	if err != nil {
		log.Logger.Error("invaid input", "error", err)
		return nil, status.Errorf(codes.InvalidArgument, "invalid input:%v", err)
	}
	return &pb.AddItemRes{
		Msg: "Item added successfully",
	}, nil

}

func (s *CartGrpcServer) ClearCart(ctx context.Context, req *pb.ClearCartReq) (*pb.ClearCartRes, error) {
	user := ctx.Value("user").(string)
	if user == "" {
		log.Logger.Error("invalid user")
		return nil, status.Errorf(codes.Unauthenticated, "invaild user")
	}
	err := s.db.ClearCart(user)
	if err != nil {
		log.Logger.Error("something went wrong")
		return nil, status.Errorf(codes.Internal, "something went wrong:%v", err)
	}
	return &pb.ClearCartRes{
		Msg: "Cart cleared",
	}, nil
}
