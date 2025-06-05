// src/app/clients/[id]/edit/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getClient, updateClient } from '@/lib/firebase/operations';

export default function EditClient() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    referentName: '',
    referentPosition: '',
    address: '',
    contractRef: '',
    reportEmails: '',
    frequency: 'monthly'
  });

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const clientData = await getClient(params.id);
        
        // Convertir el array de emails a string para el textarea
        const emailsString = clientData.reportEmails 
          ? clientData.reportEmails.join(', ')
          : '';

        setFormData({
          companyName: clientData.companyName || '',
          referentName: clientData.referentName || '',
          referentPosition: clientData.referentPosition || '',
          address: clientData.address || '',
          contractRef: clientData.contractRef || '',
          reportEmails: emailsString,
          frequency: clientData.frequency || 'monthly'
        });
      } catch (error) {
        console.error('Error cargando cliente:', error);
        alert('Error al cargar el cliente');
        router.push('/clients');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadClient();
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
    
    try {
      setSaving(true);
      
      // Convertir los emails en array
      const emailsArray = formData.reportEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const clientData = {
        ...formData,
        reportEmails: emailsArray
      };

      await updateClient(params.id, clientData);
      router.push(`/clients/${params.id}`);
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      alert('Error al actualizar el cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando cliente...</p>
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
          <div className="flex items-center space-x-4">
            <Link
              href={`/clients/${params.id}`}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
              <p className="mt-1 text-sm text-gray-500">
                Modifica la información del cliente
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                
                {/* Nombre de la Empresa */}
                <div className="sm:col-span-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Hotel Plaza Central"
                  />
                </div>

                {/* Nombre del Referente */}
                <div>
                  <label htmlFor="referentName" className="block text-sm font-medium text-gray-700">
                    Nombre del Referente *
                  </label>
                  <input
                    type="text"
                    id="referentName"
                    name="referentName"
                    required
                    value={formData.referentName}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                {/* Cargo del Referente */}
                <div>
                  <label htmlFor="referentPosition" className="block text-sm font-medium text-gray-700">
                    Cargo del Referente *
                  </label>
                  <input
                    type="text"
                    id="referentPosition"
                    name="referentPosition"
                    required
                    value={formData.referentPosition}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Gerente de Mantenimiento"
                  />
                </div>

                {/* Dirección */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Dirección *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dirección completa del cliente"
                  />
                </div>

                {/* Referencia del Contrato */}
                <div>
                  <label htmlFor="contractRef" className="block text-sm font-medium text-gray-700">
                    Ref. Contrato
                  </label>
                  <input
                    type="text"
                    id="contractRef"
                    name="contractRef"
                    value={formData.contractRef}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: CONT-2025-001"
                  />
                </div>

                {/* Frecuencia */}
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                    Frecuencia de Mantenimiento *
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    required
                    value={formData.frequency}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimestral</option>
                  </select>
                </div>

                {/* Correos para Informes */}
                <div className="sm:col-span-2">
                  <label htmlFor="reportEmails" className="block text-sm font-medium text-gray-700">
                    CC - Correos para Informes
                  </label>
                  <textarea
                    id="reportEmails"
                    name="reportEmails"
                    rows={3}
                    value={formData.reportEmails}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Separar múltiples correos con comas&#10;Ej: gerente@empresa.com, mantenimiento@empresa.com"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Separar múltiples correos con comas
                  </p>
                </div>

              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href={`/clients/${params.id}`}
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