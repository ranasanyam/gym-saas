// import { useToast } from "@/hooks/use-toast";
// import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

// export function Toaster() {
//   const { toasts } = useToast();

//   return (
//     <ToastProvider>
//       {toasts.map(function ({ id, title, description, action, ...props }) {
//         return (
//           <Toast key={id} {...props}>
//             <div className="grid gap-1">
//               {title && <ToastTitle>{title}</ToastTitle>}
//               {description && <ToastDescription>{description}</ToastDescription>}
//             </div>
//             {action}
//             <ToastClose />
//           </Toast>
//         );
//       })}
//       <ToastViewport />
//     </ToastProvider>
//   );
// }
"use client"

import { useToast } from "@/hooks/use-toast"
import { AnimatePresence, motion } from "framer-motion"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              pointer-events-auto relative flex items-start gap-3 rounded-xl p-4 pr-10 shadow-2xl border
              backdrop-blur-xl text-sm
              ${toast.variant === "destructive"
                ? "bg-red-950/90 border-red-500/30 text-red-100"
                : toast.variant === "success"
                ? "bg-green-950/90 border-green-500/30 text-green-100"
                : "bg-[hsl(220_25%_12%/0.95)] border-white/10 text-white"
              }
            `}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.variant === "destructive" ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : toast.variant === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Info className="w-4 h-4 text-primary" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="font-semibold leading-tight">{toast.title}</p>
              )}
              {toast.description && (
                <p className={`text-xs mt-0.5 leading-relaxed ${
                  toast.variant === "destructive" ? "text-red-300/80"
                  : toast.variant === "success" ? "text-green-300/80"
                  : "text-white/55"
                }`}>
                  {toast.description}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <motion.div
              className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl ${
                toast.variant === "destructive" ? "bg-red-500/50"
                : toast.variant === "success" ? "bg-green-500/50"
                : "bg-primary/50"
              }`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: (toast.duration ?? 4000) / 1000, ease: "linear" }}
            />

            {/* Close button */}
            <button
              onClick={() => dismiss(toast.id)}
              className={`absolute top-3 right-3 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity ${
                toast.variant === "destructive" ? "hover:bg-red-500/20"
                : toast.variant === "success" ? "hover:bg-green-500/20"
                : "hover:bg-white/10"
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}