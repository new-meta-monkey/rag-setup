import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Send, MessageSquare, Sparkles, Loader2, AlertCircle, User, Bot, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { queryKnowledge, type Source } from '../../api/queryApi';
import { cn } from '../../utils/cn';
import { useSettingsStore } from '../../store/settingsStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
}

export const QueryPage = () => {
  const { settings } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSources, setCurrentSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSources([]);
    setQuery('');
    setError('');
    setExpandedSources(new Set());
  };

  const toggleSource = (chunkId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(chunkId)) {
      newExpanded.delete(chunkId);
    } else {
      newExpanded.add(chunkId);
    }
    setExpandedSources(newExpanded);
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError('');

    try {
      // Build embedding config
      const embeddingConfig: Record<string, any> = {};
      if (settings.embeddingProvider === 'vertex') {
        embeddingConfig.project_id = settings.vertexProjectId;
        embeddingConfig.location = settings.vertexLocation;
        embeddingConfig.model_name = settings.vertexModel;
        if (settings.vertexCredentialsJSON) {
          embeddingConfig.credentials_json = settings.vertexCredentialsJSON;
        }
      } else if (settings.embeddingProvider === 'openai') {
        embeddingConfig.api_key = settings.openaiApiKey;
        embeddingConfig.model_name = settings.openaiModel;
      } else if (settings.embeddingProvider === 'local') {
        embeddingConfig.model_name = settings.localModel;
      } else if (settings.embeddingProvider === 'azure') {
        embeddingConfig.api_key = settings.azureApiKey;
        embeddingConfig.azure_endpoint = settings.azureEndpoint;
        embeddingConfig.api_version = settings.azureApiVersion;
        embeddingConfig.deployment_name = settings.azureDeployment;
      } else if (settings.embeddingProvider === 'aws') {
        embeddingConfig.region_name = settings.awsRegion;
        embeddingConfig.access_key_id = settings.awsAccessKeyId;
        embeddingConfig.secret_access_key = settings.awsSecretAccessKey;
        embeddingConfig.model_id = settings.awsModel;
      }

      // Build LLM config
      const llmConfig: Record<string, any> = {};
      if (settings.llmProvider === 'vertex') {
        llmConfig.project_id = settings.vertexProjectId;
        llmConfig.location = settings.vertexLocation;
        llmConfig.model_name = settings.vertexLLMModel;
        if (settings.vertexCredentialsJSON) {
          llmConfig.credentials_json = settings.vertexCredentialsJSON;
        }
      } else if (settings.llmProvider === 'openai') {
        llmConfig.api_key = settings.openaiApiKey;
        llmConfig.model_name = settings.openaiLLMModel;
      }

      // Add global LLM params
      if (settings.systemContext) llmConfig.system_prompt = settings.systemContext;
      if (settings.temperature !== undefined) llmConfig.temperature = settings.temperature;
      if (settings.maxTokens !== undefined) llmConfig.max_tokens = settings.maxTokens;

      // Prepare chat history
      const historyLimit = settings.chatHistoryLimit !== undefined ? settings.chatHistoryLimit : 5;
      const history = messages.slice(-historyLimit).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await queryKnowledge({
        query: userMessage.content,
        embedding_provider: settings.embeddingProvider || 'local',
        embedding_config: embeddingConfig,
        llm_provider: settings.llmProvider || 'vertex',
        llm_config: llmConfig,
        n_results: 5,
        min_score: settings.retrievalAccuracy || 0.0,
        history: history
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentSources(response.sources);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to query knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleQuery();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Query Knowledge</h1>
          <p className="text-zinc-400 mt-2">Ask questions to your local RAG system</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={handleNewChat}
            className="text-zinc-400 hover:text-white"
          >
            New Chat
          </Button>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 min-h-0">
        {/* Chat Column */}
        <div className="flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0 border-zinc-800">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start a Conversation</h3>
                  <p className="text-zinc-500 max-w-md">
                    Ask questions about your documents and get AI-powered answers with relevant context.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3",
                          message.role === 'user'
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-100"
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ node, ...props }) => <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props} />,
                                code: (props: any) => {
                                  const { node, inline, className, children, ...rest } = props;
                                  return inline
                                    ? <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-400" {...rest}>{children}</code>
                                    : <code className="block bg-zinc-900 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2" {...rest}>{children}</code>;
                                },
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                                li: ({ node, ...props }) => <li className="text-sm" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                em: ({ node, ...props }) => <em className="italic" {...props} />,
                                h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mt-3 mb-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
                                a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-zinc-700 pl-3 italic my-2" {...props} />,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-zinc-300" />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-6 mb-4">
                <div className="flex items-center gap-3 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}


            {/* Input Area */}
            <div className="border-t border-zinc-800 p-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Ask a question about your documents..."
                  className="flex-1 bg-zinc-900/50 border-zinc-700 focus:border-blue-500/50"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button
                  size="lg"
                  className="px-6"
                  leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </Card >
        </div >

        {/* Metrics/Sources Column */}
        < div className="flex flex-col min-h-0" >
          <Card className="flex-1 flex flex-col min-h-0 border-zinc-800">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Retrieved Context</h3>
                  <p className="text-xs text-zinc-500">Top-K relevant chunks</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {currentSources.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-sm text-zinc-500">
                    Source chunks will appear here after you ask a question
                  </p>
                </div>
              ) : (
                currentSources.map((source) => {
                  const isExpanded = expandedSources.has(source.chunk_id.toString());
                  const tokenCount = source.text.split(/\s+/).length;

                  return (
                    <div
                      key={source.chunk_id}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors"
                    >
                      <div
                        className="p-3 cursor-pointer"
                        onClick={() => toggleSource(source.chunk_id.toString())}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-violet-400 bg-violet-400/10 px-2 py-1 rounded border border-violet-400/20">
                            Chunk #{source.chunk_id}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">
                              {tokenCount} tokens
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-zinc-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                        </div>

                        {/* Similarity Score Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-500">Similarity</span>
                            <span className="text-xs font-medium text-blue-400">
                              {(source.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                              style={{ width: `${source.score * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Preview or Full Text */}
                        {isExpanded ? (
                          <p className="text-sm text-zinc-300 leading-relaxed mt-3 whitespace-pre-wrap">
                            {source.text}
                          </p>
                        ) : (
                          <p className="text-sm text-zinc-500 line-clamp-2">
                            {source.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div >
      </div >
    </div >
  );
};
