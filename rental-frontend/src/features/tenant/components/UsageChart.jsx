import { Zap, Droplets } from "lucide-react";

export function UsageChart({ data }) {
  // data = [ { month: 'T1', elec: 120, water: 15 }, { month: 'T2', elec: 140, water: 16 }, ... ]
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center py-8">
        <p className="text-slate-500 text-sm">Chưa có dữ liệu tiêu thụ</p>
      </div>
    );
  }

  // Find max values for scaling
  const maxElec = Math.max(...data.map(d => d.elec)) || 1;
  const maxWater = Math.max(...data.map(d => d.water)) || 1;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 text-lg">Biểu đồ tiêu thụ</h3>
        <div className="flex gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Điện
          </div>
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Nước
          </div>
        </div>
      </div>

      <div className="h-48 flex items-end justify-between gap-2 px-1">
        {data.map((item, index) => {
          const elecHeight = Math.max((item.elec / maxElec) * 100, 5); // min 5%
          const waterHeight = Math.max((item.water / maxWater) * 100, 5); // min 5%
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full flex justify-center items-end gap-1 h-32 mt-6 mb-2 rounded-lg p-1 hover:bg-slate-50 transition-colors">
                
                {/* Always visible data labels */}
                <div className="absolute -top-8 w-full flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-bold leading-tight z-10">
                  <span className="text-amber-500 flex items-center drop-shadow-sm"><Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5"/>{item.elec}</span>
                  <span className="text-blue-500 flex items-center drop-shadow-sm"><Droplets className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5"/>{item.water}</span>
                </div>

                {/* Electricity Bar */}
                <div className="w-full max-w-[12px] md:max-w-[16px] bg-amber-100 rounded-t-sm relative flex items-end overflow-hidden group/bar">
                  <div 
                    className="w-full bg-amber-400 rounded-t-sm transition-all duration-700 ease-out group-hover/bar:bg-amber-500" 
                    style={{ height: `${elecHeight}%` }}
                  ></div>
                </div>

                {/* Water Bar */}
                <div className="w-full max-w-[12px] md:max-w-[16px] bg-blue-100 rounded-t-sm relative flex items-end overflow-hidden group/bar">
                  <div 
                    className="w-full bg-blue-400 rounded-t-sm transition-all duration-700 ease-out group-hover/bar:bg-blue-500" 
                    style={{ height: `${waterHeight}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-slate-400 group-hover:text-slate-800 transition-colors uppercase">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
