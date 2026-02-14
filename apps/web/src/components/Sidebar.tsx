"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Settings, Bot, TrendingUp, Package, Users, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconDeviceLaptop } from "@tabler/icons-react";

const navigation = [
    { name: "Agent Creator", href: "/", icon: Bot },
    { name: "Onboarding", href: "/onboarding", icon: ClipboardList },
    { name: "Sales", href: "/sales", icon: TrendingUp },
    { name: "Products", href: "/products", icon: Package },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Collections", href: "/collections", icon: Library },
    { name: "Settings", href: "#", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="sticky top-0 flex h-screen w-20 flex-col items-center border-r border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-black transition-all duration-300">
            {/* Logo */}
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-md dark:bg-white dark:text-black">
                <IconDeviceLaptop className="h-6 w-6" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-4 px-2">
                {navigation.map((item) => {
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                                isActive
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                            )}
                        >
                            <item.icon className="h-6 w-6" />

                            {/* Tooltip */}
                            <span className="absolute left-16 z-[100] ml-2 hidden w-max rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 transition-opacity group-hover:block group-hover:opacity-100 dark:bg-white dark:text-black">
                                {item.name}
                                {/* Little triangle pointer for the tooltip */}
                                <span className="absolute -left-1 top-1/2 -mt-1 h-2 w-2 -rotate-45 bg-zinc-900 dark:bg-white" />
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="mt-auto border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-zinc-200 hover:ring-2 hover:ring-zinc-300 dark:bg-zinc-700 dark:hover:ring-zinc-600">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">US</span>

                    {/* User Tooltip */}
                    <span className="absolute left-14 z-[100] ml-2 hidden w-max rounded-md bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg opacity-0 transition-opacity group-hover:block group-hover:opacity-100 dark:bg-white dark:text-black">
                        <p className="font-semibold">User</p>
                        <p className="text-zinc-400 dark:text-zinc-500">user@example.com</p>
                        <span className="absolute -left-1 top-1/2 -mt-1 h-2 w-2 -rotate-45 bg-zinc-900 dark:bg-white" />
                    </span>
                </div>
            </div>
        </div>
    );
}
