import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Save, Key, Database, Cpu, Globe, Cloud, Server, CheckCircle2, ChevronDown, ChevronUp, Sliders, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/cn';

import { useSettingsStore, type ProviderConfig } from '../../store/settingsStore';

export const SettingsPage = () => {
  const { settings: config, updateSettings, save, isSaving } = useSettingsStore();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'embedding' | 'llm'>('llm');

  // Accordion state
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const handleSave = async () => {
    await save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateConfig = (key: keyof ProviderConfig, value: any) => {
    updateSettings(key, value);
  };

  const toggleAccordion = (provider: string) => {
    if (expandedProvider === provider) {
      setExpandedProvider(null);
    } else {
      setExpandedProvider(provider);
    }
  };

  const selectProvider = (type: 'embedding' | 'llm', provider: string) => {
    if (type === 'embedding') {
      updateConfig('embeddingProvider', provider);
    } else {
      updateConfig('llmProvider', provider);
    }
    setExpandedProvider(provider);
  };

  // Helper to get display name
  const getProviderName = (p: string) => {
    switch (p) {
      case 'local': return 'Local Processing';
      case 'vertex': return 'Google Vertex AI';
      case 'openai': return 'OpenAI';
      case 'azure': return 'Azure OpenAI';
      case 'aws': return 'AWS Bedrock';
      default: return p;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-zinc-400 mt-2">Configure your RAG pipeline</p>
        </div>
        <Button
          size="lg"
          leftIcon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          onClick={handleSave}
          variant={saved ? 'outline' : 'primary'}
          className={saved ? 'border-green-500 text-green-500 hover:bg-green-500/10' : ''}
        >
          {saved ? 'Saved!' : 'Save Configuration'}
        </Button>
      </div>

      {/* Top Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LLM Tab */}
        <div
          onClick={() => setActiveTab('llm')}
          className={cn(
            "cursor-pointer p-6 rounded-xl border transition-all duration-200 flex flex-col items-center text-center gap-4 group",
            activeTab === 'llm'
              ? "bg-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
              : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
          )}
        >
          <div className={cn("p-3 rounded-full transition-colors", activeTab === 'llm' ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200")}>
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className={cn("font-semibold", activeTab === 'llm' ? "text-white" : "text-zinc-300")}>LLM & Context</h3>
            <p className="text-xs text-zinc-500 mt-1">Active: <span className="text-emerald-400">{getProviderName(config.llmProvider)}</span></p>
          </div>
        </div>

        {/* Embedding Tab */}
        <div
          onClick={() => setActiveTab('embedding')}
          className={cn(
            "cursor-pointer p-6 rounded-xl border transition-all duration-200 flex flex-col items-center text-center gap-4 group",
            activeTab === 'embedding'
              ? "bg-zinc-900 border-violet-500/50 shadow-lg shadow-violet-500/10"
              : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
          )}
        >
          <div className={cn("p-3 rounded-full transition-colors", activeTab === 'embedding' ? "bg-violet-500/20 text-violet-500" : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200")}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className={cn("font-semibold", activeTab === 'embedding' ? "text-white" : "text-zinc-300")}>Embedding & Retrieval</h3>
            <p className="text-xs text-zinc-500 mt-1">Active: <span className="text-violet-400">{getProviderName(config.embeddingProvider)}</span></p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'embedding' && (
          <div className="space-y-6 animate-fade-in">
            {/* Retrieval Settings */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Retrieval Settings</h2>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-zinc-300">Minimum Accuracy (Similarity Score)</label>
                  <span className="text-sm font-mono text-violet-400">{config.retrievalAccuracy.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.retrievalAccuracy}
                  onChange={(e) => updateConfig('retrievalAccuracy', parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <p className="text-xs text-zinc-500">
                  Chunks with a similarity score below this threshold will be ignored. Set to 0.0 to include all results.
                </p>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-white px-1">Select Embedding Provider</h2>

            {/* Local Provider */}
            <div className={cn("rounded-xl border transition-all overflow-hidden", config.embeddingProvider === 'local' ? "border-green-500/30 bg-green-500/5" : "border-zinc-800 bg-zinc-900/30")}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  selectProvider('embedding', 'local');
                  toggleAccordion('local_emb');
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.embeddingProvider === 'local' ? "border-green-500" : "border-zinc-600")}>
                  {config.embeddingProvider === 'local' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">Local Processing</h3>
                </div>
                {expandedProvider === 'local_emb' ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {(expandedProvider === 'local_emb' || config.embeddingProvider === 'local') && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 space-y-4 animate-fade-in">
                  <Input
                    label="Model Name"
                    value={config.localModel}
                    onChange={(e) => updateConfig('localModel', e.target.value)}
                    placeholder="all-MiniLM-L6-v2"
                    leftIcon={<Cpu className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>

            {/* Vertex AI */}
            <div className={cn("rounded-xl border transition-all overflow-hidden", config.embeddingProvider === 'vertex' ? "border-blue-500/30 bg-blue-500/5" : "border-zinc-800 bg-zinc-900/30")}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  selectProvider('embedding', 'vertex');
                  toggleAccordion('vertex_emb');
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.embeddingProvider === 'vertex' ? "border-blue-500" : "border-zinc-600")}>
                  {config.embeddingProvider === 'vertex' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">Google Vertex AI</h3>
                </div>
                {expandedProvider === 'vertex_emb' ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {(expandedProvider === 'vertex_emb' || config.embeddingProvider === 'vertex') && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 space-y-4 animate-fade-in">
                  <Input
                    label="Project ID"
                    value={config.vertexProjectId}
                    onChange={(e) => updateConfig('vertexProjectId', e.target.value)}
                    placeholder="my-gcp-project-id"
                    leftIcon={<Database className="w-4 h-4" />}
                  />
                  <Input
                    label="Location"
                    value={config.vertexLocation}
                    onChange={(e) => updateConfig('vertexLocation', e.target.value)}
                    placeholder="us-central1"
                    leftIcon={<Globe className="w-4 h-4" />}
                  />
                  <Input
                    label="Model Name"
                    value={config.vertexModel}
                    onChange={(e) => updateConfig('vertexModel', e.target.value)}
                    placeholder="text-embedding-004"
                    leftIcon={<Cpu className="w-4 h-4" />}
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 ml-1">Service Account JSON (Optional)</label>
                    <textarea
                      value={config.vertexCredentialsJSON}
                      onChange={(e) => updateConfig('vertexCredentialsJSON', e.target.value)}
                      placeholder='{"type": "service_account", ...}'
                      className="w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 resize-none custom-scrollbar font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* OpenAI */}
            <div className={cn("rounded-xl border transition-all overflow-hidden", config.embeddingProvider === 'openai' ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30")}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  selectProvider('embedding', 'openai');
                  toggleAccordion('openai_emb');
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.embeddingProvider === 'openai' ? "border-emerald-500" : "border-zinc-600")}>
                  {config.embeddingProvider === 'openai' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">OpenAI</h3>
                </div>
                {expandedProvider === 'openai_emb' ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {(expandedProvider === 'openai_emb' || config.embeddingProvider === 'openai') && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 space-y-4 animate-fade-in">
                  <Input
                    label="API Key"
                    type="password"
                    value={config.openaiApiKey}
                    onChange={(e) => updateConfig('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    leftIcon={<Key className="w-4 h-4" />}
                  />
                  <Input
                    label="Model Name"
                    value={config.openaiModel}
                    onChange={(e) => updateConfig('openaiModel', e.target.value)}
                    placeholder="text-embedding-3-small"
                    leftIcon={<Cpu className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>

            {/* Azure */}
            <div className={cn("rounded-xl border transition-all overflow-hidden", config.embeddingProvider === 'azure' ? "border-blue-400/30 bg-blue-400/5" : "border-zinc-800 bg-zinc-900/30")}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  selectProvider('embedding', 'azure');
                  toggleAccordion('azure_emb');
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.embeddingProvider === 'azure' ? "border-blue-400" : "border-zinc-600")}>
                  {config.embeddingProvider === 'azure' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">Azure OpenAI</h3>
                </div>
                {expandedProvider === 'azure_emb' ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {(expandedProvider === 'azure_emb' || config.embeddingProvider === 'azure') && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 space-y-4 animate-fade-in">
                  <Input
                    label="API Key"
                    type="password"
                    value={config.azureApiKey}
                    onChange={(e) => updateConfig('azureApiKey', e.target.value)}
                    placeholder="..."
                    leftIcon={<Key className="w-4 h-4" />}
                  />
                  <Input
                    label="Endpoint"
                    value={config.azureEndpoint}
                    onChange={(e) => updateConfig('azureEndpoint', e.target.value)}
                    placeholder="https://resource.openai.azure.com/"
                    leftIcon={<Cloud className="w-4 h-4" />}
                  />
                  <Input
                    label="API Version"
                    value={config.azureApiVersion}
                    onChange={(e) => updateConfig('azureApiVersion', e.target.value)}
                    placeholder="2023-05-15"
                  />
                  <Input
                    label="Deployment Name"
                    value={config.azureDeployment}
                    onChange={(e) => updateConfig('azureDeployment', e.target.value)}
                    placeholder="my-embedding-deployment"
                    leftIcon={<Server className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>

            {/* AWS */}
            <div className={cn("rounded-xl border transition-all overflow-hidden", config.embeddingProvider === 'aws' ? "border-orange-500/30 bg-orange-500/5" : "border-zinc-800 bg-zinc-900/30")}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  selectProvider('embedding', 'aws');
                  toggleAccordion('aws_emb');
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.embeddingProvider === 'aws' ? "border-orange-500" : "border-zinc-600")}>
                  {config.embeddingProvider === 'aws' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">AWS Bedrock</h3>
                </div>
                {expandedProvider === 'aws_emb' ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {(expandedProvider === 'aws_emb' || config.embeddingProvider === 'aws') && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 space-y-4 animate-fade-in">
                  <Input
                    label="Region"
                    value={config.awsRegion}
                    onChange={(e) => updateConfig('awsRegion', e.target.value)}
                    placeholder="us-east-1"
                    leftIcon={<Globe className="w-4 h-4" />}
                  />
                  <Input
                    label="Access Key ID"
                    type="password"
                    value={config.awsAccessKeyId}
                    onChange={(e) => updateConfig('awsAccessKeyId', e.target.value)}
                    placeholder="AKIA..."
                    leftIcon={<Key className="w-4 h-4" />}
                  />
                  <Input
                    label="Secret Access Key"
                    type="password"
                    value={config.awsSecretAccessKey}
                    onChange={(e) => updateConfig('awsSecretAccessKey', e.target.value)}
                    placeholder="..."
                    leftIcon={<Key className="w-4 h-4" />}
                  />
                  <Input
                    label="Model ID"
                    value={config.awsModel}
                    onChange={(e) => updateConfig('awsModel', e.target.value)}
                    placeholder="amazon.titan-embed-text-v1"
                    leftIcon={<Cpu className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'llm' && (
          <div className="space-y-6 animate-fade-in">
            {/* System Context & Global LLM Settings */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">System Context & Parameters</h2>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300 ml-1">System Context (Prompt)</label>
                <textarea
                  value={config.systemContext}
                  onChange={(e) => updateConfig('systemContext', e.target.value)}
                  placeholder="You are a helpful AI assistant. Answer questions based on the provided context..."
                  className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 resize-none custom-scrollbar"
                />
                <p className="text-xs text-zinc-500 ml-1">
                  This instruction will be sent to the LLM with every query to define its persona and behavior.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-zinc-300">Temperature</label>
                    <span className="text-sm font-mono text-emerald-400">{config.temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Controls randomness: 0.0 is deterministic, 2.0 is very creative.
                  </p>
                </div>

                <div className="space-y-2">
                  <Input
                    label="Max Output Tokens"
                    type="number"
                    value={config.maxTokens.toString()}
                    onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value) || 2048)}
                    placeholder="2048"
                  />
                  <p className="text-xs text-zinc-500">
                    Maximum number of tokens to generate in the response.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-zinc-300">Chat History Limit</label>
                    <span className="text-sm font-mono text-emerald-400">{config.chatHistoryLimit} messages</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={config.chatHistoryLimit}
                    onChange={(e) => updateConfig('chatHistoryLimit', parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Number of previous messages to include as context.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-white px-1">Select LLM Provider</h2>

            {/* Vertex AI LLM */}
            <div className={cn("rounded-xl border transition-all overflow-hidden", config.llmProvider === 'vertex' ? "border-blue-500/30 bg-blue-500/5" : "border-zinc-800 bg-zinc-900/30")}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  selectProvider('llm', 'vertex');
                  toggleAccordion('vertex_llm');
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.llmProvider === 'vertex' ? "border-blue-500" : "border-zinc-600")}>
                  {config.llmProvider === 'vertex' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">Google Vertex AI</h3>
                </div>
                {expandedProvider === 'vertex_llm' ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {(expandedProvider === 'vertex_llm' || config.llmProvider === 'vertex') && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 space-y-4 animate-fade-in">
                  <Input
                    label="Project ID"
                    value={config.vertexProjectId}
                    onChange={(e) => updateConfig('vertexProjectId', e.target.value)}
                    placeholder="my-gcp-project-id"
                    leftIcon={<Database className="w-4 h-4" />}
                  />
                  <Input
                    label="Location"
                    value={config.vertexLocation}
                    onChange={(e) => updateConfig('vertexLocation', e.target.value)}
                    placeholder="us-central1"
                    leftIcon={<Globe className="w-4 h-4" />}
                  />
                  <Input
                    label="Model Name"
                    value={config.vertexLLMModel}
                    onChange={(e) => updateConfig('vertexLLMModel', e.target.value)}
                    placeholder="gemini-2.5-pro"
                    leftIcon={<Cpu className="w-4 h-4" />}
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 ml-1">Service Account JSON (Optional)</label>
                    <textarea
                      value={config.vertexCredentialsJSON}
                      onChange={(e) => updateConfig('vertexCredentialsJSON', e.target.value)}
                      placeholder='{"type": "service_account", ...}'
                      className="w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 resize-none custom-scrollbar font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* OpenAI LLM */}
            <div className={cn("rounded-xl border transition-all overflow-hidden", config.llmProvider === 'openai' ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30")}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  selectProvider('llm', 'openai');
                  toggleAccordion('openai_llm');
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.llmProvider === 'openai' ? "border-emerald-500" : "border-zinc-600")}>
                  {config.llmProvider === 'openai' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">OpenAI</h3>
                </div>
                {expandedProvider === 'openai_llm' ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {(expandedProvider === 'openai_llm' || config.llmProvider === 'openai') && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 space-y-4 animate-fade-in">
                  <Input
                    label="API Key"
                    type="password"
                    value={config.openaiApiKey}
                    onChange={(e) => updateConfig('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    leftIcon={<Key className="w-4 h-4" />}
                  />
                  <Input
                    label="Model Name"
                    value={config.openaiLLMModel}
                    onChange={(e) => updateConfig('openaiLLMModel', e.target.value)}
                    placeholder="gpt-4o-mini"
                    leftIcon={<Cpu className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
