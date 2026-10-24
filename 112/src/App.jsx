import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CasesList from "./pages/CasesList.jsx";
import CaseDetail from "./pages/CaseDetail.jsx";
import InstitutionProfile from "./pages/InstitutionProfile.jsx";
import OverlapQueue from "./pages/OverlapQueue.jsx";
import Alerts from "./pages/Alerts.jsx";
import Reports from "./pages/Reports.jsx";

function RequireAuth({ children }) {
  const role = localStorage.getItem("role");
  return role ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases" element={<CasesList />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/institutions/:id" element={<InstitutionProfile />} />
        <Route path="/overlaps" element={<OverlapQueue />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}