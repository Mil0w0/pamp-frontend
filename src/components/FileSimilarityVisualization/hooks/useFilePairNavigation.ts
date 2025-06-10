import { useState, useCallback, useEffect, useRef } from 'react'
import { Node, Edge } from 'reactflow'
import { FilePair } from '../types'

interface UseFilePairNavigationProps {
    filePairs: FilePair[]
    processNodes: (nodes: Node[], edges: Edge[]) => Promise<Node[]>
    processEdges: (edges: Edge[]) => Edge[]
    onNodesChange: (nodes: Node[]) => void
    onEdgesChange: (edges: Edge[]) => void
    setLayoutState: (updater: (prev: any) => any) => void
}

export const useFilePairNavigation = ({
    filePairs,
    processNodes,
    processEdges,
    onNodesChange,
    onEdgesChange,
    setLayoutState,
}: UseFilePairNavigationProps) => {
    const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0)
    
    // Store stable references to prevent dependency issues
    const processNodesRef = useRef(processNodes)
    const processEdgesRef = useRef(processEdges)
    const onNodesChangeRef = useRef(onNodesChange)
    const onEdgesChangeRef = useRef(onEdgesChange)
    const setLayoutStateRef = useRef(setLayoutState)
    
    // Update refs when values change
    processNodesRef.current = processNodes
    processEdgesRef.current = processEdges
    onNodesChangeRef.current = onNodesChange
    onEdgesChangeRef.current = onEdgesChange
    setLayoutStateRef.current = setLayoutState

    const handlePairChange = useCallback(async (index: number) => {
        console.log('Changing to pair index:', index)
        if (filePairs && filePairs[index] && index !== selectedPairIndex) {
            console.log('Valid pair found, updating state...')
            setLayoutStateRef.current((prev: any) => ({ ...prev, isTransitioning: true }))
            setSelectedPairIndex(index)
            const selectedPair = filePairs[index]

            console.log('Selected pair info:', {
                calculator_file: selectedPair.file_pair?.calculator_file,
                game_file: selectedPair.file_pair?.game_file,
                nodes_count: selectedPair.react_flow?.nodes?.length,
                edges_count: selectedPair.react_flow?.edges?.length,
            })

            try {
                const processedNodes = await processNodesRef.current(
                    selectedPair.react_flow.nodes || [],
                    selectedPair.react_flow.edges || []
                )
                onNodesChangeRef.current(processedNodes)
                
                // Process edges before setting them
                const processedEdges = processEdgesRef.current(
                    selectedPair.react_flow.edges || []
                )
                onEdgesChangeRef.current(processedEdges)

                console.log('Pair change completed')
            } catch (error) {
                console.error('Error during pair change:', error)
            } finally {
                setLayoutStateRef.current((prev: any) => ({ ...prev, isTransitioning: false }))
            }
        } else {
            console.log('Invalid pair index or no data available')
        }
    }, [filePairs, selectedPairIndex]) // Remove function dependencies

    // Navigation helper functions
    const goToPreviousPair = useCallback(() => {
        if (filePairs && selectedPairIndex > 0) {
            handlePairChange(selectedPairIndex - 1)
        }
    }, [filePairs, selectedPairIndex, handlePairChange])

    const goToNextPair = useCallback(() => {
        if (filePairs && selectedPairIndex < filePairs.length - 1) {
            handlePairChange(selectedPairIndex + 1)
        }
    }, [filePairs, selectedPairIndex, handlePairChange])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle if not focused on input elements
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return
            }

            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault()
                    goToPreviousPair()
                    break
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault()
                    goToNextPair()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goToPreviousPair, goToNextPair])

    return {
        selectedPairIndex,
        handlePairChange,
        goToPreviousPair,
        goToNextPair,
    }
} 