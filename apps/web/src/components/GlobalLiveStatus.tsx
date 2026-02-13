"use client";

import { useLiveStatus } from "@/context/LiveStatusContext";
import { LiveWorkflowStatus } from "@/components/LiveWorkflowStatus";

export function GlobalLiveStatus() {
    const {
        liveLogs,
        currentStep,
        isOpen,
        closeLiveStatus,
        generationResult,
        isCollapsed,
        toggleCollapse
    } = useLiveStatus();

    return (
        <LiveWorkflowStatus
            logs={liveLogs}
            currentStep={currentStep}
            isOpen={isOpen}
            onClose={closeLiveStatus}
            result={generationResult}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
        />
    );
}
