// src/app/visits/new/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { createVisit, getClients } from '@/lib/firebase/operations';
import { AVAILABLE_TECHNICIANS } from '@/lib/constants';

export default function NewVisit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  const [formData, setFormData] = useState({
    clientId: preselectedClientId || '',
    scheduledDate: '',
    scheduledTime: '09:00',
    technicians: [''],
    notes: '',
    allowPastDate: false
  });

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
    const { name, value, type, checked } = e.target;
    
    if (name === 'scheduledDate') {
      // Verificar si la fecha seleccionada es pasada
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
      alert('Para programar una visita con fecha pasada, debes confirmar la casilla correspondiente');
      return;
    }

    try {
      setLoading(true);
      
      // Combinar fecha y hora
      const dateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`);
      
      // Filtrar técnicos vacíos
      const technicians = formData.technicians.filter(tech => tech.trim() !== '');

      const visitData = {
        clientId: formData.clientId,
        scheduledDate: dateTime,
        status: 'scheduled',
        technicians: technicians,
        notes: formData.notes,
        completedDate: null,
        photos: [],
        // Agregar flag si es fecha pasada para referencia futura
        isPastDateVisit: selectedDate < today
      };

      await createVisit(visitData);
      router.push('/visits');
    } catch (error) {
      console.error('Error creando visita:', error);
      alert('Error al programar la visita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link
              href="/visits"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Programar Nueva Visita</h1>
              <p className="mt-1 text-sm text-gray-500">
                Agenda una visita preventiva para un cliente
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Selección de Cliente */}
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Fecha *
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
                            Has seleccionado una fecha pasada. Esto es útil para registrar visitas que ya ocurrieron.
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
                              Confirmo que quiero programar/registrar esta visita con fecha pasada
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
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
                  placeholder="Instrucciones especiales, horarios preferenciales, motivo si es fecha pasada, etc."
                />
              </div>

              {/* Cliente seleccionado info */}
              {formData.clientId && clients.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Cliente seleccionado:</h4>
                  {(() => {
                    const selectedClient = clients.find(c => c.id === formData.clientId);
                    return selectedClient ? (
                      <div className="text-sm text-blue-800">
                        <p><strong>{selectedClient.companyName}</strong></p>
                        <p>{selectedClient.address}</p>
                        <p>Referente: {selectedClient.referentName} ({selectedClient.referentPosition})</p>
                        <p>Frecuencia: {selectedClient.frequency === 'weekly' ? 'Semanal' : selectedClient.frequency === 'monthly' ? 'Mensual' : 'Bimestral'}</p>
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
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Programando...' : 'Programar Visita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}