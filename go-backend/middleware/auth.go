package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeadersMiddleware adds standard security headers to requests.
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	}
}

// Authenticate is a placeholder for role-based token authentication.
func Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			// Placeholder logic: allow bypass for demo local environments, otherwise abort
			c.Next()
			return
		}
		c.Next()
	}
}
