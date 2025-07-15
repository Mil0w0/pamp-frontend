import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Save, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { useGradingGrid } from '@/hooks/useGradingGrid'
import { GradingResult, GradingCriterion } from '@/types/grading'
import { PROJECT_API_URL } from '../../services/ProjectService/project-api-client'
import {
    formatScore,
    formatPercentage,
    calculateFinalGrade,
} from '@/utils/gradingCalculations'
import { ErrorDisplay } from '@/components/ui/error-display'
import { useSwipeable } from 'react-swipeable'

interface GradingFormProps {
    gridId: string
    targetGroupId?: string
    targetStudentId?: string
    onSave?: (results: GradingResult[], generalComment?: string) => void
    readOnly?: boolean
}

export const GradingForm: React.FC<GradingFormProps> = ({
    gridId,
    targetGroupId,
    targetStudentId,
    onSave,
    readOnly = false,
}) => {
    const {
        grid,
        loading,
        saving,
        error,
        saveResults,
        validateGrid,
        clearError,
        isResultsComplete,
        canValidate,
        missingCriteria,
        loadGrid, // Ajout de loadGrid pour rafraîchir la grille
    } = useGradingGrid({ gridId })

    const [results, setResults] = useState<Record<string, GradingResult>>({})
    const [generalComment, setGeneralComment] = useState('')
    const [showValidation, setShowValidation] = useState(false)
    const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0)

    // Initialiser les résultats avec les données existantes
    useEffect(() => {
        if (grid?.results) {
            const resultMap: Record<string, GradingResult> = {}
            grid.results.forEach((result) => {
                if (
                    (targetGroupId && result.targetGroupId === targetGroupId) ||
                    (targetStudentId &&
                        result.targetStudentId === targetStudentId)
                ) {
                    resultMap[result.gradingCriterionId] = result
                }
            })
            setResults(resultMap)
            setGeneralComment(grid.generalComment || '')
        }
    }, [grid, targetGroupId, targetStudentId])

    const handleScoreChange = (criterion: GradingCriterion, score: number) => {
        if (score < 0 || score > criterion.maxPoints) return

        const result: GradingResult = {
            gradingCriterionId: criterion.id,
            targetGroupId,
            targetStudentId,
            score,
            comment: results[criterion.id]?.comment || '',
        }

        setResults((prev) => ({
            ...prev,
            [criterion.id]: result,
        }))
    }

    const handleCommentChange = (criterionId: string, comment: string) => {
        setResults((prev) => ({
            ...prev,
            [criterionId]: {
                ...prev[criterionId],
                comment,
            },
        }))
    }

    const handleSave = async () => {
        if (!grid) return

        console.log('=== DÉBUT SAUVEGARDE ===')
        console.log('Grille actuelle:', grid)
        console.log('Résultats actuels:', results)
        console.log('Commentaire général:', generalComment)

        // Validation: ensure title, notationMode, and criteria are defined and valid
        if (
            !grid.title ||
            !grid.notationMode ||
            !Array.isArray(grid.criteria) ||
            grid.criteria.length === 0
        ) {
            alert(
                'Erreur : la grille de notation est incomplète (titre, mode ou critères manquants).'
            )
            return
        }
        // Filter criteria to ensure all required fields are present
        const validCriteria = grid.criteria.filter(
            (c) =>
                c &&
                c.id &&
                c.label &&
                typeof c.maxPoints === 'number' &&
                typeof c.weight === 'number' &&
                typeof c.commentEnabled === 'boolean'
        )
        
        console.log('Critères valides:', validCriteria)
        
        if (validCriteria.length !== grid.criteria.length) {
            alert('Erreur : certains critères sont invalides ou incomplets.')
            return
        }

        const resultsList = Object.values(results).filter(
            (result) => result.score !== undefined && result.score >= 0
        )

        console.log('Liste des résultats à sauvegarder:', resultsList)

        try {
            // Vérifier la structure des résultats selon le DTO attendu
            // Chaque résultat doit contenir les informations de target
            const formattedResults = resultsList.map(result => ({
                gradingCriterionId: result.gradingCriterionId,
                targetGroupId: targetGroupId || undefined,
                targetStudentId: targetStudentId || undefined,
                score: result.score,
                comment: result.comment || ''
            }))

            console.log('Résultats formatés pour l\'API:', formattedResults)

            // Préparer le payload - seulement results et generalComment
            const payload = {
                results: formattedResults,
                generalComment: generalComment || undefined
            }

            console.log('Payload final à envoyer:', payload)
            console.log('Endpoint utilisé:', `grading-scales/${grid.id}/results`)

            // Met à jour la grille dans la BDD (exemple: titre, critères, etc.)
            await updateGrid(grid.id, {
                title: grid.title,
                notationMode: grid.notationMode,
                criteria: validCriteria,
            })

            // Vérifier si la mise à jour de la grille a échoué
            if (error) {
                console.error('Erreur lors de la mise à jour de la grille:', error)
                alert(
                    'Erreur lors de la mise à jour de la grille: ' +
                        error.message
                )
                return
            }

            console.log('Grille mise à jour avec succès, sauvegarde des résultats...')

            // Sauvegarder les résultats
            await saveResults(grid.id, formattedResults, generalComment)

            // Vérifier si la sauvegarde a échoué
            if (error) {
                console.error('Erreur lors de la sauvegarde des résultats:', error)
                alert('Erreur lors de la sauvegarde des résultats: ' + error.message)
                return
            }

            console.log('Résultats sauvegardés avec succès!')

            // Rafraîchir la grille après sauvegarde
            await loadGrid(grid.id)

            if (onSave) {
                onSave(resultsList, generalComment)
            }

            console.log('=== FIN SAUVEGARDE ===')
        } catch (err) {
            // Gestion d'erreur générique
            console.error('Erreur inattendue lors de la sauvegarde:', err)
            alert(
                'Erreur inattendue lors de la sauvegarde: ' +
                    (err instanceof Error ? err.message : String(err))
            )
        }
    }

    const handleValidate = async () => {
        if (!grid || !canValidate) {
            if (!canValidate) {
                alert(
                    'La grille ne peut pas être validée. Veuillez vérifier que tous les critères sont notés.'
                )
            }
            return
        }

        try {
            await validateGrid(grid.id)

            // Vérifier si la validation a échoué
            if (error) {
                alert('Erreur lors de la validation: ' + error.message)
                return
            }

            await loadGrid(grid.id) // Rafraîchir la grille après validation
            setShowValidation(true)
        } catch (err) {
            console.error('Erreur lors de la validation:', err)
            alert(
                'Erreur inattendue lors de la validation: ' +
                    (err instanceof Error ? err.message : String(err))
            )
        }
    }

    const calculateCurrentStats = () => {
        if (!grid) return null

        const currentResults = Object.values(results).filter(
            (r) => r.score !== undefined
        )
        return {
            totalScore: currentResults.reduce((sum, r) => sum + r.score, 0),
            maxScore: Array.isArray(grid.criteria)
                ? grid.criteria.reduce((sum, c) => {
                      const hasResult = results[c.id]?.score !== undefined
                      return sum + (hasResult ? c.maxPoints : 0)
                  }, 0)
                : 0,
            completedCriteria: currentResults.length,
            totalCriteria: Array.isArray(grid.criteria)
                ? grid.criteria.length
                : 0,
        }
    }

    const currentStats = calculateCurrentStats()
    const finalGrade =
        grid && Object.keys(results).length > 0
            ? calculateFinalGrade(grid.criteria, Object.values(results))
            : 0

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Chargement...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!grid) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Grille de notation non trouvée.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            {error && (
                <ErrorDisplay
                    error={error}
                    onRetry={() => window.location.reload()}
                    onDismiss={clearError}
                />
            )}

            {showValidation && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        La grille a été validée avec succès !
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{grid.title}</span>
                        <div className="flex items-center gap-2">
                            {grid.isValidated && (
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    <CheckCircle className="h-3 w-3" />
                                    Validée
                                </Badge>
                            )}
                            {readOnly && (
                                <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                >
                                    <Eye className="h-3 w-3" />
                                    Lecture seule
                                </Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Progression */}
                    {currentStats && (
                        <div className="mb-6 p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                    Progression
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {currentStats.completedCriteria}/
                                    {currentStats.totalCriteria} critères
                                </span>
                            </div>
                            <Progress
                                value={
                                    (currentStats.completedCriteria /
                                        currentStats.totalCriteria) *
                                    100
                                }
                                className="mb-3"
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">
                                        Score actuel:
                                    </span>
                                    <div className="font-medium">
                                        {formatScore(
                                            currentStats.totalScore,
                                            currentStats.maxScore
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Pourcentage:
                                    </span>
                                    <div className="font-medium">
                                        {currentStats.maxScore > 0
                                            ? formatPercentage(
                                                  (currentStats.totalScore /
                                                      currentStats.maxScore) *
                                                      100
                                              )
                                            : '0%'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Note sur 20:
                                    </span>
                                    <div className="font-medium">
                                        {finalGrade.toFixed(1)}/20
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Statut:
                                    </span>
                                    <div className="font-medium">
                                        {isResultsComplete ? (
                                            <span className="text-green-600">
                                                Complet
                                            </span>
                                        ) : (
                                            <span className="text-orange-600">
                                                En cours
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Critère de notation unique avec navigation */}
                    <div className="flex items-center justify-center mb-4">
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setCurrentCriterionIndex((i) =>
                                    Math.max(i - 1, 0)
                                )
                            }
                            disabled={currentCriterionIndex === 0}
                        >
                            ◀
                        </Button>
                        <span className="mx-2 text-sm">
                            Critère {currentCriterionIndex + 1} /{' '}
                            {grid.criteria.length}
                        </span>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setCurrentCriterionIndex((i) =>
                                    Math.min(i + 1, grid.criteria.length - 1)
                                )
                            }
                            disabled={
                                currentCriterionIndex ===
                                grid.criteria.length - 1
                            }
                        >
                            ▶
                        </Button>
                    </div>
                    <div className="relative h-[260px] overflow-hidden">
                        <div
                            className="absolute w-full transition-transform duration-500"
                            style={{
                                transform: `translateX(-${currentCriterionIndex * 100}%)`,
                                display: 'flex',
                                height: '100%',
                            }}
                        >
                            {grid.criteria.map((criterion, index) => {
                                const result = results[criterion.id]
                                const score = result?.score ?? ''
                                const comment = result?.comment ?? ''
                                return (
                                    <div
                                        key={criterion.id}
                                        style={{
                                            minWidth: '100%',
                                            height: '100%',
                                        }}
                                    >
                                        <GradingCriterionSwipe
                                            criterion={criterion}
                                            index={index}
                                            score={score}
                                            comment={comment}
                                            handleScoreChange={
                                                handleScoreChange
                                            }
                                            handleCommentChange={
                                                handleCommentChange
                                            }
                                            readOnly={readOnly}
                                            isValidated={grid.isValidated}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Commentaire général */}
                    <div className="mt-6 space-y-2">
                        <Label htmlFor="generalComment">
                            Commentaire général
                        </Label>
                        <Textarea
                            id="generalComment"
                            value={generalComment}
                            onChange={(e) => setGeneralComment(e.target.value)}
                            placeholder="Commentaire général sur l'évaluation..."
                            disabled={readOnly || grid.isValidated}
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Validation */}
            {!isResultsComplete && missingCriteria.length > 0 && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Ungraded criteria:</strong>{' '}
                        {missingCriteria.join(', ')}
                    </AlertDescription>
                </Alert>
            )}

            {/* Actions */}
            {!readOnly && !grid.isValidated && (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={saving || Object.keys(results).length === 0}
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Sauvegarder
                    </Button>

                    {canValidate && (
                        <Button
                            onClick={handleValidate}
                            disabled={saving || !isResultsComplete}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider la notation
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

// Child component for a single criterion with swipe
const GradingCriterionSwipe: React.FC<{
    criterion: GradingCriterion
    index: number
    score: number | ''
    comment: string
    handleScoreChange: (criterion: GradingCriterion, score: number) => void
    handleCommentChange: (criterionId: string, comment: string) => void
    readOnly: boolean
    isValidated: boolean
}> = ({
    criterion,
    index,
    score,
    comment,
    handleScoreChange,
    handleCommentChange,
    readOnly,
    isValidated,
}) => {
    const [swipeAnim, setSwipeAnim] = React.useState('')
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (!readOnly && !isValidated) {
                setSwipeAnim('animate-swipe-left')
                handleScoreChange(criterion, 0)
                setTimeout(() => setSwipeAnim(''), 400)
            }
        },
        onSwipedRight: () => {
            if (!readOnly && !isValidated) {
                setSwipeAnim('animate-swipe-right')
                handleScoreChange(criterion, criterion.maxPoints)
                setTimeout(() => setSwipeAnim(''), 400)
            }
        },
        trackMouse: true,
    })
    return (
        <div
            key={criterion.id}
            {...swipeHandlers}
            className={swipeAnim}
            style={{ cursor: 'pointer' }}
        >
            <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                            {index + 1}. {criterion.label}
                        </CardTitle>
                        <Badge variant="outline">
                            Poids: {criterion.weight}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={`score-${criterion.id}`}>
                                Note (sur {criterion.maxPoints})
                            </Label>
                            <Input
                                id={`score-${criterion.id}`}
                                type="number"
                                min="0"
                                max={criterion.maxPoints}
                                step="0.5"
                                value={score}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value)
                                    if (!isNaN(value)) {
                                        handleScoreChange(criterion, value)
                                    }
                                }}
                                placeholder={`0 - ${criterion.maxPoints}`}
                                disabled={readOnly || isValidated}
                                className={
                                    score !== undefined && score !== 0
                                        ? 'border-green-500'
                                        : ''
                                }
                            />
                        </div>
                        {criterion.commentEnabled && (
                            <div className="space-y-2">
                                <Label htmlFor={`comment-${criterion.id}`}>
                                    Commentaire
                                </Label>
                                <Textarea
                                    id={`comment-${criterion.id}`}
                                    value={comment}
                                    onChange={(e) =>
                                        handleCommentChange(
                                            criterion.id,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Commentaire optionnel..."
                                    disabled={readOnly || isValidated}
                                    rows={2}
                                />
                            </div>
                        )}
                    </div>
                    {score !== undefined && score !== 0 && (
                        <div className="text-sm text-muted-foreground">
                            Pourcentage:{' '}
                            {formatPercentage(
                                (Number(score) / criterion.maxPoints) * 100
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

async function updateGrid(
    id: string,
    gridData: {
        title: string
        notationMode: 'groupe' | 'individuel'
        criteria: GradingCriterion[]
    }
) {
    try {
        const response = await fetch(
            `${PROJECT_API_URL}/grading-scales/${id}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(gridData),
            }
        )

        if (!response.ok) {
            throw new Error(`Failed to update grid: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('Error updating grid:', error)
        throw error
    }
}
// Ajoute les animations swipe dans le CSS global (par exemple dans index.css ou un fichier global)
/*
.animate-swipe-left {
  animation: swipeLeft 0.4s cubic-bezier(0.4,0,0.2,1);
}
.animate-swipe-right {
  animation: swipeRight 0.4s cubic-bezier(0.4,0,0.2,1);
}
@keyframes swipeLeft {
  0% { transform: translateX(0); }
  80% { transform: translateX(-40px) scale(0.98); }
  100% { transform: translateX(0); }
}
@keyframes swipeRight {
  0% { transform: translateX(0); }
  80% { transform: translateX(40px) scale(0.98); }
  100% { transform: translateX(0); }
}
*/
