"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip, // Standard import
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

// --- UI Protocol Definitions ---

export type UIComponent =
    | { type: "table"; title: string; columns: string[]; data: Record<string, string | number>[] }
    | { type: "stat-card"; title: string; value: string; trend?: string }
    | {
        type: "chart";
        chartType: "bar" | "line";
        title: string;
        labels: string[]; // X-Axis values
        datasets: { label: string; data: number[]; color?: string }[];
    }
    | {
        type: "pipeline-view";
        title: string;
        source: { title: string; content: string };
        process: { steps: string[] };
        target: { title: string; data: Record<string, string>[] };
    }
    | { type: "text"; content: string };

export type AgentResponse = {
    layout: UIComponent[];
};

// --- Renderer ---

export function DynamicRenderer({ layout }: { layout: UIComponent[] }) {
    if (!layout || layout.length === 0) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {layout.map((component, index) => {
                switch (component.type) {
                    case "stat-card":
                        return <StatCard key={index} {...component} />;
                    case "table":
                        return <DataTable key={index} {...component} />;
                    case "chart":
                        return <ChartComponent key={index} {...component} />;
                    case "text":
                        return (
                            <div key={index} className="prose dark:prose-invert">
                                <p>{component.content}</p>
                            </div>
                        );
                    case "pipeline-view":
                        return <PipelineView key={index} {...component} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
}

// --- Sub Components ---

function StatCard({ title, value, trend }: { title: string; value: string; trend?: string }) {
    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{value}</div>
            {trend && (
                <div className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                    {trend}
                </div>
            )}
        </div>
    );
}

function DataTable({ title, columns, data }: { title: string; columns: string[]; data: Record<string, string | number>[] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
            <div className="bg-zinc-50 px-6 py-4 dark:bg-zinc-900">
                <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-white">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                        {data.map((row, i) => (
                            <tr key={i}>
                                {columns.map((col) => (
                                    <td
                                        key={col}
                                        className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400"
                                    >
                                        {row[col]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ChartComponent({
    title,
    chartType,
    labels,
    datasets,
}: {
    title: string;
    chartType: "bar" | "line";
    labels: string[];
    datasets: { label: string; data: number[]; color?: string }[];
}) {
    // Tranform data for Recharts: array of objects { name: label, dataset1: val, dataset2: val }
    const chartData = labels.map((label, idx) => {
        const obj: Record<string, string | number> = { name: label };
        datasets.forEach((ds) => {
            obj[ds.label] = ds.data[idx];
        });
        return obj;
    });

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-6 text-lg font-medium text-zinc-900 dark:text-white">{title}</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1f1f1f", border: "none" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Legend />
                            {datasets.map((ds, i) => (
                                <Bar
                                    key={ds.label}
                                    dataKey={ds.label}
                                    fill={ds.color || `hsl(${i * 60 + 200}, 70 %, 50 %)`}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    ) : (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1f1f1f", border: "none" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Legend />
                            {datasets.map((ds, i) => (
                                <Line
                                    key={ds.label}
                                    type="monotone"
                                    dataKey={ds.label}
                                    stroke={ds.color || `hsl(${i * 60 + 200}, 70 %, 50 %)`}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function PipelineView({ title, source, process, target }: {
    title: string;
    source: { title: string; content: string };
    process: { steps: string[] };
    target: { title: string; data: Record<string, string>[] };
}) {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-6 text-lg font-medium text-zinc-900 dark:text-white">{title}</h3>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Source: Dirty Data */}
                <div className="flex flex-col">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">
                        {source.title}
                    </div>
                    <div className="flex-1 rounded-lg border border-red-100 bg-red-50/50 p-4 font-mono text-xs text-red-900 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200">
                        <pre className="whitespace-pre-wrap break-words">{source.content}</pre>
                    </div>
                </div>

                {/* Process: AI Transformation */}
                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        AI Processing
                    </div>
                    {process.steps.map((step, i) => (
                        <div key={i} className="flex w-full items-center gap-3 rounded bg-white px-4 py-3 shadow-sm dark:bg-zinc-800">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" style={{ animationDelay: `${i * 200}ms` }} />
                            <span className="text-xs text-zinc-700 dark:text-zinc-300">{step}</span>
                        </div>
                    ))}
                    <div className="mt-4 animate-bounce text-zinc-400">
                        ↓
                    </div>
                </div>

                {/* Target: Clean Data */}
                <div className="flex flex-col">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">
                        {target.title}
                    </div>
                    <div className="flex-1 overflow-hidden rounded-lg border border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10">
                        <table className="min-w-full divide-y divide-green-200/50 dark:divide-green-800/30">
                            <thead className="bg-green-100/50 dark:bg-green-900/20">
                                <tr>
                                    {Object.keys(target.data[0] || {}).map((k) => (
                                        <th key={k} className="px-3 py-2 text-left text-[10px] font-bold uppercase text-green-800 dark:text-green-300">{k}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-green-200/50 dark:divide-green-800/30">
                                {target.data.map((row, i) => (
                                    <tr key={i}>
                                        {Object.values(row).map((val, j) => (
                                            <td key={j} className="px-3 py-2 text-xs text-green-900 dark:text-green-200">{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
