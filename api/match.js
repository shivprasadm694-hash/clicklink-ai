export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    const product = body.product;
    const marketplaces = Array.isArray(body.marketplaces)
      ? body.marketplaces
      : [];

    if (!product) {
      return res.status(400).json({
        success: false,
        error: "Product information is required."
      });
    }

    if (marketplaces.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Select at least one marketplace."
      });
    }

    /*
      ClickLink AI marketplace adapter architecture.

      IMPORTANT:
      A real affiliate URL cannot be invented from a
      product name/photo.

      Each marketplace will later have its own official
      API + affiliate/deep-link integration.

      For now this endpoint prepares the normalized
      product information for those adapters.
    */

    const normalizedProduct = {
      product_name: product.product_name || "",
      brand: product.brand || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      color: product.color || "",
      gender: product.gender || "",
      keywords: Array.isArray(product.keywords)
        ? product.keywords
        : [],
      search_query: product.search_query || ""
    };

    const matches = [];

    /*
      AMAZON ADAPTER
    */

    if (marketplaces.includes("amazon")) {
      matches.push({
        marketplace: "Amazon",
        status: "adapter_ready",
        title: normalizedProduct.product_name,
        brand: normalizedProduct.brand,
        category: normalizedProduct.category,
        color: normalizedProduct.color,
        match: "Ready for official API integration",
        url: "",
        affiliate_url: ""
      });
    }

    /*
      FLIPKART ADAPTER
    */

    if (marketplaces.includes("flipkart")) {
      matches.push({
        marketplace: "Flipkart",
        status: "adapter_ready",
        title: normalizedProduct.product_name,
        brand: normalizedProduct.brand,
        category: normalizedProduct.category,
        color: normalizedProduct.color,
        match: "Ready for official API integration",
        url: "",
        affiliate_url: ""
      });
    }

    /*
      EBAY ADAPTER
    */

    if (marketplaces.includes("ebay")) {
      matches.push({
        marketplace: "eBay",
        status: "adapter_ready",
        title: normalizedProduct.product_name,
        brand: normalizedProduct.brand,
        category: normalizedProduct.category,
        color: normalizedProduct.color,
        match: "Ready for official API integration",
        url: "",
        affiliate_url: ""
      });
    }

    return res.status(200).json({
      success: true,

      product: normalizedProduct,

      marketplaces,

      matches
    });

  } catch (error) {

    console.error(
      "CLICKLINK MATCH ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Marketplace matching failed."
    });
  }
}
