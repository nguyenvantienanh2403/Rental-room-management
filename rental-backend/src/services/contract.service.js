import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { contractModel, roomModel, tenantModel } from "../models/index.js";

const CONTRACT_POPULATE = [
  {
    path: "roomId",
    select: "name buildingId price",
  },
  {
    path: "tenantId",
    select: "fullName identityCard phoneNumber",
  },
];

// ---------------------------------------------------------------------------
// CREATE CONTRACT
// ---------------------------------------------------------------------------
const createContractService = async (contractData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if room exists and is available
    const room = await roomModel.findById(contractData.roomId).session(session);
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
    }
    if (room.status !== "available") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng này hiện không trống");
    }

    // Check if tenant exists
    const tenant = await tenantModel
      .findById(contractData.tenantId)
      .session(session);
    if (!tenant) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");
    }

    // Tự sinh mã hợp đồng: HD-YYMMDD-XXXX
    const today = new Date();
    const yy = String(today.getFullYear()).slice(2);
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const datePrefix = `HD-${yy}${mm}${dd}`;

    const latestContract = await contractModel
      .findOne({ contractCode: { $regex: `^${datePrefix}` } })
      .sort({ contractCode: -1 })
      .session(session);

    let nextNumber = 1;
    if (latestContract) {
      const lastSequence = parseInt(
        latestContract.contractCode.split("-")[2],
        10,
      );
      nextNumber = lastSequence + 1;
    }

    const sequence = String(nextNumber).padStart(4, "0");
    contractData.contractCode = `${datePrefix}-${sequence}`;

    const newContracts = await contractModel.create([contractData], {
      session,
    });
    const newContract = newContracts[0];

    // Cập nhật room status
    room.status = "rented";
    await room.save({ session });

    await session.commitTransaction();
    session.endSession();

    const contract = await contractModel
      .findById(newContract._id)
      .populate(CONTRACT_POPULATE)
      .lean();

    return respone(StatusCodes.CREATED, "Tạo hợp đồng thành công", contract);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ---------------------------------------------------------------------------
// GET ALL CONTRACTS (With Pagination & Filters)
// ---------------------------------------------------------------------------
const getAllContractsService = async (query = {}) => {
  const { page = 1, limit = 10, status, roomId, tenantId } = query;

  const filter = {};

  if (status && ["active", "expired", "terminated"].includes(status)) {
    filter.status = status;
  }
  if (roomId) filter.roomId = roomId;
  if (tenantId) filter.tenantId = tenantId;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [contracts, totalCount] = await Promise.all([
    contractModel
      .find(filter)
      .populate(CONTRACT_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    contractModel.countDocuments(filter),
  ]);

  return respone(StatusCodes.OK, "Lấy danh sách hợp đồng thành công", {
    contracts,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// GET CONTRACT BY ID
// ---------------------------------------------------------------------------
const getContractByIdService = async (contractId) => {
  const contract = await contractModel
    .findById(contractId)
    .populate(CONTRACT_POPULATE)
    .lean();

  if (!contract) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng");
  }

  return respone(StatusCodes.OK, "Lấy thông tin hợp đồng thành công", contract);
};

// ---------------------------------------------------------------------------
// UPDATE CONTRACT
// ---------------------------------------------------------------------------
const updateContractService = async (contractId, updateData) => {
  const contract = await contractModel.findById(contractId);

  if (!contract) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng");
  }

  // If changing contractCode
  if (
    updateData.contractCode &&
    updateData.contractCode !== contract.contractCode
  ) {
    const existing = await contractModel.findOne({
      contractCode: updateData.contractCode,
    });
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, "Mã hợp đồng đã tồn tại");
    }
  }

  // If changing room
  if (updateData.roomId && updateData.roomId !== contract.roomId.toString()) {
    const room = await roomModel.findById(updateData.roomId);
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng mới");
    }
    if (room.status !== "available") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng mới hiện không trống");
    }

    // We should ideally update old room to available, new room to rented,
    // but for simplicity in standard update we leave room logic mostly independent or handle carefully.
    // Assuming updating roomId is allowed and we handle status:
    const oldRoom = await roomModel.findById(contract.roomId);
    if (oldRoom) {
      oldRoom.status = "available";
      await oldRoom.save();
    }
    room.status = "rented";
    await room.save();
  }

  // If status changed to expired or terminated, free up the room
  if (
    updateData.status &&
    updateData.status !== "active" &&
    contract.status === "active"
  ) {
    const currentRoom = await roomModel.findById(contract.roomId);
    if (currentRoom) {
      currentRoom.status = "available";
      await currentRoom.save();
    }
  }

  const allowedFields = [
    "contractCode",
    "roomId",
    "tenantId",
    "startDate",
    "endDate",
    "deposit",
    "monthlyPrice",
    "electricityPrice",
    "waterPrice",
    "services",
    "status",
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

  const updatedContract = await contractModel
    .findByIdAndUpdate(
      contractId,
      { $set: sanitizedData },
      { returnDocument: "after", runValidators: true },
    )
    .populate(CONTRACT_POPULATE)
    .lean();

  return respone(
    StatusCodes.OK,
    "Cập nhật hợp đồng thành công",
    updatedContract,
  );
};

// ---------------------------------------------------------------------------
// DELETE CONTRACT
// ---------------------------------------------------------------------------
const deleteContractService = async (contractId) => {
  const contract = await contractModel.findById(contractId);

  if (!contract) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng");
  }

  // Free up the room if it was active
  if (contract.status === "active") {
    const room = await roomModel.findById(contract.roomId);
    if (room) {
      room.status = "available";
      await room.save();
    }
  }

  await contractModel.findByIdAndDelete(contractId);

  return respone(StatusCodes.OK, "Xóa hợp đồng thành công");
};

export {
  createContractService,
  getAllContractsService,
  getContractByIdService,
  updateContractService,
  deleteContractService,
};
