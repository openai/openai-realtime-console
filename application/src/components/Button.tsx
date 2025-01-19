export default function Button({
  icon,
  children,
  onClick,
  className = '',
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      className={`bg-gray-800 text-white rounded-full p-4 flex items-center gap-1 hover:opacity-90 ${className}`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
