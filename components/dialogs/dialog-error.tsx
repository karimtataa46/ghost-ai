interface DialogErrorProps {
  message: string | null;
}

export function DialogError({ message }: DialogErrorProps) {
  if (!message) return null;

  return (
    <p role="alert" className="text-sm wrap-anywhere text-state-error">
      {message}
    </p>
  );
}
