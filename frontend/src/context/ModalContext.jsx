import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  // estado: { isOpen: boolean, view: 'LOGIN' | 'REGISTER' | 'FORGOT', ...extraData }
  const [modalState, setModalState] = useState({ isOpen: false, view: 'LOGIN' });

  const openAuthModal = (view = 'LOGIN') => {
    setModalState({ isOpen: true, view });
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const switchView = (view) => {
    setModalState({ ...modalState, view });
  };

  return (
    <ModalContext.Provider value={{ modalState, openAuthModal, closeModal, switchView }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);