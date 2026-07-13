import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { User, Package, Heart, MapPin } from "lucide-react";
import type { ClientUser } from "./account-types";
import ProfileTab from "./account-profile";
import OrdersTab from "./account-orders";
import WishlistTab from "./account-wishlist";
import AddressesTab from "./account-addresses";

type TabId = "profile" | "orders" | "wishlist" | "addresses";

export default function AccountPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [user, setUser] = useState<ClientUser | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("clientAuthenticated");
    const storedUser = localStorage.getItem("client_user");
    if (auth === "true" && storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) return null;

  const tabs = [
    { id: "profile" as TabId, label: "Profilul Meu", icon: User },
    { id: "orders" as TabId, label: "Istoric Comenzi", icon: Package },
    { id: "wishlist" as TabId, label: "Lista Dorinte", icon: Heart },
    { id: "addresses" as TabId, label: "Adresele Mele", icon: MapPin },
  ];

  return (
    <><Helmet><title>Contul Meu | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[80vh] px-4 py-8 md:py-12 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-serif">Contul Meu</h1>
        <p className="text-muted-foreground text-sm mt-1">Bine ai revenit, {user.name}!</p>
      </div>

      <div className="flex overflow-x-auto gap-1 border-b border-border mb-8 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" && <ProfileTab user={user} setUser={setUser} />}
      {activeTab === "orders" && <OrdersTab user={user} />}
      {activeTab === "wishlist" && <WishlistTab user={user} />}
      {activeTab === "addresses" && <AddressesTab user={user} />}
    </div></>
  );
}
