import { useEffect, useRef } from "react";

function ConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirming = false,
    onConfirm,
    onCancel
}) {
    const cancelRef = useRef(null);
    const titleId = "confirm-dialog-title";
    const messageId = "confirm-dialog-message";

    useEffect(() => {
        cancelRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                className="w-full max-w-md bg-white rounded-lg shadow p-6 flex flex-col gap-4"
            >
                <h2 id={titleId} className="text-xl font-bold">{title}</h2>
                <p id={messageId} className="text-sm text-gray-600">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        ref={cancelRef}
                        onClick={onCancel}
                        disabled={confirming}
                        className="border border-gray-300 px-4 py-2 rounded disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={confirming}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {confirming ? "Deleting..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
