import React, { useState, useEffect } from 'react';
import { 
  getTeamMembers, createTeamMember, deleteTeamMember, 
  getShiftTypes, createShiftType, deleteShiftType,
  getShifts, deleteShift 
} from '../api';
import { Users, Clock, Plus, Trash2, List, ShieldCheck, Edit } from 'lucide-react';

export default function Admin({ userAuth }) {
  const [members, setMembers] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberIsAdmin, setNewMemberIsAdmin] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftTime, setNewShiftTime] = useState('');
  
  const [editingShiftType, setEditingShiftType] = useState(null);
  const [editShiftName, setEditShiftName] = useState('');
  const [editShiftTime, setEditShiftTime] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersData, shiftTypesData, shiftsData] = await Promise.all([
        getTeamMembers(),
        getShiftTypes(),
        getShifts()
      ]);
      setMembers(membersData);
      setShiftTypes(shiftTypesData);
      setShifts(shiftsData);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPassword.trim()) {
      alert("Please provide both a username and a password.");
      return;
    }
    try {
      await createTeamMember({ 
        name: newMemberName, 
        password: newMemberPassword,
        is_admin: newMemberIsAdmin 
      });
      setNewMemberName('');
      setNewMemberPassword('');
      setNewMemberIsAdmin(false);
      fetchData();
    } catch (err) {
      alert("Failed to add member. Maybe they already exist?");
    }
  };

  const handleDeleteMember = async (targetMember) => {
    if (targetMember.is_primary_admin) {
      alert("The Primary Administrator cannot be deleted.");
      return;
    }

    if (targetMember.is_admin && !userAuth.isPrimaryAdmin) {
      alert("Only the Primary Administrator can delete other administrator accounts.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${targetMember.name}?`)) return;

    try {
      await deleteTeamMember(targetMember.id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete this member.");
    }
  };

  const handleAddShiftType = async (e) => {
    e.preventDefault();
    if (!newShiftName.trim() || !newShiftTime.trim()) return;
    try {
      await createShiftType({ name: newShiftName, time_range: newShiftTime });
      setNewShiftName('');
      setNewShiftTime('');
      fetchData();
    } catch (err) {
      alert("Failed to add shift type. Maybe name already exists?");
    }
  };

  const handleDeleteShiftType = async (st) => {
    if (!window.confirm(`Delete shift type "${st.name}"? This will fail if it's referenced in existing shifts.`)) return;
    try {
      await deleteShiftType(st.id);
      fetchData();
    } catch (err) {
      alert("Cannot delete shift type. It is likely tied to existing shift records.");
    }
  };

  const handleEditShiftType = (st) => {
    setEditingShiftType(st.id);
    setEditShiftName(st.name);
    setEditShiftTime(st.time_range);
  };

  const handleUpdateShiftType = async (e) => {
    e.preventDefault();
    try {
      await updateShiftType(editingShiftType, { name: editShiftName, time_range: editShiftTime });
      setEditingShiftType(null);
      fetchData();
    } catch (err) {
      alert("Failed to update shift type.");
    }
  };

  const cancelEdit = () => {
    setEditingShiftType(null);
    setEditShiftName('');
    setEditShiftTime('');
  };

  const handleDeleteShift = async (id) => {
     if (!window.confirm("Are you sure you want to completely delete this shift handover?")) return;
     try {
       await deleteShift(id);
       fetchData();
     } catch (err) {
       alert("Failed to delete shift: " + err.message);
     }
  };

  if (loading) return <div className="text-center py-12 text-secondary">Loading configuration...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Configuration</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure team members and shift schedules.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
        
        {/* Team Members */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '12px', color: 'var(--accent-primary)' }}>
              <Users size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Team Members</h2>
          </div>

          <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Username" 
              value={newMemberName} 
              onChange={e => setNewMemberName(e.target.value)} 
              required
            />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Password" 
              value={newMemberPassword} 
              onChange={e => setNewMemberPassword(e.target.value)} 
              required
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={newMemberIsAdmin} 
                onChange={e => setNewMemberIsAdmin(e.target.checked)} 
              />
              Administrator Privileges
            </label>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
              <Plus size={18} /> Add Member
            </button>
          </form>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {members.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No team members configured yet.</li>}
            {members.map(m => {
              const canDelete = !m.is_primary_admin && (!m.is_admin || userAuth.isPrimaryAdmin);
              
              return (
                <li key={m.id} style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    {m.is_primary_admin && <ShieldCheck size={14} color="var(--accent-primary)" title="Primary Administrator" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{m.is_admin ? 'Admin' : `ID: ${m.id}`}</span>
                    {canDelete && (
                      <button onClick={() => handleDeleteMember(m)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }} title="Delete Member">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Shift Types */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '12px', color: 'var(--accent-primary)' }}>
              <Clock size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Shift Types</h2>
          </div>

          <form onSubmit={handleAddShiftType} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Shift Name (e.g. Morning Shift)" 
              value={newShiftName} 
              onChange={e => setNewShiftName(e.target.value)} 
              required
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Time (e.g. 6am - 2pm)" 
                value={newShiftTime} 
                onChange={e => setNewShiftTime(e.target.value)} 
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem', whiteSpace: 'nowrap' }}>
                <Plus size={18} /> Add
              </button>
            </div>
          </form>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {shiftTypes.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No shift types configured yet.</li>}
            {shiftTypes.map(st => (
              <li key={st.id} style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {editingShiftType === st.id ? (
                  <form onSubmit={handleUpdateShiftType} style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      <input 
                        className="input-field" 
                        value={editShiftName} 
                        onChange={e => setEditShiftName(e.target.value)} 
                        placeholder="Name"
                        style={{ padding: '0.4rem 0.75rem' }}
                        autoFocus
                      />
                      <input 
                        className="input-field" 
                        value={editShiftTime} 
                        onChange={e => setEditShiftTime(e.target.value)} 
                        placeholder="Time"
                        style={{ padding: '0.4rem 0.75rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Save</button>
                      <button type="button" onClick={cancelEdit} className="btn" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: 'var(--bg-base)' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 500 }}>{st.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{st.time_range}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEditShiftType(st)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }} title="Edit Shift Type">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDeleteShiftType(st)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }} title="Delete Shift Type">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Shift Handover List */}
        <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '12px', color: 'var(--accent-primary)' }}>
              <List size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>All Recorded Shifts</h2>
          </div>

          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.5rem 1rem' }}>ID</th>
                <th style={{ padding: '0.5rem 1rem' }}>Date</th>
                <th style={{ padding: '0.5rem 1rem' }}>Shift Type</th>
                <th style={{ padding: '0.5rem 1rem' }}>Engineers (Out → In)</th>
                <th style={{ padding: '0.5rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No shifts recorded yet.</td>
                </tr>
              )}
              {shifts.map(shift => (
                <tr key={shift.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>#{shift.id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{new Date(shift.date).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{shift.shift_type?.name || 'Deleted Type'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                     {shift.outgoing_engineer?.name || 'Unknown'} <span style={{ color: 'var(--text-muted)' }}>→</span> {shift.incoming_engineer?.name || 'Unknown'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button onClick={() => handleDeleteShift(shift.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
