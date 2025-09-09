// src/app/visits/[id]/edit/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getVisits, getClient, updateVisit, deleteVisit, getClients } from '@/lib/firebase/operations';
import { AVAILABLE_TECHNICIANS } from '@/lib/constants';

export default function EditVisit() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [visit, setVisit] = useState(null);
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    technicians: [''],
    notes: '',
    allowPastDate: false
  });

  const availableTechnicians = AVAILABLE_TECHNICIANS;

  useEffect(() => {
    const loadVisitData = async () => {
      try {
        setLoading(true);
        
        const [visits, clientsData] = await Promise.all([
          getVisits(),
          getClients()
        ]);
        
        const visitData = visits.find(v => v.id === params.id);
        
        if (!visitData) {
          alert('Visita no encontrada');
          router.push('/visits');
          return;
        }

        const clientData = await getClient(visitData.clientId);
        
        setVisit(visitData);
        setClient(clientData);
        setClients(clientsData);
        
        // Pre-cargar datos del formulario
        const visitDate = visitData.scheduledDate.toDate ? visitData.scheduledDate.toDate() : new Date(visitData.scheduledDate);
        const dateString = visitDate.toISOString().split('T')[0];
        const timeString = visitDate.toTimeString().split(' ')[0].substring(0, 5);

        // Verificar si la fecha actual es pasada
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const visitDateOnly = new Date(dateString);
        const isPastDate = visitDateOnly < today;

        setFormData({
          clientId: visitData.clientId,
          scheduledDate: dateString,
          scheduledTime: timeString,
          technicians: visitData.technicians && visitData.technicians.length > 0 
            ? visitData.technicians 
            : [''],
          notes: visitData.notes || '',
          allowPastDate: isPastDate // Permitir automáticamente si ya era fecha pasada
        });

        setShowPastDateWarning(isPastDate);
        
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'scheduledDate') {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const isPastDate = selectedDate < today;
      setShowPastDateWarning(isPastDate);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        allowPastDate: isPastDate ? prev.allowPastDate : false
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleTechnicianChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      technicians: prev.technicians.map((tech, i) => 
        i === index ? value : tech
      )
    }));
  };

  const addTechnician = () => {
    setFormData(prev => ({
      ...prev,
      technicians: [...prev.technicians, '']
    }));
  };

  const removeTechnician = (index) => {
    if (formData.technicians.length > 1) {
      setFormData(prev => ({
        ...prev,
        technicians: prev.technicians.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      alert('Por favor selecciona un cliente');
      return;
    }

    if (!formData.scheduledDate) {
      alert('Por favor selecciona una fecha');
      return;
    }

    // Verificar fecha pasada si no está permitida
    const selectedDate = new Date(formData.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today && !formData.allowPastDate) {
      alert('Para editar la visita con fecha pasada, debes confirmar la casilla correspondiente');
      return;
    }

    try {
      setSaving(true);
      
      const dateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`);
      const technicians = formData.technicians.filter(tech => tech.trim() !== '');

      const updateData = {
        clientId: formData.clientId,
        scheduledDate: dateTime,
        technicians: technicians,
        notes: formData.notes,
        isPastDateVisit: selectedDate < today // Actualizar flag
      };

      await updateVisit(params.id, updateData);
      router.push('/visits');
    } catch (error) {
      console.error('Error actualizando visita:', error);
      alert('Error al actualizar la visita');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm(
      `¿Estás seguro de eliminar la visita programada para ${client?.companyName}?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await deleteVisit(params.id);
      router.push('/visits');
    } catch (error) {
      console.error('Error eliminando visita:', error);
      alert('Error al eliminar la visita');
    } finally {
      setDeleting(false);
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

  const getVisitStatusInfo = () => {
    if (!visit) return null;
    
    const isCompleted = visit.status === 'completed';
    const visitDate = visit.scheduledDate.toDate ? visit.scheduledDate.toDate() : new Date(visit.scheduledDate);
    const today = new Date();
    const isPast = visitDate < today;
    
    if (isCompleted) {
      return {
        color: 'green',
        icon: CheckCircle,
        title: 'Visita Completada',
        message: 'Esta visita ya fue completada. Puedes editarla para hacer correcciones.'
      };
    } else if (isPast) {
      return {
        color: 'amber',
        icon: AlertTriangle,
        title: 'Visita Vencida',
        message: 'Esta visita tenía fecha pasada y no fue completada.'
      };
    } else {
      return {
        color: 'blue',
        icon: Calendar,
        title: 'Visita Programada',
        message: 'Esta visita está programada para el futuro.'
      };
    }
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

  const statusInfo = getVisitStatusInfo();

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
                <h1 className="text-2xl font-bold text-gray-900">Editar Visita</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Modifica la visita para {client?.companyName}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>{deleting ? 'Eliminando...' : 'Eliminar Visita'}</span>
            </button>
          </div>

          {/* Estado de la visita */}
          {statusInfo && (
            <div className={`bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 rounded-md p-4`}>
              <div className="flex items-start">
                <statusInfo.icon className={`h-5 w-5 text-${statusInfo.color}-600 mr-3 mt-0.5`} />
                <div>
                  <h4 className={`text-sm font-medium text-${statusInfo.color}-900 mb-1`}>
                    {statusInfo.title}
                  </h4>
                  <p className={`text-sm text-${statusInfo.color}-800 mb-2`}>
                    {statusInfo.message}
                  </p>
                  <div className={`text-sm text-${statusInfo.color}-800`}>
                    <p><strong>{client?.companyName}</strong></p>
                    <p>Fecha original: {formatDate(visit?.scheduledDate)}</p>
                    <p>Técnicos: {visit?.technicians?.join(', ') || 'Sin asignar'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Selección de Cliente */}
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  required
                  value={formData.clientId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} - {client.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Nueva Fecha *
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    required
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  {/* Warning para fechas pasadas */}
                  {showPastDateWarning && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm text-amber-800">
                            Fecha pasada seleccionada. Útil para registrar visitas que ya ocurrieron.
                          </p>
                          <label className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              name="allowPastDate"
                              checked={formData.allowPastDate}
                              onChange={handleChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-amber-800">
                              Confirmo el cambio a fecha pasada
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Hora
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Técnicos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Técnicos Asignados
                </label>
                <div className="space-y-3">
                  {formData.technicians.map((technician, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={technician}
                        onChange={(e) => handleTechnicianChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccionar técnico...</option>
                        {availableTechnicians.map((tech) => (
                          <option key={tech} value={tech}>
                            {tech}
                          </option>
                        ))}
                      </select>
                      {formData.technicians.length > 1 && (
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
                    + Agregar otro técnico
                  </button>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Motivo del cambio, instrucciones especiales, etc."
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
                  href="/visits"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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