// Utilities for error handling in the application
export interface ErrorInfo {
    title: string
    message: string
    type: 'network' | 'validation' | 'permission' | 'server' | 'unknown'
    actionable?: boolean
    retryable?: boolean
}

// Cache to avoid re-analyzing the same errors
const errorAnalysisCache = new Map<string, ErrorInfo>()

/**
 * Analyse une erreur et retourne des informations structurées
 */
export const analyzeError = (error: string | Error): ErrorInfo => {
    const errorMessage = typeof error === 'string' ? error : error.message

    // Vérifier le cache d'abord
    const cached = errorAnalysisCache.get(errorMessage)
    if (cached) {
        return cached
    }

    const lowerError = errorMessage.toLowerCase()
    let result: ErrorInfo

    // Erreurs réseau
    if (
        lowerError.includes('fetch') ||
        lowerError.includes('network') ||
        lowerError.includes('connection') ||
        lowerError.includes('cannot get') ||
        lowerError.includes('timeout')
    ) {
        result = {
            title: 'Problème de connexion',
            message:
                'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.',
            type: 'network',
            actionable: true,
            retryable: true,
        }
    }

    // Erreurs d'authentification
    else if (
        lowerError.includes('unauthorized') ||
        lowerError.includes('401') ||
        lowerError.includes('authentication')
    ) {
        result = {
            title: 'Accès non autorisé',
            message: 'Votre session a expiré. Veuillez vous reconnecter.',
            type: 'permission',
            actionable: true,
            retryable: false,
        }
    }

    // Erreurs de permissions
    else if (
        lowerError.includes('forbidden') ||
        lowerError.includes('403') ||
        lowerError.includes('permission')
    ) {
        result = {
            title: 'Accès refusé',
            message:
                "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
            type: 'permission',
            actionable: false,
            retryable: false,
        }
    }

    // Erreurs de validation
    else if (
        lowerError.includes('validation') ||
        lowerError.includes('invalid') ||
        lowerError.includes('required') ||
        lowerError.includes('400')
    ) {
        result = {
            title: 'Données invalides',
            message:
                'Les informations saisies ne sont pas valides. Veuillez vérifier et corriger.',
            type: 'validation',
            actionable: true,
            retryable: false,
        }
    }

    // Erreurs serveur
    else if (
        lowerError.includes('500') ||
        lowerError.includes('server error') ||
        lowerError.includes('internal')
    ) {
        result = {
            title: 'Erreur serveur',
            message:
                "Une erreur s'est produite sur le serveur. Veuillez réessayer plus tard.",
            type: 'server',
            actionable: true,
            retryable: true,
        }
    }

    // Erreurs de ressource non trouvée
    else if (lowerError.includes('404') || lowerError.includes('not found')) {
        result = {
            title: 'Ressource introuvable',
            message: "L'élément demandé n'existe pas ou a été supprimé.",
            type: 'server',
            actionable: false,
            retryable: false,
        }
    }

    // Erreur générique
    result = {
        title: "Une erreur s'est produite",
        message:
            errorMessage ||
            "Une erreur inattendue s'est produite. Veuillez réessayer.",
        type: 'unknown',
        actionable: true,
        retryable: true,
    }

    // Mettre en cache le résultat (limiter la taille du cache)
    if (errorAnalysisCache.size >= 100) {
        const firstKey = errorAnalysisCache.keys().next().value
        if (firstKey) {
            errorAnalysisCache.delete(firstKey)
        }
    }
    errorAnalysisCache.set(errorMessage, result)

    return result
}

/**
 * Génère un message d'erreur convivial pour les grilles de notation
 */
export const getGradingErrorMessage = (
    error: string | Error,
    context?: string
): ErrorInfo => {
    const baseError = analyzeError(error)

    // Personnaliser selon le contexte
    switch (context) {
        case 'load_grids':
            return {
                ...baseError,
                title: 'Unable to load grids',
                message:
                    baseError.type === 'network'
                        ? 'Unable to retrieve grading grids. Check your connection.'
                        : 'Error loading grading grids.',
            }
        // Add similar translations for other cases
        case 'create_grid':
            return {
                ...baseError,
                title: 'Échec de création',
                message:
                    baseError.type === 'validation'
                        ? 'Veuillez vérifier que tous les champs obligatoires sont remplis.'
                        : 'Impossible de créer la grille de notation.',
            }

        case 'update_grid':
            return {
                ...baseError,
                title: 'Impossible de mettre à jour la grille',
                message:
                    baseError.type === 'network'
                        ? 'Impossible de sauvegarder les modifications. Vérifiez votre connexion.'
                        : 'Erreur lors de la mise à jour de la grille de notation.',
                actionable: baseError.type === 'network',
                retryable: baseError.type === 'network',
            }

        case 'delete_grid':
            return {
                ...baseError,
                title: 'Impossible de supprimer la grille',
                message:
                    baseError.type === 'network'
                        ? 'Impossible de supprimer la grille. Vérifiez votre connexion.'
                        : 'Erreur lors de la suppression de la grille de notation.',
                actionable: baseError.type === 'network',
                retryable: baseError.type === 'network',
            }

        case 'save_results':
            return {
                ...baseError,
                title: 'Sauvegarde échouée',
                message:
                    "Impossible de sauvegarder les résultats. Vos données n'ont pas été perdues.",
                actionable: baseError.type === 'network',
                retryable: baseError.type === 'network',
            }

        case 'validate_grid':
            return {
                ...baseError,
                title: 'Validation impossible',
                message:
                    'Impossible de valider la grille. Vérifiez que tous les critères sont complétés.',
                actionable: baseError.type === 'network',
                retryable: baseError.type === 'network',
            }

        default:
            return baseError
    }
}

/**
 * Détermine si une erreur justifie un retry automatique
 */
export const shouldRetry = (error: string | Error): boolean => {
    const errorInfo = analyzeError(error)
    return errorInfo.retryable === true && errorInfo.type === 'network'
}

/**
 * Génère des suggestions d'actions pour l'utilisateur
 */
export const getErrorActions = (errorInfo: ErrorInfo): string[] => {
    const actions: string[] = []

    if (errorInfo.retryable) {
        actions.push('Réessayer')
    }

    if (errorInfo.type === 'network') {
        actions.push('Vérifier la connexion internet')
        actions.push('Actualiser la page')
    }

    if (errorInfo.type === 'permission') {
        actions.push('Se reconnecter')
        actions.push("Contacter l'administrateur")
    }

    if (errorInfo.type === 'validation') {
        actions.push('Vérifier les données saisies')
        actions.push("Consulter l'aide")
    }

    if (actions.length === 0) {
        actions.push('Contacter le support technique')
    }

    return actions
}
