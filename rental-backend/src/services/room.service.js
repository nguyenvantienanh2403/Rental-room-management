import { StatusCodes } from "http-status-codes";
import { ApiError, response, checkIsAdmin } from "../utils/index.js";
import { roomRepository, buildingRepository } from "../repositories/index.js";
import { uploadToCloudinary } from "./upload.service.js";
import { getCache, setCache, deleteCache, deletePatternCache } from "../utils/cache.js";

const ROOM_POPULATE = [
  {
    path: "buildingId",
    select: "name address type landlordId",
  },
  {
    path: "tenants",
    match: { status: "active" },
    select: "fullName identityCard phoneNumber homeTown",
  },
];

// Hàm tiện ích: Lấy tất cả ID tòa nhà của một Landlord
const getLandlordBuildingIds = async (landlordId) => {
  const buildings = await buildingRepository.find({ landlordId }, { select: '_id', lean: true });
  return buildings.map(b => b._id);
};

// Hàm tiện ích: Kiểm tra quyền sở hữu tòa nhà
const verifyBuildingOwnership = async (buildingId, currentUser) => {
  if (checkIsAdmin(currentUser)) return true;
  const building = await buildingRepository.findById(buildingId, { select: 'landlordId', lean: true });
  if (!building) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy tòa nhà");
  if (building.landlordId.toString() !== currentUser._id.toString()) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền thao tác trên tòa nhà này");
  }
  return true;
};

// ---------------------------------------------------------------------------
// CREATE ROOM
// ---------------------------------------------------------------------------
const createRoomService = async (roomData, currentUser) => {
  // Check ownership of building
  await verifyBuildingOwnership(roomData.buildingId, currentUser);

  const newRoom = await roomRepository.create(roomData);

  const room = await roomRepository.findById(newRoom._id, {
    populate: ROOM_POPULATE,
    lean: true,
  });

  // Invalidate cache
  await deletePatternCache(`rooms:list:building:${roomData.buildingId}:*`);
  await deletePatternCache("rooms:all:*");
  await deletePatternCache("rooms:public:*");

  return response(StatusCodes.CREATED, "Tạo phòng thành công", room);
};

// ---------------------------------------------------------------------------
// GET ROOMS BY BUILDING ID
// ---------------------------------------------------------------------------
const getRoomsByBuildingService = async (buildingId, queryOptions = {}, currentUser) => {
  // Kiểm tra quyền xem building này
  await verifyBuildingOwnership(buildingId, currentUser);

  const cacheKey = `rooms:list:building:${buildingId}:query:${JSON.stringify(queryOptions)}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return response(StatusCodes.OK, "Lấy danh sách phòng thành công", cachedData);
  }

  const { page = 1, limit = 10, status } = queryOptions;
  const filter = { buildingId };

  if (status && ["available", "rented", "maintenance"].includes(status)) {
    filter.status = status;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [rooms, totalCount] = await Promise.all([
    roomRepository.find(filter, {
      populate: ROOM_POPULATE,
      sort: { createdAt: -1 },
      skip,
      limit: limitNum,
      lean: true,
    }),
    roomRepository.countDocuments(filter),
  ]);

  const resultData = {
    rooms,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  };

  await setCache(cacheKey, resultData, 300); // Cache 5 minutes

  return response(StatusCodes.OK, "Lấy danh sách phòng thành công", resultData);
};

// ---------------------------------------------------------------------------
// GET PUBLIC ROOMS (Marketplace)
// ---------------------------------------------------------------------------
const getPublicRoomsService = async (queryOptions = {}) => {
  const cacheKey = `rooms:public:query:${JSON.stringify(queryOptions)}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return response(StatusCodes.OK, "Lấy danh sách phòng trống thành công", cachedData);
  }

  const { page = 1, limit = 10 } = queryOptions;
  const filter = { status: "available" }; // Luôn luôn chỉ lấy phòng trống

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [rooms, totalCount] = await Promise.all([
    roomRepository.find(filter, {
      populate: ROOM_POPULATE,
      sort: { createdAt: -1 },
      skip,
      limit: limitNum,
      lean: true,
    }),
    roomRepository.countDocuments(filter),
  ]);

  const resultData = {
    rooms,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  };

  await setCache(cacheKey, resultData, 300); // Cache 5 minutes

  return response(StatusCodes.OK, "Lấy danh sách phòng trống thành công", resultData);
};

// ---------------------------------------------------------------------------
// GET ALL ROOMS (Xử lý Data Ownership toàn cục)
// ---------------------------------------------------------------------------
const getAllRoomsService = async (queryOptions = {}, currentUser) => {
  const cacheKey = `rooms:all:user:${currentUser?._id || "public"}:query:${JSON.stringify(queryOptions)}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return response(StatusCodes.OK, "Lấy danh sách tất cả phòng thành công", cachedData);
  }

  const { page = 1, limit = 10, status } = queryOptions;
  const filter = {};

  // Data ownership: Nếu không phải admin, chỉ lấy phòng thuộc các tòa nhà của mình
  if (!checkIsAdmin(currentUser)) {
    const allowedBuildingIds = await getLandlordBuildingIds(currentUser._id);
    filter.buildingId = { $in: allowedBuildingIds };
  }

  if (status && ["available", "rented", "maintenance"].includes(status)) {
    filter.status = status;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [rooms, totalCount] = await Promise.all([
    roomRepository.find(filter, {
      populate: ROOM_POPULATE,
      sort: { createdAt: -1 },
      skip,
      limit: limitNum,
      lean: true,
    }),
    roomRepository.countDocuments(filter),
  ]);

  const resultData = {
    rooms,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  };

  await setCache(cacheKey, resultData, 300); // Cache 5 minutes

  return response(StatusCodes.OK, "Lấy danh sách tất cả phòng thành công", resultData);
};

// ---------------------------------------------------------------------------
// GET ROOM BY SLUG
// ---------------------------------------------------------------------------
const getRoomBySlugService = async (slug, currentUser) => {
  const cacheKey = `rooms:detail:slug:${slug}`;
  let room = await getCache(cacheKey);

  if (!room) {
    room = await roomRepository.findOne({ slug }, { populate: ROOM_POPULATE, lean: true });

    if (room) {
      await setCache(cacheKey, room, 300);
      // Cache cross reference by _id
      if (room._id) {
        await setCache(`rooms:detail:id:${room._id.toString()}`, room, 300);
      }
    }
  }

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  // Check ownership
  await verifyBuildingOwnership(room.buildingId._id || room.buildingId, currentUser);

  return response(StatusCodes.OK, "Lấy thông tin phòng thành công", room);
};

// ---------------------------------------------------------------------------
// UPDATE ROOM
// ---------------------------------------------------------------------------
const updateRoomService = async (roomId, updateData, currentUser) => {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  // Check ownership
  await verifyBuildingOwnership(room.buildingId, currentUser);

  const allowedFields = [
    "name",
    "price",
    "area",
    "status",
    "amenities",
    "images",
    "maxCapacity",
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

  const updatedRoom = await roomRepository.findByIdAndUpdate(
    roomId,
    { $set: sanitizedData },
    { populate: ROOM_POPULATE, lean: true }
  );

  // Invalidate cache
  await deletePatternCache(`rooms:list:building:${room.buildingId}:*`);
  await deletePatternCache("rooms:all:*");
  await deletePatternCache("rooms:public:*");
  await deleteCache(`rooms:detail:id:${roomId}`);
  if (room.slug) {
    await deleteCache(`rooms:detail:slug:${room.slug}`);
  }
  if (updatedRoom && updatedRoom.slug && updatedRoom.slug !== room.slug) {
    await deleteCache(`rooms:detail:slug:${updatedRoom.slug}`);
  }

  return response(StatusCodes.OK, "Cập nhật phòng thành công", updatedRoom);
};

// ---------------------------------------------------------------------------
// DELETE ROOM
// ---------------------------------------------------------------------------
const deleteRoomService = async (roomId, currentUser) => {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  // Check ownership
  await verifyBuildingOwnership(room.buildingId, currentUser);

  await roomRepository.findByIdAndDelete(roomId);

  // Invalidate cache
  await deletePatternCache(`rooms:list:building:${room.buildingId}:*`);
  await deletePatternCache("rooms:all:*");
  await deletePatternCache("rooms:public:*");
  await deleteCache(`rooms:detail:id:${roomId}`);
  if (room.slug) {
    await deleteCache(`rooms:detail:slug:${room.slug}`);
  }

  return response(StatusCodes.OK, "Xóa phòng thành công");
};

// ---------------------------------------------------------------------------
// UPLOAD ROOM IMAGES
// ---------------------------------------------------------------------------
const uploadRoomImagesService = async (files) => {
  if (!files || files.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Không có file ảnh được cung cấp");
  }

  const uploadPromises = files.map(file => 
    uploadToCloudinary(
      file.buffer,
      "rental-app/rooms",
      {
        transformation: [
          { width: 1200, height: 800, crop: "fill" },
          { quality: "auto", fetch_format: "auto" },
        ],
      }
    )
  );

  const results = await Promise.all(uploadPromises);
  const imageUrls = results.map(result => result.secure_url);

  return response(StatusCodes.OK, "Tải ảnh lên thành công", imageUrls);
};

export {
  createRoomService,
  getRoomsByBuildingService,
  getAllRoomsService,
  getPublicRoomsService,
  getRoomBySlugService,
  updateRoomService,
  deleteRoomService,
  uploadRoomImagesService,
};
