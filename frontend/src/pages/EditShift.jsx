import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTeamMembers, getShiftTypes, getShiftById, updateShift } from '../api';
import { Save } from 'lucide-react';

export default function EditShift() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [members, setMembers] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: '',
    shift_type_id: '',
    outgoing_engineer_id: '',
    incoming_engineer_id: '',
    ongoing_incidents: '',
    new_alerts: '',
    actions_taken: '',
    pending_tasks: '',
    planned_maintenance: '',
    known_issues: '',
    escalations: '',
    additional_notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, s, existingShift] = await Promise.all([
          getTeamMembers(), 
          getShiftTypes(),
          getShiftById(id)
        ]);
        setMembers(m);
        setShiftTypes(s);
        
        setFormData({
            date: existingShift.date.split('T')[0],
            shift_type_id: existingShift.shift_type_id,
            outgoing_engineer_id: existingShift.outgoing_engineer_id,
            incoming_engineer_id: existingShift.incoming_engineer_id,
            ongoing_incidents: existingShift.ongoing_incidents || '',
            new_alerts: existingShift.new_alerts || '',
            actions_taken: existingShift.actions_taken || '',
            pending_tasks: existingShift.pending_tasks || '',
            planned_maintenance: existingShift.planned_maintenance || '',
            known_issues: existingShift.known_issues || '',
            escalations: existingShift.escalations || '',
            additional_notes: existingShift.additional_notes || ''
        });
        
      } catch (err) {
        console.error(err);
        alert("Failed to load shift data.");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateShift(id, formData);
      navigate(`/shifts/${id}`);
    } catch (err) {
      alert("Error saving shift: " + err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-secondary">Loading forms...</div>;
  if (members.length === 0 || shiftTypes.length === 0) {
    return (
      <div className="glass-panel text-center" style={{ padding: '3rem' }}>
        <h2>Configuration Required</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>You need to configure at least one Team Member and Shift Type before submitting a handover.</p>
        <button onClick={() => navigate('/admin')} className="btn btn-primary" style={{ marginTop: '2rem' }}>Go to Admin Config</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Edit Handover #{id}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Modify the details of this recorded shift.</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Shift Date</label>
              <input type="date" name="date" className="input-field" value={formData.date} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Shift Type</label>
              <select name="shift_type_id" className="input-field" value={formData.shift_type_id} onChange={handleChange} required>
                {shiftTypes.map(st => <option key={st.id} value={st.id}>{st.name} ({st.time_range})</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Outgoing Engineer</label>
              <select name="outgoing_engineer_id" className="input-field" value={formData.outgoing_engineer_id} onChange={handleChange} required>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Incoming Engineer</label>
              <select name="incoming_engineer_id" className="input-field" value={formData.incoming_engineer_id} onChange={handleChange} required>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

          {/* Text Areas Input Components */}
          {[
            { name: 'ongoing_incidents', label: 'Ongoing Incidents', placeholder: 'Any incidents currently being handled? (Optional)', req: false },
            { name: 'new_alerts', label: 'New Alerts During Shift', placeholder: 'Sentry errors, high memory issues, etc.', req: true },
            { name: 'actions_taken', label: 'Actions Taken', placeholder: 'E.g., RDB dump taken, resolved automatically...', req: true },
            { name: 'pending_tasks', label: 'Pending Tasks', placeholder: 'Tasks to carry over (Optional)', req: false },
            { name: 'planned_maintenance', label: 'Planned Maintenance / Changes', placeholder: 'E.g., Nil', req: true },
            { name: 'known_issues', label: 'Known Issues / Observations', placeholder: 'E.g., Nil', req: true },
            { name: 'escalations', label: 'Escalations / Communications', placeholder: 'Informed crawling team about X...', req: true },
            { name: 'additional_notes', label: 'Additional Notes', placeholder: 'Any other info (Optional)', req: false },
          ].map((field) => (
            <div key={field.name}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>{field.label} {field.req && <span style={{ color: '#ef4444' }}>*</span>}</span>
                {!field.req && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Optional</span>}
              </label>
              <textarea 
                name={field.name}
                className="input-field"
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                required={field.req}
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
              <Save size={18} /> Update Handover
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
