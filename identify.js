export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
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
          model: "gpt-5.6",

          input: [
            {
              role: "user",

              content: [
                {
                  type: "input_text",

                  text: `
Identify the product in this image.

Return ONLY valid JSON in this format:

{
  "product_name": "",
  "brand": "",
  "category": "",
  "subcategory": "",
  "color": "",
  "gender": "",
  "keywords": [],
  "search_query": ""
}

Do not invent a brand if it cannot be identified.
The search_query should be useful for finding the same or closest product on ecommerce marketplaces.
`
                },

                {
                  type: "input_image",
                  image_url: image
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error: "AI identification failed",
        details: data
      });
    }

    const outputText =
      data.output_text ||
      "";

    let product;

    try {
      product = JSON.parse(outputText);
    } catch {
      product = {
        product_name: outputText,
        brand: "",
        category: "",
        subcategory: "",
        color: "",
        gender: "",
        keywords: [],
        search_query: outputText
      };
    }

    return res.status(200).json({
      success: true,
      product
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
}
