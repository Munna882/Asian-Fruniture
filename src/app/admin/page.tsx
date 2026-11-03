import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
  // Fetch real data from the database
  const totalProducts = await prisma.product.count();
  const totalOrders = await prisma.order.count();
  const totalUsers = await prisma.user.count();
  const totalRevenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: "COMPLETED" }
  });

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  const revenueDisplay = totalRevenue._sum.total 
    ? `৳ ${(Number(totalRevenue._sum.total) / 100).toLocaleString('en-US')}` 
    : "৳ 0";

  const stats = [
    { title: "Total Revenue", value: revenueDisplay, change: "+0%", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { title: "Total Orders", value: totalOrders.toString(), change: "+0%", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
    { title: "Active Products", value: totalProducts.toString(), change: "+0%", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { title: "Total Users", value: totalUsers.toString(), change: "+0%", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
            <div className="w-12 h-12 bg-[var(--brand-cream)] text-[var(--brand-maroon)] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <a href="/admin/orders" className="text-sm font-semibold text-[var(--brand-maroon)] hover:underline">View All</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No orders found in the database yet.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
                    <td className="p-4 text-gray-600">{order.user.name}</td>
                    <td className="p-4 text-gray-600">{formatDistanceToNow(order.createdAt)} ago</td>
                    <td className="p-4 font-semibold">৳ {(Number(order.total) / 100).toLocaleString('en-US')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
