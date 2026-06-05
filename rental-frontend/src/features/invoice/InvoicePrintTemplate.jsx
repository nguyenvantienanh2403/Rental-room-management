import React from "react";
import qrCode from "../../assets/Ma_QR.jpg";

export const InvoicePrintTemplate = React.forwardRef(({ invoice }, ref) => {
  if (!invoice) return null;

  const contract = invoice.fullContract || invoice.contractId || {};
  const room = contract.roomId || {};
  const tenant = contract.tenantId || {};

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div 
      ref={ref} 
      className="bg-white p-8"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        color: "#000",
        backgroundColor: "#fff"
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ lineHeight: '1.6' }}>
          <p style={{ margin: 0, fontSize: '15px' }}>Khách thuê: <span style={{ fontWeight: 'normal' }}>{tenant.fullName}</span></p>
          <p style={{ margin: 0, fontSize: '15px' }}>Điện thoại: <span style={{ fontWeight: 'normal' }}>{tenant.phoneNumber}</span></p>
        </div>
        <div style={{ textAlign: 'right', lineHeight: '1.6' }}>
          <p style={{ margin: 0, fontSize: '15px' }}>Tháng: {invoice.month}/{invoice.year}</p>
          <p style={{ margin: 0, fontSize: '15px' }}>Hạn thanh toán: {formatDate(invoice.dueDate)}</p>
          <p style={{ margin: 0, fontSize: '15px' }}>Trạng thái: <span style={{ fontWeight: 'bold', color: invoice.status === 'paid' ? 'green' : '#e67e22' }}>{invoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Table */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f1f5f9', fontSize: '14px' }}>Phòng</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f1f5f9', fontSize: '14px' }}>Nội dung</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f1f5f9', fontSize: '14px', textAlign: 'right' }}>Đơn giá</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f1f5f9', fontSize: '14px', textAlign: 'center' }}>Số lượng</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f1f5f9', fontSize: '14px', textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {/* Room Row */}
              <tr>
                <td rowSpan={3 + (invoice.otherFees && invoice.otherFees.length > 0 ? 1 : 0)} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>
                  Phòng {room.name}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>Tiền phòng</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{formatMoney(invoice.roomCharge)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>1</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(invoice.roomCharge)}</td>
              </tr>
              
              {/* Electricity Row */}
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>Điện</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{formatMoney(invoice.electricityUnitPrice)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                  {invoice.meterReadingId?.electricity?.newIndex - invoice.meterReadingId?.electricity?.oldIndex || 0}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(invoice.electricityTotal)}</td>
              </tr>

              {/* Water Row */}
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>Nước</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{formatMoney(invoice.waterUnitPrice)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                  {invoice.meterReadingId?.water?.newIndex - invoice.meterReadingId?.water?.oldIndex || 0}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(invoice.waterTotal)}</td>
              </tr>

              {/* Services Row (Grouped) */}
              {invoice.otherFees && invoice.otherFees.length > 0 && (() => {
                const totalServiceAmount = invoice.otherFees.reduce((sum, fee) => sum + fee.amount, 0);
                
                // Cố gắng tìm Số người từ mảng services của hợp đồng (nếu có)
                let serviceQty = 1;
                if (contract.services && contract.services.length > 0) {
                  const personService = contract.services.find(s => s.unit?.toLowerCase().includes('người'));
                  if (personService && personService.quantity > 0) {
                    serviceQty = personService.quantity;
                  } else {
                    serviceQty = contract.services[0].quantity || 1;
                  }
                }
                
                const unitPrice = totalServiceAmount / serviceQty;

                return (
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>Dịch vụ</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{formatMoney(unitPrice)}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>{serviceQty}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(totalServiceAmount)}</td>
                  </tr>
                );
              })()}
              
              {/* Discount Row (Optional) */}
              {invoice.discount > 0 && (
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', color: 'red' }}>Giảm giá</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 'bold', color: 'red' }}>- {formatMoney(invoice.discount)}</td>
                </tr>
              )}

              {/* Total Row */}
              <tr>
                <td colSpan={4} style={{ border: '1px solid #cbd5e1', padding: '15px 10px', backgroundColor: '#fde047', fontWeight: 'bold', fontSize: '16px' }}>Tổng</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '15px 10px', backgroundColor: '#fde047', fontWeight: 'bold', fontSize: '16px', textAlign: 'right' }}>{formatMoney(invoice.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR Code Section */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569' }}>Quét mã để thanh toán</p>
          <div style={{ border: '1px solid #e2e8f0', padding: '10px', backgroundColor: '#fafafa', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <img src={qrCode} alt="QR Code" style={{ width: '100%', height: 'auto', display: 'block' }} crossOrigin="anonymous" />
          </div>
        </div>
      </div>
    </div>
  );
});

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';
