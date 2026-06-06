import { useState, useEffect } from 'react';
import { FileText, Download, Printer, ShieldCheck, AlertCircle } from 'lucide-react';
import { contractService } from '../../services/contract.service';
import toast from 'react-hot-toast';
import { formatMoney, formatDate } from '../../utils/format';

export function TenantContractsPage() {
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setIsLoading(true);
        // Tenant dashboard typically fetches all contracts but only 1 is active
        const response = await contractService.getAll();
        const data = response.data?.contracts || response.data?.data || response.data || [];
        
        // Find active contract first
        let activeContract = data.find(c => c.status === 'active');
        if (!activeContract && data.length > 0) {
          activeContract = data[0]; // fallback to the latest
        }
        
        setContract(activeContract);
      } catch (error) {
        toast.error("Không thể tải thông tin hợp đồng.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContract();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-16 bg-white/40 rounded-2xl w-1/3"></div>
        <div className="h-[800px] bg-white/40 rounded-3xl w-full max-w-4xl mx-auto"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-[var(--color-tenant-primary)] mb-2">Chưa có hợp đồng</h2>
        <p className="text-[var(--color-tenant-primary)]/50 font-medium">Bạn hiện không có hợp đồng thuê phòng nào đang có hiệu lực.</p>
      </div>
    );
  }

  const landlord = contract.roomId?.buildingId?.landlordId || {};
  const tenant = contract.tenantId || {};
  const room = contract.roomId || {};
  const building = room.buildingId || {};

  const formatAddress = (addr) => {
    if (!addr) return '...........................';
    if (typeof addr === 'string') return addr;
    return [addr.street, addr.ward, addr.district, addr.city].filter(Boolean).join(', ');
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header Actions (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--color-tenant-primary)] tracking-tight">Hợp đồng điện tử</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
              contract.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              {contract.status === 'active' ? <ShieldCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {contract.status === 'active' ? 'Đang có hiệu lực' : 'Đã hết hạn/Hủy'}
            </span>
            <span className="text-[var(--color-tenant-primary)]/50 font-bold text-sm">Mã: {contract.contractCode}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 px-5 py-2.5 bg-white text-[var(--color-tenant-primary)] border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> In / Lưu PDF
          </button>
        </div>
      </div>

      {/* Contract Document (A4 Styling) */}
      <div className="bg-white mx-auto max-w-4xl shadow-2xl rounded-sm p-8 md:p-16 text-slate-800 text-sm md:text-base leading-relaxed print:shadow-none print:p-0 print:w-full print:max-w-full">
        
        {/* Quốc hiệu */}
        <div className="text-center mb-8">
          <h2 className="font-bold text-lg md:text-xl uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</h2>
          <h3 className="font-bold text-base md:text-lg underline underline-offset-4 mb-6">Độc lập - Tự do - Hạnh phúc</h3>
          <p className="italic text-right text-sm">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
        </div>

        {/* Tên hợp đồng */}
        <div className="text-center mb-8">
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-wide">Hợp đồng thuê phòng</h1>
          <p className="text-sm font-medium mt-1">Số: {contract.contractCode}</p>
        </div>

        <p className="mb-4">Hôm nay, ngày {new Date(contract.createdAt).getDate()} tháng {new Date(contract.createdAt).getMonth() + 1} năm {new Date(contract.createdAt).getFullYear()}, tại địa chỉ: {formatAddress(building.address)}, chúng tôi gồm có:</p>

        {/* Bên A */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">BÊN CHO THUÊ (BÊN A):</h3>
          <ul className="space-y-1 list-none pl-4">
            <li><span className="font-semibold w-32 inline-block">Ông/Bà:</span> {landlord.fullName || '...........................'}</li>
            <li><span className="font-semibold w-32 inline-block">CCCD/CMND:</span> {landlord.identityCard || '...........................'}</li>
            <li><span className="font-semibold w-32 inline-block">Số điện thoại:</span> {landlord.phoneNumber || '...........................'}</li>
            <li><span className="font-semibold w-32 inline-block">Địa chỉ:</span> {formatAddress(landlord.address)}</li>
          </ul>
        </div>

        {/* Bên B */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-2">BÊN THUÊ (BÊN B):</h3>
          <ul className="space-y-1 list-none pl-4">
            <li><span className="font-semibold w-32 inline-block">Ông/Bà:</span> {tenant.fullName || '...........................'}</li>
            <li><span className="font-semibold w-32 inline-block">CCCD/CMND:</span> {tenant.identityCard || '...........................'}</li>
            <li><span className="font-semibold w-32 inline-block">Số điện thoại:</span> {tenant.phoneNumber || '...........................'}</li>
          </ul>
        </div>

        <p className="font-bold mb-4">Hai bên cùng thỏa thuận và ký kết hợp đồng thuê phòng với các điều khoản sau đây:</p>

        {/* Điều khoản 1 */}
        <div className="mb-6">
          <h4 className="font-bold underline mb-2">Điều 1: Nội dung và Mục đích thuê</h4>
          <p className="mb-1">- Bên A đồng ý cho Bên B thuê phòng số: <span className="font-bold">{room.name}</span></p>
          <p className="mb-1">- Tại tòa nhà: <span className="font-bold">{building.name}</span> ({formatAddress(building.address)})</p>
          <p className="mb-1">- Mục đích sử dụng: Để ở.</p>
        </div>

        {/* Điều khoản 2 */}
        <div className="mb-6">
          <h4 className="font-bold underline mb-2">Điều 2: Thời hạn thuê</h4>
          <p className="mb-1">- Thời hạn hợp đồng: Kể từ ngày <span className="font-bold">{formatDate(contract.startDate)}</span> đến ngày <span className="font-bold">{formatDate(contract.endDate)}</span>.</p>
          <p className="mb-1">- Nếu Bên B muốn gia hạn hợp đồng thì phải báo trước cho Bên A ít nhất 30 ngày trước khi hết hạn.</p>
        </div>

        {/* Điều khoản 3 */}
        <div className="mb-6">
          <h4 className="font-bold underline mb-2">Điều 3: Giá thuê và Phương thức thanh toán</h4>
          <p className="mb-1">- Tiền cọc: <span className="font-bold">{formatMoney(contract.deposit)}</span> (Sẽ được hoàn trả khi hết hạn hợp đồng nếu không có vi phạm).</p>
          <p className="mb-1">- Giá thuê phòng: <span className="font-bold">{formatMoney(contract.monthlyPrice)} / tháng</span>.</p>
          <p className="mb-1">- Tiền điện: <span className="font-bold">{formatMoney(contract.electricityPrice)} / kWh</span>.</p>
          <p className="mb-1">- Tiền nước: <span className="font-bold">{formatMoney(contract.waterPrice)} / khối</span>.</p>
          
          {contract.services && contract.services.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">- Các dịch vụ khác:</p>
              <ul className="list-disc pl-8">
                {contract.services.map((svc, idx) => (
                  <li key={idx}>{svc.name}: {formatMoney(svc.price)} / {svc.unit}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-2">- Thời gian thanh toán: Theo thông báo hàng tháng trên hệ thống phần mềm.</p>
        </div>

        {/* Điều khoản 4 */}
        <div className="mb-8">
          <h4 className="font-bold underline mb-2">Điều 4: Trách nhiệm các bên</h4>
          <p className="mb-1">- Bên A có trách nhiệm bàn giao phòng đúng hạn, đảm bảo các thiết bị hoạt động tốt.</p>
          <p className="mb-1">- Bên B có trách nhiệm thanh toán đủ, đúng hạn các khoản chi phí, giữ gìn tài sản chung và tuân thủ nội quy tòa nhà.</p>
        </div>

        {/* Chữ ký */}
        <div className="flex justify-between mt-12 mb-20 px-8">
          <div className="text-center">
            <p className="font-bold mb-16">BÊN A</p>
            <p className="italic text-slate-500 mt-20">(Đã ký xác nhận trên hệ thống)</p>
            <p className="font-bold mt-2">{landlord.fullName}</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-16">BÊN B</p>
            <p className="italic text-slate-500 mt-20">(Đã ký xác nhận trên hệ thống)</p>
            <p className="font-bold mt-2">{tenant.fullName}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
