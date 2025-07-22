import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertTriangle, ChevronDown, Eye, Loader2, Users } from 'lucide-react'
import { useSimilarityData } from './useSimilarityData'

interface SimilarityCellProps {
    submissionId?: string
}

export const SimilarityCell: React.FC<SimilarityCellProps> = ({
    submissionId,
}) => {
    const navigate = useNavigate()
    const {
        similarities,
        loading,
        error,
        highestSimilarityGroup,
        similarityGroups,
    } = useSimilarityData(submissionId)

    if (!submissionId) {
        return <span className="text-muted-foreground italic">N/A</span>
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                    Loading...
                </span>
            </div>
        )
    }

    if (error === 'calculating') {
        return (
            <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">
                    Similarity being calculated...
                </span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Error</span>
            </div>
        )
    }

    if (!similarities || similarities.length === 0) {
        return (
            <Badge variant="outline" className="text-xs">
                No similarities
            </Badge>
        )
    }

    // Find the highest similarity score
    const highestSimilarity = similarities.reduce((prev, current) =>
        current.overall_similarity > prev.overall_similarity ? current : prev
    )
    const similarityPercentage = (
        highestSimilarity.overall_similarity * 100
    ).toFixed(1)

    const handleViewSimilarity = () => {
        navigate(`/similarity/submission/${submissionId}`)
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Badge
                        variant={
                            highestSimilarity.overall_similarity > 0.7
                                ? 'destructive'
                                : highestSimilarity.overall_similarity > 0.3
                                  ? 'secondary'
                                  : 'outline'
                        }
                        className="text-xs"
                    >
                        {similarityPercentage}%
                    </Badge>
                    {highestSimilarityGroup && (
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {highestSimilarityGroup.name}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1">
                {similarities.length > 1 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="View all similarities"
                            >
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                All Similarities ({similarities.length})
                            </div>
                            <DropdownMenuSeparator />
                            {similarities
                                .sort(
                                    (a, b) =>
                                        b.overall_similarity -
                                        a.overall_similarity
                                )
                                .map((similarity) => {
                                    const group = similarityGroups?.get(
                                        similarity.similarity_id
                                    )
                                    return (
                                        <DropdownMenuItem
                                            key={similarity.similarity_id}
                                            className="flex items-center gap-2 cursor-default"
                                        >
                                            <Badge
                                                variant={
                                                    similarity.overall_similarity >
                                                    0.7
                                                        ? 'destructive'
                                                        : similarity.overall_similarity >
                                                            0.3
                                                          ? 'secondary'
                                                          : 'outline'
                                                }
                                                className="text-xs"
                                            >
                                                {(
                                                    similarity.overall_similarity *
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {group?.name ||
                                                        'Loading...'}
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleViewSimilarity}
                    title="View similarity details"
                >
                    <Eye className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}
