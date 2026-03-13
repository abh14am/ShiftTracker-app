import React, { useState, useEffect } from 'react';
import { getTeamMembers, createTeamMember, deleteTeamMember, getShiftTypes, createShiftType, getShifts, deleteShift } from '../api';
import { Users, Clock, Plus, Trash2, List } from 'lucide-react';

export default function Admin() {
  const [members, setMembers] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  const [newMemberName, setNewMemberName] = useState('');
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftTime, setNewShiftTime] = useState('');

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
    if (!newMemberName.trim()) return;
    try {
      await createTeamMember({ name: newMemberName });
      setNewMemberName('');
      fetchData();
    } catch (err) {
      alert("Failed to add member. Maybe they already exist?");
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member? This might fail if they are part of existing shifts.")) return;
    try {
      await deleteTeamMember(id);
      fetchData();
    } catch (err) {
      alert("Cannot delete this member. They are likely assigned to an existing shift.");
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
        <p style={{ color: 'var(--text-secondary)' }}>Configure team members and shift schedules to populate form dropdowns.</p>
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

          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Username" 
              value={newMemberName} 
              onChange={e => setNewMemberName(e.target.value)} 
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }}>
              <Plus size={18} /> Add
            </button>
          </form>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {members.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No team members configured yet.</li>}
            {members.map(m => (
              <li key={m.id} style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{m.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {m.id}</span>
                  <button onClick={() => handleDeleteMember(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }} title="Delete Member">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
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
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Time (e.g. 6am - 2pm)" 
                value={newShiftTime} 
                onChange={e => setNewShiftTime(e.target.value)} 
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem', whiteSpace: 'nowrap' }}>
                <Plus size={18} /> Add
              </button>
            </div>
          </form>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {shiftTypes.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No shift types configured yet.</li>}
            {shiftTypes.map(st => (
              <li key={st.id} style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>{st.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{st.time_range}</span>
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
                  <td style={{ padding: '0.75rem 1rem' }}>{shift.shift_type.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                     {shift.outgoing_engineer.name} <span style={{ color: 'var(--text-muted)' }}>→</span> {shift.incoming_engineer.name}
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
