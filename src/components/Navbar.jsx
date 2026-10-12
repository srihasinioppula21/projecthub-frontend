import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">ProjectHub <span className="brand-ai">AI</span></span>
        <nav className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/ai">AI Assistant</NavLink>
        </nav>
        <div className="nav-user">
          <span>{user.name}</span>
          <span className={`pill pill-${user.role.toLowerCase()}`}>{user.role}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
