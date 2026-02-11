"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  MessageCircle,
  Crown,
  Building2,
  LogOut,
  User,
  ChevronDown,
  ClipboardList,
  Menu,
  X,
  Settings,
  CreditCard,
} from "lucide-react";
import { AppIcon } from "./AppIcon";

interface UserData {
  id: string;
  username: string;
  name: string;
  role: string;
  tenant_id?: string | null;
}

interface TenantProfile {
  name: string;
  logo_url: string | null;
}

const iconSize = 18;

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/tenant-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setTenantProfile(data.profile);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen, mobileMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (
    pathname === "/login" ||
    pathname === "/suporte" ||
    pathname === "/" ||
    pathname === "/vendas" ||
    loading
  ) {
    return null;
  }

  // Se for super admin (sem tenant_id), mostrar apenas links administrativos
  const isSuperAdmin = user && !user.tenant_id;
  
  const navItems = isSuperAdmin
    ? [
        { href: "/admin", label: "Master", icon: Crown },
        { href: "/admin/clientes", label: "Clientes", icon: Building2 },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/stream", label: "Pedidos", icon: ClipboardList },
        { href: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
        { href: "/atendimento", label: "Atendimento", icon: MessageCircle },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          {/* Logo do tenant acima/esquerda, header mantém Pedidos Express */}
          <a href={isSuperAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3">
            {tenantProfile?.logo_url && !isSuperAdmin ? (
              <img
                src={tenantProfile.logo_url}
                alt={tenantProfile.name}
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <AppIcon size={28} />
            )}
            <span className="text-lg font-bold text-gray-900 font-display">
              Pedidos Express
            </span>
          </a>
          {/* Desktop: navegação sem ícones */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: botão hambúrguer */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X size={20} className="text-gray-700" />
            ) : (
              <Menu size={20} className="text-gray-700" />
            )}
          </button>

          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <User size={16} className="text-gray-600" />
                </div>
                <span className="hidden sm:inline font-medium text-gray-900 max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="truncate text-xs capitalize text-gray-500">
                      {isSuperAdmin ? "Super Admin" : user.role}
                    </p>
                  </div>
                  {!isSuperAdmin && (
                    <>
                      <a
                        href="/dashboard/perfil"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={iconSize} className="text-gray-500" />
                        <span>Configurações</span>
                      </a>
                      <a
                        href="/dashboard/pagamento"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CreditCard size={iconSize} className="text-gray-500" />
                        <span>Assinaturas</span>
                      </a>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={iconSize} className="text-gray-500" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: menu hambúrguer com ícones */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-gray-100 bg-white"
        >
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    size={20}
                    className={isActive ? "text-primary-600" : "text-gray-500"}
                  />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
