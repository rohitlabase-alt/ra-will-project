package main

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var _ = testMongoConnection

func testMongoConnection() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb+srv://rohitlabase_db_user:Rohit13@cluster0.oghpqcw.mongodb.net/Digital_Will_pro?appName=Cluster0"))
	if err != nil {
		fmt.Println("Connect Error:", err)
		return
	}
	err = client.Ping(ctx, nil)
	if err != nil {
		fmt.Println("Ping Error:", err)
	} else {
		fmt.Println("Success!")
	}
}
