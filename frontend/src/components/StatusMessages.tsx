// Small components shown by every page while data loads or when it fails.

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function LoadingMessage({ text = "Loading..." }: { text?: string }) {
  // role="status" is a polite live region: screen readers announce the text.
  return (
    <p className="status" role="status">
      {text}
    </p>
  );
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  // role="alert" (an assertive live region) makes screen readers read the
  // error as soon as it appears.
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
