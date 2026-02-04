<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDocumentsStore } from '../../stores/documents.store';
import type { FolderNode } from '../../services/documents.service';

const store = useDocumentsStore();

const expandedNodes = ref<Set<string>>(new Set(['all']));

const toggleExpand = (nodeId: string) => {
    if (expandedNodes.value.has(nodeId)) {
        expandedNodes.value.delete(nodeId);
    } else {
        expandedNodes.value.add(nodeId);
    }
};

const selectNode = (nodeId: string) => {
    store.selectFolder(nodeId);
};

const isExpanded = (nodeId: string) => expandedNodes.value.has(nodeId);

const quickFilters = [
    { id: 'favorites', label: 'Favorites', icon: '⭐', filter: 'favorites' as const },
    { id: 'failed', label: 'Failed indexing', icon: '❗', filter: 'failed' as const },
    { id: 'recent', label: 'Recently updated', icon: '🕒', filter: 'recent' as const }
];

const handleQuickFilter = (filter: 'all' | 'favorites' | 'failed' | 'recent') => {
    store.setFilterType(filter);
    store.selectFolder('all');
};

onMounted(() => {
    store.fetchFolderTree();
});
</script>

<template>
    <div class="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ store.totalDocuments }} Documents
            </span>
        </div>

        <!-- Quick Filters -->
        <div class="px-3 py-3 border-b border-gray-200 dark:border-gray-800">
            <div class="space-y-1">
                <button
                    v-for="filter in quickFilters"
                    :key="filter.id"
                    @click="handleQuickFilter(filter.filter)"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                    :class="store.filterType === filter.filter && store.selectedFolderId === 'all'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
                >
                    <span>{{ filter.icon }}</span>
                    <span>{{ filter.label }}</span>
                    <span 
                        v-if="filter.filter === 'favorites'" 
                        class="ml-auto text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full"
                    >
                        {{ store.favoriteCount }}
                    </span>
                    <span 
                        v-if="filter.filter === 'failed' && store.errorCount > 0" 
                        class="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full"
                    >
                        {{ store.errorCount }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Folder Tree -->
        <div class="flex-1 overflow-y-auto scrollbar-thin p-3">
            <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">
                Folders
            </div>

            <!-- Recursive Tree Component -->
            <template v-for="node in store.folderTree" :key="node.id">
                <TreeNode 
                    :node="node" 
                    :level="0"
                    :expanded-nodes="expandedNodes"
                    :selected-id="store.selectedFolderId"
                    @toggle="toggleExpand"
                    @select="selectNode"
                />
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, h } from 'vue';

// Recursive TreeNode component
const TreeNode = defineComponent({
    name: 'TreeNode',
    props: {
        node: {
            type: Object as PropType<FolderNode>,
            required: true
        },
        level: {
            type: Number,
            required: true
        },
        expandedNodes: {
            type: Object as PropType<Set<string>>,
            required: true
        },
        selectedId: {
            type: String,
            default: null
        }
    },
    emits: ['toggle', 'select'],
    setup(props, { emit }) {
        const hasChildren = () => props.node.children && props.node.children.length > 0;
        const isExpanded = () => props.expandedNodes.has(props.node.id);
        const isSelected = () => props.selectedId === props.node.id;

        return () => {
            const children = [];

            // Node button
            children.push(
                h('button', {
                    class: [
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
                        isSelected()
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    ],
                    style: { paddingLeft: `${props.level * 16 + 8}px` },
                    onClick: () => emit('select', props.node.id)
                }, [
                    // Expand/Collapse icon
                    hasChildren() ? h('span', {
                        class: 'text-xs text-gray-400 w-4 cursor-pointer hover:text-gray-600 transition-transform',
                        style: isExpanded() ? 'transform: rotate(90deg)' : '',
                        onClick: (e: Event) => {
                            e.stopPropagation();
                            emit('toggle', props.node.id);
                        }
                    }, '▶') : h('span', { class: 'w-4' }),
                    // Folder icon
                    h('span', { class: 'text-base' }, props.node.id === 'all' ? '📁' : '📂'),
                    // Name
                    h('span', { class: 'flex-1 text-left truncate' }, props.node.name),
                    // Count badge
                    h('span', {
                        class: 'text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded'
                    }, props.node.documentCount)
                ])
            );

            // Render children if expanded
            if (hasChildren() && isExpanded()) {
                props.node.children.forEach(child => {
                    children.push(
                        h(TreeNode, {
                            node: child,
                            level: props.level + 1,
                            expandedNodes: props.expandedNodes,
                            selectedId: props.selectedId,
                            onToggle: (id: string) => emit('toggle', id),
                            onSelect: (id: string) => emit('select', id)
                        })
                    );
                });
            }

            return h('div', {}, children);
        };
    }
});

export default {
    components: { TreeNode }
};
</script>
