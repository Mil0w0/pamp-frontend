# Système de Grilles de Notation

Ce module implémente un système complet de gestion des grilles de notation pour l'application de gestion de projets étudiants.

## 🏗️ Architecture

### Types (`src/types/grading.ts`)
- `GradingCriterion` : Critère de notation avec libellé, points max, poids
- `GradingResult` : Résultat de notation pour un critère donné
- `GradingGrid` : Grille complète avec critères et résultats
- `CreateGradingGridDto` / `UpdateGradingGridDto` : DTOs pour les opérations CRUD

### Services (`src/services/GradingService/`)
- `grading-api-client.ts` : Client API pour toutes les opérations CRUD
- Gestion des erreurs et authentification intégrées

### Utilitaires (`src/utils/gradingCalculations.ts`)
- Calculs de statistiques (moyenne, pourcentage, note pondérée)
- Validation de complétude des grilles et résultats
- Formatage des scores et pourcentages

### Hook personnalisé (`src/hooks/useGradingGrid.ts`)
- Gestion d'état centralisée pour les grilles
- Actions CRUD avec gestion d'erreurs
- Validation en temps réel

## 🧩 Composants

### `GradingGridForm`
**Usage** : Création et modification de grilles de notation

```tsx
import { GradingGridForm } from '@/components/GradingSystem'

<GradingGridForm
  projectId="project-123"
  gridId="grid-456" // Optionnel pour modification
  type="rapport" // Pour création
  targetId="group-789"
  onSave={(grid) => console.log('Grille sauvée', grid)}
  onCancel={() => console.log('Annulé')}
  readOnly={false}
/>
```

**Fonctionnalités** :
- ✅ Création/modification de grilles
- ✅ Gestion dynamique des critères
- ✅ Validation en temps réel
- ✅ Calcul automatique des statistiques
- ✅ Support des modes groupe/individuel

### `GradingForm`
**Usage** : Saisie et consultation des notes

```tsx
import { GradingForm } from '@/components/GradingSystem'

<GradingForm
  gridId="grid-456"
  targetGroupId="group-789" // OU targetStudentId
  onSave={(results, comment) => console.log('Notes sauvées')}
  readOnly={false}
/>
```

**Fonctionnalités** :
- ✅ Interface de notation intuitive
- ✅ Progression visuelle
- ✅ Commentaires par critère
- ✅ Validation automatique
- ✅ Calcul de note finale

### `GradingGridList`
**Usage** : Liste et gestion des grilles

```tsx
import { GradingGridList } from '@/components/GradingSystem'

<GradingGridList
  projectId="project-123"
  onCreateGrid={() => setShowCreate(true)}
  onEditGrid={(grid) => setSelectedGrid(grid)}
  onViewGrid={(grid) => setViewGrid(grid)}
  onDeleteGrid={(grid) => handleDelete(grid)}
/>
```

**Fonctionnalités** :
- ✅ Filtrage par type, statut, mode
- ✅ Recherche textuelle
- ✅ Actions contextuelles
- ✅ Statistiques par grille
- ✅ Interface responsive

### `GradingResults`
**Usage** : Consultation des résultats et statistiques

```tsx
import { GradingResults } from '@/components/GradingSystem'

<GradingResults
  projectId="project-123"
  onViewGrid={(grid) => setViewGrid(grid)}
  onExportResults={(grid) => exportToPDF(grid)}
/>
```

**Fonctionnalités** :
- ✅ Tableau de bord des résultats
- ✅ Statistiques globales
- ✅ Tri et filtrage avancés
- ✅ Indicateurs visuels de performance
- ✅ Export des données

## 🚀 Intégration

### Exemple d'intégration complète

```tsx
import React, { useState } from 'react'
import { 
  GradingSystemDemo,
  GradingGridForm,
  GradingForm 
} from '@/components/GradingSystem'

// Intégration complète avec démo
const ProjectPage = ({ projectId }: { projectId: string }) => {
  return (
    <GradingSystemDemo 
      projectId={projectId} 
      userRole="teacher" // ou "student"
    />
  )
}

// Intégration modulaire
const CustomGradingPage = ({ projectId }: { projectId: string }) => {
  const [selectedGrid, setSelectedGrid] = useState(null)
  
  return (
    <div>
      {/* Votre contenu existant */}
      
      <GradingGridForm
        projectId={projectId}
        onSave={(grid) => {
          console.log('Grille créée:', grid)
          // Redirection ou mise à jour d'état
        }}
      />
    </div>
  )
}
```

### Intégration dans le contexte projet

```tsx
// Dans ProjectContext ou page de projet
import { useGradingGrid } from '@/hooks/useGradingGrid'

const ProjectWithGrading = () => {
  const { grids, loading } = useGradingGrid({ projectId: 'project-123' })
  
  return (
    <div>
      <h2>Grilles de notation ({grids.length})</h2>
      {/* Intégrer les composants selon les besoins */}
    </div>
  )
}
```

## 🔧 Configuration API

Le système utilise les endpoints suivants :

```
GET    /projects/{projectId}/grading-scales
GET    /projects/{projectId}/grading-scales?type={type}&targetId={targetId}
GET    /grading-scales/{gridId}
POST   /grading-scales
PATCH  /grading-scales/{gridId}
POST   /grading-scales/{gridId}/results
POST   /grading-scales/{gridId}/validate
DELETE /grading-scales/{gridId}
```

### Backend Integration & Effective Criteria Notation

#### Saving Results with Proper Validation

```tsx
import { saveResults } from '@/services/GradingService/grading-api-client'

const results = [
  {
    gradingCriterionId: 'crit-1',
    targetGroupId: 'group-789',
    score: 15,
    comment: 'Excellent code quality'
  },
  // ... other criteria results
]

const generalComment = 'Overall assessment comments.'

try {
  const response = await saveResults('grid-456', results, generalComment)
  if (!response.success) {
    // Display backend error message
    alert('Error saving results: ' + (response.error?.message || 'Unknown error'))
    return
  }
  // Refresh grid to reflect changes
  await loadGrid('grid-456')
} catch (error) {
  console.error('Unexpected error:', error)
}
```

#### Backend Validation Logic

**Grid Existence Check:**
- Returns 404 if grading scale not found
- Validates grid accessibility

**Validation State Check:**
- Returns 403 (Forbidden) if grid is already validated
- Prevents modification of finalized grids

**Criteria Validation:**
- Returns 404 if any criterion ID doesn't exist
- Ensures all results reference valid criteria

**Data Type Validation:**
- Validates score ranges and data types
- Returns 400 for invalid payload structure

## 🎨 Personnalisation

### Thèmes et styles
Tous les composants utilisent le système de design existant :
- `@/components/ui/*` pour les composants de base
- Classes Tailwind pour le styling
- Support du mode sombre automatique

### Validation personnalisée
```tsx
import { validateGridCompleteness } from '@/utils/gradingCalculations'

const customValidation = (grid: GradingGrid) => {
  const baseValidation = validateGridCompleteness(grid)
  
  // Ajouter vos règles personnalisées
  const customRules = {
    // Exemple : minimum 3 critères
    hasMinimumCriteria: grid.criteria.length >= 3
  }
  
  return {
    ...baseValidation,
    customRules
  }
}
```

## 🔒 Sécurité et permissions

### Gestion des rôles
```tsx
// Exemple de gestion des permissions
const GradingWithPermissions = ({ userRole, projectId }) => {
  const canEdit = userRole === 'teacher'
  const canValidate = userRole === 'teacher'
  const canView = ['teacher', 'student'].includes(userRole)
  
  return (
    <GradingForm
      gridId="grid-123"
      readOnly={!canEdit}
      // Autres props selon permissions
    />
  )
}
```

### Validation côté client
- Validation des scores (0 ≤ score ≤ maxPoints)
- Validation des poids (> 0)
- Validation de complétude avant validation
- Sanitisation des entrées utilisateur

## 🔄 UI State Synchronization

### Grid State Management

```tsx
const { 
  grid, 
  loading, 
  saving, 
  error, 
  saveResults, 
  validateGrid, 
  loadGrid // Essential for refreshing state
} = useGradingGrid({ gridId })

// After any modification, refresh grid state
const handleSave = async () => {
  const response = await saveResults(gridId, results, comment)
  if (response.success) {
    await loadGrid(gridId) // Sync with backend state
  }
}

const handleValidate = async () => {
  await validateGrid(gridId)
  await loadGrid(gridId) // Update validation status
}
```

### Effective Criteria Notation Flow

1. **Criteria Scoring:** User inputs scores for each criterion
2. **Client Validation:** Check score ranges and required fields
3. **Backend Submission:** Send results via `POST /grading-scales/{id}/results`
4. **Server Validation:** Verify grid exists, not validated, criteria valid
5. **Database Update:** Save results and update grid state
6. **UI Refresh:** Reload grid to reflect changes
7. **Status Update:** Grid can be validated when complete

## 📊 Metrics and Statistics

The system automatically calculates:
- Total score and percentage
- Progress per criterion
- Group/individual statistics
- Comparisons and averages

```tsx
import { calculateGradingStats } from '@/utils/gradingCalculations'

const stats = calculateGradingStats(criteria, results)
// stats.totalScore, stats.maxScore, stats.percentage, stats.weightedScore
```

## 🧪 Tests

Pour tester les composants :

```tsx
// Exemple de test avec des données mockées
const mockGrid = {
  id: 'test-grid',
  projectId: 'test-project',
  title: 'Test Grid',
  type: 'rapport',
  // ... autres propriétés
}

<GradingGridForm
  projectId="test-project"
  // Props de test
/>
```

## 🚨 Error Handling & Status Management

### Frontend Error Handling

```tsx
import { getGradingErrorMessage } from '@/utils/errorHandling'

const handleSave = async () => {
  try {
    const saveResponse = await saveResults(gridId, results, generalComment)
    if (!saveResponse.success) {
      // Display backend error message
      alert('Error saving results: ' + (saveResponse.error?.message || 'Unknown error'))
      return
    }
    // Refresh grid state after successful save
    await loadGrid(gridId)
  } catch (error) {
    // Handle unexpected errors
    alert('Unexpected error: ' + (error instanceof Error ? error.message : String(error)))
    console.error('Save error:', error)
  }
}
```

### Backend Error Codes & Validation

**404 - Not Found:**
- Grading scale doesn't exist
- Referenced criterion not found
- Invalid grid or criterion IDs

**403 - Forbidden:**
- Attempting to modify validated grid
- Grid status is `isValidated: true`
- Cannot add/edit results on finalized grids

**400 - Bad Request:**
- Invalid payload structure
- Missing required fields
- Score out of range
- Invalid data types

**500 - Internal Server Error:**
- Database connection issues
- Unexpected server errors

### Grid Status Validation Process

```tsx
const handleValidate = async () => {
  try {
    await validateGrid(gridId)
    // Grid status changes to isValidated: true
    await loadGrid(gridId) // Refresh to show read-only state
    setShowValidation(true)
  } catch (error) {
    console.error('Validation error:', error)
  }
}
```

**Validation Effects:**
- Grid becomes read-only (`isValidated: true`)
- No further modifications allowed
- UI switches to view-only mode
- Validation timestamp recorded

## 📱 Responsive Design

Tous les composants sont optimisés pour :
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (320px - 767px)

## 🔄 Migration et mise à jour

Pour migrer depuis l'ancien système :
1. Importer les nouveaux composants
2. Remplacer les anciens composants de notation
3. Mettre à jour les appels API
4. Tester les fonctionnalités critiques

---

**Note** : Ce système est conçu pour être modulaire et extensible. Chaque composant peut être utilisé indépendamment selon vos besoins spécifiques.