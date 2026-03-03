"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

const ROLE_LABELS: Record<string, string> = {
  system_admin: "System Admin",
  admin: "Admin",
  site_user: "Site User",
};

export function UserMenu() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSignOut() {
    setUser(null);
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-400 text-text-inverse text-xs font-bold cursor-pointer hover:bg-primary-500 transition-colors focus-ring"
          aria-label="User menu"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2.5">
          <p className="text-sm font-semibold text-text-primary">
            {user.displayName}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{user.email}</p>
          <Badge variant="info" className="mt-1.5">
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="h-3.5 w-3.5" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="h-3.5 w-3.5" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={handleSignOut}>
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
