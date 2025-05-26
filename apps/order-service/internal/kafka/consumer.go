package kafka

import (
	"context"
	"encoding/json"
	"log"
	"order-service/internal/service"

	"github.com/segmentio/kafka-go"
)

type OrderEvent struct {
	EventType string `json:"eventType"`
	OrderId   string `json:"orderId"`
}

func ConsumeOrderEvents(orderService service.OrderService) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{"localhost:9092"},
		Topic:   "order-events",
		GroupID: "order-service-group",
	})

	go func() {

		for {
			m, err := r.ReadMessage(context.Background())
			if err != nil {
				log.Println("Error reading kafka message:", err)
				continue
			}
			var event OrderEvent
			if err := json.Unmarshal(m.Value, &event); err != nil {
				log.Println("Error unmarshalling event", err)
				continue
			}
			if event.EventType == "ORDER_PAID" {
				err := orderService.UpdateOrderStatus(event.OrderId, "PAID")
				if err != nil {
					log.Println("Failed to update order status:", err)

				} else {
					log.Printf("Order %s marked as PAID\n", event.OrderId)
				}
			}

		}
	}()
}
