package routes

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rohit/will-backend/handlers"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:3000", "http://localhost:3002"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", 0755)
	}

	r.Static("/uploads", "./uploads")

	// REST API Routes
	api := r.Group("/api")
	{
		api.POST("/upload-will-documents", handlers.UploadWillDocuments)
		api.GET("/get-documents/:wallet", handlers.GetDocuments)
		api.POST("/save-will", handlers.SaveWill)
		api.GET("/get-will/:address", handlers.GetWill)
		api.GET("/find-inherited-wills/:address", handlers.FindInheritedWills)
		api.GET("/get-will-by-hash/:hash", handlers.GetWillByHash)

		// CyberSecurity Audit & Extensions
		api.GET("/verify-integrity", handlers.VerifyIntegrity)
		api.GET("/system-alerts", handlers.GetSystemAlerts)
		api.POST("/generate-certificate", handlers.GenerateCertificate)
	}

	return r
}
