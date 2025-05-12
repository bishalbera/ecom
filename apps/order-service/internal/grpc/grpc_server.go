package grpc

import (
	"context"
	"log"
	"net"
	pb "order-service/github.com/ecom/packages/proto/order"
	"order-service/internal/model"
	"order-service/internal/service"

	"google.golang.org/grpc"
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
	s := grpc.NewServer()
	pb.RegisterOrderServiceServer(s, &OrderGrpcServer{svc: svc})
	return s.Serve(lis)

}

func (s *OrderGrpcServer) GetOrder(ctx context.Context, req *pb.GetOrderReq) (*pb.OrderRes, error) {
	order, err := s.svc.GetOrder(req.Id)
	if err != nil {
		return nil, err
	}
	return mapToOrderRes(order), nil
}

func (s *OrderGrpcServer) GetAllOrder(ctx context.Context, _ *pb.Empty) (*pb.AllOrderRes, error) {
	orders, err := s.svc.GetAllOrders()
	if err != nil {
		return nil, err
	}
	var res pb.AllOrderRes
	for _, order := range orders {
		res.Orders = append(res.Orders, mapToOrderRes(order))

	}
	return &res, nil
}

func (s *OrderGrpcServer) CreatOrder(ctx context.Context, req *pb.CreateOrderReq) (*pb.OrderRes, error) {

	var items []model.OrderItems
	for _, item := range req.Items {
		items = append(items, model.OrderItems{
			ProductId: item.ProductId,
			Quantity:  int(item.Quantity),
			Price:     item.Price,
		})
	}
	order, err := s.svc.CreateOrder(req.UserId, items)
	if err != nil {
		return nil, err
	}
	return mapToOrderRes(order), nil
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
