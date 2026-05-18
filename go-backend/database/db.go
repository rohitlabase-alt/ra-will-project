package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var WillCollection *mongo.Collection
var DocumentCollection *mongo.Collection

func InitMongoDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}
	var err error
	Client, err = mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("MongoDB Connection Error:", err)
	}

	err = Client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Could not ping MongoDB:", err)
	}

	fmt.Println("Connected to MongoDB!")
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "will_db"
	}
	WillCollection = Client.Database(dbName).Collection("wills")
	DocumentCollection = Client.Database(dbName).Collection("documents")
}
