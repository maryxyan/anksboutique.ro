import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { BarChart2, Package, ShoppingBag, TrendingUp, Clock, AlertTriangle, LogOut, LayoutDashboard, Archive } from "lucide-react";
import { AdminLayout } from "./layout";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() },
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-serif">Panou de Control</h1>
        <p className="text-muted-foreground text-sm mt-1">Bine ai revenit în panoul Ank's Boutique.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Comenzi" value={stats?.totalOrders ?? "—"} icon={ShoppingBag} loading={isLoading} />
        <StatCard label="Venit Total" value={stats ? `${stats.totalRevenue.toFixed(0)} RON` : "—"} icon={TrendingUp} loading={isLoading} />
        <StatCard label="Total Produse" value={stats?.totalProducts ?? "—"} icon={Package} loading={isLoading} />
        <StatCard label="Comenzi în Așteptare" value={stats?.pendingOrders ?? "—"} icon={Clock} loading={isLoading} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <StatCard label="Comenzile de Azi" value={stats?.todayOrders ?? "—"} icon={ShoppingBag} loading={isLoading} small />
        <StatCard label="Venitul de Azi" value={stats ? `${stats.todayRevenue.toFixed(0)} RON` : "—"} icon={TrendingUp} loading={isLoading} small />
        <StatCard label="Produse cu Stoc Scăzut" value={stats?.lowStockProducts ?? "—"} icon={AlertTriangle} loading={isLoading} small accent />
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium uppercase tracking-widest">Comenzi Recente</h2>
          <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border pb-0.5">
            Vezi Toate
          </Link>
        </div>
        <div className="border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Se încarcă...</div>
          ) : !stats?.recentOrders?.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nicio comandă încă.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Comandă</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden md:table-cell">Total</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/40 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{order.total.toFixed(2)} RON</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, icon: Icon, loading, accent, small }: {
  label: string;
  value: string | number;
  icon: any;
  loading?: boolean;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`border border-border p-5 ${accent ? "bg-accent/30" : "bg-background"}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="h-7 bg-muted animate-pulse w-1/2 rounded" />
      ) : (
        <p className={`font-medium ${small ? "text-xl" : "text-2xl"} font-serif`}>{value}</p>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: "în așteptare",
  confirmed: "confirmată",
  shipped: "expediată",
  delivered: "livrată",
  cancelled: "anulată",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 border ${STATUS_COLORS[status] || "bg-muted text-muted-foreground border-border"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
