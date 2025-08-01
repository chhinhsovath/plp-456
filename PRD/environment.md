ssh ubuntu@157.10.73.52
en_&xdX#!N(^OqCQzc3RE0B)m6ogU!

DB_HOST=157.10.73.52
DB_PORT=5432
DB_NAME=plp_456
DB_USER=admin
DB_PASSWORD=P@ssw0rd


open_router=sk-or-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
model=google/gemma-3-27b-it:free
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <OPENROUTER_API_KEY>",
    "HTTP-Referer": “https://tec.openplp.com”, // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": “PLP TEC”, // Optional. Site title for rankings on openrouter.ai.
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "google/gemma-3-27b-it:free",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What is in this image?"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
            }
          }
        ]
      }
    ]
  })
});