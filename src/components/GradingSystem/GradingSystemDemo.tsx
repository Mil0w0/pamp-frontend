import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Plus, FileText, Users, BarChart3, Settings } from 'lucide-react'
import {
    GradingGridForm,
    GradingForm,
    GradingGridList,
    GradingResults,
    GradingGrid,
    GradingResult,
} from './index'

interface GradingSystemDemoProps {
    projectId: string
    userRole?: 'teacher' | 'student'
}

/**
 * Composant de démonstration montrant l'intégration complète du système de notation
 * Ce composant peut servir de référence pour l'intégration dans les pages de projet
 */
export const GradingSystemDemo: React.FC<GradingSystemDemoProps> = ({
    projectId,
    userRole = 'teacher',
}) => {
    const [activeTab, setActiveTab] = useState('grids')
    const [selectedGrid, setSelectedGrid] = useState<GradingGrid | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showGradingDialog, setShowGradingDialog] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleCreateGrid = () => {
        setShowCreateDialog(true)
    }

    const handleEditGrid = (grid: GradingGrid) => {
        setSelectedGrid(grid)
        setShowCreateDialog(true)
    }

    const handleViewGrid = (grid: GradingGrid) => {
        setSelectedGrid(grid)
        setShowGradingDialog(true)
    }

    const handleGradeGrid = (grid: GradingGrid) => {
        setSelectedGrid(grid)
        setShowGradingDialog(true)
    }

    const handleCloseDialogs = () => {
        setShowCreateDialog(false)
        setShowGradingDialog(false)
        setSelectedGrid(null)
    }

    const handleGridSaved = (grid: GradingGrid) => {
        console.log('Grille sauvegardée:', grid)
        setRefreshKey((k) => k + 1)
        handleCloseDialogs()
    }

    const handleResultsSaved = (results: GradingResult[], comment?: string) => {
        console.log('Résultats sauvegardés:', results, comment)
        setRefreshKey((k) => k + 1)
        handleCloseDialogs()
    }

    const handleExportResults = (grid: GradingGrid) => {
        console.log('Export des résultats pour:', grid.title)
        // Ici vous pourriez implémenter l'export en CSV/PDF
    }

    const isTeacher = userRole === 'teacher'

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Système de notation</h1>
                    <p className="text-muted-foreground">
                        Gérez les grilles de notation et les évaluations pour ce
                        projet
                    </p>
                </div>
                <Badge variant="outline">
                    {isTeacher ? 'Enseignant' : 'Étudiant'}
                </Badge>
            </div>

            {/* Navigation par onglets */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                        value="grids"
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Grilles
                    </TabsTrigger>
                    <TabsTrigger
                        value="grading"
                        className="flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Notation
                    </TabsTrigger>
                    <TabsTrigger
                        value="results"
                        className="flex items-center gap-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Résultats
                    </TabsTrigger>
                </TabsList>

                {/* Onglet Gestion des grilles */}
                <TabsContent value="grids" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            Gestion des grilles
                        </h2>
                        {isTeacher && (
                            <Button onClick={handleCreateGrid}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nouvelle grille
                            </Button>
                        )}
                    </div>

                    <GradingGridList
                        projectId={projectId}
                        onCreateGrid={isTeacher ? handleCreateGrid : undefined}
                        onEditGrid={isTeacher ? handleEditGrid : undefined}
                        onViewGrid={handleViewGrid}
                        onDeleteGrid={
                            isTeacher
                                ? (grid) => console.log('Supprimer:', grid)
                                : undefined
                        }
                    />
                </TabsContent>

                {/* Onglet Notation */}
                <TabsContent value="grading" className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Interface de notation
                    </h2>

                    {isTeacher ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Sélectionner une grille pour noter
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <GradingGridList
                                    key={refreshKey}
                                    projectId={projectId}
                                    onViewGrid={handleGradeGrid}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                    Accès étudiant
                                </h3>
                                <p className="text-muted-foreground">
                                    Les étudiants peuvent consulter leurs notes
                                    validées dans l'onglet Résultats.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Onglet Résultats */}
                <TabsContent value="results" className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Résultats et statistiques
                    </h2>

                    <GradingResults
                        key={refreshKey}
                        projectId={projectId}
                        onViewGrid={handleViewGrid}
                        onExportResults={
                            isTeacher ? handleExportResults : undefined
                        }
                    />
                </TabsContent>
            </Tabs>

            {/* Dialog pour créer/modifier une grille */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="w-full max-w-none max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedGrid
                                ? 'Modifier la grille'
                                : 'Créer une grille'}
                        </DialogTitle>
                    </DialogHeader>
                    <GradingGridForm
                        projectId={projectId}
                        gridId={selectedGrid?.id}
                        onSave={handleGridSaved}
                        onCancel={handleCloseDialogs}
                        readOnly={!isTeacher}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog pour noter/consulter */}
            <Dialog
                open={showGradingDialog}
                onOpenChange={setShowGradingDialog}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isTeacher ? 'Noter' : 'Consulter'} -{' '}
                            {selectedGrid?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedGrid && (
                        <GradingForm
                            gridId={selectedGrid.id}
                            targetGroupId="example-group-id" // À remplacer par l'ID réel
                            onSave={isTeacher ? handleResultsSaved : undefined}
                            readOnly={!isTeacher || selectedGrid.isValidated}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Exemple d'utilisation dans une page de projet
export const ProjectGradingPage: React.FC<{ projectId: string }> = ({
    projectId,
}) => {
    return (
        <div className="container mx-auto p-6">
            <GradingSystemDemo
                projectId={projectId}
                userRole="teacher" // ou "student" selon le contexte
            />
        </div>
    )
}

// Exemple d'intégration dans un composant existant
export const ProjectPageWithGrading: React.FC<{ projectId: string }> = ({
    projectId,
}) => {
    const [showGrading, setShowGrading] = useState(false)

    return (
        <div className="space-y-6">
            {/* Contenu existant de la page projet */}
            <Card>
                <CardHeader>
                    <CardTitle>Informations du projet</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Contenu existant du projet...</p>

                    <div className="mt-4">
                        <Button
                            onClick={() => setShowGrading(!showGrading)}
                            variant="outline"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {showGrading ? 'Masquer' : 'Afficher'} les grilles
                            de notation
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Système de notation intégré */}
            {showGrading && (
                <Card>
                    <CardContent className="p-6">
                        <GradingSystemDemo projectId={projectId} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
