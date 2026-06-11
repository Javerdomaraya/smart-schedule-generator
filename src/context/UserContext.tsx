import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'TEACHER' | 'GUEST';

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  teacherId?: string; // If TEACHER, which teacher are they logged in as details
  setTeacherId: (id: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('ADMIN');

  const [teacherId, setTeacherIdState] = useState<string>(() => {
    const saved = localStorage.getItem('deped_mock_teacher_id');
    return saved || 't-1'; // Default first teacher
  });

  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(true);

  const setRole = (newRole: UserRole) => {
    setRoleState('ADMIN');
  };

  const setTeacherId = (id: string) => {
    setTeacherIdState(id);
    localStorage.setItem('deped_mock_teacher_id', id);
  };

  const setIsLoggedIn = (val: boolean) => {
    setIsLoggedInState(true);
  };

  const logout = () => {
    // No-op for standalone admin app
  };

  return (
    <UserContext.Provider value={{ role, setRole, teacherId, setTeacherId, isLoggedIn, setIsLoggedIn, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
