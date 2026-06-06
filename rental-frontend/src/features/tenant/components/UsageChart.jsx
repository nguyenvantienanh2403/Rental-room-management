import { Zap, Droplets, TrendingUp } from "lucide-react";

export function UsageChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl shadow-[var(--color-tenant-primary)]/5 border border-white flex flex-col items-center justify-center text-center h-full min-h-[280px]">
        <div className="w-16 h-16 bg-[var(--color-tenant-accent)]/20 text-[var(--color-tenant-primary)]/40 rounded-2xl flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8" />
        </div>
        <p className="text-[var(--color-tenant-primary)]/60 font-medium">Chưa có dữ liệu tiêu thụ để hiển thị</p>
      </div>
    );
  }

  // Find max values for scaling
  const maxElec = Math.max(...data.map(d => d.elec)) || 1;
  const maxWater = Math.max(...data.map(d => d.water)) || 1;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl shadow-[var(--color-tenant-primary)]/5 border border-white h-full flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="font-black text-xl text-[var(--color-tenant-primary)] tracking-tight">Thống kê tiêu thụ</h3>
          <p className="text-[var(--color-tenant-primary)]/50 text-xs font-bold uppercase tracking-wider mt-1">6 tháng gần nhất</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs font-bold bg-slate-50/50 p-2 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-amber-600">
            <span className="w-3 h-3 rounded-md bg-gradient-to-t from-amber-500 to-amber-300 shadow-sm"></span> Điện
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <span className="w-3 h-3 rounded-md bg-gradient-to-t from-blue-500 to-blue-300 shadow-sm"></span> Nước
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-1 sm:gap-3 px-1 mt-auto h-[200px] relative">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="w-full h-px bg-[var(--color-tenant-primary)] border-dashed border-t border-[var(--color-tenant-primary)]"></div>
          <div className="w-full h-px bg-[var(--color-tenant-primary)] border-dashed border-t border-[var(--color-tenant-primary)]"></div>
          <div className="w-full h-px bg-[var(--color-tenant-primary)] border-dashed border-t border-[var(--color-tenant-primary)]"></div>
          <div className="w-full h-px bg-[var(--color-tenant-primary)] border-dashed border-t border-[var(--color-tenant-primary)]"></div>
        </div>

        {data.map((item, index) => {
          const elecHeight = Math.max((item.elec / maxElec) * 100, 8); // min 8%
          const waterHeight = Math.max((item.water / maxWater) * 100, 8); // min 8%
          
          // Compute animation delay based on index
          const delay = index * 100;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 group z-10 h-full justify-end">
              <div className="relative w-full flex justify-center items-end gap-1 sm:gap-2 h-full pb-2 rounded-xl hover:bg-slate-50/50 transition-colors">
                
                {/* Data labels tooltip (visible on hover) */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-[var(--color-tenant-primary)] text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl flex gap-3 pointer-events-none z-20">
                  <span className="flex items-center text-amber-300"><Zap className="w-3 h-3 mr-1"/>{item.elec}</span>
                  <span className="flex items-center text-blue-300"><Droplets className="w-3 h-3 mr-1"/>{item.water}</span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-tenant-primary)]"></div>
                </div>

                {/* Electricity Bar */}
                <div className="w-full max-w-[14px] sm:max-w-[20px] bg-amber-50 rounded-t-md relative flex items-end overflow-hidden shadow-inner h-full">
                  <div 
                    className="w-full rounded-t-md bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-1000 ease-out animate-in slide-in-from-bottom-full" 
                    style={{ height: `${elecHeight}%`, animationDelay: `${delay}ms`, animationFillMode: 'both' }}
                  ></div>
                </div>

                {/* Water Bar */}
                <div className="w-full max-w-[14px] sm:max-w-[20px] bg-blue-50 rounded-t-md relative flex items-end overflow-hidden shadow-inner h-full">
                  <div 
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-300 transition-all duration-1000 ease-out animate-in slide-in-from-bottom-full" 
                    style={{ height: `${waterHeight}%`, animationDelay: `${delay + 50}ms`, animationFillMode: 'both' }}
                  ></div>
                </div>
              </div>
              
              {/* X-axis Label */}
              <span className="text-[10px] sm:text-xs font-bold text-[var(--color-tenant-primary)]/60 mt-2 uppercase tracking-widest">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
