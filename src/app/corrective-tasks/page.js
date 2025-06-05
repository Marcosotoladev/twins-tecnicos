// src/app/corrective-tasks/page.js

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, CheckCircle, User, Building, Filter, Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCorrectiveTasks, getClients } from '@/lib/firebase/operations';

export default function CorrectiveTasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // all, pending, in_progress, completed
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, clientsData] = await Promise.all([
        getCorrectiveTasks(),
        getClients()
      ]);
      setTasks(tasksData);
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

  // Filtrar tareas
  const filteredTasks = tasks.filter(task => {
    const client = clientsMap[task.clientId];
    const clientName = client?.companyName || '';

    // Filtro por estado
    const matchesStatus = filter === 'all' || task.status === filter;

    // Filtro por prioridad
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    // Filtro por búsqueda
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

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

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'bg-red-500 text-white',
      'normal': 'bg-yellow-500 text-white',
      'next_visit': 'bg-blue-500 text-white'
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

  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysAgo = (date) => {
    if (!date) return null;
    const d = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    const diffTime = today - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tareas Correctivas</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona los problemas y reparaciones pendientes
              </p>
            </div>
            <Link
              href="/corrective-tasks/new"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Nueva Tarea</span>
            </Link>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Buscar por cliente o descripción..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por estado */}
              <div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>

              {/* Filtro por prioridad */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Todas las prioridades</option>
                  <option value="urgent">Urgente</option>
                  <option value="normal">Normal</option>
                  <option value="next_visit">Próxima Visita</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de tareas */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando tareas...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-6 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">
                  {tasks.length === 0
                    ? 'No hay tareas correctivas registradas'
                    : 'No se encontraron tareas que coincidan con los filtros'
                  }
                </p>
                {tasks.length === 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Las tareas se crean automáticamente al completar visitas con problemas
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente / Problema
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reportado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => {
                      const client = clientsMap[task.clientId];
                      const daysAgo = getDaysAgo(task.reportedDate);
                      return (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {client?.companyName || 'Cliente no encontrado'}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {task.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {client?.address}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(task.reportedDate)}
                            </div>
                            {daysAgo !== null && (
                              <div className={`text-xs ${daysAgo > 7 ? 'text-red-600' : 'text-gray-500'}`}>
                                {daysAgo === 0 ? 'Hoy' :
                                  daysAgo === 1 ? 'Ayer' :
                                    `Hace ${daysAgo} días`}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              por {task.reportedBy}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              {task.status !== 'completed' ? (
                                <>
                                  <Link
                                    href={`/corrective-tasks/${task.id}`}
                                    className="text-orange-600 hover:text-orange-900"
                                  >
                                    {task.status === 'pending' ? 'Procesar' : 'Completar'}
                                  </Link>
                                  <Link
                                    href={`/corrective-tasks/${task.id}/edit`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Editar
                                  </Link>
                                </>
                              ) : (
                                <Link
                                  href={`/corrective-tasks/${task.id}`}
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Tareas
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {tasks.length}
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
                      <Clock className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pendientes
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {tasks.filter(t => t.status === 'pending').length}
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
                      <User className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          En Proceso
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {tasks.filter(t => t.status === 'in_progress').length}
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
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Completadas
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {tasks.filter(t => t.status === 'completed').length}
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