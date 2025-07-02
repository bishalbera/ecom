package grpc

import (
	"context"
	"log"
	"net"
	pb "order-service/github.com/ecom/packages/proto/order"
	"order-service/internal/model"
	"order-service/internal/service"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type OrderGrpcServer struct {
	pb.UnimplementedOrderServiceServer
	svc *service.OrderService
}

func NewGrpcServer(svc *service.OrderService) error {
	lis, err := net.Listen("tcp", ":50055")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	s := grpc.NewServer(grpc.UnaryInterceptor(UserIDInterceptor))
	pb.RegisterOrderServiceServer(s, &OrderGrpcServer{svc: svc})
	return s.Serve(lis)

}

func (s *OrderGrpcServer) GetOrder(ctx context.Context, req *pb.GetOrderReq) (*pb.OrderRes, error) {
	user := ctx.Value("user").(string)
	if user == "" {
		return nil, status.Errorf(codes.Unauthenticated, "invaild user")
	}
	order, err := s.svc.GetOrder(req.Id)
	if err != nil {
		return nil, err
	}
	if order.UserId != user {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}
	return mapToOrderRes(order), nil
}

func (s *OrderGrpcServer) GetAllOrders(ctx context.Context, _ *pb.Empty) (*pb.AllOrderRes, error) {
	user := ctx.Value("user").(string)
	if user == "" {
		return nil, status.Errorf(codes.Unauthenticated, "invaild user")
	}
	orders, err := s.svc.GetAllOrders(user)
	if err != nil {
		return nil, err
	}
	var res pb.AllOrderRes
	for _, order := range orders {
		res.Orders = append(res.Orders, mapToOrderRes(order))

	}
	return &res, nil
}

func (s *OrderGrpcServer) CreateOrder(ctx context.Context, req *pb.CreateOrderReq) (*pb.OrderRes, error) {
	user := ctx.Value("user").(string)
	if user == "" {
		return nil, status.Errorf(codes.Unauthenticated, "invaild user")
	}

	var items []model.OrderItems
	for _, item := range req.Items {
		if item.ProductId == "" {
			return nil, status.Errorf(codes.InvalidArgument, "productId cannot be empty")
		}
		items = append(items, model.OrderItems{
			ProductId: item.ProductId,
			Quantity:  int(item.Quantity),
			Price:     item.Price,
		})
	}
	order, clientSecret, err := s.svc.CreateOrder(user, items)
	if err != nil {
		return nil, err
	}
	orderRes := mapToOrderRes(order)
	orderRes.ClientSecret = clientSecret
	return orderRes, nil
}

func (s *OrderGrpcServer) UpdateOrderStatus(ctx context.Context, req *pb.UpdateOrderStatusReq) (*pb.UpdateOrderStatusRes, error) {
	err := s.svc.UpdateOrderStatus(req.OrderId, req.Status)
	if err != nil {
		return nil, err
	}
	return &pb.UpdateOrderStatusRes{Message: "Order status updated successfully"}, nil
}

// -----Helper mapper -----
func mapToOrderRes(order *model.Order) *pb.OrderRes {
	items := make([]*pb.OrderItem, len(order.Items))
	for i, item := range order.Items {
		items[i] = &pb.OrderItem{
			Id:        item.Id,
			ProductId: item.ProductId,
			OrderId:   order.Id.String(),
			Quantity:  int32(item.Quantity),
			Price:     item.Price,
		}
	}
	return &pb.OrderRes{
		Id:          order.Id.String(),
		UserId:      order.UserId,
		Items:       items,
		OrderStatus: order.OrderStatus,
		Total:       order.Total,
	}

}
