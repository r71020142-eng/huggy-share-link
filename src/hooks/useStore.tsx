import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Store {
  id: string;
  name: string;
  slug: string;
  plan_type: "basic" | "pro";
  whatsapp: string | null;
  address: string | null;
  operating_hours: string | null;
  promo_banner: string | null;
  estimated_time: string | null;
  min_order: number | null;
  is_open: boolean | null;
  delivery_enabled: boolean | null;
  pickup_enabled: boolean | null;
  logo_url: string | null;
  banner_url: string | null;
  theme_color: string | null;
  monthly_goal: number | null;
  owner_id: string;
}

interface StoreContextType {
  store: Store | null;
  stores: Store[];
  loading: boolean;
  switchStore: (storeId: string) => void;
  refreshStore: () => Promise<void>;
  isPro: boolean;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  stores: [],
  loading: true,
  switchStore: () => {},
  refreshStore: async () => {},
  isPro: false,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    if (!user) {
      setStores([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user.id);

    if (!error && data) {
      setStores(data as Store[]);
      if (!activeStoreId && data.length > 0) {
        setActiveStoreId(data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, [user]);

  const store = stores.find((s) => s.id === activeStoreId) || null;

  return (
    <StoreContext.Provider
      value={{
        store,
        stores,
        loading,
        switchStore: setActiveStoreId,
        refreshStore: fetchStores,
        isPro: store?.plan_type === "pro",
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
