import { useState, useCallback, useRef } from 'react'

const MAX_HISTORY = 50

export function useEditorHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState)
  const history = useRef<T[]>([initialState])
  const historyIndex = useRef(0)

  const pushState = useCallback((newState: T) => {
    // Remove any future states if we're in the middle of history
    const nextIndex = historyIndex.current + 1
    history.current = history.current.slice(0, nextIndex)
    history.current.push(newState)

    // Limit history size
    if (history.current.length > MAX_HISTORY) {
      history.current.shift()
    } else {
      historyIndex.current = nextIndex
    }

    setState(newState)
  }, [])

  const undo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current -= 1
      const prevState = history.current[historyIndex.current]
      setState(prevState)
      return prevState
    }
    return state
  }, [state])

  const redo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current += 1
      const nextState = history.current[historyIndex.current]
      setState(nextState)
      return nextState
    }
    return state
  }, [state])

  const canUndo = historyIndex.current > 0
  const canRedo = historyIndex.current < history.current.length - 1

  return { state, pushState, undo, redo, canUndo, canRedo }
}
