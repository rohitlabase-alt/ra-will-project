package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type DocumentResponse struct {
	FileName   string `json:"fileName"`
	Hash       string `json:"hash"`
	StorageURL string `json:"storageUrl"`
}

type WillDocument struct {
	WalletAddress string `json:"walletAddress"`
	FileName      string `json:"fileName"`
	FilePath      string `json:"filePath"`
	Hash          string `json:"hash"`
	StorageURL    string `json:"storageUrl"`
}

type WillRecord struct {
	UserAddress         string      `json:"userAddress"`
	WillType            string      `json:"willType"`
	Status              string      `json:"status"`
	TxHash              string      `json:"txHash"`
	Assets              interface{} `json:"assets"`
	Beneficiaries       interface{} `json:"beneficiaries"`
	DocumentHashes      []string    `json:"documentHashes"`
	WillTypeFormData    interface{} `json:"willTypeFormData"`
	Is2FAEnabled        bool        `json:"is2FAEnabled"`
	IsBiometricsEnabled bool        `json:"isBiometricsEnabled"`
	CreatedAt           time.Time   `json:"createdAt"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found, using defaults")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

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

	var mockDocuments []WillDocument

	r.POST("/api/upload-will-documents", func(c *gin.Context) {
		wallet := c.PostForm("walletAddress")

		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		files := form.File["documents"]
		var uploadedDocs []DocumentResponse

		for _, file := range files {
			filename := file.Filename
			dst := filepath.Join("uploads", filename)
			if err := c.SaveUploadedFile(file, dst); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save file %s", filename)})
				return
			}

			hash, err := generateHash(dst)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to hash file %s", filename)})
				return
			}

			doc := WillDocument{
				WalletAddress: wallet,
				FileName:      filename,
				FilePath:      dst,
				Hash:          hash,
				StorageURL:    fmt.Sprintf("http://localhost:%s/uploads/%s", port, filename),
			}
			mockDocuments = append(mockDocuments, doc)

			uploadedDocs = append(uploadedDocs, DocumentResponse{
				FileName:   filename,
				Hash:       hash,
				StorageURL: doc.StorageURL,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"documents": uploadedDocs,
			"message":   "uploaded successfully",
		})
	})

	r.GET("/api/get-documents/:wallet", func(c *gin.Context) {
		wallet := c.Param("wallet")
		var result []WillDocument
		for _, d := range mockDocuments {
			if d.WalletAddress == wallet {
				result = append(result, d)
			}
		}
		c.JSON(http.StatusOK, result)
	})

	var mockStorage = make(map[string]WillRecord)

	r.POST("/api/save-will", func(c *gin.Context) {
		var record WillRecord
		if err := c.ShouldBindJSON(&record); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		record.CreatedAt = time.Now()
		mockStorage[record.UserAddress] = record
		fmt.Printf("MOCK: Saved will for %s\n", record.UserAddress)
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Will saved to memory (MOCK MODE)"})
	})

	r.GET("/api/get-will/:address", func(c *gin.Context) {
		address := c.Param("address")
		if record, ok := mockStorage[address]; ok {
			c.JSON(http.StatusOK, record)
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "No will found for this address (MOCK MODE)"})
	})

	fmt.Printf("Mock Server running on http://localhost:%s\n", port)
	fmt.Printf("WillSys Address: %s\n", os.Getenv("WILLSYS_ADDRESS"))
	fmt.Printf("AssetManager Address: %s\n", os.Getenv("ASSET_MANAGER_ADDRESS"))
	fmt.Printf("BeneficiaryManager Address: %s\n", os.Getenv("BENEFICIARY_MANAGER_ADDRESS"))
	fmt.Printf("WillTypeManager Address: %s\n", os.Getenv("WILL_TYPE_MANAGER_ADDRESS"))
	fmt.Printf("DigitalWill Address: %s\n", os.Getenv("DIGITAL_WILL_ADDRESS"))
	r.Run(":" + port)
}

func generateHash(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}
