package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetSystemAlerts fetches system and network alerts.
func GetSystemAlerts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"alerts": []gin.H{
			{
				"type":      "info",
				"message":   "Vigilance Check: Neural Legacy Vault status active.",
				"timestamp": "now",
			},
			{
				"type":      "success",
				"message":   "AI Executor status: Active monitoring running.",
				"timestamp": "now",
			},
		},
	})
}
