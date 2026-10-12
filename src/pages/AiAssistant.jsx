import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';

export default function AiAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user.role === 'STUDENT';

  const [requirements, setRequirements] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isStudent) return;
    api.get('/projects').then(({ data }) => {
      setProjects(data);
      if (data.length) setProjectId(String(data[0].id));
    }).catch(() => {});
  }, [isStudent]);

  const ask = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/suggest', { requirements });
      setResult(data);
      setSelected(data.tasks.map((_, i) => i));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i) =>
    setSelected(selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i]);

  const startWithIdea = (idea) =>
    navigate('/', {
      state: {
        prefill: {
          title: idea.title,
          description: idea.description,
          technologies: result.technologies.join(', '),
        },
      },
    });

  const addTasks = async () => {
    setError('');
    setMessage('');
    try {
      for (const i of selected) {
        await api.post(`/projects/${projectId}/tasks`, { title: result.tasks[i], status: 'TODO' });
      }
      setMessage(`Added ${selected.length} task(s) to the project.`);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>AI Assistant</h2>
          <p className="muted">Describe what you want to build and get project ideas, suitable technologies and a starter task list.</p>
        </div>
      </div>

      <form className="card form" onSubmit={ask}>
        <label>Your requirements or interests
          <textarea
            rows={4}
            placeholder="e.g. I like healthcare and want a web app using Java and React that I can finish in 3 months with a team of 3."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            required
          />
        </label>
        <div className="row">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Thinking…' : 'Get suggestions'}
          </button>
        </div>
      </form>

      {error && <div className="alert">{error}</div>}
      {message && <div className="alert alert-ok">{message}</div>}

      {result && (
        <>
          {result.source === 'offline' && (
            <p className="muted small">
              Showing built-in suggestions. Set <code>ANTHROPIC_API_KEY</code> on the backend to get AI-generated ones.
            </p>
          )}

          <h3>Project ideas</h3>
          <div className="grid">
            {result.ideas.map((idea, i) => (
              <div key={i} className="card">
                <h4>{idea.title}</h4>
                <p className="muted">{idea.description}</p>
                {isStudent && (
                  <button className="btn" onClick={() => startWithIdea(idea)}>Start a project with this idea</button>
                )}
              </div>
            ))}
          </div>

          <h3>Suggested technologies</h3>
          <div className="chips">
            {result.technologies.map((t) => <span key={t} className="chip static">{t}</span>)}
          </div>

          <h3>Suggested tasks</h3>
          <div className="card">
            <ul className="plain">
              {result.tasks.map((t, i) => (
                <li key={i}>
                  <label className="check">
                    {isStudent && (
                      <input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} />
                    )}
                    {t}
                  </label>
                </li>
              ))}
            </ul>
            {isStudent && (
              projects.length === 0 ? (
                <p className="muted small">Create a project first to add these tasks to it.</p>
              ) : (
                <div className="row wrap">
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  <button className="btn btn-primary" disabled={selected.length === 0} onClick={addTasks}>
                    Add {selected.length} selected task(s) to project
                  </button>
                </div>
              )
            )}
          </div>
        </>
      )}
    </>
  );
}
