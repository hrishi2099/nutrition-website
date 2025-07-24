'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  avatar?: string;
  email?: string;
  linkedIn?: string;
  twitter?: string;
  specialties: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    avatar: '',
    email: '',
    linkedIn: '',
    twitter: '',
    specialties: '',
    displayOrder: 0,
  });

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/team', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      bio: '',
      avatar: '',
      email: '',
      linkedIn: '',
      twitter: '',
      specialties: '',
      displayOrder: 0,
    });
    setEditingMember(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (member: TeamMember) => {
    setFormData({
      name: member.name,
      position: member.position,
      bio: member.bio,
      avatar: member.avatar || '',
      email: member.email || '',
      linkedIn: member.linkedIn || '',
      twitter: member.twitter || '',
      specialties: member.specialties.join(', '),
      displayOrder: member.displayOrder,
    });
    setEditingMember(member);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const specialtiesArray = formData.specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        ...formData,
        specialties: specialtiesArray,
      };

      const response = await fetch(
        editingMember ? `/api/admin/team/${editingMember.id}` : '/api/admin/team',
        {
          method: editingMember ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(editingMember ? 'Failed to update team member' : 'Failed to create team member');
      }

      const data = await response.json();
      
      if (editingMember) {
        setTeamMembers(teamMembers.map(member => 
          member.id === editingMember.id ? data.teamMember : member
        ));
      } else {
        setTeamMembers([...teamMembers, data.teamMember]);
      }

      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      const member = teamMembers.find(m => m.id === memberId);
      if (!member) return;

      const response = await fetch(`/api/admin/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...member, isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team member status');
      }

      const data = await response.json();
      setTeamMembers(teamMembers.map(member => 
        member.id === memberId ? data.teamMember : member
      ));
    } catch (err) {
      alert('Failed to update team member status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/team/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team member');
      }

      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
    } catch (err) {
      alert('Failed to delete team member: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </AdminSidebar>
    );
  }

  if (error) {
    return (
      <AdminSidebar>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchTeamMembers}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Try Again
          </button>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your team members displayed on the About page</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center space-x-2"
          >
            <span>👤</span>
            <span>Add Team Member</span>
          </button>
        </div>

        {/* Team Members List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members ({teamMembers.length})</h2>
          </div>
          
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No team members found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Add your first team member to get started
              </p>
              <button
                onClick={openCreateModal}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                Add First Team Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{member.avatar || '👤'}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleMemberStatus(member.id, member.isActive)}
                        className={`${
                          member.isActive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        } hover:opacity-75`}
                        title={member.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {member.isActive ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{member.name}</h3>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-2">{member.position}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">{member.bio}</p>
                  
                  {member.specialties.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.slice(0, 3).map((specialty, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                            {specialty}
                          </span>
                        ))}
                        {member.specialties.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded">
                            +{member.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.isActive 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Order: {member.displayOrder}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position *
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Lead Nutritionist"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio *
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Brief description of background and expertise"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Avatar (Emoji or URL)
                    </label>
                    <input
                      type="text"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="👩‍⚕️ or image URL"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specialties (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Clinical Nutrition, Sports Nutrition, Weight Management"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.linkedIn}
                      onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {editingMember ? 'Update Team Member' : 'Add Team Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}