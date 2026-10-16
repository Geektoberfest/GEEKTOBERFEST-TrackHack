import { useState } from "react";

const inputClass = "w-full border border-gray-300 rounded px-3 py-2";

// maximum lengths; keep in sync with BACKEND/src/controllers/hackathonController.js
const limits = { title: 100, organizer: 100, location: 100, website: 200, description: 2000 };

const inputFields = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "organizer", label: "Organizer", type: "text", required: true },
    { name: "startDate", label: "Start Date", type: "date" },
    { name: "endDate", label: "End Date", type: "date" },
    { name: "registrationDeadline", label: "Registration Deadline", type: "date" },
    { name: "location", label: "Location", type: "text" },
    { name: "website", label: "Website (https://...)", type: "url" }
];

const modes = ["Online", "Offline", "Hybrid"];
const statuses = ["Upcoming", "Registered", "In Progress", "Completed", "Cancelled"];

function toDateInput(value) {
    if (!value) {
        return "";
    }
    return value.slice(0, 10);
}

function toTagsInput(value) {
    if (!value) {
        return "";
    }
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    return value;
}

function Counter({ length, max }) {
    const nearLimit = length >= max * 0.9;

    return (
        <p className={"text-xs text-right mt-1 " + (nearLimit ? "text-amber-600" : "text-gray-500")}>
            {length}/{max}
        </p>
    );
}

function HackathonForm({ initialData, onSubmit, buttonText }) {
    const data = initialData || {};

    const [form, setForm] = useState({
        title: data.title || "",
        organizer: data.organizer || "",
        description: data.description || "",
        startDate: toDateInput(data.startDate),
        endDate: toDateInput(data.endDate),
        registrationDeadline: toDateInput(data.registrationDeadline),
        location: data.location || "",
        mode: data.mode || "Online",
        status: data.status || "Upcoming",
        website: data.website || "",
        tags: toTagsInput(data.tags)
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            // the API stores tags as a list; the form edits them as comma-separated text
            const payload = {
                ...form,
                tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            };
            await onSubmit(payload);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
            {error && <p className="text-red-600">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inputFields.map((field) => (
                    <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium mb-1">{field.label}</label>
                        <input
                            id={field.name}
                            type={field.type}
                            name={field.name}
                            value={form[field.name]}
                            onChange={handleChange}
                            required={field.required}
                            maxLength={limits[field.name]}
                            className={inputClass}
                        />
                        {limits[field.name] && <Counter length={form[field.name].length} max={limits[field.name]} />}
                    </div>
                ))}

                <div>
                    <label htmlFor="mode" className="block text-sm font-medium mb-1">Mode</label>
                    <select id="mode" name="mode" value={form.mode} onChange={handleChange} className={inputClass}>
                        {modes.map((mode) => (
                            <option key={mode} value={mode}>{mode}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
                    <select id="status" name="status" value={form.status} onChange={handleChange} className={inputClass}>
                        {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={limits.description}
                    className={inputClass}
                ></textarea>
                <Counter length={form.description.length} max={limits.description} />
            </div>

            <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags / skills (comma-separated)</label>
                <input
                    id="tags"
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="React, AI, Blockchain"
                    className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">Tags power personalized recommendations for other users.</p>
            </div>

            <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
                {saving ? "Saving..." : buttonText}
            </button>
        </form>
    );
}

export default HackathonForm;