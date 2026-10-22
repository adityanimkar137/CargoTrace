import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  Shield,
  Key,
  UserPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Layers,
  Package,
  Server,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiClient } from '../../lib/apiClient.js';
import { SystemStatusModal } from '../../components/feedback/SystemStatusModal.jsx';
import { ShipmentListPage } from '../shipments/pages/ShipmentListPage.jsx';

export function OrganizationView() {
  const {
    user,
    organization,
    role,
    permissions,
    logout
  } = useAuth();
  const [activeTab, setActiveTab] = useState('shipments'); // 'shipments' | 'organization'
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Add Member Form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('reviewer');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [addError, setAddError] = useState(null);
  const [createdMemberInfo, setCreatedMemberInfo] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Reset Password Modal state
  const [resetModalState, setResetModalState] = useState({
    isOpen: false,
    member: null,
    password: '',
    confirmPassword: '',
    showPassword: false,
    loading: false,
    error: null,
    result: null
  });

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    setMembersError(null);
    try {
      const data = await apiClient.get('/organizations/current/members');
      setMembers(data.members || []);
    } catch (err) {
      setMembersError(err.message || 'Failed to retrieve organization members');
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError(null);

    const emailTrimmed = newEmail.trim();
    if (!emailTrimmed) {
      setAddError('Member work email address is required.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setAddError('Initial password is required and must contain at least 8 characters.');
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setAddError('The initial password and confirmation password do not match.');
      return;
    }

    setAddingMember(true);
    try {
      const res = await apiClient.post('/organizations/current/members', {
        email: emailTrimmed,
        displayName: newName.trim() || undefined,
        role: newRole,
        password: newPassword
      });

      setCreatedMemberInfo({
        ...res.member,
        assignedPassword: newPassword
      });
      fetchMembers();
    } catch (err) {
      setAddError(err.message || 'Failed to register new organization member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewEmail('');
    setNewName('');
    setNewRole('reviewer');
    setNewPassword('');
    setNewConfirmPassword('');
    setShowNewPassword(false);
    setAddError(null);
    setCreatedMemberInfo(null);
    setCopiedKey(false);
  };

  const handleCopyCredentials = (emailToCopy, passwordToCopy, roleToCopy) => {
    const text = `CargoTrace Workspace Account:\nEmail: ${emailToCopy}\nPassword: ${passwordToCopy}\nRole: ${roleToCopy}\nWorkspace: ${organization?.name || 'CargoTrace'}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleOpenResetModal = (member) => {
    setResetModalState({
      isOpen: true,
      member,
      password: '',
      confirmPassword: '',
      showPassword: false,
      loading: false,
      error: null,
      result: null
    });
  };

  const handlePerformResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalState.member?.userId) return;

    if (!resetModalState.password || resetModalState.password.length < 8) {
      setResetModalState(prev => ({
        ...prev,
        error: 'Password must be at least 8 characters long.'
      }));
      return;
    }

    if (resetModalState.password !== resetModalState.confirmPassword) {
      setResetModalState(prev => ({
        ...prev,
        error: 'Passwords do not match.'
      }));
      return;
    }

    setResetModalState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await apiClient.post(`/organizations/current/members/${resetModalState.member.userId}/reset-password`, {
        password: resetModalState.password
      });
      setResetModalState(prev => ({
        ...prev,
        loading: false,
        result: {
          ...res.member,
          updatedPassword: resetModalState.password
        }
      }));
    } catch (err) {
      setResetModalState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to update member password'
      }));
    }
  };

  const getRoleBadgeClass = (r) => {
    switch (r?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'investigator':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'reviewer':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Enterprise Workspace Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold tracking-tight text-white">{organization?.name || 'CargoTrace'}</h1>
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium border uppercase ${getRoleBadgeClass(role)}`}>
                {role || 'Viewer'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Tenant slug: <span className="text-slate-300">{organization?.slug}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'shipments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Shipments</span>
          </button>

          <button
            onClick={() => setActiveTab('organization')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'organization'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Organization</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 transition cursor-pointer"
            title="Inspect platform connection and AI engine health"
          >
            <Server className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <span className="text-xs font-semibold text-white block">{user?.displayName}</span>
              <span className="text-[11px] text-slate-400 font-mono">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 px-3 py-1.5 rounded-md border border-rose-900/80 transition cursor-pointer"
              title="Sign out of workspace"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'shipments' ? (
          <ShipmentListPage />
        ) : (
          <>
            {/* Multi-Tenant Security Banner */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-900 mt-0.5">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Multi-Tenant Organization Security Active</h2>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                    Every member account is scoped strictly to the <span className="text-slate-200 font-medium">{organization?.name}</span> tenant. Roles and permissions are cryptographically verified on every server request.
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-3 py-1.5 rounded-md shrink-0">
                Verified Tenant Session
              </div>
            </div>

            {/* Organization Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Org Profile Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 mb-3">
                    <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-900">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Organization Profile</h3>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="text-slate-200 font-medium">{organization?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenant Slug:</span>
                      <span className="text-slate-300">{organization?.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-emerald-400 uppercase">{organization?.status || 'Active'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Members:</span>
                      <span className="text-slate-200 tabular-nums">{members.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] text-slate-500">
                  Data isolation boundaries prevent cross-organization record visibility.
                </div>
              </div>

              {/* User Role & Capabilities Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between md:col-span-2">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-900">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Active Capabilities & Access Control</h3>
                        <p className="text-xs text-slate-400">Granted to your current verified account credentials</p>
                      </div>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded font-mono font-medium border uppercase ${getRoleBadgeClass(role)}`}>
                      {role} Role
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                    {permissions.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center space-x-1.5 text-[11px] font-mono bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 text-slate-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] text-slate-500 flex justify-between items-center">
                  <span>Enforced directly on server endpoints and client actions</span>
                  <span className="font-mono text-slate-400 tabular-nums">{permissions.length} active capabilities</span>
                </div>
              </div>
            </div>

            {/* Organization Members Section */}
            <section className="bg-slate-950 border border-slate-800 rounded-xl p-6" aria-labelledby="members-heading">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-900">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 id="members-heading" className="text-sm font-semibold text-white">Organization Members</h3>
                    <p className="text-xs text-slate-400">Authorized personnel registered for the {organization?.name} tenancy</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={fetchMembers}
                    disabled={loadingMembers}
                    className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
                    title="Refresh member list"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingMembers ? 'animate-spin text-blue-400' : ''}`} />
                  </button>

                  {role === 'admin' && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm font-medium transition cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add Member</span>
                    </button>
                  )}
                </div>
              </div>

              {membersError && (
                <div className="mt-4 p-3 bg-rose-950/50 border border-rose-900 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{membersError}</span>
                </div>
              )}

              {/* Members Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">User</th>
                      <th className="py-2.5 px-4 font-medium">Role</th>
                      <th className="py-2.5 px-4 font-medium">Account Status</th>
                      <th className="py-2.5 px-4 font-medium">Joined Date</th>
                      <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {members.map((member) => {
                      const isSelf = member.userId === user?.id || member.email === user?.email;
                      const isAdmin = role === 'admin';

                      return (
                        <tr key={member.membershipId} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 px-4">
                            <div className="font-sans font-medium text-slate-200 flex items-center space-x-1.5">
                              <span>{member.displayName}</span>
                              {isSelf && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px]">{member.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase ${getRoleBadgeClass(member.role)}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              <span className="capitalize">{member.membershipStatus || 'active'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 tabular-nums">
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isAdmin && !isSelf && (
                                <button
                                  onClick={() => handleOpenResetModal(member)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium transition cursor-pointer"
                                  title="Assign new password for this member"
                                >
                                  <Key className="h-3 w-3 text-amber-400" />
                                  <span>Reset Password</span>
                                </button>
                              )}
                              {isSelf && (
                                <span className="text-[11px] text-slate-500 italic">
                                  Current User
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Add Member Modal (Admin Only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Add Organization Member</h3>
              </div>
              <button
                onClick={handleCloseAddModal}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-2.5 bg-rose-950/60 border border-rose-900 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {/* Post-Creation Success Details */}
            {createdMemberInfo ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-300 font-semibold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Member Registered Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    The member account has been registered with active tenant privileges. Provide these assigned credentials to the member so they can log in directly.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Assigned Role:</span>
                    <span className={`px-2 py-0.5 rounded uppercase font-semibold border ${getRoleBadgeClass(createdMemberInfo.role)}`}>
                      {createdMemberInfo.role}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Work Email:</span>
                    <span className="text-white font-medium">{createdMemberInfo.email}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-slate-400 text-[11px] block mb-1">Assigned Password:</label>
                    <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                      <span className="text-amber-300 font-bold tracking-wider">
                        {showNewPassword ? createdMemberInfo.assignedPassword : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-slate-400 hover:text-slate-200 transition p-1"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(createdMemberInfo.email, createdMemberInfo.assignedPassword, createdMemberInfo.role)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition cursor-pointer shadow-sm"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Credentials Copied!' : 'Copy Login Details'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Work Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="member@company.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="reviewer">Reviewer — Review SHA-256 evidence, investigate damage & approve reports</option>
                    <option value="investigator">Investigator — Register shipments, custody events & run AI audits</option>
                    <option value="admin">Admin — Full organization management & member administration</option>
                    <option value="viewer">Viewer — Read-only observation of authorized shipments</option>
                  </select>
                </div>

                {/* Explicit Required Password Field */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Initial Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Must be at least 8 characters long.
                  </p>
                </div>

                {/* Password Confirmation Field */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    placeholder="Re-enter initial password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
                  >
                    {addingMember ? 'Registering...' : 'Register Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal (Admin Only) */}
      {resetModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Reset Member Password</h3>
              </div>
              <button
                onClick={() => setResetModalState({ isOpen: false, member: null, password: '', confirmPassword: '', showPassword: false, loading: false, error: null, result: null })}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {resetModalState.error && (
              <div className="mb-4 p-2.5 bg-rose-950/60 border border-rose-900 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{resetModalState.error}</span>
              </div>
            )}

            {resetModalState.result ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg text-emerald-200">
                  <div className="flex items-center space-x-2 text-emerald-300 font-semibold mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Password Updated Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90">
                    The member can now authenticate using the new password.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 font-mono space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">User:</span>
                    <span className="text-white font-medium">{resetModalState.result.email}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 text-[11px] block mb-1">New Password:</span>
                    <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded border border-slate-700">
                      <span className="text-amber-300 font-bold">{resetModalState.result.updatedPassword}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(resetModalState.result.email, resetModalState.result.updatedPassword, resetModalState.result.role)}
                    className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Copied!' : 'Copy New Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetModalState({ isOpen: false, member: null, password: '', confirmPassword: '', showPassword: false, loading: false, error: null, result: null })}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePerformResetPassword} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="text-slate-400">Target Member:</div>
                  <div className="text-white font-medium">{resetModalState.member?.displayName}</div>
                  <div className="text-slate-400 text-[10px]">{resetModalState.member?.email} ({resetModalState.member?.role})</div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    New Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={resetModalState.showPassword ? 'text' : 'password'}
                      required
                      value={resetModalState.password}
                      onChange={(e) => setResetModalState(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setResetModalState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {resetModalState.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={resetModalState.showPassword ? 'text' : 'password'}
                    required
                    value={resetModalState.confirmPassword}
                    onChange={(e) => setResetModalState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalState({ isOpen: false, member: null, password: '', confirmPassword: '', showPassword: false, loading: false, error: null, result: null })}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetModalState.loading}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
                  >
                    {resetModalState.loading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Telemetry Modal */}
      <SystemStatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />

      {/* Enterprise Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>CargoTrace • Cargo Damage Investigation & Evidence Integrity Platform</div>
        <div className="font-mono text-[11px] text-slate-600">Enterprise Edition</div>
      </footer>
    </div>
  );
}
