import { useState } from "react";

function PasswordInput({ value, onChange, placeholder = "Password", ...props }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full border border-gray-300 rounded px-3 py-2 pr-16"
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 px-3 text-sm text-indigo-600 hover:text-indigo-700"
            >
                {showPassword ? "Hide" : "Show"}
            </button>
        </div>
    );
}

export default PasswordInput;
