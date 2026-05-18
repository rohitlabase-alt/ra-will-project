package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rohit/will-backend/database"
	"github.com/rohit/will-backend/models"
	"github.com/rohit/will-backend/utils"
)

func UploadWillDocuments(c *gin.Context) {
	wallet := c.PostForm("walletAddress")

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	files := form.File["documents"]
	var uploadedDocs []models.DocumentResponse

	for _, fileHeader := range files {
		filename := fileHeader.Filename
		dst := filepath.Join("uploads", filename)

		if err := c.SaveUploadedFile(fileHeader, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save file %s", filename)})
			return
		}

		hash, err := utils.GenerateHash(dst)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to hash file %s", filename)})
			return
		}

		ipfsHash, err := utils.UploadToPinata(dst, filename)
		if err != nil {
			log.Println("Pinata upload error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to upload to IPFS: %v", err)})
			return
		}

		gateway := os.Getenv("PINATA_GATEWAY")
		if gateway == "" {
			gateway = "https://gateway.pinata.cloud"
		}
		storageUrl := fmt.Sprintf("%s/ipfs/%s", gateway, ipfsHash)

		doc := models.WillDocument{
			WalletAddress: wallet,
			FileName:      filename,
			FilePath:      dst,
			Hash:          hash,
			StorageURL:    storageUrl,
			IpfsHash:      ipfsHash,
			UploadedAt:    time.Now(),
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err = database.DocumentCollection.InsertOne(ctx, doc)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save metadata to MongoDB"})
			return
		}

		uploadedDocs = append(uploadedDocs, models.DocumentResponse{
			FileName:   filename,
			Hash:       hash,
			StorageURL: doc.StorageURL,
			IpfsHash:   ipfsHash,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"documents": uploadedDocs,
		"message":   "uploaded successfully",
	})
}
