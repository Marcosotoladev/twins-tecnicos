// src/app/corrective-tasks/new/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Building, FileText } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { createCorrectiveTask, getClients } from '@/lib/firebase/operations';
import { AVAILABLE_TECHNICIANS } from '@/lib/constants';


export default function NewCorrectiveTask() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState({
    clientId: preselectedClientId || '',
    description: '',
    priority: 'normal',
    reportedBy: '',
    notes: ''
  });

  // Lista de técnicos disponibles 
const availableTechnicians = AVAILABLE_TECHNICIANS;

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error cargando clientes:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

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
      setLoading(true);

      const taskData = {
        clientId: formData.clientId,
        originVisitId: null, // Es una tarea manual, no viene de una visita
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'pending',
        reportedDate: new Date(),
        reportedBy: formData.reportedBy,
        completedDate: null,
        completedBy: [],
        notes: formData.notes.trim(),
        photos: []
      };

      await createCorrectiveTask(taskData);
      router.push('/corrective-tasks');
    } catch (error) {
      console.error('Error creando tarea correctiva:', error);
      alert('Error al crear la tarea correctiva');
    } finally {
      setLoading(false);
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link
              href="/corrective-tasks"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Tarea Correctiva</h1>
              <p className="mt-1 text-sm text-gray-500">
                Registra un problema o reparación pendiente
              </p>
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
                {loadingClients ? (
                  <div className="text-sm text-gray-500">Cargando clientes...</div>
                ) : (
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
                )}
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
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-orange-900 mb-2">Cliente seleccionado:</h4>
                  {(() => {
                    const selectedClient = clients.find(c => c.id === formData.clientId);
                    return selectedClient ? (
                      <div className="text-sm text-orange-800">
                        <p><strong>{selectedClient.companyName}</strong></p>
                        <p>{selectedClient.address}</p>
                        <p>Referente: {selectedClient.referentName} ({selectedClient.referentPosition})</p>
                        <p>Teléfono: {selectedClient.phone || 'No especificado'}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Información importante */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Información:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Esta tarea se creará con estado "Pendiente"</li>
                  <li>• Aparecerá en la lista de tareas correctivas</li>
                  <li>• Los técnicos podrán tomarla y completarla</li>
                  <li>• También puedes crear tareas automáticamente al completar visitas con problemas</li>
                </ul>
              </div>

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
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Tarea Correctiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}