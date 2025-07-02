package ports

type PaymentClient interface {
	CreatePaymentIntent(orderId string, amount float64) (string, error)
}
