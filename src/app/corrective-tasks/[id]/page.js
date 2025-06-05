// src/app/corrective-tasks/[id]/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, Building, Calendar, User, FileText, Clock, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCorrectiveTasks, getClient, updateCorrectiveTask, deleteCorrectiveTask } from '@/lib/firebase/operations';
import { AVAILABLE_TECHNICIANS } from '@/lib/constants';


export default function CorrectiveTaskDetail() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Estado del formulario de completado
  const [completionData, setCompletionData] = useState({
    status: 'in_progress',
    technicians: [''],
    notes: '',
    completedDate: null
  });

  const availableTechnicians = AVAILABLE_TECHNICIANS;

  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setLoading(true);
        const tasks = await getCorrectiveTasks();
        const taskData = tasks.find(t => t.id === params.id);

        if (!taskData) {
          alert('Tarea no encontrada');
          router.push('/corrective-tasks');
          return;
        }

        const clientData = await getClient(taskData.clientId);

        setTask(taskData);
        setClient(clientData);

        // Pre-cargar datos del formulario
        setCompletionData({
          status: taskData.status || 'in_progress',
          technicians: taskData.completedBy && taskData.completedBy.length > 0
            ? taskData.completedBy
            : [''],
          notes: taskData.notes || '',
          completedDate: taskData.completedDate
        });
      } catch (error) {
        console.error('Error cargando tarea:', error);
        alert('Error al cargar la tarea');
        router.push('/corrective-tasks');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadTaskData();
    }
  }, [params.id, router]);

  const handleTechnicianChange = (index, value) => {
    setCompletionData(prev => ({
      ...prev,
      technicians: prev.technicians.map((tech, i) =>
        i === index ? value : tech
      )
    }));
  };

  const addTechnician = () => {
    setCompletionData(prev => ({
      ...prev,
      technicians: [...prev.technicians, '']
    }));
  };

  const removeTechnician = (index) => {
    if (completionData.technicians.length > 1) {
      setCompletionData(prev => ({
        ...prev,
        technicians: prev.technicians.filter((_, i) => i !== index)
      }));
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);

      // Filtrar técnicos vacíos
      const technicians = completionData.technicians.filter(tech => tech.trim() !== '');

      if (newStatus === 'completed' && technicians.length === 0) {
        alert('Debe asignar al menos un técnico para completar la tarea');
        return;
      }

      const updateData = {
        status: newStatus,
        completedBy: technicians,
        notes: completionData.notes
      };

      // Si se está completando, agregar fecha de completado
      if (newStatus === 'completed') {
        updateData.completedDate = new Date();
      }

      await updateCorrectiveTask(params.id, updateData);

      // Actualizar el estado local
      setTask(prev => ({ ...prev, ...updateData }));
      setCompletionData(prev => ({ ...prev, status: newStatus }));

      // Si se completó, ir de vuelta a la lista
      if (newStatus === 'completed') {
        router.push('/corrective-tasks');
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      alert('Error al actualizar la tarea');
    } finally {
      setUpdating(false);
    }
  };

  // Agregar esta función después de handleUpdateStatus:

const handleDelete = async () => {
  const confirmDelete = confirm(
    `¿Estás seguro de eliminar esta tarea correctiva completada?\n\n"${task?.description}"\n\nEsta acción no se puede deshacer.`
  );
  
  if (!confirmDelete) return;

  try {
    setUpdating(true);
    await deleteCorrectiveTask(params.id);
    router.push('/corrective-tasks');
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    alert('Error al eliminar la tarea');
  } finally {
    setUpdating(false);
  }
};

  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'bg-red-100 text-red-800 border-red-300',
      'normal': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'next_visit': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'urgent': 'Urgente',
      'normal': 'Normal',
      'next_visit': 'Próxima Visita'
    };
    return labels[priority] || priority;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-red-100 text-red-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pendiente',
      'in_progress': 'En Proceso',
      'completed': 'Completada'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando tarea...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const isCompleted = task?.status === 'completed';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/corrective-tasks"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isCompleted ? 'Tarea Completada' : 'Procesar Tarea Correctiva'}
                </h1>
                <p className="text-sm text-gray-500">
                  {client?.companyName}
                </p>
              </div>
            </div>

<div className="flex items-center space-x-2">
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task?.priority)}`}>
    {getPriorityLabel(task?.priority)}
  </span>
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task?.status)}`}>
    {getStatusLabel(task?.status)}
  </span>
  
  {/* Botón eliminar para tareas completadas */}
  {isCompleted && (
    <button
      onClick={handleDelete}
      disabled={updating}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 flex items-center space-x-1"
    >
      <Trash2 size={14} />
      <span>Eliminar</span>
    </button>
  )}
</div>
</div>
          {/* Información de la tarea */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Información de la Tarea
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    Cliente
                  </span>
                  <p className="text-gray-900 mt-1">{client?.companyName}</p>
                  <p className="text-sm text-gray-500">{client?.address}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Descripción del Problema
                  </span>
                  <p className="text-gray-900 mt-1">{task?.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Fecha de Reporte
                  </span>
                  <p className="text-gray-900 mt-1">{formatDate(task?.reportedDate)}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Reportado por
                  </span>
                  <p className="text-gray-900 mt-1">{task?.reportedBy}</p>
                </div>

                {isCompleted && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Fecha de Completado
                    </span>
                    <p className="text-gray-900 mt-1">{formatDate(task?.completedDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isCompleted ? (
            /* Formulario de procesamiento */
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                {task?.status === 'pending' ? 'Iniciar Procesamiento' : 'Completar Tarea'}
              </h3>

              {/* Técnicos asignados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Técnicos Asignados *
                </label>
                <div className="space-y-3">
                  {completionData.technicians.map((technician, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={technician}
                        onChange={(e) => handleTechnicianChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Seleccionar técnico...</option>
                        {availableTechnicians.map((tech) => (
                          <option key={tech} value={tech}>
                            {tech}
                          </option>
                        ))}
                      </select>
                      {completionData.technicians.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTechnician(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTechnician}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    + Agregar técnico
                  </button>
                </div>
              </div>

              {/* Notas del trabajo */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Notas del Trabajo Realizado
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={completionData.notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Describe el trabajo realizado, materiales utilizados, etc."
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/corrective-tasks"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </Link>

                {task?.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={updating}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {updating ? 'Actualizando...' : 'Marcar En Proceso'}
                  </button>
                )}

                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updating}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>{updating ? 'Completando...' : 'Completar Tarea'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Vista de tarea completada */
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Trabajo Completado
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-500">Técnicos:</span>
                  <p className="text-gray-900">{task.completedBy?.join(', ') || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Fecha de Completado:</span>
                  <p className="text-gray-900">{formatDate(task.completedDate)}</p>
                </div>
              </div>

              {task.notes && (
                <div>
                  <span className="font-medium text-gray-500">Notas del Trabajo:</span>
                  <p className="text-gray-900 mt-1">{task.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}