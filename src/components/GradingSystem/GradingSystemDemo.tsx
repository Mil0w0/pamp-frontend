import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import {
    validateGridCompleteness,
    validateResultsCompleteness,
} from '@/utils/gradingCalculations'

interface GradingSystemDemoProps {
    projectId: string
    userRole?: 'teacher' | 'student'
}

/**
 * Demo component showcasing the complete integration of the grading system
 * This component can serve as a reference for integration into project pages
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
        const validation = validateGridCompleteness(grid)
        if (!validation.isComplete) {
            console.error('Grid validation failed:', validation.missingFields)
            return
        }
        console.log('Grid saved:', grid)
        setRefreshKey((k) => k + 1)
        handleCloseDialogs()
    }

    const handleResultsSaved = (results: GradingResult[], comment?: string) => {
        if (selectedGrid) {
            const validation = validateResultsCompleteness(
                selectedGrid.criteria,
                results
            )
            if (!validation.isComplete) {
                console.error(
                    'Results validation failed:',
                    validation.missingCriteria
                )
                return
            }
        }
        console.log('Results saved:', results, comment)
        setRefreshKey((k) => k + 1)
        handleCloseDialogs()
    }

    const handleExportResults = (grid: GradingGrid) => {
        console.log('Export results for:', grid.title)
        // Here you could implement CSV/PDF export
    }

    const isTeacher = userRole === 'teacher'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Grading System</h1>
                    <p className="text-muted-foreground">
                        Manage grading grids and evaluations for this project
                    </p>
                </div>
                <Badge variant="outline">
                    {isTeacher ? 'Teacher' : 'Student'}
                </Badge>
            </div>

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                        value="grids"
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Grids
                    </TabsTrigger>
                    <TabsTrigger
                        value="grading"
                        className="flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Grading
                    </TabsTrigger>
                    <TabsTrigger
                        value="results"
                        className="flex items-center gap-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Results
                    </TabsTrigger>
                </TabsList>

                {/* Grid Management Tab */}
                <TabsContent value="grids" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            Grid Management
                        </h2>
                        {/* Le bouton 'New Grid' n'est affiché qu'ici */}
                        {isTeacher && (
                            <Button onClick={handleCreateGrid}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Grid
                            </Button>
                        )}
                    </div>
                    <GradingGridList
                        projectId={projectId}
                        // onCreateGrid retiré pour éviter le double affichage
                        onEditGrid={isTeacher ? handleEditGrid : undefined}
                        onViewGrid={handleViewGrid}
                        onDeleteGrid={
                            isTeacher
                                ? (grid) => console.log('Delete:', grid)
                                : undefined
                        }
                    />
                </TabsContent>

                {/* Grading Tab */}
                <TabsContent value="grading" className="space-y-4">
                    <h2 className="text-xl font-semibold">Grading Interface</h2>

                    {isTeacher ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Select a grid to grade</CardTitle>
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
                                    Student Access
                                </h3>
                                <p className="text-muted-foreground">
                                    Students can view their validated grades in
                                    the Results tab.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Results and Statistics
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

            {/* Dialog for creating/editing a grid */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="w-full max-w-none max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedGrid ? 'Edit Grid' : 'Create Grid'}
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

            {/* Dialog for grading/viewing */}
            <Dialog
                open={showGradingDialog}
                onOpenChange={setShowGradingDialog}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isTeacher ? 'Grade' : 'View'} -{' '}
                            {selectedGrid?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedGrid && (
                        <GradingForm
                            gridId={selectedGrid.id}
                            targetGroupId={selectedGrid.targetId} // Use actual target ID from grid
                            onSave={isTeacher ? handleResultsSaved : undefined}
                            readOnly={!isTeacher || selectedGrid.isValidated}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Example usage in a project page
export const ProjectGradingPage: React.FC<{ projectId: string }> = ({
    projectId,
}) => {
    return (
        <div className="container mx-auto p-6">
            <GradingSystemDemo
                projectId={projectId}
                userRole="teacher" // or "student" based on context
            />
        </div>
    )
}

// Example integration in an existing component
export const ProjectPageWithGrading: React.FC<{ projectId: string }> = ({
    projectId,
}) => {
    const [showGrading, setShowGrading] = useState(false)

    return (
        <div className="space-y-6">
            {/* Existing project page content */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Existing project content...</p>

                    <div className="mt-4">
                        <Button
                            onClick={() => setShowGrading(!showGrading)}
                            variant="outline"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {showGrading ? 'Hide' : 'Show'} Grading Grids
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Integrated grading system */}
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
