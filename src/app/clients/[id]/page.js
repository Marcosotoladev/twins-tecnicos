// src/app/clients/[id]/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, ArrowLeft, Mail, User, Building, MapPin, FileText, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getClient, getVisits, getCorrectiveTasks } from '@/lib/firebase/operations';

export default function ClientDetail() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [correctiveTasks, setCorrectiveTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClientData = async () => {
      try {
        setLoading(true);
        const [clientData, visitsData, tasksData] = await Promise.all([
          getClient(params.id),
          getVisits(params.id),
          getCorrectiveTasks(params.id)
        ]);
        
        setClient(clientData);
        setVisits(visitsData);
        setCorrectiveTasks(tasksData);
      } catch (error) {
        console.error('Error cargando datos del cliente:', error);
        alert('Error al cargar el cliente');
        router.push('/clients');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadClientData();
    }
  }, [params.id, router]);

  const getFrequencyLabel = (frequency) => {
    const frequencies = {
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'bimonthly': 'Bimestral'
    };
    return frequencies[frequency] || frequency;
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

  if (!client) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">Cliente no encontrado</p>
            <Link href="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
              Volver a clientes
            </Link>
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
                href="/clients"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
                <p className="text-sm text-gray-500">Información del cliente</p>
              </div>
            </div>
            <Link
              href={`/clients/${client.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Editar</span>
            </Link>
          </div>

          {/* Información del cliente */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información General</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    Empresa
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.companyName}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Referente
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.referentName} - {client.referentPosition}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Dirección
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.address}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Ref. Contrato
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.contractRef || 'No especificado'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Frecuencia
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getFrequencyLabel(client.frequency)}
                    </span>
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    Correos para Informes
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.reportEmails && client.reportEmails.length > 0 ? (
                      <div className="space-y-1">
                        {client.reportEmails.map((email, index) => (
                          <div key={index} className="text-blue-600">{email}</div>
                        ))}
                      </div>
                    ) : (
                      'No especificado'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Visitas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {visits.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tareas Pendientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {correctiveTasks.filter(task => task.status === 'pending').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tareas Completadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {correctiveTasks.filter(task => task.status === 'completed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex space-x-4">
            <Link
              href={`/visits/new?clientId=${client.id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Nueva Visita
            </Link>
            <Link
              href={`/corrective-tasks/new?clientId=${client.id}`}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Nueva Tarea Correctiva
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}