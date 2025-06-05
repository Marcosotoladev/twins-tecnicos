// src/lib/firebase/operations.js

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

// ===== CLIENTES =====
export const getClients = async () => {
  try {
    console.log('🔍 Intentando obtener clientes...');
    const q = query(collection(db, 'clients'), orderBy('companyName'));
    const querySnapshot = await getDocs(q);
    console.log('📊 Documentos encontrados:', querySnapshot.docs.length);
    
    const clients = querySnapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      console.log('📄 Cliente:', data);
      return data;
    });
    
    console.log('✅ Clientes finales:', clients);
    return clients;
  } catch (error) {
    console.error('❌ Error getting clients:', error);
    throw error;
  }
};

export const getClient = async (clientId) => {
  try {
    const docRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Cliente no encontrado');
    }
  } catch (error) {
    console.error('Error getting client:', error);
    throw error;
  }
};

export const createClient = async (clientData) => {
  try {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Cliente creado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (clientId, clientData) => {
  try {
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, {
      ...clientData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (clientId) => {
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// ===== VISITAS =====
export const getVisits = async (clientId = null) => {
  try {
    let querySnapshot;
    
    if (clientId) {
      // Solo filtrar por clientId, sin orderBy para evitar error de índice
      const q = query(collection(db, 'visits'), where('clientId', '==', clientId));
      querySnapshot = await getDocs(q);
    } else {
      // Obtener todas las visitas sin orderBy
      querySnapshot = await getDocs(collection(db, 'visits'));
    }
    
    const visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Ordenar en el cliente (JavaScript) en lugar de Firestore
    return visits.sort((a, b) => {
      const dateA = a.scheduledDate?.toDate?.() || new Date(a.scheduledDate);
      const dateB = b.scheduledDate?.toDate?.() || new Date(b.scheduledDate);
      return dateB - dateA; // Más reciente primero
    });
  } catch (error) {
    console.error('Error getting visits:', error);
    // Retornar array vacío en lugar de throw para evitar que falle
    return [];
  }
};

export const createVisit = async (visitData) => {
  try {
    const docRef = await addDoc(collection(db, 'visits'), {
      ...visitData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating visit:', error);
    throw error;
  }
};

export const updateVisit = async (visitId, visitData) => {
  try {
    const visitRef = doc(db, 'visits', visitId);
    await updateDoc(visitRef, {
      ...visitData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating visit:', error);
    throw error;
  }
};


export const deleteVisit = async (visitId) => {
  try {
    await deleteDoc(doc(db, 'visits', visitId));
  } catch (error) {
    console.error('Error deleting visit:', error);
    throw error;
  }
};


// ===== TAREAS CORRECTIVAS =====
export const getCorrectiveTasks = async (clientId = null) => {
  try {
    let querySnapshot;
    
    if (clientId) {
      // Solo filtrar por clientId, sin orderBy
      const q = query(collection(db, 'corrective_tasks'), where('clientId', '==', clientId));
      querySnapshot = await getDocs(q);
    } else {
      // Obtener todas las tareas sin orderBy
      querySnapshot = await getDocs(collection(db, 'corrective_tasks'));
    }
    
    const tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Ordenar en el cliente (JavaScript)
    return tasks.sort((a, b) => {
      const dateA = a.reportedDate?.toDate?.() || new Date(a.reportedDate);
      const dateB = b.reportedDate?.toDate?.() || new Date(b.reportedDate);
      return dateB - dateA; // Más reciente primero
    });
  } catch (error) {
    console.error('Error getting corrective tasks:', error);
    // Retornar array vacío en lugar de throw
    return [];
  }
};

export const createCorrectiveTask = async (taskData) => {
  try {
    const docRef = await addDoc(collection(db, 'corrective_tasks'), {
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating corrective task:', error);
    throw error;
  }
};

export const updateCorrectiveTask = async (taskId, taskData) => {
  try {
    const taskRef = doc(db, 'corrective_tasks', taskId);
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating corrective task:', error);
    throw error;
  }
};

// Agregar después de updateCorrectiveTask:

export const deleteCorrectiveTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, 'corrective_tasks', taskId));
  } catch (error) {
    console.error('Error deleting corrective task:', error);
    throw error;
  }
};