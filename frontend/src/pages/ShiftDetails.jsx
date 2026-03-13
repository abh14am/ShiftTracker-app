import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getShiftById } from '../api';
import { ArrowLeft, Clock, User, AlertCircle, CheckCircle, Info, Edit } from 'lucide-react';

export default function ShiftDetails() {
  const { id } = useParams();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShift = async () => {
      try {
        const data = await getShiftById(id);
        setShift(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShift();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-secondary">Loading shift details...</div>;
  if (!shift) return <div className="text-center py-12 text-secondary">Shift not found.</div>;

  const DetailRow = ({ label, value, icon: Icon, color = "var(--text-primary)" }) => {
    if (!value) return null;
    return (
      <div style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>
          {Icon && <Icon size={16} />} 
          {label}
        </h4>
        <div style={{ color: color, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {value}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', fontWeight: 500 }} className="hover-bg-surface p-2 rounded">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{shift.shift_type.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14}/> {shift.shift_type.time_range}</span>
              <span>•</span>
              <span>{new Date(shift.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 600 }}>
              ID #{shift.id}
            </span>
            <Link to={`/shifts/${shift.id}/edit`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} color="var(--accent-primary)" /> Team Handover
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'block' }}>Outgoing Engineer</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{shift.outgoing_engineer.name}</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--accent-primary)', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)' }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'block' }}>Incoming Engineer</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{shift.incoming_engineer.name}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Shift Report Details</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <DetailRow label="New Alerts During Shift" value={shift.new_alerts} icon={AlertCircle} color="#fbbf24" />
          <DetailRow label="Ongoing Incidents" value={shift.ongoing_incidents} icon={AlertCircle} color="#f87171" />
          <DetailRow label="Actions Taken" value={shift.actions_taken} icon={CheckCircle} color="#34d399" />
          <DetailRow label="Pending Tasks" value={shift.pending_tasks} icon={Clock} />
          <DetailRow label="Planned Maintenance / Changes" value={shift.planned_maintenance} icon={Info} />
          <DetailRow label="Known Issues / Observations" value={shift.known_issues} icon={Info} />
          <DetailRow label="Escalations / Communications" value={shift.escalations} icon={AlertCircle} color="#fcd34d" />
          <DetailRow label="Additional Notes" value={shift.additional_notes} icon={Info} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
}
