export function Separator({ className = '' }: { className?: string }) {
  return (
    <hr
      className={`border-t border-gray-300 dark:border-gray-700 ${className}`}
    />
  );
}