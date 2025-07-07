package kafka

import (
	"context"
	"encoding/json"
	"log/slog"
	"order-service/internal/service"

	"github.com/segmentio/kafka-go"
)

type OrderEvent struct {
	EventType string `json:"eventType"`
	OrderId   string `json:"orderId"`
}

func ConsumeOrderEvents(orderService service.OrderService, logger *slog.Logger) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{"localhost:9092"},
		Topic:   "order-events",
		GroupID: "order-service-group",
	})

	go func() {

		for {
			m, err := r.ReadMessage(context.Background())
			if err != nil {
				logger.Error("Error reading kafka message", "error", err)
				continue
			}
			var event OrderEvent
			if err := json.Unmarshal(m.Value, &event); err != nil {
				logger.Error("Error unmarshalling event", "error", err)
				continue
			}
			if event.EventType == "ORDER_PAID" {
				err := orderService.UpdateOrderStatus(event.OrderId, "PAID")
				if err != nil {
					logger.Error("Failed to update order status", "error", err)

				} else {
					logger.Info("Order marked as PAID", "orderId", event.OrderId)
				}
			}

		}
	}()
}
