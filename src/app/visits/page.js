// src/app/visits/page.js

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, Building, Plus, Filter } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getVisits, getClients } from '@/lib/firebase/operations';

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, scheduled, completed
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [visitsData, clientsData] = await Promise.all([
        getVisits(),
        getClients()
      ]);
      setVisits(visitsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Crear un mapa de clientes para búsquedas rápidas
  const clientsMap = clients.reduce((map, client) => {
    map[client.id] = client;
    return map;
  }, {});

  // Filtrar y ordenar visitas
  const filteredVisits = visits
    .filter(visit => {
      const client = clientsMap[visit.clientId];
      const clientName = client?.companyName || '';

      // Filtro por estado
      const matchesStatus = filter === 'all' || visit.status === filter;

      // Filtro por búsqueda
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Ordenar por fecha programada de más antigua a más futura
      const dateA = a.scheduledDate?.toDate ? a.scheduledDate.toDate() : new Date(a.scheduledDate || 0);
      const dateB = b.scheduledDate?.toDate ? b.scheduledDate.toDate() : new Date(b.scheduledDate || 0);
      return dateA - dateB;
    });

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'scheduled': 'Programada',
      'completed': 'Completada'
    };
    return labels[status] || status;
  };

  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visitas</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona las visitas preventivas programadas
              </p>
            </div>
            <Link
              href="/visits/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Nueva Visita</span>
            </Link>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por estado */}
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas</option>
                  <option value="scheduled">Programadas</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de visitas */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando visitas...</p>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="p-6 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">
                  {visits.length === 0
                    ? 'No hay visitas programadas'
                    : 'No se encontraron visitas que coincidan con los filtros'
                  }
                </p>
                {visits.length === 0 && (
                  <Link
                    href="/visits/new"
                    className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Programar primera visita
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Programada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Técnicos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVisits.map((visit) => {
                      const client = clientsMap[visit.clientId];
                      return (
                        <tr key={visit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {client?.companyName || 'Cliente no encontrado'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {client?.address}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {formatDate(visit.scheduledDate)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                              {getStatusLabel(visit.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {visit.technicians && visit.technicians.length > 0
                                  ? visit.technicians.join(', ')
                                  : 'Sin asignar'
                                }
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              {visit.status === 'scheduled' ? (
                                <>
                                  <Link
                                    href={`/visits/${visit.id}`}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Completar
                                  </Link>
                                  <Link
                                    href={`/visits/${visit.id}/edit`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Editar
                                  </Link>
                                </>
                              ) : (
                                <Link
                                  href={`/visits/${visit.id}`}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Ver Detalles
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          {!loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-8 w-8 text-blue-600" />
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
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Programadas
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {visits.filter(v => v.status === 'scheduled').length}
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
                          Completadas
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {visits.filter(v => v.status === 'completed').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}