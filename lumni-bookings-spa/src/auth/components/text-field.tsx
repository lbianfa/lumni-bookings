interface TextFieldProps {
  id: string
  label: string
  type: 'email' | 'password'
  autoComplete: string
  placeholder?: string
  value: string
  error: string | undefined
  onBlur: () => void
  onChange: (value: string) => void
}

export function TextField({
  id,
  label,
  error,
  onChange,
  ...input
}: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        required
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
