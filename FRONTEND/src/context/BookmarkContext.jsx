import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "./AuthContext";

const BookmarkContext = createContext();

export function BookmarkProvider({ children }) {
    const { user } = useAuth();
    // remember which user the list belongs to, so another login never shows the previous user's saves
    const [saved, setSaved] = useState({ owner: null, ids: new Set() });

    // load the saved list once when someone logs in
    useEffect(() => {
        if (!user) {
            return;
        }

        const loadSaved = async () => {
            try {
                const res = await api.get("/bookmarks");
                const ids = new Set(res.data.hackathons.map((hackathon) => hackathon._id));
                setSaved({ owner: user.id, ids });
            } catch {
                setSaved({ owner: user.id, ids: new Set() });
            }
        };

        loadSaved();
    }, [user]);

    const savedIds = user && saved.owner === user.id ? saved.ids : new Set();
    const isSaved = (hackathonId) => savedIds.has(hackathonId);

    // returns an error message if the request failed, otherwise null
    const toggleSaved = async (hackathonId) => {
        const isSavedNow = isSaved(hackathonId);

        try {
            if (isSavedNow) {
                await api.delete("/bookmarks/" + hackathonId);
            } else {
                await api.post("/bookmarks", { hackathon: hackathonId });
            }
        } catch (err) {
            return err.response?.data?.message || "Could not update your saved list";
        }

        setSaved((current) => {
            const ids = new Set(current.ids);
            if (isSavedNow) {
                ids.delete(hackathonId);
            } else {
                ids.add(hackathonId);
            }
            return { owner: current.owner, ids };
        });
        return null;
    };

    return (
        <BookmarkContext.Provider value={{ isSaved, toggleSaved }}>
            {children}
        </BookmarkContext.Provider>
    );
}

export function useBookmarks() {
    return useContext(BookmarkContext);
}
