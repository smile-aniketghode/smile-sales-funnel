// Recent Contacts widget - shows last 5 contacts with quick view

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { contactAPI } from '../services/api';
import { Link } from 'react-router-dom';

export const RecentContacts: React.FC = () => {
  const { data: contacts, isLoading, isError } = useQuery({
    queryKey: ['contacts', 'recent'],
    queryFn: () => contactAPI.getContacts(5), // Get 5 most recent
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
  });

  const formatIndianCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">👥</span>
          Recent Contacts
        </h3>
        <span className="text-sm text-gray-500">
          {contacts?.count || 0} total
        </span>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">Failed to load contacts</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {contacts?.contacts && contacts.contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{contact.name}</h4>
                      <p className="text-sm text-gray-600 truncate">
                        {contact.position} @ {contact.company}
                      </p>
                      <p className="text-xs text-gray-500">{contact.email}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {contact.deal_value > 0 && (
                      <p className="font-semibold text-green-700">
                        {formatIndianCurrency(contact.deal_value)}
                      </p>
                    )}
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      contact.segment === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                      contact.segment === 'Mid-Market' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {contact.segment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No contacts yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Contacts extracted from emails will appear here
              </p>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link
              to="/contacts"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
            >
              View all contacts
              <span className="ml-1">→</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
