
import mongoose from "mongoose";
import Collection from "../models/HouseCollection.js";
import House from "../models/House.js";

const getOwnedHouse = async (houseId, userId) => {
  return House.findOne({
    _id: houseId,
    ownerId: userId
  });
};


export const createCollection = async (req, res) => {
  try {
    const { houseId } = req.params;
    const { name, description, coverImage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(houseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid house ID."
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required."
      });
    }

    const house = await getOwnedHouse(houseId, req.user.id);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found or unauthorized.",
        data:[]
      });
    }

    const collection = await Collection.create({
      houseId,
      name: name.trim(),
      description,
      coverImage,
      productIds: []
    });

    return res.status(201).json({
      success: true,
      message: "Collection created successfully.",
      data: collection
    });

  } catch (error) {
    
    console.error("Create collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create collection."
    });
  }
};


// 2. GET ALL HOUSE COLLECTIONS
export const getHouseCollections = async (req, res) => {
  try {
    const { houseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(houseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid house ID."
      });
    }

    const house = await getOwnedHouse(houseId, req.user.id);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found or unauthorized.",
        data:[]
      });
    }

    const collections = await Collection.find({ houseId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Collections fetched successfully.",
      data: collections
    });

  } catch (error) {
    console.error("Get house collections error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch collections."
    });
  }
};


// Any authenticated user can access this endpoint.
export const getHouseCollectionById = async (req, res) => {
  try {
    const { collectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID."
      });
    }

    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found."
      });
    }

    
    const productIds = collection.productIds.map(
      id => id.toString()
    );

    await collection.populate({
      path: "productIds",
      select: "title price currency media"
    });

    // Remove null entries for deleted products.
    const products = collection.productIds.filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Collection fetched successfully.",
      data: {
        _id: collection._id,
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        productIds,
        products
      }
    });

  } catch (error) {
    console.error("Get collection by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch collection."
    });
  }
};


// 4. UPDATE COLLECTION
export const updateCollection = async (req, res) => {
  try {
    const { houseId, collectionId } = req.params;
    const { name, description, coverImage } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(houseId) ||
      !mongoose.Types.ObjectId.isValid(collectionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid house or collection ID."
      });
    }

    const house = await getOwnedHouse(houseId, req.user.id);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found or unauthorized."
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Collection name cannot be empty."
        });
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (coverImage !== undefined) {
      updateData.coverImage = coverImage;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update."
      });
    }

    const collection = await Collection.findOneAndUpdate(
      {
        _id: collectionId,
        houseId
      },
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully.",
      data: collection
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A collection with this name already exists."
      });
    }

    console.error("Update collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update collection."
    });
  }
};


// 5. DELETE COLLECTION
export const deleteCollection = async (req, res) => {
  try {
    const { houseId, collectionId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(houseId) ||
      !mongoose.Types.ObjectId.isValid(collectionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid house or collection ID."
      });
    }

    const house = await getOwnedHouse(houseId, req.user.id);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found or unauthorized."
      });
    }

    const collection = await Collection.findOneAndDelete({
      _id: collectionId,
      houseId
    });

    if (!collection) {
      return res.status(200).json({
        success: true,
        message: "Collection not found.",
        data:[],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully.",
      data: collection
    });

  } catch (error) {
    console.error("Delete collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete collection."
    });
  }
};
