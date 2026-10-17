import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Hackathons from "./pages/Hackathons";
import HackathonDetails from "./pages/HackathonDetails";
import CreateHackathon from "./pages/CreateHackathon";
import EditHackathon from "./pages/EditHackathon";
import TrackerPage from "./pages/TrackerPage";
import NotFound from "./pages/NotFound";
import GitHubDashboard from "./pages/GitHubDashboard";
import SavedHackathons from "./pages/SavedHackathons";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Recommended from "./pages/Recommended";
import Teams from "./pages/Teams";
import TeamDetails from "./pages/TeamDetails";

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-6">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/hackathons" element={<ProtectedRoute><Hackathons /></ProtectedRoute>} />
                    <Route path="/hackathons/create" element={<ProtectedRoute><CreateHackathon /></ProtectedRoute>} />
                    <Route path="/hackathons/:id" element={<ProtectedRoute><HackathonDetails /></ProtectedRoute>} />
                    <Route path="/hackathons/:id/edit" element={<ProtectedRoute><EditHackathon /></ProtectedRoute>} />
                    <Route path="/trackers/:id" element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} />
                    <Route path="/recommended" element={<ProtectedRoute><Recommended /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/github" element={<ProtectedRoute><GitHubDashboard /></ProtectedRoute>} />
                    <Route path="/saved" element={<ProtectedRoute><SavedHackathons /></ProtectedRoute>} />
                    <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
                    <Route path="/teams/:id" element={<ProtectedRoute><TeamDetails /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                    
                </Routes>
            </div>
        </div>
    );
}

export default App;