export default function Button({ icon, children, onClick, className, disabled }) {
  return (
    <button
      className={`rounded-full px-5 py-3 flex items-center gap-2 text-sm font-medium border backdrop-blur-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
}
