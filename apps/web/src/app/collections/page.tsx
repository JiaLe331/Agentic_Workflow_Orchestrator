'use client';

import { WorkflowCollection } from '@/components/WorkflowCollection';
import { useWorkflows } from '@/hooks/use-workflows';
import { IconLibrary, IconPlus, IconSearch, IconFilter } from '@tabler/icons-react';
import { useState } from 'react';

export default function CollectionsPage() {
    const { workflows, isLoading, error, remove } = useWorkflows();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this workflow?')) {
            await remove(id);
        }
    };

    const filteredWorkflows = workflows?.filter(workflow =>
        (workflow.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (sortBy === 'name') {
            return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
        } else if (sortBy === 'status') {
            // Using uiType as a proxy for status/type sorting
            return (a.uiType || '').localeCompare(b.uiType || '');
        }
        return 0;
    });

    if (isLoading) return <div className="p-8 text-center">Loading workflows...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading workflows</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50">
            {/* Header Section */}
            <div className="px-8 py-6 mb-6 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                            <IconLibrary size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Library</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage and organize your automated workflows</p>
                        </div>
                    </div>
                    <button className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95">
                        <IconPlus size={18} />
                        <span>New Collection</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-8 pb-8 overflow-y-auto">
                {/* Search and Filter Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-96">
                        <IconSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
                        <input
                            type="text"
                            placeholder="Search collections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                            <IconFilter size={16} />
                            <span>Filter</span>
                        </button>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                            <option value="recent">Sort by: Recent</option>
                            <option value="name">Sort by: Name</option>
                            <option value="status">Sort by: Status</option>
                        </select>
                    </div>
                </div>

                {/* Collections Grid */}
                <WorkflowCollection workflows={sortedWorkflows} onDelete={handleDelete} />
            </div>
        </div>
    );
}
