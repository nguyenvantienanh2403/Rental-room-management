import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ApiError, response, escapeRegExp } from "../utils/index.js";
import { contractRepository, roomRepository, tenantRepository } from "../repositories/index.js";

const CONTRACT_POPULATE = [
  {
    path: "roomId",
    select: "name buildingId price",
    populate: {
      path: "buildingId",
      select: "name address landlordId",
      populate: {
        path: "landlordId",
        select: "fullName phoneNumber identityCard address",
      },
    },
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
    const room = await roomRepository.findById(contractData.roomId, { session });
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
    }
    if (room.status !== "available") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng này hiện không trống");
    }

    // Check if tenant exists
    const tenant = await tenantRepository.findById(contractData.tenantId, { session });
    if (!tenant) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");
    }

    // Tự sinh mã hợp đồng: HD-YYMMDD-XXXX
    const today = new Date();
    const yy = String(today.getFullYear()).slice(2);
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const datePrefix = `HD-${yy}${mm}${dd}`;

    const latestContract = await contractRepository.findOne(
      { contractCode: { $regex: `^${datePrefix}` } },
      { sort: { contractCode: -1 }, session }
    );

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

    const newContract = await contractRepository.create(contractData, { session });

    // Cập nhật room status
    room.status = "rented";
    await room.save({ session });

    await session.commitTransaction();
    session.endSession();

    const contract = await contractRepository.findById(newContract._id, {
      populate: CONTRACT_POPULATE,
      lean: true,
    });

    return response(StatusCodes.CREATED, "Tạo hợp đồng thành công", contract);
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
  const { page = 1, limit = 10, status, roomId, tenantId, search } = query;

  const filter = {};

  if (status && ["active", "expired", "terminated"].includes(status)) {
    filter.status = status;
  }
  if (roomId) filter.roomId = roomId;
  if (tenantId) filter.tenantId = tenantId;

  if (search) {
    const tenants = await tenantRepository.find({
      fullName: new RegExp(escapeRegExp(search), 'i')
    }, { select: '_id', lean: true });
    const tenantIds = tenants.map(t => t._id);
    filter.$or = [
      { contractCode: new RegExp(escapeRegExp(search), 'i') },
      { tenantId: { $in: tenantIds } }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [contracts, totalCount] = await Promise.all([
    contractRepository.find(filter, {
      populate: CONTRACT_POPULATE,
      sort: { createdAt: -1 },
      skip,
      limit: limitNum,
      lean: true,
    }),
    contractRepository.countDocuments(filter),
  ]);

  return response(StatusCodes.OK, "Lấy danh sách hợp đồng thành công", {
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
  const contract = await contractRepository.findById(contractId, {
    populate: CONTRACT_POPULATE,
    lean: true,
  });

  if (!contract) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng");
  }

  return response(StatusCodes.OK, "Lấy thông tin hợp đồng thành công", contract);
};

// ---------------------------------------------------------------------------
// UPDATE CONTRACT
// ---------------------------------------------------------------------------
const updateContractService = async (contractId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const contract = await contractRepository.findById(contractId, { session });

    if (!contract) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng");
    }

    // If changing contractCode
    if (
      updateData.contractCode &&
      updateData.contractCode !== contract.contractCode
    ) {
      const existing = await contractRepository.findOne(
        { contractCode: updateData.contractCode },
        { session }
      );
      if (existing) {
        throw new ApiError(StatusCodes.CONFLICT, "Mã hợp đồng đã tồn tại");
      }
    }

    // If changing room
    if (updateData.roomId && updateData.roomId !== contract.roomId.toString()) {
      const room = await roomRepository.findById(updateData.roomId, { session });
      if (!room) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng mới");
      }
      if (room.status !== "available") {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng mới hiện không trống");
      }

      const oldRoom = await roomRepository.findById(contract.roomId, { session });
      if (oldRoom) {
        oldRoom.status = "available";
        await oldRoom.save({ session });
      }
      room.status = "rented";
      await room.save({ session });
    }

    // If status changed to expired or terminated, free up the room
    if (
      updateData.status &&
      updateData.status !== "active" &&
      contract.status === "active"
    ) {
      const currentRoom = await roomRepository.findById(contract.roomId, { session });
      if (currentRoom) {
        currentRoom.status = "available";
        await currentRoom.save({ session });
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

    const updatedContract = await contractRepository.findByIdAndUpdate(
      contractId,
      { $set: sanitizedData },
      { populate: CONTRACT_POPULATE, session }
    );

    await session.commitTransaction();
    session.endSession();

    return response(
      StatusCodes.OK,
      "Cập nhật hợp đồng thành công",
      updatedContract ? updatedContract.toObject() : null,
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ---------------------------------------------------------------------------
// DELETE CONTRACT
// ---------------------------------------------------------------------------
const deleteContractService = async (contractId) => {
  const contract = await contractRepository.findById(contractId);

  if (!contract) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng");
  }

  // Free up the room if it was active
  if (contract.status === "active") {
    const room = await roomRepository.findById(contract.roomId);
    if (room) {
      room.status = "available";
      await room.save();
    }
  }

  await contractRepository.findByIdAndDelete(contractId);

  return response(StatusCodes.OK, "Xóa hợp đồng thành công");
};

export {
  createContractService,
  getAllContractsService,
  getContractByIdService,
  updateContractService,
  deleteContractService,
};
