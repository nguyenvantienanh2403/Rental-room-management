import { StatusCodes } from "http-status-codes";
import { response, checkIsAdmin } from "../utils/index.js";
import { buildingModel, roomModel, invoiceModel, contractModel } from "../models/index.js";

const getOverviewService = async (currentUser) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let previousMonth = currentMonth - 1;
  let previousYear = currentYear;
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = currentYear - 1;
  }

  // Khởi tạo các bộ lọc Data Ownership
  let roomFilter = {};
  let contractFilter = {};
  let invoiceFilter = {};

  if (currentUser && !checkIsAdmin(currentUser)) {
    // 1. Tìm các ID Tòa nhà của Landlord
    const buildings = await buildingModel.find({ landlordId: currentUser._id }).select('_id').lean();
    const buildingIds = buildings.map(b => b._id);
    
    roomFilter.buildingId = { $in: buildingIds };
    
    // 2. Tìm các ID Phòng thuộc các Tòa nhà trên
    const rooms = await roomModel.find({ buildingId: { $in: buildingIds } }).select('_id').lean();
    const roomIds = rooms.map(r => r._id);
    
    contractFilter.roomId = { $in: roomIds };
    
    // 3. Tìm các ID Hợp đồng thuộc các Phòng trên
    const contracts = await contractModel.find({ roomId: { $in: roomIds } }).select('_id').lean();
    const contractIds = contracts.map(c => c._id);
    
    invoiceFilter.contractId = { $in: contractIds };
  }

  // 1. Room Statistics
  const roomStatsPromise = Promise.all([
    roomModel.countDocuments(roomFilter),
    roomModel.countDocuments({ ...roomFilter, status: "rented" })
  ]).then(([total, rented]) => {
    const available = total - rented;
    const occupancyRate = total > 0 ? ((rented / total) * 100).toFixed(2) : 0;
    return {
      totalRooms: total,
      rentedRooms: rented,
      availableRooms: available,
      occupancyRate: parseFloat(occupancyRate)
    };
  });

  // 2. Current Month Revenue
  const currentMonthRevenuePromise = invoiceModel.aggregate([
    { $match: { ...invoiceFilter, month: currentMonth, year: currentYear, status: "paid" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]).then(res => res[0]?.total || 0);

  const previousMonthRevenuePromise = invoiceModel.aggregate([
    { $match: { ...invoiceFilter, month: previousMonth, year: previousYear, status: "paid" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]).then(res => res[0]?.total || 0);

  // 3. Total Debt
  const totalDebtPromise = invoiceModel.aggregate([
    { $match: { ...invoiceFilter, status: "issued" } },
    { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$totalAmount" } } }
  ]).then(res => ({
    count: res[0]?.count || 0,
    total: res[0]?.total || 0
  }));

  // 4. Revenue Chart (6 Months)
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }
    last6Months.push({ month: m, year: y });
  }

  const revenueChartPromise = invoiceModel.aggregate([
    {
      $match: {
        ...invoiceFilter,
        status: "paid",
        $or: last6Months.map(item => ({ month: item.month, year: item.year }))
      }
    },
    {
      $group: {
        _id: { month: "$month", year: "$year" },
        totalRevenue: { $sum: "$totalAmount" }
      }
    }
  ]).then(results => {
    return last6Months.map(time => {
      const found = results.find(r => r._id.month === time.month && r._id.year === time.year);
      return {
        month: time.month,
        year: time.year,
        totalRevenue: found ? found.totalRevenue : 0
      };
    });
  });

  // 5. Overdue Invoices
  const overdueInvoicesPromise = invoiceModel.find({
    ...invoiceFilter,
    status: "issued",
    dueDate: { $lt: today }
  })
    .sort({ dueDate: 1 })
    .limit(10)
    .populate({
      path: "contractId",
      select: "contractCode roomId tenantId",
      populate: [
        { path: "roomId", select: "name" },
        { path: "tenantId", select: "fullName phoneNumber" }
      ]
    })
    .lean()
    .then(invoices => {
      return invoices.map(inv => {
        const diffTime = Math.abs(today - new Date(inv.dueDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...inv,
          daysOverdue: diffDays
        };
      });
    });

  // 6. Expiring Contracts
  const expiringDateLimit = new Date(today);
  expiringDateLimit.setDate(today.getDate() + 30);
  expiringDateLimit.setHours(23, 59, 59, 999);

  const expiringContractsPromise = contractModel.find({
    ...contractFilter,
    status: "active",
    endDate: { $gte: today, $lte: expiringDateLimit }
  })
    .sort({ endDate: 1 })
    .limit(10)
    .populate("roomId", "name")
    .populate("tenantId", "fullName phoneNumber")
    .lean();

  // Run all promises concurrently
  const [
    roomStats,
    currentMonthRevenue,
    previousMonthRevenue,
    totalDebt,
    revenueChart,
    overdueInvoices,
    expiringContracts
  ] = await Promise.all([
    roomStatsPromise,
    currentMonthRevenuePromise,
    previousMonthRevenuePromise,
    totalDebtPromise,
    revenueChartPromise,
    overdueInvoicesPromise,
    expiringContractsPromise
  ]);

  const dashboardData = {
    roomStats,
    revenue: {
      currentMonth: currentMonthRevenue,
      previousMonth: previousMonthRevenue,
    },
    totalDebt,
    revenueChart,
    overdueInvoices,
    expiringContracts
  };

  return response(StatusCodes.OK, "Lấy dữ liệu Dashboard thành công", dashboardData);
};

export { getOverviewService };
