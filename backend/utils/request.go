package utils

import (
	"encoding/json"
	"io"
	"net/http"
)

// ParseJSONBody парсит JSON тело запроса в структуру
func ParseJSONBody(r *http.Request, v interface{}) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	defer r.Body.Close()

	return json.Unmarshal(body, v)
}
