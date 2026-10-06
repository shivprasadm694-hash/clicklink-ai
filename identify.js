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
        error: "OPENAI_API_KEY is not configured in Vercel."
      });
    }

    const { image } = req.body || {};

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        success: false,
        error: "Product image is required."
      });
    }

    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        error: "Invalid image format."
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
You are the product identification engine for ClickLink AI.

Analyze the uploaded product image carefully.

Your job is to identify the product as accurately as possible so another system can search for the same or closest product on ecommerce marketplaces.

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
  "search_query": ""
}

Rules:

1. Do not invent a brand.
2. If the brand cannot be identified, return an empty string.
3. Identify the visible product type.
4. Identify the main visible color.
5. Identify men's/women's/unisex only when reasonably clear.
6. Use useful ecommerce search keywords.
7. The search_query must be a concise search phrase that can be used to find the same or closest product on marketplaces such as Amazon, Flipkart and eBay.
8. Do not include explanations.
9. Return JSON only.
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
      console.error(
        "OPENAI API ERROR:",
        data
      );

      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          "AI identification failed."
      });
    }

    let outputText =
      data.output_text || "";

    outputText = outputText.trim();

    /*
      Remove accidental markdown JSON fences
      if the model returns them.
    */

    outputText = outputText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();


    let product;

    try {

      product =
        JSON.parse(outputText);

    } catch (parseError) {

      console.error(
        "JSON PARSE ERROR:",
        outputText
      );

      return res.status(500).json({
        success: false,
        error:
          "AI returned an invalid product response."
      });

    }


    /*
      Make sure the expected fields exist.
    */

    product = {

      product_name:
        typeof product.product_name === "string"
          ? product.product_name
          : "",

      brand:
        typeof product.brand === "string"
          ? product.brand
          : "",

      category:
        typeof product.category === "string"
          ? product.category
          : "",

      subcategory:
        typeof product.subcategory === "string"
          ? product.subcategory
          : "",

      color:
        typeof product.color === "string"
          ? product.color
          : "",

      gender:
        typeof product.gender === "string"
          ? product.gender
          : "",

      keywords:
        Array.isArray(product.keywords)
          ? product.keywords
          : [],

      search_query:
        typeof product.search_query === "string"
          ? product.search_query
          : ""
    };


    if (!product.product_name) {

      return res.status(422).json({
        success: false,
        error:
          "AI could not identify the product."
      });

    }


    console.log(
      "CLICKLINK AI PRODUCT:",
      product
    );


    return res.status(200).json({
      success: true,
      product
    });

  } catch (error) {

    console.error(
      "CLICKLINK IDENTIFY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Server error while identifying product."
    });
  }
}
