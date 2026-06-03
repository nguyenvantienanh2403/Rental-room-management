import cron from "node-cron";
import { contractModel, invoiceModel, notificationModel } from "../models/index.js";

const startCronJobs = () => {
  // Chạy mỗi ngày lúc 00:00 sáng theo giờ Việt Nam
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Bắt đầu chạy các job kiểm tra định kỳ...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. Quét Hóa Đơn Quá Hạn (OVERDUE_INVOICE)
      const overdueInvoices = await invoiceModel
        .find({ status: "issued", dueDate: { $lt: today } })
        .populate({
          path: "contractId",
          select: "contractCode roomId",
          populate: {
            path: "roomId",
            select: "name buildingId",
            populate: { path: "buildingId", select: "landlordId name" }
          }
        });

      for (const invoice of overdueInvoices) {
        const landlordId = invoice.contractId?.roomId?.buildingId?.landlordId;
        const roomName = invoice.contractId?.roomId?.name;
        
        if (landlordId) {
          // Check trùng lặp
          const exists = await notificationModel.exists({
            type: "OVERDUE_INVOICE",
            "metadata.invoiceId": invoice._id
          });

          if (!exists) {
            await notificationModel.create({
              recipientId: landlordId,
              title: "Hóa đơn quá hạn",
              message: `Hóa đơn tháng ${invoice.month}/${invoice.year} của ${roomName} đã quá hạn thanh toán.`,
              type: "OVERDUE_INVOICE",
              metadata: {
                invoiceId: invoice._id,
                contractId: invoice.contractId._id,
                roomId: invoice.contractId.roomId._id
              }
            });
          }
        }
      }

      // 2. Quét Hợp Đồng Sắp Hết Hạn & Đã Hết Hạn
      const activeContracts = await contractModel
        .find({ status: "active" })
        .populate({
          path: "roomId",
          select: "name buildingId",
          populate: { path: "buildingId", select: "landlordId name" }
        });

      for (const contract of activeContracts) {
        const landlordId = contract.roomId?.buildingId?.landlordId;
        const roomName = contract.roomId?.name;
        
        if (landlordId) {
          const endDate = new Date(contract.endDate);
          endDate.setHours(0, 0, 0, 0);

          const diffTime = endDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            // Hợp đồng đã hết hạn -> Đổi status thành 'expired' và thông báo
            contract.status = "expired";
            await contract.save();

            const exists = await notificationModel.exists({
              type: "CONTRACT_EXPIRED",
              "metadata.contractId": contract._id
            });

            if (!exists) {
              await notificationModel.create({
                recipientId: landlordId,
                title: "Hợp đồng hết hạn",
                message: `Hợp đồng của ${roomName} đã chính thức hết hạn.`,
                type: "CONTRACT_EXPIRED",
                metadata: {
                  contractId: contract._id,
                  roomId: contract.roomId._id
                }
              });
            }
          } else if (diffDays === 30 || diffDays === 7) {
            // Sắp hết hạn (đúng 30 hoặc 7 ngày)
            const exists = await notificationModel.exists({
              type: "CONTRACT_EXPIRING",
              "metadata.contractId": contract._id,
              "metadata.daysLeft": diffDays
            });

            if (!exists) {
              await notificationModel.create({
                recipientId: landlordId,
                title: "Hợp đồng sắp hết hạn",
                message: `Hợp đồng của ${roomName} sẽ hết hạn sau ${diffDays} ngày nữa.`,
                type: "CONTRACT_EXPIRING",
                metadata: {
                  contractId: contract._id,
                  roomId: contract.roomId._id,
                  daysLeft: diffDays
                }
              });
            }
          }
        }
      }
      
      console.log("[CRON] Đã hoàn thành các job kiểm tra định kỳ.");
    } catch (error) {
      console.error("[CRON ERROR]", error);
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });
};

export default startCronJobs;
