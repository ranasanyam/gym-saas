"use client"

import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

type ToastVariant = "default" | "destructive" | "success"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string }
  | { type: "DISMISS"; id: string }

interface ToastState {
  toasts: Toast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD":
      return {
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "DISMISS": {
      const { id } = action
      if (!toastTimeouts.has(id)) {
        const timeout = setTimeout(() => {
          toastTimeouts.delete(id)
          dispatch({ type: "REMOVE", id })
        }, TOAST_REMOVE_DELAY)
        toastTimeouts.set(id, timeout)
      }
      return state
    }
    case "REMOVE":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) }
  }
}

let memoryState: ToastState = { toasts: [] }
const listeners: Array<(state: ToastState) => void> = []

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

function toast(props: Omit<Toast, "id">) {
  const id = genId()
  const duration = props.duration ?? TOAST_REMOVE_DELAY

  dispatch({ type: "ADD", toast: { ...props, id } })

  setTimeout(() => {
    dispatch({ type: "DISMISS", id })
  }, duration)

  return id
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: "DISMISS", id }),
  }
}

export { useToast, toast }