import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../services/api';

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: 'Active' | 'Prospect' | 'Lead';
  lastActivity: string;
  dealValue: number;
}

export const Contacts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All Segments');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Placeholder data - will be replaced with API call
  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Rachel Kim',
      email: 'rachel@acmecorp.com',
      company: 'Acme Corp',
      role: 'VP of Sales',
      status: 'Active',
      lastActivity: '2 hours ago',
      dealValue: 125000,
    },
    {
      id: '2',
      name: 'John Davis',
      email: 'john@globalind.com',
      company: 'Global Industries',
      role: 'Director',
      status: 'Prospect',
      lastActivity: '1 day ago',
      dealValue: 95000,
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma@techstart.io',
      company: 'TechStart Inc',
      role: 'CEO',
      status: 'Active',
      lastActivity: '5 hours ago',
      dealValue: 78500,
    },
    {
      id: '4',
      name: 'Sarah Miller',
      email: 'sarah@brightfuture.co',
      company: 'Bright Future Co',
      role: 'CTO',
      status: 'Lead',
      lastActivity: '3 days ago',
      dealValue: 42000,
    },
    {
      id: '5',
      name: 'Alex Lee',
      email: 'alex@innovate.com',
      company: 'Innovate Solutions',
      role: 'Product Manager',
      status: 'Active',
      lastActivity: 'Yesterday',
      dealValue: 52000,
    },
    {
      id: '6',
      name: 'Mike Johnson',
      email: 'mike@peakperf.com',
      company: 'Peak Performance',
      role: 'Operations Lead',
      status: 'Prospect',
      lastActivity: '2 days ago',
      dealValue: 68000,
    },
  ];

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-orange-600',
      'bg-pink-600',
      'bg-indigo-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Prospect':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Lead':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatIndianCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All Status' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          + Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>All Segments</option>
          <option>Enterprise</option>
          <option>SMB</option>
          <option>Startup</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Prospect</option>
          <option>Lead</option>
        </select>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-6 py-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deal Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No contacts found
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`${getAvatarColor(
                          contact.name
                        )} h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                      >
                        {getInitials(contact.name)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.name}
                        </div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                        contact.status
                      )}`}
                    >
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.lastActivity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatIndianCurrency(contact.dealValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                    Edit
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </div>
    </div>
  );
};
