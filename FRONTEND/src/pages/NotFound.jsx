import { Link, useLocation } from "react-router-dom";

function NotFound() {
    const location = useLocation();

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center flex flex-col items-center gap-3">
            <p className="text-6xl font-bold text-indigo-600">404</p>
            <h1 className="text-2xl font-bold">Page not found</h1>
            <p className="text-gray-600">
                We couldn't find <span className="font-mono break-all">{location.pathname}</span>. The link may be
                broken or the page may have been moved.
            </p>
            <Link to="/dashboard" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                Go to Dashboard
            </Link>
        </div>
    );
}

export default NotFound;
