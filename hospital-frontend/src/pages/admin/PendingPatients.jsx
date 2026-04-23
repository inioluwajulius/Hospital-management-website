import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const PendingDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [rejecting, setRejecting] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users/registrations/pending');
      const pendingDoctors = response.data?.filter(user => user.role === 'doctor') || [];
      setDoctors(pendingDoctors);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch pending doctors');
      console.error('Error fetching pending doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      setApproving(prev => ({ ...prev, [doctorId]: true }));
      setError('');
      await api.put(`/users/${doctorId}/approve`);
      setSuccess('Doctor approved successfully!');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve doctor');
      console.error('Approval error:', err);
    } finally {
      setApproving(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleReject = async (doctorId) => {
    try {
      setRejecting(prev => ({ ...prev, [doctorId]: true }));
      setError('');
      await api.put(`/users/${doctorId}/reject`);
      setSuccess('Doctor rejected successfully');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject doctor');
      console.error('Rejection error:', err);
    } finally {
      setRejecting(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pending Doctor Approvals</h2>
          <p className="text-slate-500 text-sm mt-1">Review and approve new doctor registrations.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary mr-2" size={20} />
          <span>Loading pending doctors...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pending Doctor Approvals</h2>
        <p className="text-slate-500 text-sm mt-1">Review and approve new doctor registrations.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Pending Registrations</h3>
            <p className="text-xs text-slate-500 mt-1">
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <button
            onClick={fetchPendingDoctors}
            disabled={loading}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {doctors.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">No Pending Approvals</h4>
            <p className="text-slate-500">All doctor registrations have been reviewed.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Doctor Name</p>
                        <p className="text-sm font-bold text-slate-900">{doctor.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Email</p>
                        <p className="text-sm text-slate-700 break-all">{doctor.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Role</p>
                        <p className="text-sm font-mono text-slate-700 bg-slate-50 px-3 py-1 rounded inline-block capitalize">
                          {doctor.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Registration Date</p>
                        <p className="text-sm text-slate-700">
                          {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Status</p>
                        <p className="text-sm text-slate-700 capitalize">{doctor.status || 'pending'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleApprove(doctor._id)}
                    disabled={approving[doctor._id] || rejecting[doctor._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {approving[doctor._id] ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(doctor._id)}
                    disabled={rejecting[doctor._id] || approving[doctor._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {rejecting[doctor._id] ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingDoctors;
