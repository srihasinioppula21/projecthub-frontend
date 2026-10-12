import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import StatusBadge from '../components/StatusBadge';

const COLUMNS = [
  ['TODO', 'To do'],
  ['IN_PROGRESS', 'In progress'],
  ['DONE', 'Done'],
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');

  const [taskForm, setTaskForm] = useState({ title: '', assigneeId: '', dueDate: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [comment, setComment] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, t, f] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
        api.get(`/projects/${id}/feedback`),
      ]);
      setProject(p.data);
      setTasks(t.data);
      setFeedback(f.data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // run an API call, then refresh everything
  const act = async (fn, after) => {
    setError('');
    try {
      await fn();
      after?.();
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (!project) {
    return error ? (
      <>
        <div className="alert">{error}</div>
        <Link to="/">← Back to dashboard</Link>
      </>
    ) : (
      <p className="muted">Loading…</p>
    );
  }

  const isFaculty = user.role === 'FACULTY';
  const isMember = project.members.some((m) => m.id === user.id);
  const canSubmit = isMember && !['SUBMITTED', 'APPROVED'].includes(project.status);
  const canReview = isFaculty && project.status === 'SUBMITTED';

  const addTask = (e) => {
    e.preventDefault();
    act(
      () =>
        api.post(`/projects/${id}/tasks`, {
          title: taskForm.title,
          status: 'TODO',
          assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null,
          dueDate: taskForm.dueDate || null,
        }),
      () => setTaskForm({ title: '', assigneeId: '', dueDate: '' })
    );
  };

  const updateTask = (task, changes) =>
    act(() =>
      api.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        status: task.status,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        ...changes,
      })
    );

  const removeTask = (task) => act(() => api.delete(`/tasks/${task.id}`));

  const addMember = (e) => {
    e.preventDefault();
    act(() => api.post(`/projects/${id}/members`, { email: memberEmail }), () => setMemberEmail(''));
  };

  const postComment = (e) => {
    e.preventDefault();
    act(() => api.post(`/projects/${id}/feedback`, { comment }), () => setComment(''));
  };

  const review = (decision) =>
    act(
      () => api.post(`/projects/${id}/review`, { decision, comment: reviewComment }),
      () => setReviewComment('')
    );

  return (
    <>
      <Link to="/" className="back">← All projects</Link>

      <div className="page-head">
        <div>
          <h2>{project.title}</h2>
          <p className="muted">Created by {project.owner.name}</p>
        </div>
        <div className="row">
          <StatusBadge status={project.status} />
          {canSubmit && (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (window.confirm('Submit this project to faculty for review?')) {
                  act(() => api.post(`/projects/${id}/submit`));
                }
              }}
            >
              Submit for review
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card">
        <p>{project.description || <span className="muted">No description.</span>}</p>
        {project.technologies && <p className="tech">{project.technologies}</p>}
        <div className="progress big"><div style={{ width: `${project.progress}%` }} /></div>
        <p className="small muted">{project.progress}% complete · {project.taskCount} tasks</p>
      </div>

      {canReview && (
        <div className="card review">
          <h3>Faculty review</h3>
          <p className="muted">This project has been submitted. Approve it, or reject it with feedback so the team can improve it.</p>
          <textarea
            rows={3}
            placeholder="Feedback for the team (optional for approval, recommended for rejection)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
          <div className="row">
            <button className="btn btn-success" onClick={() => review('APPROVED')}>Approve</button>
            <button className="btn btn-danger" onClick={() => review('REJECTED')}>Reject</button>
          </div>
        </div>
      )}

      <div className="two-col">
        <section className="card">
          <h3>Team</h3>
          <ul className="plain">
            {project.members.map((m) => (
              <li key={m.id}>
                <b>{m.name}</b> <span className="muted small">{m.email}</span>
                {m.id === project.owner.id && <span className="pill pill-student">Owner</span>}
              </li>
            ))}
          </ul>
          {isMember && (
            <form className="row" onSubmit={addMember}>
              <input
                type="email"
                placeholder="Add student by email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
              />
              <button className="btn">Add</button>
            </form>
          )}
        </section>

        <section className="card">
          <h3>Feedback &amp; comments</h3>
          <div className="comments">
            {feedback.length === 0 && <p className="muted">No feedback yet.</p>}
            {feedback.map((f) => (
              <div key={f.id} className="comment">
                <div className="small">
                  <b>{f.author.name}</b>{' '}
                  <span className={`pill pill-${f.author.role.toLowerCase()}`}>{f.author.role}</span>{' '}
                  <span className="muted">{new Date(f.createdAt).toLocaleString()}</span>
                </div>
                <p>{f.comment}</p>
              </div>
            ))}
          </div>
          <form className="row" onSubmit={postComment}>
            <input
              placeholder="Write a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <button className="btn">Post</button>
          </form>
        </section>
      </div>

      <section className="card">
        <h3>Tasks</h3>

        {isMember && (
          <form className="row wrap" onSubmit={addTask}>
            <input
              className="grow"
              placeholder="New task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
            <select
              value={taskForm.assigneeId}
              onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {project.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
            <button className="btn btn-primary">Add task</button>
          </form>
        )}

        <div className="board">
          {COLUMNS.map(([status, label]) => {
            const items = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="column">
                <h4>{label} <span className="muted">({items.length})</span></h4>
                {items.length === 0 && <p className="muted small">Nothing here.</p>}
                {items.map((t) => (
                  <div key={t.id} className="task">
                    <div className="task-title">{t.title}</div>
                    <div className="small muted">
                      {t.assigneeName || 'Unassigned'}
                      {t.dueDate && ` · due ${t.dueDate}`}
                    </div>
                    {isMember && (
                      <div className="row task-actions">
                        <select value={t.status} onChange={(e) => updateTask(t, { status: e.target.value })}>
                          {COLUMNS.map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                        </select>
                        <select
                          value={t.assigneeId ?? ''}
                          onChange={(e) => updateTask(t, { assigneeId: e.target.value ? Number(e.target.value) : null })}
                        >
                          <option value="">Unassigned</option>
                          {project.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <button className="btn btn-ghost" title="Delete task" onClick={() => removeTask(t)}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
