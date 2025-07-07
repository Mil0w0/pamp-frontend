import React from 'react'
import { Separator } from '@/components/ui/separator'
import { FilePair, LayoutState } from '../types'

interface TopBarProps {
    currentPair: FilePair
    layoutState: LayoutState
}

export const TopBar: React.FC<TopBarProps> = ({ currentPair, layoutState }) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-foreground">
                    Code Structure Visualization
                </h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Separator orientation="vertical" className="h-4" />
                    <span>
                        {currentPair.react_flow.file_metadata.file1.name} vs{' '}
                        {currentPair.react_flow.file_metadata.file2.name}
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>Code Structure Analysis</span>
                    {(layoutState.isApplyingZoom ||
                        layoutState.isTransitioning) && (
                        <>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1 text-primary">
                                <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent"></div>
                                <span className="text-xs">
                                    {layoutState.isTransitioning
                                        ? 'Switching Pairs...'
                                        : 'Optimizing Zoom...'}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                {/* Legend */}
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs">
                        <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
                        <span className="text-muted-foreground">Files</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                        <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded"></div>
                        <span className="text-muted-foreground">Imports</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                        <div className="w-3 h-3 bg-orange-100 border border-orange-500 rounded"></div>
                        <span className="text-muted-foreground">Functions</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                        <div className="w-3 h-3 bg-red-100 border-2 border-red-500 rounded"></div>
                        <span className="text-muted-foreground">Similar</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded border-dashed"></div>
                        <span className="text-muted-foreground">Calls</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                        <div className="w-3 h-3 bg-purple-100 border border-purple-500 rounded border-dashed"></div>
                        <span className="text-muted-foreground">Comments</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const VisualizationArea = {
    TopBar,
}
