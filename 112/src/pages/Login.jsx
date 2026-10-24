import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  "RB Officer",
  "PGRC Officer",
  "Regional Office Official",
  "Senior Management",
  "Administrator",
];

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState(ROLES[0]);
  const [email, setEmail] = useState("officer@aicte-india.org");
  const [password, setPassword] = useState("password");

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("role", role);
    navigate("/");
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-logo">CL</div>
          <div>
            <div className="brand-name">CASELINK</div>
            <div className="brand-sub">AICTE Case Monitoring</div>
          </div>
        </div>

        <div className="login-title">Sign in</div>
        <div className="muted" style={{ marginBottom: 22 }}>
          Integrated Institution Complaint Monitoring Dashboard
        </div>

        <div className="form-group">
          <label className="label">Role</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Official email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn" type="submit" style={{ width: "100%", padding: 11 }}>
          Sign in
        </button>

        <div className="muted" style={{ fontSize: 12, marginTop: 14, textAlign: "center" }}>
          Demo mode: any credentials work. The selected role is shown in the top bar.
        </div>
      </form>
    </div>
  );
}