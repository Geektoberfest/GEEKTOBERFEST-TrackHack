import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import HackathonCard from "../components/HackathonCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 10;

const filterKeys = ["status", "mode", "startFrom", "startTo", "sort"];

function Hackathons() {
    // search, filters and page are kept in the URL so they survive refresh, the back button and shared links
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const filters = {
        status: searchParams.get("status") || "",
        mode: searchParams.get("mode") || "",
        startFrom: searchParams.get("startFrom") || "",
        startTo: searchParams.get("startTo") || "",
        sort: searchParams.get("sort") || "newest"
    };
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

    // a string (not an object) so the effect below only re-runs when the URL really changes
    const queryString = searchParams.toString();

    const [hackathons, setHackathons] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadHackathons = async () => {
            setLoading(true);
            setError("");

            // only send the search and filters that are set in the URL
            const urlParams = new URLSearchParams(queryString);
            const params = { page, limit: PAGE_SIZE };
            ["search", ...filterKeys].forEach((key) => {
                if (urlParams.get(key)) {
                    params[key] = urlParams.get(key);
                }
            });

            try {
                const res = await api.get("/hackathons", { params });
                setHackathons(res.data.hackathons);
                setTotal(res.data.total);
                setTotalPages(res.data.totalPages);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load hackathons");
            } finally {
                setLoading(false);
            }
        };

        loadHackathons();
    }, [queryString, page]);

    // update the URL, removing empty values so links stay short
    const updateParams = (changes) => {
        const next = new URLSearchParams(searchParams);
        Object.keys(changes).forEach((key) => {
            const value = changes[key];
            if (!value || (key === "sort" && value === "newest") || (key === "page" && value === 1)) {
                next.delete(key);
            } else {
                next.set(key, value);
            }
        });
        setSearchParams(next);
    };

    // go back to the first page whenever the search or a filter changes
    const handleSearch = (text) => {
        updateParams({ search: text, page: 1 });
    };

    const handleFilterChange = (name, value) => {
        updateParams({ [name]: value, page: 1 });
    };

    const clearFilters = () => {
        const cleared = { page: 1 };
        filterKeys.forEach((key) => {
            cleared[key] = "";
        });
        updateParams(cleared);
    };

    const handlePageChange = (newPage) => {
        updateParams({ page: newPage });
        window.scrollTo(0, 0);
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">All Hackathons</h1>

            <div className="flex flex-col gap-3 mb-6">
                <SearchBar key={search} initialValue={search} onSearch={handleSearch} />
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <FilterBar filters={filters} onChange={handleFilterChange} />
                    <button onClick={clearFilters} className="text-indigo-600 text-sm py-2">
                        Clear filters
                    </button>
                </div>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            {loading ? (
                <p>Loading...</p>
            ) : hackathons.length === 0 ? (
                search || filters.status || filters.mode ? (
                    <EmptyState
                        title="No matching hackathons"
                        message="Try a different search term or change the filters."
                    />
                ) : (
                    <EmptyState
                        title="No hackathons yet"
                        message="Be the first to add a hackathon for everyone to see."
                        actionLabel="Add hackathon"
                        actionTo="/hackathons/create"
                    />
                )
            ) : (
                <>
                    <p className="text-sm text-gray-600 mb-3">
                        {total} {total === 1 ? "hackathon" : "hackathons"} found
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hackathons.map((hackathon) => (
                            <HackathonCard key={hackathon._id} hackathon={hackathon} />
                        ))}
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </>
            )}
        </div>
    );
}

export default Hackathons;
