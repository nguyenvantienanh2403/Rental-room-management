import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { buildingModel } from "../models/index.js";
import { ROLES } from "../constants/index.js";

/**
 * Populate options cho building queries
 */
const BUILDING_POPULATE = [
  {
    path: "landlordId",
    select: "username email avatar slug",
  },
];

const checkIsAdmin = (user) => {
  if (!user || !user.role) return false;
  const roleName = typeof user.role === 'object' ? user.role.name : user.role;
  return roleName?.toLowerCase() === ROLES.ADMIN;
};

// ---------------------------------------------------------------------------
// CREATE BUILDING
// ---------------------------------------------------------------------------
const createBuildingService = async (currentUser, buildingData) => {
  const newBuilding = await buildingModel.create({
    ...buildingData,
    landlordId: currentUser._id,
  });

  const building = await buildingModel
    .findById(newBuilding._id)
    .populate(BUILDING_POPULATE)
    .lean();

  return respone(StatusCodes.CREATED, "Tạo tòa nhà thành công", building);
};

// ---------------------------------------------------------------------------
// GET ALL BUILDINGS  (phân trang + filter + data ownership)
// ---------------------------------------------------------------------------
const getAllBuildingsService = async (query = {}, currentUser) => {
  const {
    page = 1,
    limit = 10,
    keyword,
    type,
    city,
    district,
    status = "active",
  } = query;

  const filter = {};

  // Data Ownership: Landlord chỉ thấy tòa nhà của mình
  if (currentUser && !checkIsAdmin(currentUser)) {
    filter.landlordId = currentUser._id;
  }

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
    filter.$or = [{ name: regex }, { "address.street": regex }];
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

  return respone(StatusCodes.OK, "Lấy danh sách tòa nhà thành công", {
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
const getBuildingBySlugOrIdService = async (identifier, currentUser) => {
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
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy tòa nhà");
  }

  if (building.status === "inactive") {
    throw new ApiError(StatusCodes.GONE, "Tòa nhà này đã bị vô hiệu hóa");
  }

  // Data Ownership
  if (currentUser && !checkIsAdmin(currentUser)) {
    const landlordIdStr = building.landlordId?._id ? building.landlordId._id.toString() : building.landlordId.toString();
    if (landlordIdStr !== currentUser._id.toString()) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền truy cập tòa nhà này");
    }
  }

  return respone(StatusCodes.OK, "Lấy thông tin tòa nhà thành công", building);
};

// ---------------------------------------------------------------------------
// UPDATE BUILDING
// ---------------------------------------------------------------------------
const updateBuildingService = async (currentUser, buildingId, updateData) => {
  const building = await buildingModel.findById(buildingId);

  if (!building) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy tòa nhà");
  }

  // Chỉ Admin hoặc Landlord sở hữu mới được sửa
  if (!checkIsAdmin(currentUser) && building.landlordId.toString() !== currentUser._id.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Bạn chỉ có thể cập nhật tòa nhà của chính mình",
    );
  }

  // Whitelist các field được phép cập nhật
  const allowedFields = [
    "name",
    "type",
    "description",
    "address",
    "amenities",
    "images",
    "totalRooms",
    "contactPhone",
  ];
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Không có dữ liệu hợp lệ để cập nhật",
    );
  }

  const updatedBuilding = await buildingModel
    .findByIdAndUpdate(
      buildingId,
      { $set: sanitizedData },
      { returnDocument: "after", runValidators: true },
    )
    .populate(BUILDING_POPULATE)
    .lean();

  return respone(
    StatusCodes.OK,
    "Cập nhật tòa nhà thành công",
    updatedBuilding,
  );
};

// ---------------------------------------------------------------------------
// DELETE BUILDING  (Soft delete — status = "inactive")
// ---------------------------------------------------------------------------
const deleteBuildingService = async (currentUser, buildingId) => {
  const building = await buildingModel.findById(buildingId);

  if (!building) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy tòa nhà");
  }

  // Chỉ Admin hoặc Landlord sở hữu mới được xóa
  if (!checkIsAdmin(currentUser) && building.landlordId.toString() !== currentUser._id.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Bạn chỉ có thể xóa tòa nhà của chính mình",
    );
  }

  if (building.status === "inactive") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Tòa nhà này đã bị vô hiệu hóa",
    );
  }

  building.status = "inactive";
  await building.save();

  return respone(StatusCodes.OK, "Vô hiệu hóa tòa nhà thành công");
};

export {
  createBuildingService,
  getAllBuildingsService,
  getBuildingBySlugOrIdService,
  updateBuildingService,
  deleteBuildingService,
};
