import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { CheckCircle2 } from "lucide-react";

export function OverdueInvoices({ data }) {
  return (
    <Card className="col-span-4 lg:col-span-1">
      <CardHeader>
        <CardTitle>Hóa đơn nợ</CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm text-muted-foreground">Không có hóa đơn quá hạn</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((invoice) => (
              <div key={invoice._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{invoice.contractId?.roomId?.name || "Không rõ phòng"}</p>
                  <p className="text-xs text-muted-foreground">{invoice.contractId?.tenantId?.fullName || "Không rõ khách"} • Quá hạn {invoice.daysOverdue} ngày</p>
                </div>
                <div className="text-sm font-medium text-destructive">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.totalAmount || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
