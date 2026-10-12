import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import StatusBadge from '../components/StatusBadge';

const EMPTY = { title: '', description: '', technologies: '' };

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isStudent = user.role === 'STUDENT';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  // The AI assistant can send an idea here to pre-fill the form.
  const prefill = location.state?.prefill;
  const [showForm, setShowForm] = useState(Boolean(prefill));
  const [form, setForm] = useState(prefill || EMPTY);

  const load = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // clear the router state so a refresh doesn't re-open the form
    if (prefill) window.history.replaceState({}, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/projects', form);
      navigate(`/projects/${data.id}`);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const count = (s) => projects.filter((p) => p.status === s).length;
  const visible = filter === 'ALL' ? projects : projects.filter((p) => p.status === filter);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{isStudent ? 'My projects' : 'All student projects'}</h2>
          <p className="muted">
            {isStudent
              ? 'Create projects, form teams, assign tasks and track progress.'
              : 'Monitor projects, approve submissions and give feedback.'}
          </p>
        </div>
        {isStudent && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Close' : '+ New project'}
          </button>
        )}
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="stats">
        <div className="stat"><b>{projects.length}</b><span>Total</span></div>
        <div className="stat"><b>{count('IN_PROGRESS')}</b><span>In progress</span></div>
        <div className="stat"><b>{count('SUBMITTED')}</b><span>{isStudent ? 'Awaiting review' : 'To review'}</span></div>
        <div className="stat"><b>{count('APPROVED')}</b><span>Approved</span></div>
      </div>

      {isStudent && showForm && (
        <form className="card form" onSubmit={create}>
          <h3>New project</h3>
          <label>Title
            <input value={form.title} onChange={set('title')} required />
          </label>
          <label>Description
            <textarea rows={3} value={form.description} onChange={set('description')} />
          </label>
          <label>Technologies
            <input
              placeholder="e.g. Spring Boot, React.js, MySQL"
              value={form.technologies}
              onChange={set('technologies')}
            />
          </label>
          <div className="row">
            <button className="btn btn-primary">Create project</button>
            <Link to="/ai" className="btn btn-ghost">Need ideas? Ask the AI assistant</Link>
          </div>
        </form>
      )}

      <div className="filters">
        {['ALL', 'PLANNING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((s) => (
          <button key={s} className={filter === s ? 'chip active' : 'chip'} onClick={() => setFilter(s)}>
            {s === 'ALL' ? 'All' : s.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="card empty">
          {projects.length === 0
            ? isStudent ? 'No projects yet. Create your first one!' : 'No projects have been created yet.'
            : 'No projects match this filter.'}
        </div>
      ) : (
        <div className="grid">
          {visible.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card project-card">
              <div className="row between">
                <h3>{p.title}</h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="muted clamp">{p.description || 'No description'}</p>
              {p.technologies && <p className="tech">{p.technologies}</p>}
              <div className="progress"><div style={{ width: `${p.progress}%` }} /></div>
              <div className="row between small muted">
                <span>{p.progress}% · {p.taskCount} task{p.taskCount === 1 ? '' : 's'}</span>
                <span>{p.members.length} member{p.members.length === 1 ? '' : 's'} · by {p.owner.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
