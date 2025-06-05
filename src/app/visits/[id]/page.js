// src/app/visits/[id]/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle, Camera, FileText } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getVisits, getClient, updateVisit, createCorrectiveTask } from '@/lib/firebase/operations';
import { AVAILABLE_TECHNICIANS } from '@/lib/constants';

export default function VisitDetail() {
  const params = useParams();
  const router = useRouter();
  const [visit, setVisit] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  
  // Estado del formulario de completado
  const [completionData, setCompletionData] = useState({
    notes: '',
    technicians: [''],
    issues: [] // Array de problemas encontrados
  });

  // Estado para agregar nuevos problemas
  const [newIssue, setNewIssue] = useState({
    description: '',
    priority: 'normal'
  });

  useEffect(() => {
    const loadVisitData = async () => {
      try {
        setLoading(true);
        const visits = await getVisits();
        const visitData = visits.find(v => v.id === params.id);
        
        if (!visitData) {
          alert('Visita no encontrada');
          router.push('/visits');
          return;
        }

        const clientData = await getClient(visitData.clientId);
        
        setVisit(visitData);
        setClient(clientData);
        
        // Pre-cargar datos si la visita ya está completada
        if (visitData.status === 'completed') {
          setCompletionData({
            notes: visitData.notes || '',
            technicians: visitData.technicians || [''],
            issues: []
          });
        } else {
          // Pre-cargar técnicos asignados
          setCompletionData(prev => ({
            ...prev,
            technicians: visitData.technicians && visitData.technicians.length > 0 
              ? visitData.technicians 
              : ['']
          }));
        }
      } catch (error) {
        console.error('Error cargando visita:', error);
        alert('Error al cargar la visita');
        router.push('/visits');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadVisitData();
    }
  }, [params.id, router]);

const availableTechnicians = AVAILABLE_TECHNICIANS;

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

  const addIssue = () => {
    if (newIssue.description.trim()) {
      setCompletionData(prev => ({
        ...prev,
        issues: [...prev.issues, { ...newIssue, id: Date.now() }]
      }));
      setNewIssue({ description: '', priority: 'normal' });
    }
  };

  const removeIssue = (issueId) => {
    setCompletionData(prev => ({
      ...prev,
      issues: prev.issues.filter(issue => issue.id !== issueId)
    }));
  };

  const handleCompleteVisit = async () => {
    try {
      setCompleting(true);
      
      // Filtrar técnicos vacíos
      const technicians = completionData.technicians.filter(tech => tech.trim() !== '');
      
      if (technicians.length === 0) {
        alert('Debe asignar al menos un técnico');
        return;
      }

      // Actualizar la visita como completada
      const visitUpdateData = {
        status: 'completed',
        completedDate: new Date(),
        technicians: technicians,
        notes: completionData.notes
      };

      await updateVisit(params.id, visitUpdateData);

      // Crear tareas correctivas para cada problema encontrado
      for (const issue of completionData.issues) {
        const taskData = {
          clientId: visit.clientId,
          originVisitId: params.id,
          description: issue.description,
          priority: issue.priority,
          status: 'pending',
          reportedDate: new Date(),
          reportedBy: technicians[0], // Primer técnico como quien reporta
          completedDate: null,
          completedBy: [],
          notes: '',
          photos: []
        };

        await createCorrectiveTask(taskData);
      }

      router.push('/visits');
    } catch (error) {
      console.error('Error completando visita:', error);
      alert('Error al completar la visita');
    } finally {
      setCompleting(false);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando visita...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const isCompleted = visit?.status === 'completed';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/visits"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isCompleted ? 'Detalles de Visita' : 'Completar Visita'}
                </h1>
                <p className="text-sm text-gray-500">
                  {client?.companyName} - {formatDate(visit?.scheduledDate)}
                </p>
              </div>
            </div>
            
            {isCompleted && (
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-full">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Completada</span>
              </div>
            )}
          </div>

          {/* Información del cliente */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Empresa:</span>
                <p className="text-gray-900">{client?.companyName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Referente:</span>
                <p className="text-gray-900">{client?.referentName} ({client?.referentPosition})</p>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-500">Dirección:</span>
                <p className="text-gray-900">{client?.address}</p>
              </div>
            </div>
          </div>

          {!isCompleted ? (
            /* Formulario de completado */
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Completar Inspección</h3>
              
              {/* Técnicos presentes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Técnicos Presentes *
                </label>
                <div className="space-y-3">
                  {completionData.technicians.map((technician, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={technician}
                        onChange={(e) => handleTechnicianChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Agregar técnico
                  </button>
                </div>
              </div>

              {/* Problemas encontrados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  Problemas Encontrados
                </label>
                
                {/* Lista de problemas */}
                {completionData.issues.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {completionData.issues.map((issue) => (
                      <div key={issue.id} className={`p-3 border rounded-md ${getPriorityColor(issue.priority)}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm">{issue.description}</p>
                            <span className="text-xs font-medium">
                              Prioridad: {getPriorityLabel(issue.priority)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeIssue(issue.id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar nuevo problema */}
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Describe el problema encontrado..."
                        value={newIssue.description}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={newIssue.priority}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, priority: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgente</option>
                      <option value="next_visit">Próxima Visita</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addIssue}
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    + Agregar Problema
                  </button>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Observaciones de la Visita
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={completionData.notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detalles de la inspección, estado general de los equipos, etc."
                />
              </div>

              {/* Botón de completar */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/visits"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </Link>
                <button
                  onClick={handleCompleteVisit}
                  disabled={completing}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>{completing ? 'Completando...' : 'Completar Visita'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Vista de visita completada */
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Detalles de la Inspección</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-500">Fecha de Completado:</span>
                  <p className="text-gray-900">{formatDate(visit.completedDate)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Técnicos:</span>
                  <p className="text-gray-900">{visit.technicians?.join(', ') || 'No especificado'}</p>
                </div>
              </div>
              
              {visit.notes && (
                <div>
                  <span className="font-medium text-gray-500">Observaciones:</span>
                  <p className="text-gray-900 mt-1">{visit.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}