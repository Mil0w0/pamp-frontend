import { useEffect } from 'react'
import { SubmissionSimilarity } from '../types'

interface UseKeyboardNavigationProps {
    similarities: SubmissionSimilarity[]
    currentSimilarityId: string | null
    selectedPairIndex: number
    totalFilePairs: number
    onSimilarityChange: (similarityId: string) => void
    onPairChange: (index: number) => void
    isEnabled?: boolean
}

export const useKeyboardNavigation = ({
    similarities,
    currentSimilarityId,
    selectedPairIndex,
    totalFilePairs,
    onSimilarityChange,
    onPairChange,
    isEnabled = true,
}: UseKeyboardNavigationProps) => {
    useEffect(() => {
        if (!isEnabled) return

        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle keyboard navigation if no input elements are focused
            const focusedElement = document.activeElement
            if (
                focusedElement &&
                (focusedElement.tagName === 'INPUT' ||
                    focusedElement.tagName === 'TEXTAREA' ||
                    focusedElement.tagName === 'SELECT' ||
                    (focusedElement as HTMLElement).contentEditable === 'true')
            ) {
                return
            }

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault()
                    // Switch to previous similarity
                    if (similarities.length > 1 && currentSimilarityId) {
                        const currentIndex = similarities.findIndex(
                            (s) => s.similarity_id === currentSimilarityId
                        )
                        if (currentIndex > 0) {
                            const previousSimilarity =
                                similarities[currentIndex - 1]
                            onSimilarityChange(previousSimilarity.similarity_id)
                            console.log(
                                'Keyboard navigation: Previous similarity'
                            )
                        } else if (currentIndex === 0) {
                            // Wrap to last similarity
                            const lastSimilarity =
                                similarities[similarities.length - 1]
                            onSimilarityChange(lastSimilarity.similarity_id)
                            console.log(
                                'Keyboard navigation: Wrapped to last similarity'
                            )
                        }
                    }
                    break

                case 'ArrowRight':
                    event.preventDefault()
                    // Switch to next similarity
                    if (similarities.length > 1 && currentSimilarityId) {
                        const currentIndex = similarities.findIndex(
                            (s) => s.similarity_id === currentSimilarityId
                        )
                        if (
                            currentIndex >= 0 &&
                            currentIndex < similarities.length - 1
                        ) {
                            const nextSimilarity =
                                similarities[currentIndex + 1]
                            onSimilarityChange(nextSimilarity.similarity_id)
                            console.log('Keyboard navigation: Next similarity')
                        } else if (currentIndex === similarities.length - 1) {
                            // Wrap to first similarity
                            const firstSimilarity = similarities[0]
                            onSimilarityChange(firstSimilarity.similarity_id)
                            console.log(
                                'Keyboard navigation: Wrapped to first similarity'
                            )
                        }
                    }
                    break

                case 'ArrowUp':
                    event.preventDefault()
                    // Switch to previous file pair
                    if (totalFilePairs > 1) {
                        const newIndex =
                            selectedPairIndex > 0
                                ? selectedPairIndex - 1
                                : totalFilePairs - 1 // Wrap to last
                        onPairChange(newIndex)
                        console.log('Keyboard navigation: Previous file pair')
                    }
                    break

                case 'ArrowDown':
                    event.preventDefault()
                    // Switch to next file pair
                    if (totalFilePairs > 1) {
                        const newIndex =
                            selectedPairIndex < totalFilePairs - 1
                                ? selectedPairIndex + 1
                                : 0 // Wrap to first
                        onPairChange(newIndex)
                        console.log('Keyboard navigation: Next file pair')
                    }
                    break

                default:
                    // Do nothing for other keys
                    break
            }
        }

        // Add event listener
        document.addEventListener('keydown', handleKeyDown)

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [
        similarities,
        currentSimilarityId,
        selectedPairIndex,
        totalFilePairs,
        onSimilarityChange,
        onPairChange,
        isEnabled,
    ])

    // Return navigation info for UI feedback
    return {
        canNavigateSimilarities: similarities.length > 1,
        canNavigateFilePairs: totalFilePairs > 1,
        currentSimilarityIndex: currentSimilarityId
            ? similarities.findIndex(
                  (s) => s.similarity_id === currentSimilarityId
              )
            : -1,
        totalSimilarities: similarities.length,
    }
}
