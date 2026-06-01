import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { buildingModel } from "../models/index.js";

/**
 * Populate options cho building queries
 */
const BUILDING_POPULATE = [
  {
    path: "landlordId",
    select: "username email avatar slug",
  },
];

// ---------------------------------------------------------------------------
// CREATE BUILDING
// ---------------------------------------------------------------------------
const createBuildingService = async (landlordId, buildingData) => {
  const newBuilding = await buildingModel.create({
    ...buildingData,
    landlordId,
  });

  const building = await buildingModel
    .findById(newBuilding._id)
    .populate(BUILDING_POPULATE)
    .lean();

  return respone(StatusCodes.CREATED, "Building created successfully", building);
};

// ---------------------------------------------------------------------------
// GET ALL BUILDINGS  (public, phân trang + filter)
// ---------------------------------------------------------------------------
const getAllBuildingsService = async (query = {}) => {
  const { page = 1, limit = 10, keyword, type, city, district, status = "active" } = query;

  const filter = {};

  // Default: chỉ hiển thị building active
  if (status && ["active", "inactive"].includes(status)) {
    filter.status = status;
  }

  // Filter theo type
  if (type) {
    filter.type = type;
  }

  // Filter theo city
  if (city) {
    filter["address.city"] = new RegExp(city, "i");
  }

  // Filter theo district
  if (district) {
    filter["address.district"] = new RegExp(district, "i");
  }

  // Search keyword theo name hoặc address.street
  if (keyword) {
    const regex = new RegExp(keyword, "i");
    filter.$or = [
      { name: regex },
      { "address.street": regex },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [buildings, totalCount] = await Promise.all([
    buildingModel
      .find(filter)
      .populate(BUILDING_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    buildingModel.countDocuments(filter),
  ]);

  return respone(StatusCodes.OK, "Buildings retrieved successfully", {
    buildings,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// GET BUILDING BY SLUG OR ID
// ---------------------------------------------------------------------------
const getBuildingBySlugOrIdService = async (identifier) => {
  // Thử tìm theo slug trước, nếu không có thì tìm theo ID
  let building = await buildingModel
    .findOne({ slug: identifier })
    .populate(BUILDING_POPULATE)
    .lean();

  if (!building) {
    // Kiểm tra xem identifier có phải ObjectId hợp lệ không
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      building = await buildingModel
        .findById(identifier)
        .populate(BUILDING_POPULATE)
        .lean();
    }
  }

  if (!building) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Building not found");
  }

  if (building.status === "inactive") {
    throw new ApiError(StatusCodes.GONE, "This building has been deactivated");
  }

  return respone(StatusCodes.OK, "Building retrieved successfully", building);
};

// ---------------------------------------------------------------------------
// UPDATE BUILDING
// ---------------------------------------------------------------------------
const updateBuildingService = async (currentUserId, buildingId, updateData) => {
  const building = await buildingModel.findById(buildingId);

  if (!building) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Building not found");
  }

  // Chỉ landlord sở hữu mới được sửa
  if (building.landlordId.toString() !== currentUserId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You can only update your own building",
    );
  }

  // Whitelist các field được phép cập nhật
  const allowedFields = [
    "name", "type", "description", "address",
    "amenities", "images", "totalRooms", "contactPhone",
  ];
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No valid fields to update");
  }

  const updatedBuilding = await buildingModel
    .findByIdAndUpdate(buildingId, { $set: sanitizedData }, { new: true, runValidators: true })
    .populate(BUILDING_POPULATE)
    .lean();

  return respone(StatusCodes.OK, "Building updated successfully", updatedBuilding);
};

// ---------------------------------------------------------------------------
// DELETE BUILDING  (Soft delete — status = "inactive")
// ---------------------------------------------------------------------------
const deleteBuildingService = async (currentUserId, buildingId) => {
  const building = await buildingModel.findById(buildingId);

  if (!building) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Building not found");
  }

  // Chỉ landlord sở hữu mới được xóa
  if (building.landlordId.toString() !== currentUserId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You can only delete your own building",
    );
  }

  if (building.status === "inactive") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Building is already deactivated");
  }

  building.status = "inactive";
  await building.save();

  return respone(StatusCodes.OK, "Building deactivated successfully");
};

export {
  createBuildingService,
  getAllBuildingsService,
  getBuildingBySlugOrIdService,
  updateBuildingService,
  deleteBuildingService,
};
