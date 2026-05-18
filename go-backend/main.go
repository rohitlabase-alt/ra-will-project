package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"github.com/rohit/will-backend/database"
	"github.com/rohit/will-backend/middleware"
	"github.com/rohit/will-backend/routes"
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found, using system environment variables")
	}

	// Initialize MongoDB
	database.InitMongoDB()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	// Initialize central router
	r := routes.SetupRouter()

	// Apply global security middleware
	r.Use(middleware.SecurityHeadersMiddleware())
	r.Use(middleware.Authenticate())

	fmt.Printf("ChainLock Go-Backend running on http://localhost:%s\n", port)
	r.Run(":" + port)
}
