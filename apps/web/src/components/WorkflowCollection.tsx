import { Play, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowItem } from "@/context/WorkflowContext";
import { useRouter } from "next/navigation";

interface WorkflowCollectionProps {
    item: WorkflowItem;
    onRun?: (id: string) => void;
    onView?: (id: string) => void;
}

const departmentColors = {
    Sales: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    HR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Finance: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Marketing: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

export function WorkflowCollection({ item, onRun, onView }: WorkflowCollectionProps) {
    const router = useRouter();

    const handleRunClick = () => {
        if (item.requiresInput) {
            router.push(`/agent/${item.id}`);
        } else {
            onRun?.(item.id);
        }
    };

    return (
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
                <div>
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            departmentColors[item.department]
                        )}
                    >
                        {item.department}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-white">
                        {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {item.description}
                    </p>
                </div>
            </div>

            <div className="mt-auto pt-6 flex items-center justify-between">
                <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    {new Date(item.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                    {onView && (
                        <button
                            onClick={() => onView(item.id)}
                            className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                        >
                            <FileText className="mr-1.5 h-4 w-4" />
                            Details
                        </button>
                    )}
                    <button
                        onClick={handleRunClick}
                        className={cn(
                            "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                            item.requiresInput
                                ? "bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                                : "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
                        )}
                    >
                        {item.requiresInput ? (
                            <>
                                <FileText className="mr-1.5 h-4 w-4" />
                                Open Form
                            </>
                        ) : (
                            <>
                                <Play className="mr-1.5 h-4 w-4" />
                                Run Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
