/**
 * Script de migración: users (role=empresa) → colección empresas
 * Uso: node migrate_empresas.mjs
 */
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCP2lXT7muCMQgUmnenCbAa4WAibfaECRw",
  authDomain: "mudapp-a9d40.firebaseapp.com",
  projectId: "mudapp-a9d40",
  storageBucket: "mudapp-a9d40.appspot.com",
  messagingSenderId: "1055745145885",
  appId: "1:1055745145885:web:f567beff7a6374daee4ee4"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function migrate() {
  console.log('\n🔍 Buscando cuentas empresa en la colección users...\n');

  // Leer todos los usuarios
  const usersSnap = await getDocs(collection(db, 'users'));
  const empresas = [];

  usersSnap.forEach(docSnap => {
    const data = docSnap.data();
    const role = data.role || data.rol;
    if (role === 'empresa') {
      empresas.push({ uid: docSnap.id, ...data });
    }
  });

  console.log(`✅ Encontradas ${empresas.length} cuenta(s) empresa:\n`);
  empresas.forEach(e => {
    console.log(`  - [${e.uid}] ${e.name || e.nombreComercial || '(sin nombre)'} | email: ${e.email}`);
  });

  if (empresas.length === 0) {
    console.log('  (ninguna cuenta empresa encontrada)');
    process.exit(0);
  }

  console.log('\n📦 Iniciando migración a colección "empresas"...\n');

  let migradas = 0;
  let yaExistian = 0;
  let errores = 0;

  for (const empresa of empresas) {
    const empresaRef = doc(db, 'empresas', empresa.uid);
    const existing = await getDoc(empresaRef);

    if (existing.exists()) {
      console.log(`  ⏭  [${empresa.uid}] Ya existe en "empresas" — se omite.`);
      yaExistian++;
      continue;
    }

    // Mapear campos del esquema antiguo al nuevo
    const nuevoDoc = {
      uid: empresa.uid,
      // Datos básicos heredados de Google/users
      nombreComercial: empresa.name || empresa.nombreComercial || '',
      email: empresa.email || '',
      logoUrl: empresa.photoUrl || empresa.photoURL || '',
      // Campos de negocio (vacíos, la empresa los completará en el panel)
      razonSocial: empresa.razonSocial || '',
      cuit: empresa.cuit || empresa.cuil || '',
      telefono: empresa.telefono || empresa.phone || '',
      direccion: empresa.direccion || empresa.address || '',
      localidad: empresa.localidad || empresa.ciudad || '',
      provincia: empresa.provincia || '',
      sitioWeb: empresa.sitioWeb || empresa.website || '',
      descripcion: empresa.descripcion || '',
      // Estado
      estado: empresa.estado || 'trial',
      perfilCompleto: false,
      // Datos de suscripción heredados
      subscription: empresa.subscription || {
        status: 'trial_active',
        planType: 'flota_vehiculos',
        planName: 'Plan Flota por Vehículos (Empresa)',
        trialDaysTotal: 60,
        daysRemaining: 60,
        maxVehicles: 10
      },
      // Timestamps
      migratedAt: new Date().toISOString(),
      createdAt: empresa.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Determinar si el perfil ya tiene datos suficientes para marcarse completo
    const camposObligatorios = ['razonSocial', 'cuit', 'telefono', 'localidad'];
    nuevoDoc.perfilCompleto = camposObligatorios.every(
      c => (nuevoDoc[c] || '').toString().trim().length > 0
    );

    try {
      await setDoc(empresaRef, nuevoDoc);
      console.log(`  ✅ [${empresa.uid}] ${nuevoDoc.nombreComercial || nuevoDoc.email} → migrado ${nuevoDoc.perfilCompleto ? '(perfil completo)' : '(perfil incompleto — pendiente de completar)'}`);
      migradas++;
    } catch (err) {
      console.error(`  ❌ [${empresa.uid}] Error: ${err.message}`);
      errores++;
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`📊 Resumen de migración:`);
  console.log(`   ✅ Migradas:      ${migradas}`);
  console.log(`   ⏭  Ya existían:   ${yaExistian}`);
  console.log(`   ❌ Con error:     ${errores}`);
  console.log('─────────────────────────────────────────\n');

  process.exit(0);
}

migrate().catch(err => {
  console.error('Error fatal en migración:', err);
  process.exit(1);
});
