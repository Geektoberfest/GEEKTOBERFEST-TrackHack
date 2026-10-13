const SKILL_POINTS = 3;
const INTEREST_POINTS = 2;
const MODE_POINTS = 2;
const LOCATION_POINTS = 1;

const MAX_ITEMS = 20;
const MAX_ITEM_LENGTH = 50;

// " React, AI " -> ["React", "AI"]; dedupes case-insensitively, keeps first casing
const normalizeList = (value) => {
    const items = Array.isArray(value)
        ? value
        : typeof value === "string"
            ? value.split(",")
            : [];

    const seen = new Set();
    const result = [];

    for (const item of items) {
        if (typeof item !== "string") {
            continue;
        }
        const trimmed = item.trim().replace(/\s+/g, " ");
        if (!trimmed || trimmed.length > MAX_ITEM_LENGTH) {
            continue;
        }
        const key = trimmed.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(trimmed);
        if (result.length >= MAX_ITEMS) {
            break;
        }
    }

    return result;
};

const normalizeModes = (value) => {
    const allowed = ["Online", "Offline", "Hybrid"];
    const list = normalizeList(value);
    const seen = new Set();
    const result = [];

    for (const item of list) {
        const match = allowed.find((mode) => mode.toLowerCase() === item.toLowerCase());
        if (match && !seen.has(match)) {
            seen.add(match);
            result.push(match);
        }
    }

    return result;
};

// a skill/interest matches when it equals a tag or appears in title/description/organizer text
const matchesTextOrTags = (needle, hackathon) => {
    const key = String(needle).toLowerCase();
    const tags = Array.isArray(hackathon.tags) ? hackathon.tags : [];
    if (tags.some((tag) => String(tag).toLowerCase() === key)) {
        return true;
    }
    const haystack = [hackathon.title, hackathon.description, hackathon.organizer]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return haystack.includes(key);
};

const locationMatches = (preferredLocation, hackathonLocation) => {
    if (!preferredLocation || !hackathonLocation) {
        return false;
    }
    const preferred = String(preferredLocation).trim().toLowerCase();
    const location = String(hackathonLocation).trim().toLowerCase();
    if (!preferred || !location) {
        return false;
    }
    return location.includes(preferred) || preferred.includes(location);
};

const scoreHackathon = (user, hackathon) => {
    const skills = Array.isArray(user.skills) ? user.skills : [];
    const interests = Array.isArray(user.interests) ? user.interests : [];

    const matchedSkills = skills.filter((skill) => matchesTextOrTags(skill, hackathon));
    const matchedInterests = interests.filter((interest) => matchesTextOrTags(interest, hackathon));

    const modeMatch =
        Array.isArray(user.preferredModes) &&
        user.preferredModes.length > 0 &&
        user.preferredModes.includes(hackathon.mode);

    const locationMatch = locationMatches(user.preferredLocation, hackathon.location);

    const score =
        matchedSkills.length * SKILL_POINTS +
        matchedInterests.length * INTEREST_POINTS +
        (modeMatch ? MODE_POINTS : 0) +
        (locationMatch ? LOCATION_POINTS : 0);

    const reasons = [];
    matchedSkills.forEach((skill) => reasons.push("Matches your skill: " + skill));
    matchedInterests.forEach((interest) => reasons.push("Matches your interest: " + interest));
    if (modeMatch) {
        reasons.push(hackathon.mode + " mode matches your preference");
    }
    if (locationMatch) {
        reasons.push("Location matches your preference");
    }

    return { score, matchedSkills, matchedInterests, modeMatch, locationMatch, reasons };
};

const rankHackathons = (user, hackathons) => {
    return hackathons
        .map((hackathon) => {
            const result = scoreHackathon(user, hackathon);
            return { hackathon, ...result };
        })
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            const aStart = a.hackathon.startDate ? new Date(a.hackathon.startDate).getTime() : Infinity;
            const bStart = b.hackathon.startDate ? new Date(b.hackathon.startDate).getTime() : Infinity;
            if (aStart !== bStart) {
                return aStart - bStart;
            }
            const aCreated = a.hackathon.createdAt ? new Date(a.hackathon.createdAt).getTime() : 0;
            const bCreated = b.hackathon.createdAt ? new Date(b.hackathon.createdAt).getTime() : 0;
            return bCreated - aCreated;
        });
};

module.exports = {
    SKILL_POINTS,
    INTEREST_POINTS,
    MODE_POINTS,
    LOCATION_POINTS,
    normalizeList,
    normalizeModes,
    scoreHackathon,
    rankHackathons
};
