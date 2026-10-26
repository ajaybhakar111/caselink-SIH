import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "RB Officer";

  const handleSearch = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      navigate(`/cases?q=${encodeURIComponent(e.target.value.trim())}`);
    }
  };

  const logout = () => {
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <header className="topbar">
      <input
        className="topbar-search"
        placeholder="Search institution, AICTE ID or case ID, then press Enter"
        onKeyDown={handleSearch}
      />
      <div className="topbar-right">
        <div className="user-chip">
          <div className="avatar">{role.charAt(0)}</div>
          <div>
            <div className="user-name">Authorized Official</div>
            <div className="user-role">{role}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}