// Sources Service - API functions for managing data sources via IPC

import { invoke } from './desktopApi';

export interface Source {
    id: string;
    name: string;
    path: string;
    type: 'folder' | 'collection';
    status: 'indexed' | 'indexing' | 'error' | 'paused' | 'pending';
    totalFiles: number;
    indexedFiles: number;
    failedFiles: number;
    lastUpdate: string;
    fileTypes: { [key: string]: number };
    errors: SourceError[];
}

export interface SourceError {
    file: string;
    message: string;
}

export interface AddSourceOptions {
    name?: string;
    includeTypes: string[];
    excludePatterns: string[];
    chunkSize?: number;
}

export interface IndexStatus {
    sourceId: string;
    progress: number;
    currentFile: string;
    statusText: string;
    filesProcessed: number;
    totalFiles: number;
}

export async function listSources(): Promise<Source[]> {
    return await invoke('sources:list');
}

export async function addSource(path: string, options: AddSourceOptions): Promise<Source> {
    return await invoke('sources:add', { path, options });
}

export async function removeSource(sourceId: string): Promise<void> {
    await invoke('sources:remove', sourceId);
}

export async function reindexSource(sourceId: string): Promise<void> {
    await invoke('sources:reindex', sourceId);
}

export async function reindexAllSources(): Promise<void> {
    const sources = await listSources();
    for (const source of sources) {
        if (source.status !== 'paused') {
            await reindexSource(source.id);
        }
    }
}

export async function clearSourceIndex(sourceId: string): Promise<void> {
    await invoke('sources:reindex', sourceId);
}

export async function pauseSourceIndexing(sourceId: string): Promise<void> {
    await invoke('sources:pause', sourceId);
}

export async function resumeSourceIndexing(sourceId: string): Promise<void> {
    await invoke('sources:resume', sourceId);
}

export async function pauseGlobalIndexing(): Promise<void> {
    const sources = await listSources();
    for (const source of sources) {
        if (source.status === 'indexing') {
            await pauseSourceIndexing(source.id);
        }
    }
}

export async function resumeGlobalIndexing(): Promise<void> {
    const sources = await listSources();
    for (const source of sources) {
        if (source.status === 'paused') {
            await resumeSourceIndexing(source.id);
        }
    }
}

export async function getIndexStatus(sourceId: string): Promise<IndexStatus> {
    return await invoke('sources:getStatus', sourceId);
}

export async function retryFailedFiles(sourceId: string): Promise<void> {
    await invoke('sources:retryFailed', sourceId);
}

export async function ignoreFailedFile(sourceId: string, filePath: string): Promise<void> {
    // TODO: Implement in backend
    console.log('Ignoring failed file:', filePath);
}

let globalPaused = false;
export function isGlobalPaused(): boolean {
    return globalPaused;
}

export async function selectFolder(): Promise<string | null> {
    try {
        return await invoke('dialog:selectFolder');
    } catch (error) {
        console.error('Failed to open folder dialog:', error);
        return null;
    }
}
