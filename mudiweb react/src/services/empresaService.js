import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from './firebase';

const COLLECTION = 'empresas';

const empresaService = {
  /**
   * Inicializa el documento de empresa si no existe.
   * Se llama automáticamente al login con role === 'empresa'.
   */
  async initEmpresaDoc(uid, { name, email, photoUrl } = {}) {
    const ref = doc(db, COLLECTION, uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        // Datos básicos tomados del perfil de Google
        nombreComercial: name || '',
        email: email || '',
        logoUrl: photoUrl || '',
        // Campos de negocio a completar por la empresa en el panel
        razonSocial: '',
        cuit: '',
        telefono: '',
        direccion: '',
        localidad: '',
        provincia: '',
        sitioWeb: '',
        descripcion: '',
        // Estado
        estado: 'trial',
        perfilCompleto: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  },

  /**
   * Obtiene el perfil completo de la empresa desde Firestore.
   */
  async getEmpresa(uid) {
    const ref = doc(db, COLLECTION, uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  /**
   * Actualiza el perfil de empresa. Marca perfilCompleto=true si hay razón social y CUIT.
   */
  async updateEmpresa(uid, data) {
    const ref = doc(db, COLLECTION, uid);
    const camposObligatorios = ['razonSocial', 'cuit', 'telefono', 'localidad'];
    const perfilCompleto = camposObligatorios.every(
      (c) => (data[c] || '').toString().trim().length > 0
    );

    await updateDoc(ref, {
      ...data,
      perfilCompleto,
      updatedAt: serverTimestamp()
    });

    return perfilCompleto;
  }
};

export default empresaService;
