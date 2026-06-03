import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Building2, DollarSign, Users, AlertCircle } from "lucide-react";

export function StatCards({ data }) {
  if (!data) return null;
  
  const stats = [
    {
      title: "Tổng số phòng",
      value: data.roomStats?.totalRooms || 0,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Phòng đang thuê",
      value: data.roomStats?.rentedRooms || 0,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Doanh thu tháng này",
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.revenue?.currentMonth || 0),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-purple-100",
    },
    {
      title: "Hóa đơn nợ",
      value: data.totalDebt?.count || 0,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
