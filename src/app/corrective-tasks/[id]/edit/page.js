// src/app/corrective-tasks/[id]/edit/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Building, FileText, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCorrectiveTasks, getClient, updateCorrectiveTask, deleteCorrectiveTask, getClients } from '@/lib/firebase/operations';

export default function EditCorrectiveTask() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [task, setTask] = useState(null);
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    priority: 'normal',
    reportedBy: '',
    notes: ''
  });

  const availableTechnicians = [
    'Juan Pérez',
    'María García',
    'Carlos López',
    'Ana Martínez'
  ];

  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setLoading(true);
        
        // Cargar tareas y clientes
        const [tasks, clientsData] = await Promise.all([
          getCorrectiveTasks(),
          getClients()
        ]);
        
        const taskData = tasks.find(t => t.id === params.id);
        
        if (!taskData) {
          alert('Tarea no encontrada');
          router.push('/corrective-tasks');
          return;
        }

        // Verificar que la tarea se pueda editar
        if (taskData.status === 'completed') {
          alert('No se puede editar una tarea completada');
          router.push('/corrective-tasks');
          return;
        }

        const clientData = await getClient(taskData.clientId);
        
        setTask(taskData);
        setClient(clientData);
        setClients(clientsData);
        
        // Pre-cargar datos del formulario
        setFormData({
          clientId: taskData.clientId,
          description: taskData.description || '',
          priority: taskData.priority || 'normal',
          reportedBy: taskData.reportedBy || '',
          notes: taskData.notes || ''
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      alert('Por favor selecciona un cliente');
      return;
    }

    if (!formData.description.trim()) {
      alert('Por favor describe el problema');
      return;
    }

    if (!formData.reportedBy) {
      alert('Por favor selecciona quien reporta el problema');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        clientId: formData.clientId,
        description: formData.description.trim(),
        priority: formData.priority,
        reportedBy: formData.reportedBy,
        notes: formData.notes.trim()
      };

      await updateCorrectiveTask(params.id, updateData);
      router.push('/corrective-tasks');
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      alert('Error al actualizar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm(
      `¿Estás seguro de eliminar esta tarea correctiva?\n\n"${task?.description}"\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await deleteCorrectiveTask(params.id);
      router.push('/corrective-tasks');
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      alert('Error al eliminar la tarea');
    } finally {
      setDeleting(false);
    }
  };

  const getPriorityInfo = (priority) => {
    const info = {
      'urgent': {
        label: 'Urgente',
        description: 'Requiere atención inmediata',
        color: 'text-red-600 bg-red-50 border-red-200'
      },
      'normal': {
        label: 'Normal',
        description: 'Se puede programar en los próximos días',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      },
      'next_visit': {
        label: 'Próxima Visita',
        description: 'Se puede resolver en la siguiente visita programada',
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      }
    };
    return info[priority] || info.normal;
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
                <h1 className="text-2xl font-bold text-gray-900">Editar Tarea Correctiva</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Modifica la tarea para {client?.companyName}
                </p>
              </div>
            </div>
            
            {/* Botón eliminar */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>{deleting ? 'Eliminando...' : 'Eliminar Tarea'}</span>
            </button>
          </div>

          {/* Información actual */}
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-orange-900 mb-2">Tarea Actual:</h4>
            <div className="text-sm text-orange-800">
              <p><strong>{client?.companyName}</strong></p>
              <p>Problema: {task?.description}</p>
              <p>Prioridad: {getPriorityInfo(task?.priority).label}</p>
              <p>Reportado: {formatDate(task?.reportedDate)} por {task?.reportedBy}</p>
              <p>Estado: {task?.status === 'pending' ? 'Pendiente' : task?.status === 'in_progress' ? 'En Proceso' : 'Completada'}</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Selección de Cliente */}
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Cliente *
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  required
                  value={formData.clientId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} - {client.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción del Problema */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  Descripción del Problema *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Describe detalladamente el problema encontrado..."
                />
              </div>

              {/* Prioridad */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad *
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  value={formData.priority}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente</option>
                  <option value="next_visit">Próxima Visita</option>
                </select>
                
                {/* Información de la prioridad seleccionada */}
                <div className={`mt-2 p-3 rounded-md border ${getPriorityInfo(formData.priority).color}`}>
                  <div className="text-sm font-medium">
                    {getPriorityInfo(formData.priority).label}
                  </div>
                  <div className="text-xs mt-1">
                    {getPriorityInfo(formData.priority).description}
                  </div>
                </div>
              </div>

              {/* Reportado por */}
              <div>
                <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-700 mb-2">
                  Reportado por *
                </label>
                <select
                  id="reportedBy"
                  name="reportedBy"
                  required
                  value={formData.reportedBy}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Seleccionar técnico...</option>
                  {availableTechnicians.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas adicionales */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Notas Adicionales (opcional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Observaciones adicionales, contexto, etc."
                />
              </div>

              {/* Cliente seleccionado info */}
              {formData.clientId && clients.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Cliente:</h4>
                  {(() => {
                    const selectedClient = clients.find(c => c.id === formData.clientId);
                    return selectedClient ? (
                      <div className="text-sm text-green-800">
                        <p><strong>{selectedClient.companyName}</strong></p>
                        <p>{selectedClient.address}</p>
                        <p>Referente: {selectedClient.referentName} ({selectedClient.referentPosition})</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/corrective-tasks"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}