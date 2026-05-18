package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/rohit/will-backend/database"
	"github.com/rohit/will-backend/models"
)

func GetDocuments(c *gin.Context) {
	wallet := c.Param("wallet")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := database.DocumentCollection.Find(ctx, bson.M{"walletAddress": wallet})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var results []models.WillDocument
	if err = cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

func SaveWill(c *gin.Context) {
	var record models.WillRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record.CreatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userAddress": record.UserAddress}
	update := bson.M{"$set": record}
	opts := options.Update().SetUpsert(true)

	_, err := database.WillCollection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save to database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Will data saved to MongoDB",
	})
}

func GetWill(c *gin.Context) {
	address := c.Param("address")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var result models.WillRecord
	err := database.WillCollection.FindOne(ctx, bson.M{"userAddress": address}).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "No will found for this address"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func FindInheritedWills(c *gin.Context) {
	address := c.Param("address")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := database.WillCollection.Find(ctx, bson.M{"beneficiaries.address": address})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var results []models.WillRecord
	if err = cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

func GetWillByHash(c *gin.Context) {
	hash := c.Param("hash")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var result models.WillRecord
	filter := bson.M{
		"$or": []bson.M{
			{"txHash": bson.M{"$regex": "^" + hash + "$", "$options": "i"}},
			{"userAddress": bson.M{"$regex": "^" + hash + "$", "$options": "i"}},
		},
	}
	err := database.WillCollection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "No will found with this transaction hash or user address"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
