"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Unplug } from "lucide-react";
// import { motion } from "framer-motion"; // Would add for better animation, using simple CSS for now for speed/dep minimal
import { cn } from "@/lib/utils";

const steps = [
    { id: 1, name: "Parsing user intent", duration: 1500 },
    { id: 2, name: "Designing workflow architecture", duration: 2000 },
    { id: 3, name: "Connecting n8n nodes", duration: 1500 },
    { id: 4, name: "Configuring parameters", duration: 1000 },
    { id: 5, name: "Finalizing agent", duration: 800 },
];

interface AgentVisualizationProps {
    onComplete: () => void;
}

export function AgentVisualization({ onComplete }: AgentVisualizationProps) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (currentStep >= steps.length) {
            setTimeout(onComplete, 500);
            return;
        }

        const timer = setTimeout(() => {
            setCurrentStep((prev) => prev + 1);
        }, steps[currentStep].duration);

        return () => clearTimeout(timer);
    }, [currentStep, onComplete]);

    return (
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-black">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Unplug className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    Building your Agent
                </h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Orchestrating n8n nodes based on your requirements...
                </p>
            </div>

            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={cn(
                            "flex items-center space-x-3 transition-opacity duration-300",
                            index > currentStep ? "opacity-30" : "opacity-100"
                        )}
                    >
                        <div className="flex h-6 w-6 items-center justify-center">
                            {index < currentStep ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : index === currentStep ? (
                                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                            ) : (
                                <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-sm font-medium",
                                index <= currentStep
                                    ? "text-zinc-900 dark:text-white"
                                    : "text-zinc-500 dark:text-zinc-400"
                            )}
                        >
                            {step.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
