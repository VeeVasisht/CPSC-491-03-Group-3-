export default function FormMessage({ type, message }) {
    if (!message) return null;

    const styles =
      type === "error"
        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
        : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
    
    return (
        <dev className = {`p-3 rounded-lg border text-sm ${styles}`}>
            {message}
        </div>
    );
}