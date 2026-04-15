import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWwiseStore } from '../stores/wwise';
import { useCanvasStore } from '../stores/canvas';

interface OriginalsFile {
  name: string;
  path: string;
  size: number;
  ext: string;
  folder: string;
}

interface FolderNode {
  name: string;
  fullPath: string;
  files: OriginalsFile[];
  children: Record<string, FolderNode>;
  fileCount: number;
}

const EXT_COLORS: Record<string, string> = {
  '.wav': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  '.mp3': 'text-green-400 bg-green-400/10 border-green-400/30',
  '.ogg': 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  '.flac': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFolderTree(files: OriginalsFile[]): FolderNode {
  const root: FolderNode = { name: 'Originals', fullPath: '', files: [], children: {}, fileCount: 0 };

  for (const file of files) {
    const parts = file.folder.split('/').filter(Boolean);
    let current = root;
    let pathSoFar = '';

    for (const part of parts) {
      pathSoFar += (pathSoFar ? '/' : '') + part;
      if (!current.children[part]) {
        current.children[part] = { name: part, fullPath: pathSoFar, files: [], children: {}, fileCount: 0 };
      }
      current = current.children[part];
    }

    current.files.push(file);
  }

  // Count files recursively
  function countFiles(node: FolderNode): number {
    let count = node.files.length;
    for (const child of Object.values(node.children)) {
      count += countFiles(child);
    }
    node.fileCount = count;
    return count;
  }
  countFiles(root);

  return root;
}

function filterTree(node: FolderNode, query: string): FolderNode | null {
  const q = query.toLowerCase();
  const filteredFiles = node.files.filter((f) => f.name.toLowerCase().includes(q));
  const filteredChildren: Record<string, FolderNode> = {};
  let childFileCount = 0;

  for (const [key, child] of Object.entries(node.children)) {
    const filtered = filterTree(child, query);
    if (filtered) {
      filteredChildren[key] = filtered;
      childFileCount += filtered.fileCount;
    }
  }

  const totalCount = filteredFiles.length + childFileCount;
  if (totalCount === 0) return null;

  return { ...node, files: filteredFiles, children: filteredChildren, fileCount: totalCount };
}

// --- Folder tree node component ---

function FolderTreeNode({
  node,
  depth,
  selectedFile,
  onSelectFile,
  onDragStart,
  defaultExpanded,
}: {
  node: FolderNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onDragStart: (e: React.DragEvent, file: OriginalsFile) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? depth < 2);

  const childKeys = Object.keys(node.children).sort();
  const sortedFiles = [...node.files].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      {/* Folder header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full gap-1 px-1 py-0.5 hover:bg-white/5 rounded group"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <span className="text-[9px] text-[#8892a4] w-3 flex-shrink-0 select-none">
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
        <span className="text-[10px] text-[#eaeaea] truncate font-medium">{node.name}</span>
        <span className="text-[8px] text-[#8892a4] ml-auto flex-shrink-0 tabular-nums">
          {node.fileCount}
        </span>
      </button>

      {/* Children */}
      {expanded && (
        <div>
          {childKeys.map((key) => (
            <FolderTreeNode
              key={key}
              node={node.children[key]}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onDragStart={onDragStart}
            />
          ))}
          {sortedFiles.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              depth={depth + 1}
              selected={selectedFile === file.path}
              onSelect={() => onSelectFile(file.path)}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- File row component ---

function FileRow({
  file,
  depth,
  selected,
  onSelect,
  onDragStart,
}: {
  file: OriginalsFile;
  depth: number;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent, file: OriginalsFile) => void;
}) {
  const extClass = EXT_COLORS[file.ext.toLowerCase()] || 'text-[#8892a4] bg-white/5 border-white/10';

  return (
    <div
      className={`flex items-center gap-1.5 px-1 py-0.5 cursor-pointer rounded group ${
        selected ? 'bg-[#0f3460]/60 ring-1 ring-[#0f3460]' : 'hover:bg-white/5'
      }`}
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
      onClick={onSelect}
      draggable
      onDragStart={(e) => onDragStart(e, file)}
    >
      {/* File name */}
      <span className="text-[9px] text-[#eaeaea] truncate flex-1 select-none">{file.name}</span>

      {/* Format badge */}
      <span
        className={`text-[7px] uppercase font-mono px-1 py-px rounded border flex-shrink-0 ${extClass}`}
      >
        {file.ext.replace('.', '')}
      </span>

      {/* File size */}
      <span className="text-[8px] text-[#8892a4] flex-shrink-0 tabular-nums w-12 text-right">
        {formatFileSize(file.size)}
      </span>
    </div>
  );
}

// --- Main component ---

export default function WwiseOriginalsBrowser() {
  const { connected, projectInfo } = useWwiseStore();
  const { updateNodeData } = useCanvasStore();

  const [files, setFiles] = useState<OriginalsFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState('');

  // Derive the project path from projectInfo
  const projectPath = useMemo(() => {
    if (!projectInfo) return null;
    const info = projectInfo as any;
    return info.projectPath || info.path || info.directories?.originals || null;
  }, [projectInfo]);

  const effectivePath = projectPath || manualPath || null;

  const scan = useCallback(async () => {
    if (!effectivePath) return;
    setLoading(true);
    setError(null);
    try {
      const projectFS = (window as any).projectFS;
      if (!projectFS?.scanWwiseOriginals) {
        setError('projectFS.scanWwiseOriginals not available');
        setLoading(false);
        return;
      }
      const result = await projectFS.scanWwiseOriginals(effectivePath);
      if (result.success) {
        setFiles(result.files || []);
      } else {
        setError('Scan failed');
        setFiles([]);
      }
    } catch (err: any) {
      setError(err.message || 'Scan error');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [effectivePath]);

  // Auto-scan on mount when connected and path is available
  useEffect(() => {
    if (connected && effectivePath) {
      scan();
    }
  }, [connected, effectivePath, scan]);

  const tree = useMemo(() => buildFolderTree(files), [files]);
  const displayTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;
    return filterTree(tree, searchQuery.trim()) || { ...tree, files: [], children: {}, fileCount: 0 };
  }, [tree, searchQuery]);

  const handleDragStart = useCallback((e: React.DragEvent, file: OriginalsFile) => {
    e.dataTransfer.setData('application/wwise-original', JSON.stringify(file));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Not connected state
  if (!connected) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-[9px] text-[#8892a4] uppercase tracking-widest font-mono mb-1">
          Wwise Originals
        </p>
        <p className="text-[9px] text-[#8892a4]">Connect to Wwise to browse originals</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#0f3460]/40">
        <span className="text-[9px] text-[#8892a4] uppercase tracking-widest font-mono">
          Originals
        </span>
        <button
          onClick={scan}
          disabled={loading || !effectivePath}
          className="text-[8px] text-[#8892a4] hover:text-[#eaeaea] disabled:opacity-30
                     px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors font-mono uppercase tracking-wider"
          title="Refresh file list"
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      {/* Manual path input when no path auto-detected */}
      {!projectPath && (
        <div className="px-3 py-2 border-b border-[#0f3460]/40">
          <label className="text-[8px] text-[#8892a4] uppercase tracking-widest font-mono block mb-1">
            .wproj Path
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              placeholder="/path/to/project.wproj"
              className="flex-1 bg-[#1a1a2e] border border-[#0f3460]/60 rounded px-1.5 py-0.5
                         text-[9px] text-[#eaeaea] placeholder:text-[#8892a4]/50
                         focus:outline-none focus:border-[#e94560]/60 font-mono"
            />
            <button
              onClick={scan}
              disabled={!manualPath || loading}
              className="text-[8px] text-[#eaeaea] bg-[#0f3460]/40 hover:bg-[#0f3460]/70
                         disabled:opacity-30 px-2 py-0.5 rounded font-mono uppercase tracking-wider transition-colors"
            >
              Scan
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-1.5 border-b border-[#0f3460]/40">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter files..."
          className="w-full bg-[#1a1a2e] border border-[#0f3460]/40 rounded px-2 py-0.5
                     text-[9px] text-[#eaeaea] placeholder:text-[#8892a4]/50
                     focus:outline-none focus:border-[#e94560]/40"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 text-[9px] text-red-400 bg-red-400/5 border-b border-red-400/20">
          {error}
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto px-1 py-1 min-h-0">
        {loading && files.length === 0 && (
          <p className="text-[9px] text-[#8892a4] text-center py-4">Scanning...</p>
        )}

        {!loading && files.length === 0 && !error && effectivePath && (
          <p className="text-[9px] text-[#8892a4] text-center py-4">No originals found</p>
        )}

        {!loading && files.length === 0 && !effectivePath && (
          <p className="text-[9px] text-[#8892a4] text-center py-4">
            Enter a .wproj path above to scan
          </p>
        )}

        {displayTree.fileCount > 0 && (
          <div>
            {Object.keys(displayTree.children)
              .sort()
              .map((key) => (
                <FolderTreeNode
                  key={key}
                  node={displayTree.children[key]}
                  depth={0}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  onDragStart={handleDragStart}
                  defaultExpanded
                />
              ))}
            {displayTree.files.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                depth={0}
                selected={selectedFile === file.path}
                onSelect={() => setSelectedFile(file.path)}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        )}

        {searchQuery && displayTree.fileCount === 0 && files.length > 0 && (
          <p className="text-[9px] text-[#8892a4] text-center py-4">No matches</p>
        )}
      </div>

      {/* Footer stats */}
      {files.length > 0 && (
        <div className="px-3 py-1 border-t border-[#0f3460]/40 flex items-center justify-between">
          <span className="text-[8px] text-[#8892a4] font-mono tabular-nums">
            {displayTree.fileCount} / {files.length} files
          </span>
          <span className="text-[8px] text-[#8892a4] font-mono">
            Drag onto nodes to assign
          </span>
        </div>
      )}
    </div>
  );
}
