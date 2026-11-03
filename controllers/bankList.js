import axios from "axios";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Cache bank list in memory for 24 hours
const BANK_CACHE_TTL = 24 * 60 * 60 * 1000;

const bankCache = new Map();

export const getBanks = async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: "Paystack is not configured."
      });
    }

    // Default to Nigeria, but allow configuration through .env
    const country = (
      process.env.PAYSTACK_BANK_COUNTRY || "nigeria"
    ).toLowerCase();

    // Check cache
    const cachedBanks = bankCache.get(country);

    if (cachedBanks && Date.now() < cachedBanks.expiresAt) {
      return res.status(200).json({
        success: true,
        message: "Banks retrieved successfully.",
        data: cachedBanks.data
      });
    }

    // Fetch banks from Paystack
    let banks = [];
    let page = 1;
    let pageCount = 1;

    do {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/bank`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json"
          },

          params: {
            country,
            perPage: 100,
            page
          },

          timeout: 15000
        }
      );

      if (!response.data?.status) {
        throw new Error("Unable to retrieve banks from Paystack.");
      }

      const bankData = response.data.data || [];

      banks.push(...bankData);

      pageCount = Number(response.data.meta?.pageCount) || 1;

      page++;

    } while (page <= pageCount);

    // Return only active banks and the fields
    // required by the frontend.
    const formattedBanks = banks
      .filter(bank =>
        bank.active !== false &&
        bank.is_deleted !== true &&
        bank.name &&
        bank.code
      )
      .map(bank => ({
        name: bank.name,
        code: String(bank.code)
      }))
      // Remove duplicates using bank code
      .filter((bank, index, self) =>
        index === self.findIndex(
          item => item.code === bank.code
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!formattedBanks.length) {
      throw new Error("No banks were returned by Paystack.");
    }

    // Save to cache
    bankCache.set(country, {
      data: formattedBanks,
      expiresAt: Date.now() + BANK_CACHE_TTL
    });

    return res.status(200).json({
      success: true,
      message: "Banks retrieved successfully.",
      data: formattedBanks
    });

  } catch (error) {
    console.error(
      "Get banks error:",
      error.response?.data?.message || error.message
    );

    // If Paystack fails, serve expired cached data if available.
    const country = (
      process.env.PAYSTACK_BANK_COUNTRY || "nigeria"
    ).toLowerCase();

    const cachedBanks = bankCache.get(country);

    if (cachedBanks) {
      return res.status(200).json({
        success: true,
        message: "Banks retrieved from cached data.",
        data: cachedBanks.data
      });
    }

    return res.status(502).json({
      success: false,
      message: "Unable to retrieve bank list. Please try again later."
    });
  }
};