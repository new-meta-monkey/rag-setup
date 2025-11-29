import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../../components/common/Card/Card';
import { RefreshCw, ZoomIn, Info } from 'lucide-react';
import { Button } from '../../components/common/Button/Button';
import { useToast } from '../../components/common/Toast/Toast';

interface DataPoint {
    x: number;
    y: number;
    z?: number;
    id: string;
    source: string;
    text_preview: string;
    token_count: number;
}

interface VisualizationTabProps {
    isActive: boolean;
}

const COLORS = [
    '#60A5FA', // blue-400
    '#34D399', // emerald-400
    '#A78BFA', // violet-400
    '#F472B6', // pink-400
    '#FBBF24', // amber-400
    '#2DD4BF', // teal-400
    '#FB7185', // rose-400
    '#818CF8', // indigo-400
];

export const VisualizationTab: React.FC<VisualizationTabProps> = ({ isActive }) => {
    const { showToast } = useToast();
    const [data, setData] = useState<DataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uniqueSources, setUniqueSources] = useState<string[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/visualize_stored?method=pca&n_components=2');
            const result = await response.json();

            if (result.points) {
                setData(result.points);
                // Extract unique sources for color mapping
                const sources = Array.from(new Set(result.points.map((p: DataPoint) => p.source))) as string[];
                setUniqueSources(sources);
                showToast('Visualization updated', 'success');
            }
        } catch (error) {
            console.error('Error fetching visualization data:', error);
            showToast('Failed to load visualization', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isActive && data.length === 0) {
            fetchData();
        }
    }, [isActive]);

    const getColorForSource = (source: string) => {
        const index = uniqueSources.indexOf(source);
        return COLORS[index % COLORS.length];
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl max-w-xs z-50">
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getColorForSource(point.source) }}
                        />
                        <span className="text-xs font-medium text-zinc-300 truncate max-w-[200px]">
                            {point.source}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-2 font-mono">{point.id.slice(0, 8)}...</p>
                    <p className="text-sm text-zinc-200 line-clamp-3 mb-2 italic">
                        "{point.text_preview}"
                    </p>
                    <div className="flex justify-between items-center text-xs text-zinc-500 border-t border-zinc-800 pt-2">
                        <span>Tokens: {point.token_count}</span>
                        <span>Coords: ({point.x.toFixed(2)}, {point.y.toFixed(2)})</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <ZoomIn className="w-5 h-5 text-blue-400" />
                        Semantic Map
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Explore your knowledge base chunks in 2D space. Closer points are semantically similar.
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={fetchData}
                    isLoading={isLoading}
                >
                    Refresh Map
                </Button>
            </div>

            <Card className="h-[600px] border-zinc-800 bg-zinc-900/30 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Dimension 1"
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={{ stroke: '#666' }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Dimension 2"
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={{ stroke: '#666' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Chunks" data={data} fill="#8884d8">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColorForSource(entry.source)} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                        <Info className="w-12 h-12 mb-4 opacity-50" />
                        <p>No data to visualize yet.</p>
                        <p className="text-sm mt-2">Upload documents to see them mapped here.</p>
                    </div>
                )}
            </Card>

            {/* Legend */}
            {uniqueSources.length > 0 && (
                <div className="flex flex-wrap gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    {uniqueSources.map((source) => (
                        <div key={source} className="flex items-center gap-2 text-xs text-zinc-400">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getColorForSource(source) }}
                            />
                            <span className="truncate max-w-[200px]" title={source}>{source}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
