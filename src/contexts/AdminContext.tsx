'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminContextType {
  isAdmin: boolean;
  adminUser: AdminUser | null;
  isLoading: boolean;
  checkAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/verify', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(true);
        setAdminUser(data.user);
      } else {
        setIsAdmin(false);
        setAdminUser(null);
      }
    } catch {
      setIsAdmin(false);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminUser,
        isLoading,
        checkAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}