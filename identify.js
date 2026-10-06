export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const { image } = req.body || {};

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        success: false,
        error: "Product image is required"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-6-luna",

          input: [
            {
              role: "user",

              content: [
                {
                  type: "input_text",

                  text: `
You are ClickLink AI's product identification engine.

Analyze the uploaded ecommerce product image.

Identify the product as accurately as possible.

Return ONLY valid JSON.

Use exactly this structure:

{
  "product_name": "",
  "brand": "",
  "category": "",
  "subcategory": "",
  "color": "",
  "gender": "",
  "keywords": [],
  "search_query": "",
  "confidence": 0
}

Rules:

- Do not invent a brand.
- If the brand cannot be identified, return an empty string.
- Identify visible product characteristics.
- The search_query must be useful for searching the same or closest product on ecommerce marketplaces.
- keywords must contain useful marketplace search terms.
- confidence must be a number from 0 to 100.
- Do not include explanations outside the JSON.
`
                },

                {
                  type: "input_image",
                  image_url: image,
                  detail: "high"
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);

      return res.status(response.status).json({
        success: false,
        error: "AI identification failed",
        details: data
      });
    }

    const outputText = data.output_text || "";

    if (!outputText) {
      return res.status(500).json({
        success: false,
        error: "AI returned an empty response"
      });
    }

    let product;

    try {
      product = JSON.parse(outputText);
    } catch (parseError) {
      console.error("JSON PARSE ERROR:", parseError);

      return res.status(500).json({
        success: false,
        error: "AI returned invalid product data",
        raw: outputText
      });
    }

    return res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    console.error("CLICKLINK IDENTIFY ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Server error while identifying product"
    });
  }
}
