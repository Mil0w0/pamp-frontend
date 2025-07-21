import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Plus,
    FileText,
    Users,
    BarChart3,
    Settings,
    RefreshCw,
    Search,
} from 'lucide-react'
import { GradingGridForm } from '@/components/GradingSystem/GradingGridForm'
import { GradingGridList, FilterType, FilterStatus } from './GradingGridList'
import { GradingResults } from './GradingResults'
import { SwipeGradingInterface } from './SwipeGradingInterface'
import type { GradingGrid } from '@/types/grading'

interface GradingSystemDemoProps {
    projectId: string
    userRole?: 'teacher' | 'student'
}

export const GradingSystemDemo: React.FC<GradingSystemDemoProps> = ({
    projectId,
    userRole = 'teacher',
}) => {
    const [activeTab, setActiveTab] = useState('grids')
    const [selectedGrid, setSelectedGrid] = useState<GradingGrid | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showGradingDialog, setShowGradingDialog] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [sortBy, setSortBy] = useState<string>('date')
    const [searchTerm, setSearchTerm] = useState<string>('')

    const handleCreateGrid = () => {
        setSelectedGrid(null)
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

    const isTeacher = userRole === 'teacher'

    return (
        <div className="space-y-6">
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
                        Gradings
                    </TabsTrigger>
                    <TabsTrigger
                        value="results"
                        className="flex items-center gap-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Results
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="grids" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            Grid Management
                        </h2>
                        {isTeacher && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setRefreshKey((k) => k + 1)}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                                <Button onClick={handleCreateGrid}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Grid
                                </Button>
                            </div>
                        )}
                    </div>
                    <GradingGridList
                        key={refreshKey}
                        projectId={projectId}
                        onEditGrid={isTeacher ? handleEditGrid : undefined}
                        onViewGrid={handleViewGrid}
                        onDeleteGrid={
                            isTeacher
                                ? (grid) => console.log('Delete:', grid)
                                : undefined
                        }
                        onCreateGrid={isTeacher ? handleCreateGrid : undefined}
                        showFilters={false}
                        showOnlyDrafts={true}
                    />
                </TabsContent>
                <TabsContent value="grading" className="space-y-4">
                    {isTeacher ? (
                        <>
                            <div>
                                <h2 className="text-2xl font-bold">Gradings</h2>
                                <p className="text-muted-foreground">
                                    Grade validated grids for this project
                                </p>
                            </div>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search grading grids..."
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value
                                                    )
                                                }
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Select
                                                value={filterType}
                                                onValueChange={(value) =>
                                                    setFilterType(
                                                        value as FilterType
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All types
                                                    </SelectItem>
                                                    <SelectItem value="deliverable">
                                                        Deliverable
                                                    </SelectItem>
                                                    <SelectItem value="report">
                                                        Report
                                                    </SelectItem>
                                                    <SelectItem value="presentation">
                                                        Presentation
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={filterStatus}
                                                onValueChange={(value) =>
                                                    setFilterStatus(
                                                        value as FilterStatus
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All statuses
                                                    </SelectItem>
                                                    <SelectItem value="validated">
                                                        Validated
                                                    </SelectItem>
                                                    <SelectItem value="draft">
                                                        Drafts
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={sortBy}
                                                onValueChange={(value) =>
                                                    setSortBy(value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sort by" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="date">
                                                        Modification Date
                                                    </SelectItem>
                                                    <SelectItem value="title">
                                                        Title
                                                    </SelectItem>
                                                    <SelectItem value="type">
                                                        Type
                                                    </SelectItem>
                                                    <SelectItem value="average">
                                                        Average
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <GradingGridList
                                key={refreshKey}
                                projectId={projectId}
                                onViewGrid={handleGradeGrid}
                                showFilters={false}
                                showOnlyValidated={true}
                                externalFilterType={filterType}
                                externalFilterStatus={filterStatus}
                                externalSortBy={sortBy}
                                externalSearchTerm={searchTerm}
                            />
                        </>
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
                <TabsContent value="results" className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Results and Statistics
                    </h2>
                    <GradingResults
                        key={refreshKey}
                        projectId={projectId}
                        onViewGrid={handleViewGrid}
                    />
                </TabsContent>
            </Tabs>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="w-[90vw] min-w-[600px] max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedGrid
                                ? selectedGrid.isValidated
                                    ? 'View Grading Grid'
                                    : 'Edit Grid'
                                : 'Create Grid'}
                        </DialogTitle>
                    </DialogHeader>
                    <GradingGridForm
                        projectId={projectId}
                        gridId={selectedGrid?.id}
                        onSave={() => {
                            handleCloseDialogs()
                            setRefreshKey((k) => k + 1)
                        }}
                        onCancel={handleCloseDialogs}
                        readOnly={!isTeacher || selectedGrid?.isValidated}
                    />
                </DialogContent>
            </Dialog>
            <Dialog
                open={showGradingDialog}
                onOpenChange={setShowGradingDialog}
            >
                <DialogContent className="w-[90vw] max-w-5xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isTeacher ? 'Grade' : 'View'} -{' '}
                            {selectedGrid?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedGrid && (
                        <SwipeGradingInterface
                            gradingScale={selectedGrid}
                            targetGroupId={selectedGrid.targetId}
                            onGradingComplete={() => {
                                setRefreshKey((k) => k + 1)
                                handleCloseDialogs()
                            }}
                            onCancel={handleCloseDialogs}
                            readOnly={!isTeacher || selectedGrid.isValidated}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export const ProjectGradingPage: React.FC<{ projectId: string }> = ({
    projectId,
}) => {
    return (
        <div className="container mx-auto p-6">
            <GradingSystemDemo projectId={projectId} userRole="teacher" />
        </div>
    )
}

export const ProjectPageWithGrading: React.FC<{ projectId: string }> = ({
    projectId,
}) => {
    const [showGrading, setShowGrading] = useState(false)
    return (
        <div className="space-y-6">
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
