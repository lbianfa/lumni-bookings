interface TextFieldProps {
  id: string
  label: string
  type: 'text' | 'email' | 'password'
  autoComplete: string
  placeholder?: string
  /** Marks the label "(optional)" and drops `required`. */
  optional?: boolean
  value: string
  error: string | undefined
  onBlur: () => void
  onChange: (value: string) => void
}

export function TextField({
  id,
  label,
  optional = false,
  error,
  onChange,
  ...input
}: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional && (
          <span className="font-normal text-muted"> (optional)</span>
        )}
      </label>
      <input
        id={id}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-[10px] border border-line-strong bg-white px-3.5 text-[15px] text-ink aria-invalid:border-danger"
        {...input}
      />
      {error && (
        <p id={errorId} role="alert" className="m-0 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
