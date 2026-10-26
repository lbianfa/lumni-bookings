import { useEffect, useRef } from 'react'

interface SignOutErrorDialogProps {
  open: boolean
  onDismiss: () => void
}

export function SignOutErrorDialog({
  open,
  onDismiss,
}: SignOutErrorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="sign-out-error-title"
      aria-describedby="sign-out-error-message"
      // Escape closes the dialog natively; only report it when the parent still thinks it is open.
      onClose={() => {
        if (open) onDismiss()
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[400px] rounded-2xl border border-line bg-white p-6 text-ink backdrop:bg-ink/40"
    >
      <h2
        id="sign-out-error-title"
        className="m-0 text-lg font-bold tracking-[-0.01em]"
      >
        Could not sign out
      </h2>
      <p id="sign-out-error-message" className="mt-2 text-sm text-muted">
        Something went wrong while signing you out. Please try again.
      </p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-11 items-center rounded-[10px] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Close
        </button>
      </div>
    </dialog>
  )
}
