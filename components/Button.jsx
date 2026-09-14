export default function Button({
    children,
    loading = false,
    disabled = false,
    type = "button",
    variant = "primary",
}) {
    const baseStyles =
    "w-full px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600",
        danger:
          "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
    };

    return (
        <button
            type = {type}
            disabled = {disabled || loading}
            className = {`${baseStyles} ${variants[variant] || variants.primary}`}
        >
            {loading ? "Processing..." : children}
        </button>
    );
}