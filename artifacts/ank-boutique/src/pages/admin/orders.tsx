import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOrders,
  getListOrdersQueryKey,
  useUpdateOrderStatus,
} from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { StatusBadge } from "./dashboard";
import { ChevronDown } from "lucide-react";

const STATUSES = ["", "pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useListOrders(
    { status: status || undefined, page, limit: 20 },
    { query: { queryKey: getListOrdersQueryKey({ status: status || undefined, page, limit: 20 }) } }
  );

  const updateStatus = useUpdateOrderStatus();

  const handleStatus = (id: number, newStatus: string) => {
    updateStatus.mutate(
      { id, data: { status: newStatus } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }) }
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} orders total</p>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-border bg-background px-4 py-2 text-sm focus:border-foreground outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Status"}</option>
          ))}
        </select>
      </div>

      <div className="border border-border bg-background overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading orders...</div>
        ) : !data?.orders?.length ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No orders found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden lg:table-cell">Total</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString("ro-RO")}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{order.total.toFixed(2)} RON</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => { e.stopPropagation(); handleStatus(order.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] uppercase tracking-wider font-medium border border-border bg-background px-2 py-1 outline-none"
                      >
                        {STATUSES.filter(Boolean).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr key={`${order.id}-detail`} className="bg-muted/30 border-b border-border/40">
                      <td colSpan={6} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-3">Shipping Details</h3>
                            <p className="text-sm">{order.shippingAddress}</p>
                            <p className="text-sm">{order.city}, {order.county} {order.postalCode}</p>
                            <p className="text-sm text-muted-foreground mt-1">{order.customerPhone}</p>
                          </div>
                          <div>
                            <h3 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-3">Order Items</h3>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <span>{item.productTitle} {item.size ? `(${item.size})` : ""} x{item.quantity}</span>
                                  <span className="text-muted-foreground">{(item.price * item.quantity).toFixed(2)} RON</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-border mt-3 pt-3 flex justify-between font-medium text-sm">
                              <span>Total</span>
                              <span>{order.total.toFixed(2)} RON</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.total > 20 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-border disabled:opacity-40 hover:bg-muted transition-colors">
            Previous
          </button>
          <span className="text-muted-foreground text-xs">Page {page}</span>
          <button disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-border disabled:opacity-40 hover:bg-muted transition-colors">
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
