package ports

type ProductClient interface {
	GetPrice(productId string) (float64,error)
}