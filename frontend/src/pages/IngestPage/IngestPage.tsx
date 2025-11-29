import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { FileText, Settings2, Save, Layers, Type, File, Loader2, RotateCcw, UploadCloud, FileType, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Maximize2, Minimize2, Tag, X, Plus, Hash, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useIngestStore } from '../../store/ingestStore';
import { useSettingsStore } from '../../store/settingsStore';
import { extractText, generateChunks as apiGenerateChunks, storeChunks } from '../../api/ingestApi';
import { Select } from '../../components/common/Select/Select';
import { useToast } from '../../components/common/Toast/Toast';

// Types
interface Document {
  id: string;
  text: string;
  metadata: any;
}

interface ProviderConfig {
  embeddingProvider: 'local' | 'vertex' | 'openai' | 'azure' | 'aws';
  llmProvider: 'vertex' | 'openai';
  // Vertex
  vertexProjectId: string;
  vertexLocation: string;
  vertexModel: string;
  vertexCredentialsJSON: string;
  // OpenAI
  openaiApiKey: string;
  openaiModel: string;
  // Local
  localModel: string;
  // Azure
  azureApiKey: string;
  azureEndpoint: string;
  azureApiVersion: string;
  azureDeployment: string;
  // AWS
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsModel: string;
}

export const IngestPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  // Global State
  const {
    inputType, setInputType,
    textInput, setTextInput,
    file, setFile,
    fileId, setFileId,
    pages, setPages,
    strategy, setStrategy,
    strategyConfig, setStrategyConfig,
    chunks, setChunks,
    metrics, setMetrics,
    reset: resetStore
  } = useIngestStore();

  // Local UI State
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());
  const [isChunking, setIsChunking] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [storeStatus, setStoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { settings } = useSettingsStore();
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');

  // Helper to get backend config based on provider
  const getBackendConfig = (providerType: string) => {
    if (!settings) return {};

    switch (providerType) {
      case 'vertex':
        return {
          project_id: settings.vertexProjectId,
          location: settings.vertexLocation,
          model_name: settings.vertexModel,
          credentials_json: settings.vertexCredentialsJSON
        };
      case 'openai':
        return {
          api_key: settings.openaiApiKey,
          model_name: settings.openaiModel
        };
      case 'azure':
        return {
          api_key: settings.azureApiKey,
          azure_endpoint: settings.azureEndpoint,
          api_version: settings.azureApiVersion,
          deployment_name: settings.azureDeployment
        };
      case 'aws':
        return {
          region_name: settings.awsRegion,
          access_key_id: settings.awsAccessKeyId,
          secret_access_key: settings.awsSecretAccessKey,
          model_id: settings.awsModel
        };
      case 'local':
        return {
          model_name: settings.localModel
        };
      default:
        return {};
    }
  };

  // Handlers
  const handleReset = () => {
    resetStore();
    setActiveTab('input');
    setStoreStatus('idle');
    setChunks([]);
    setMetrics(null);
    setMetadata({});
    setPages([]);
  };

  const handleAddMetadata = () => {
    if (metadataKey.trim() && metadataValue.trim()) {
      setMetadata({ ...metadata, [metadataKey.trim()]: metadataValue.trim() });
      setMetadataKey('');
      setMetadataValue('');
    }
  };

  const handleRemoveMetadata = (key: string) => {
    const newMetadata = { ...metadata };
    delete newMetadata[key];
    setMetadata(newMetadata);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);

      // Check file type for extraction
      const filename = uploadedFile.name.toLowerCase();
      if (filename.endsWith('.pdf') || filename.endsWith('.docx') || filename.endsWith('.xlsx')) {
        setIsExtracting(true);
        try {
          const data = await extractText(uploadedFile);
          setTextInput(data.text);
          setPages(data.pages || []); // Store pages
          setFileId(data.file_id); // Store file ID
          setInputType('text'); // Switch to text input to show extracted content
          setFile(null); // Clear file input since we're now showing text
        } catch (error) {
          console.error('Error extracting text:', error);
          showToast('Failed to extract text', 'error');
        } finally {
          setIsExtracting(false);
        }
      } else {
        // Standard text read for .txt, .md, etc.
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setTextInput(event.target.result as string);
            setPages([]); // No pages for plain text usually
            setInputType('text'); // Switch to text input to show file content
            setFile(null); // Clear file input since we're now showing text
          }
        };
        reader.readAsText(uploadedFile);
      }
    }
  };

  const updateConfig = (key: string, value: any) => {
    setStrategyConfig({ ...strategyConfig, [key]: value });
  };

  const generateChunks = async () => {
    if (!textInput) return;

    setIsChunking(true);
    setStoreStatus('idle'); // Reset store status on new chunking

    const startTime = performance.now(); // Start timing

    try {
      // Prepare provider config for semantic chunking if needed
      let providerConfig = undefined;
      if (strategy === 'semantic' && settings) {
        providerConfig = {
          type: settings.embeddingProvider,
          ...getBackendConfig(settings.embeddingProvider)
        };
      }

      const data = await apiGenerateChunks({
        text: textInput,
        strategy: strategy,
        config: strategyConfig,
        provider_config: providerConfig,
        pages: pages
      });

      const endTime = performance.now(); // End timing
      const timeTaken = Math.round(endTime - startTime); // Calculate duration in ms

      setChunks(data.chunks || []);
      setMetrics({
        ...data.metrics,
        time_taken_ms: timeTaken // Add time taken to metrics
      });

      // Auto-navigate to preview on success
      setActiveTab('preview');

      // Clear inputs
      setTextInput('');
      setFile(null);

    } catch (error) {
      console.error('Error generating chunks:', error);
      setChunks([]); // Reset on error
      setMetrics(null);
      showToast('Failed to generate chunks', 'error');
    } finally {
      setIsChunking(false);
    }
  };

  const toggleChunk = (index: number) => {
    const newExpanded = new Set(expandedChunks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChunks(newExpanded);
  };

  const toggleAllChunks = () => {
    if (expandedChunks.size === chunks.length) {
      setExpandedChunks(new Set());
    } else {
      setExpandedChunks(new Set(chunks.map((_, i) => i)));
    }
  };

  const saveAndVisualize = async () => {
    if (chunks.length === 0 || !settings) return;

    setIsStoring(true);
    try {
      const provider = settings.embeddingProvider;
      const config = getBackendConfig(provider);

      // Store Chunks
      // Store Chunks
      await storeChunks({
        chunks: chunks,
        metadatas: chunks.map(() => ({
          source: file ? file.name : 'manual_input',
          file_id: fileId, // Include file ID for cascade delete
          ...metadata  // Include custom metadata tags
        })),
        provider: provider,
        config: config
      });

      setStoreStatus('success');
      showToast('Successfully embedded and stored chunks', 'success');

      // Reset and navigate
      setTimeout(() => {
        resetStore();
        navigate('/query');
      }, 1000); // Small delay to let the user see the success state

    } catch (error) {
      console.error('Error storing:', error);
      setStoreStatus('error');
      showToast('Failed to store chunks', 'error');
    } finally {
      setIsStoring(false);
    }
  };

  // Reset config when strategy changes
  useEffect(() => {
    if (strategy === 'character') {
      setStrategyConfig({ chunk_size: 1000, chunk_overlap: 200 });
    } else if (strategy === 'paragraph') {
      setStrategyConfig({ min_chunk_size: 100 });
    } else if (strategy === 'sentence') {
      setStrategyConfig({ sentences_per_chunk: 5, overlap: 1 });
    } else if (strategy === 'semantic') {
      setStrategyConfig({ threshold: 0.8 });
    } else if (strategy === 'recursive') {
      setStrategyConfig({ chunk_size: 1000, chunk_overlap: 200 });
    } else if (strategy === 'hierarchical') {
      setStrategyConfig({ split_level: 2 });
    }
  }, [strategy, setStrategyConfig]);

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ingest Data</h1>
          <p className="text-zinc-400 mt-2">Process documents and manage knowledge base</p>
        </div>

        <div className="flex gap-4">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={handleReset}
            className="text-zinc-400 hover:text-white"
          >
            Reset All
          </Button>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveTab('input')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer hover:bg-zinc-900",
              activeTab === 'input'
                ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
            )}>
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", activeTab === 'input' ? "bg-blue-500 text-white" : "bg-zinc-800")}>1</div>
            <span className="font-medium text-sm">Input Source</span>
          </div>

          <div className="w-12 h-px bg-zinc-800" />

          <div
            onClick={() => setActiveTab('preview')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer hover:bg-zinc-900",
              activeTab === 'preview'
                ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
            )}>
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", activeTab === 'preview' ? "bg-blue-500 text-white" : "bg-zinc-800")}>2</div>
            <span className="font-medium text-sm">Preview</span>
          </div>
        </div>
      </div>

      {activeTab === 'input' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Input Source</h2>
                  <p className="text-xs text-zinc-500">Upload files or paste text to begin</p>
                </div>
              </div>
            </div>

            {/* Input Type Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-zinc-900/50 rounded-lg border border-zinc-800 w-fit">
              <button
                onClick={() => setInputType('text')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  inputType === 'text' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Type className="w-4 h-4" /> Text Input
              </button>
              <button
                onClick={() => setInputType('file')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  inputType === 'file' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <File className="w-4 h-4" /> File Upload
              </button>
            </div>

            <div className="mb-8">
              {inputType === 'file' ? (
                <div className="h-64 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group relative overflow-hidden">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.pdf,.docx,.xlsx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    {isExtracting ? (
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 font-medium px-4">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    PDF, DOCX, XLSX, TXT, MD
                  </p>
                </div>
              ) : (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text to chunk..."
                  className="w-full h-64 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 resize-none custom-scrollbar"
                />
              )}
            </div>

            {/* Chunking Strategy */}
            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-4 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Chunking Strategy</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Select
                  label="Strategy"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <option value="character" className="bg-zinc-900">Character Split</option>
                  <option value="recursive" className="bg-zinc-900">Recursive Character Split</option>
                  <option value="paragraph" className="bg-zinc-900">Paragraph Split</option>
                  <option value="sentence" className="bg-zinc-900">Sentence Split</option>
                  <option value="semantic" className="bg-zinc-900">Semantic Split (AI)</option>
                  <option value="hierarchical" className="bg-zinc-900">Hierarchical Split</option>
                </Select>

                <div className="space-y-4">
                  {strategy === 'character' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Chunk Size"
                        type="number"
                        value={strategyConfig.chunk_size || 1000}
                        onChange={(e) => updateConfig('chunk_size', parseInt(e.target.value))}
                      />
                      <Input
                        label="Overlap"
                        type="number"
                        value={strategyConfig.chunk_overlap || 200}
                        onChange={(e) => updateConfig('chunk_overlap', parseInt(e.target.value))}
                      />
                    </div>
                  )}

                  {strategy === 'recursive' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Chunk Size"
                          type="number"
                          value={strategyConfig.chunk_size || 1000}
                          onChange={(e) => updateConfig('chunk_size', parseInt(e.target.value))}
                        />
                        <Input
                          label="Overlap"
                          type="number"
                          value={strategyConfig.chunk_overlap || 200}
                          onChange={(e) => updateConfig('chunk_overlap', parseInt(e.target.value))}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        Splits by paragraphs, then newlines, then spaces to fit chunk size.
                      </p>
                    </div>
                  )}

                  {strategy === 'paragraph' && (
                    <Input
                      label="Min Chunk Size"
                      type="number"
                      value={strategyConfig.min_chunk_size || 100}
                      onChange={(e) => updateConfig('min_chunk_size', parseInt(e.target.value))}
                    />
                  )}

                  {strategy === 'sentence' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Sentences / Chunk"
                        type="number"
                        value={strategyConfig.sentences_per_chunk || 5}
                        onChange={(e) => updateConfig('sentences_per_chunk', parseInt(e.target.value))}
                      />
                      <Input
                        label="Overlap"
                        type="number"
                        value={strategyConfig.overlap || 1}
                        onChange={(e) => updateConfig('overlap', parseInt(e.target.value))}
                      />
                    </div>
                  )}

                  {strategy === 'hierarchical' && (
                    <div className="space-y-4">
                      <Input
                        label="Split Level (1=#, 2=##)"
                        type="number"
                        min="1"
                        max="6"
                        value={strategyConfig.split_level || 2}
                        onChange={(e) => updateConfig('split_level', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-zinc-500">
                        Splits document by Markdown headers up to the specified level.
                      </p>
                    </div>
                  )}

                  {strategy === 'semantic' && (
                    <Input
                      label="Similarity Threshold"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={strategyConfig.threshold || 0.8}
                      onChange={(e) => updateConfig('threshold', parseFloat(e.target.value))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Metadata Tags Section */}
            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-4 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Metadata Tags (Optional)</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Add custom tags to organize and categorize your chunks</p>

              {/* Metadata Input */}
              <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 mb-4">
                <Input
                  label="Key"
                  placeholder="e.g., category, author, source"
                  value={metadataKey}
                  onChange={(e) => setMetadataKey(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMetadata()}
                />
                <Input
                  label="Value"
                  placeholder="e.g., documentation, john, manual"
                  value={metadataValue}
                  onChange={(e) => setMetadataValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMetadata()}
                />
                <div className="flex items-end">
                  <Button
                    size="md"
                    variant="outline"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleAddMetadata}
                    disabled={!metadataKey.trim() || !metadataValue.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Metadata Tags Display */}
              {Object.keys(metadata).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full text-sm"
                    >
                      <span className="font-medium">{key}:</span>
                      <span>{value}</span>
                      <button
                        onClick={() => handleRemoveMetadata(key)}
                        className="hover:bg-emerald-500/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={generateChunks}
                isLoading={isChunking}
                disabled={!textInput && !file}
                className={cn(
                  "px-8",
                  (!textInput && !file) ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                Generate & Preview
              </Button>
            </div>
          </Card>
        </div >
      )}

      {
        activeTab === 'preview' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <Card className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Chunk Preview</h2>
                    <p className="text-xs text-zinc-500">Review generated chunks before embedding</p>
                  </div>
                </div>
              </div>

              {/* Metrics Cards */}
              {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <Card className="p-4 flex flex-col items-center border-blue-500/20 bg-blue-500/5">
                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 mb-2">
                      <Layers className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Chunks</p>
                    <p className="text-2xl font-bold text-white mt-1">{metrics.total_chunks}</p>
                  </Card>

                  <Card className="p-4 flex flex-col items-center border-violet-500/20 bg-violet-500/5">
                    <div className="p-2 rounded-full bg-violet-500/10 text-violet-500 mb-2">
                      <Type className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Avg Size</p>
                    <p className="text-2xl font-bold text-white mt-1">{Math.round(metrics.avg_size)}</p>
                  </Card>

                  <Card className="p-4 flex flex-col items-center border-emerald-500/20 bg-emerald-500/5">
                    <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                      <Minimize2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Min Size</p>
                    <p className="text-2xl font-bold text-white mt-1">{Math.min(...chunks.map(c => c.text.length))}</p>
                  </Card>

                  <Card className="p-4 flex flex-col items-center border-amber-500/20 bg-amber-500/5">
                    <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 mb-2">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Max Size</p>
                    <p className="text-2xl font-bold text-white mt-1">{Math.max(...chunks.map(c => c.text.length))}</p>
                  </Card>

                  <Card className="p-4 flex flex-col items-center border-cyan-500/20 bg-cyan-500/5">
                    <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-500 mb-2">
                      <Hash className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Chars</p>
                    <p className="text-2xl font-bold text-white mt-1">{chunks.reduce((acc, c) => acc + c.text.length, 0).toLocaleString()}</p>
                  </Card>

                  <Card className="p-4 flex flex-col items-center border-orange-500/20 bg-orange-500/5">
                    <div className="p-2 rounded-full bg-orange-500/10 text-orange-500 mb-2">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Time Taken</p>
                    <p className="text-2xl font-bold text-white mt-1">{metrics.time_taken_ms}ms</p>
                  </Card>
                </div>
              )}

              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleAllChunks}
                  leftIcon={expandedChunks.size === chunks.length ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  className="text-zinc-400 hover:text-white"
                >
                  {expandedChunks.size === chunks.length ? "Collapse All" : "Expand All"}
                </Button>
              </div>

              <div className="flex-1 bg-zinc-950/30 rounded-xl border border-zinc-800/50 p-4 overflow-y-auto max-h-[500px] custom-scrollbar mb-6">
                {chunks?.length > 0 ? (
                  <div className="grid gap-4">
                    {chunks.map((chunk, i) => {
                      const isExpanded = expandedChunks.has(i);
                      const pageNumbers = chunk.metadata?.page_numbers || [];
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group overflow-hidden",
                            isExpanded ? "ring-1 ring-blue-500/20" : ""
                          )}
                        >
                          <div
                            className="flex justify-between items-center p-3 cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/80 transition-colors"
                            onClick={() => toggleChunk(i)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">
                                Chunk #{i + 1}
                              </span>
                              <span className="text-xs text-zinc-500 font-mono">{chunk.text.length} chars</span>
                              {pageNumbers && (Array.isArray(pageNumbers) ? pageNumbers.length > 0 : pageNumbers) && (
                                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                                  Page {Array.isArray(pageNumbers) ? pageNumbers.join(', ') : pageNumbers}
                                </span>
                              )}
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                          </div>

                          {isExpanded ? (
                            <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/30 animate-in slide-in-from-top-2 duration-200">
                              <p className="text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">{chunk.text}</p>
                              {/* Display all metadata for debugging/verification */}
                              {Object.keys(chunk.metadata).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-800/30">
                                  <p className="text-xs text-zinc-500 mb-2">Metadata:</p>
                                  <pre className="text-xs text-zinc-400 bg-zinc-900/50 p-2 rounded">{JSON.stringify(chunk.metadata, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="px-4 pb-3 pt-1">
                              <p className="text-sm text-zinc-500 line-clamp-1 font-mono">{chunk.text}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4 min-h-[200px]">
                    <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center">
                      <FileType className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p>No chunks generated</p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-zinc-800/50 flex justify-between items-center">
                <Button
                  variant="ghost"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setActiveTab('input')}
                >
                  Back to Input
                </Button>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                    Target: <span className="text-zinc-200 font-medium">{settings?.embeddingProvider === 'local' ? 'Local ChromaDB' : 'Cloud Vector Store'}</span>
                  </div>

                  <Button
                    size="lg"
                    leftIcon={<Save className="w-4 h-4" />}
                    onClick={saveAndVisualize}
                    isLoading={isStoring}
                    className="min-w-[200px]"
                  >
                    Embed & Save to Knowledge Base
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )
      }


    </div >
  );
};
