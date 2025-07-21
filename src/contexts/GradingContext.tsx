import React, { createContext, useReducer, ReactNode } from 'react'
import { GradingGrid, GradingResult } from '@/types/grading'

type State = {
    grids: GradingGrid[]
    currentGrid: GradingGrid | null
}

type Action =
    | { type: 'SET_GRIDS'; payload: GradingGrid[] }
    | { type: 'SET_CURRENT_GRID'; payload: GradingGrid | null }
    | { type: 'UPDATE_GRID'; payload: GradingGrid }
    | { type: 'ADD_RESULT'; payload: { gridId: string; result: GradingResult } }

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_GRIDS':
            return { ...state, grids: action.payload }
        case 'SET_CURRENT_GRID':
            return { ...state, currentGrid: action.payload }
        case 'UPDATE_GRID':
            return {
                ...state,
                grids: state.grids.map((g) =>
                    g.id === action.payload.id ? action.payload : g
                ),
                currentGrid:
                    state.currentGrid?.id === action.payload.id
                        ? action.payload
                        : state.currentGrid,
            }
        case 'ADD_RESULT':
            return {
                ...state,
                grids: state.grids.map((g) =>
                    g.id === action.payload.gridId
                        ? {
                              ...g,
                              results: [...g.results, action.payload.result],
                          }
                        : g
                ),
                currentGrid:
                    state.currentGrid?.id === action.payload.gridId
                        ? {
                              ...state.currentGrid,
                              results: [
                                  ...state.currentGrid.results,
                                  action.payload.result,
                              ],
                          }
                        : state.currentGrid,
            }
        default:
            return state
    }
}

const GradingContext = createContext<
    { state: State; dispatch: React.Dispatch<Action> } | undefined
>(undefined)

export const GradingProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [state, dispatch] = useReducer(reducer, {
        grids: [],
        currentGrid: null,
    })
    return (
        <GradingContext.Provider value={{ state, dispatch }}>
            {children}
        </GradingContext.Provider>
    )
}

export { GradingContext }
