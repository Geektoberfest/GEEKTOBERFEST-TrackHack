// keep these values in sync with sortOptions in BACKEND/src/controllers/hackathonController.js
export const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "startDate", label: "Start date (soonest)" },
    { value: "-startDate", label: "Start date (latest)" },
    { value: "deadline", label: "Deadline (soonest)" },
    { value: "-deadline", label: "Deadline (latest)" },
    { value: "title", label: "Title (A-Z)" },
    { value: "-title", label: "Title (Z-A)" }
];
