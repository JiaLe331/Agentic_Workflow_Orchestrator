import Link from "next/link";
import { Library, Settings, Bot, TrendingUp, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconDeviceLaptop } from "@tabler/icons-react";

const navigation = [
    { name: "Agent Creator", href: "/", icon: Bot },
    { name: "Sales", href: "/sales", icon: TrendingUp },
    { name: "Products", href: "/products", icon: Package },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Collections", href: "/collections", icon: Library },
    { name: "Settings", href: "#", icon: Settings },
];

export function Sidebar() {
    return (
        <div className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
            <div className="flex h-16 items-center px-6">
                <IconDeviceLaptop className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <span className="ml-3 text-lg font-bold text-zinc-900 dark:text-white">
                    n8n Agents
                </span>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white" />
                        {item.name}
                    </Link>
                ))}
            </nav>
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="ml-3">
                        <p className="text-sm font-medium text-zinc-700 dark:text-white">
                            User
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            user@example.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
