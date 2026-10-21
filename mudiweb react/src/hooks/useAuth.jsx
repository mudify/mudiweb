import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  auth,
  db,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
  googleProvider,
  signInWithPopup,
  signOut
} from '../services/firebase';
import empresaService from '../services/empresaService';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'mudify_user_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegisteringRef = useRef(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      // Si hay un registro en curso (lanzado explícitamente desde loginWithGoogle),
      // no intervenir aquí para evitar pisar o cancelar la escritura en Firestore.
      if (isRegisteringRef.current) {
        return;
      }

      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          let snap;
          try {
            snap = await getDocFromServer(userDocRef);
          } catch (serverErr) {
            console.warn('getDocFromServer falló en onAuthStateChanged, intentando getDoc:', serverErr);
            snap = await getDoc(userDocRef);
          }

          if (snap.exists()) {
            const data = snap.data();
            const rawRole = data.role || data.rol || 'conductor';
            // Doble criterio: campo role='empresa' O flag isEmpresa=true
            const normalizedRole = (rawRole === 'empresa' || data.isEmpresa === true) ? 'empresa' : 'conductor';
            const prof = {
              uid: fbUser.uid,
              name: data.name || fbUser.displayName,
              email: data.email || fbUser.email,
              photoUrl: data.photoUrl || fbUser.photoURL,
              role: normalizedRole,
              isEmpresa: normalizedRole === 'empresa',
              subscription: data.subscription || {
                planName: normalizedRole === 'empresa' ? 'Plan Flota por Vehículos' : 'Plan Fletero Pro',
                daysRemaining: 60,
                maxVehicles: normalizedRole === 'empresa' ? 10 : 1
              }
            };
            const basicUser = {
              uid: fbUser.uid,
              displayName: data.name || fbUser.displayName || 'Usuario Mudify',
              name: data.name || fbUser.displayName || 'Usuario Mudify',
              email: fbUser.email,
              photoURL: data.photoUrl || fbUser.photoURL || '',
              avatarUrl: data.photoUrl || fbUser.photoURL || ''
            };

            // Solo establecemos user y profile cuando el documento EXISTE en Firestore
            setUser(basicUser);
            setProfile(prof);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(prof));

            if (normalizedRole === 'empresa') {
              empresaService.initEmpresaDoc(fbUser.uid, {
                name: data.name || fbUser.displayName,
                email: data.email || fbUser.email,
                photoUrl: data.photoUrl || fbUser.photoURL
              }).catch(err => console.warn('initEmpresaDoc:', err));
            }
          } else {
            // El usuario autenticado en Google NO está registrado en Mudify.
            // NUNCA asignar perfil por defecto ni admitirlo al sistema.
            // Desloguear de Firebase Auth inmediatamente y asegurar estados nulos.
            await signOut(auth).catch(() => {});
            setUser(null);
            setProfile(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } catch (err) {
          console.warn('Error verificando usuario en Firestore:', err);
          await signOut(auth).catch(() => {});
          setUser(null);
          setProfile(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (chosenRole = 'conductor', isRegister = false) => {
    // Sanitizar chosenRole (puede ser un SyntheticEvent si se pasa en onClick={signInWithGoogle})
    const safeRole = (typeof chosenRole === 'string' && ['cliente', 'conductor', 'empresa'].includes(chosenRole))
      ? chosenRole
      : 'conductor';
    const safeIsRegister = Boolean(isRegister);

    if (safeIsRegister) {
      isRegisteringRef.current = true;
    }

    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      let snap;
      try {
        snap = await getDocFromServer(userDocRef);
      } catch (e) {
        snap = await getDoc(userDocRef);
      }

      if (!snap.exists()) {
        // Usuario NO registrado en Mudify
        if (!safeIsRegister) {
          // Intento de LOGIN rechazado: desloguear y lanzar error inmediatamente
          await signOut(auth).catch(() => {});
          setUser(null);
          setProfile(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          const err = new Error('Esta cuenta de Google no está registrada en Mudify. Por favor, registrate primero.');
          err.code = 'USER_NOT_REGISTERED';
          throw err;
        }

        // REGISTRO NUEVO: crear el documento en Firestore
        let subscriptionData = null;
        if (safeRole === 'empresa') {
          subscriptionData = {
            status: 'trial_active',
            planType: 'flota_vehiculos',
            planName: 'Plan Flota por Vehículos (Empresa)',
            trialDaysTotal: 60,
            daysRemaining: 60,
            maxVehicles: 10
          };
        } else {
          subscriptionData = {
            status: 'trial_active',
            planType: 'fletero_pro',
            planName: 'Plan Fletero Pro',
            trialDaysTotal: 60,
            daysRemaining: 60,
            maxVehicles: 1
          };
        }

        const userDataToSave = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Usuario Mudify',
          email: fbUser.email,
          photoUrl: fbUser.photoURL || '',
          role: safeRole,
          isEmpresa: safeRole === 'empresa',
          subscription: subscriptionData,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        };

        await setDoc(userDocRef, userDataToSave);

        if (safeRole === 'empresa') {
          await empresaService.initEmpresaDoc(fbUser.uid, {
            name: fbUser.displayName,
            email: fbUser.email,
            photoUrl: fbUser.photoURL
          }).catch(err => console.warn('initEmpresaDoc register:', err));
        }

        const newProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Usuario Mudify',
          email: fbUser.email,
          photoUrl: fbUser.photoURL || '',
          role: safeRole,
          isEmpresa: safeRole === 'empresa',
          subscription: subscriptionData
        };

        const basicUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Usuario Mudify',
          name: fbUser.displayName || 'Usuario Mudify',
          email: fbUser.email,
          photoURL: fbUser.photoURL || '',
          avatarUrl: fbUser.photoURL || ''
        };

        setUser(basicUser);
        setProfile(newProfile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));

        return { user: fbUser, role: safeRole, isEmpresa: safeRole === 'empresa' };

      } else {
        // Usuario YA REGISTRADO en Firestore
        const existingData = snap.data();
        let effectiveRole = safeRole;
        // PROTECCIÓN PERMANENTE: Si la cuenta ya tiene role='empresa' o isEmpresa=true, NUNCA se degrada
        if (existingData.role === 'empresa' || existingData.isEmpresa === true) {
          effectiveRole = 'empresa';
        } else if (existingData.role) {
          effectiveRole = existingData.role;
        }

        const subscriptionData = existingData.subscription || {
          planName: effectiveRole === 'empresa' ? 'Plan Flota por Vehículos' : 'Plan Fletero Pro',
          daysRemaining: 60,
          maxVehicles: effectiveRole === 'empresa' ? 10 : 1
        };

        await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });

        const updatedProfile = {
          uid: fbUser.uid,
          name: existingData.name || fbUser.displayName,
          email: existingData.email || fbUser.email,
          photoUrl: existingData.photoUrl || fbUser.photoURL,
          role: effectiveRole,
          isEmpresa: effectiveRole === 'empresa',
          subscription: subscriptionData
        };

        const basicUser = {
          uid: fbUser.uid,
          displayName: existingData.name || fbUser.displayName || 'Usuario Mudify',
          name: existingData.name || fbUser.displayName || 'Usuario Mudify',
          email: fbUser.email,
          photoURL: existingData.photoUrl || fbUser.photoURL || '',
          avatarUrl: existingData.photoUrl || fbUser.photoURL || ''
        };

        setUser(basicUser);
        setProfile(updatedProfile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedProfile));

        if (effectiveRole === 'empresa') {
          empresaService.initEmpresaDoc(fbUser.uid, {
            name: fbUser.displayName,
            email: fbUser.email,
            photoUrl: fbUser.photoURL
          }).catch(err => console.warn('initEmpresaDoc login:', err));
        }

        return { user: fbUser, role: effectiveRole, isEmpresa: effectiveRole === 'empresa' };
      }
    } catch (err) {
      if (err.code === 'USER_NOT_REGISTERED') {
        await signOut(auth).catch(() => {});
        setUser(null);
        setProfile(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      throw err;
    } finally {
      isRegisteringRef.current = false;
      setLoading(false);
    }
  };

  const updateUserData = async ({ name, photoUrl, role }) => {
    if (!user?.uid) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (role !== undefined) {
      updates.role = role;
      updates.isEmpresa = role === 'empresa';
    }
    updates.lastUpdated = serverTimestamp();

    await setDoc(userDocRef, updates, { merge: true });

    // Si es empresa, también sincronizar empresas/{uid}
    const isNowEmpresa = role === 'empresa' || (!role && (profile?.role === 'empresa' || profile?.isEmpresa));
    if (isNowEmpresa) {
      const empRef = doc(db, 'empresas', user.uid);
      await setDoc(empRef, {
        ...(name ? { nombreComercial: name } : {}),
        ...(photoUrl ? { logoUrl: photoUrl } : {}),
        role: 'empresa',
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }

    const updatedUser = {
      ...user,
      ...(name ? { displayName: name, name } : {}),
      ...(photoUrl ? { photoURL: photoUrl, avatarUrl: photoUrl } : {})
    };
    const updatedProfile = {
      ...profile,
      ...(name ? { name } : {}),
      ...(photoUrl ? { photoUrl } : {}),
      ...(role !== undefined ? { role, isEmpresa: role === 'empresa' } : {})
    };

    setUser(updatedUser);
    setProfile(updatedProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedProfile));
  };

  const logout = async () => {
    try {
      await signOut(auth).catch(() => {});
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setProfile(null);
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle: loginWithGoogle,
    updateUserData,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
