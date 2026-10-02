import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';

export type UserRole = 'seeker' | 'worker';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  switchToSeeker: () => void;
  switchToWorker: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('seeker');
  const router = useRouter();

  const switchToSeeker = () => {
    setRoleState('seeker');
    router.replace('/(seeker)');
  };

  const switchToWorker = () => {
    setRoleState('worker');
    router.replace('/(worker)');
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'seeker') {
      router.replace('/(seeker)');
    } else {
      router.replace('/(worker)');
    }
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        switchToSeeker,
        switchToWorker,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
