package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	productServiceURL := os.Getenv("PRODUCT_SERVICE_URL")
	if productServiceURL == "" {
		productServiceURL = "http://product-service:8080"
	}

	resp, err := http.Post(fmt.Sprintf("%s/products", productServiceURL), "application/json", nil)
	if err != nil {
		fmt.Printf("Error seeding products: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Error seeding products: received status code %d\n", resp.StatusCode)
		os.Exit(1)
	}

	fmt.Println("Successfully seeded products.")
}
