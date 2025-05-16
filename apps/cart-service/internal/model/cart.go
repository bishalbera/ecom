package model

type CartItems struct {
	ProductId string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}
type Cart struct {
	UserId string      `json:"user_id"`
	Items  []CartItems `json:"items"`
}
