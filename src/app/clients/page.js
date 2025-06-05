// src/app/clients/page.js

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getClients, deleteClient } from '@/lib/firebase/operations';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDelete = async (clientId, clientName) => {
    if (confirm(`¿Estás seguro de eliminar el cliente "${clientName}"?`)) {
      try {
        await deleteClient(clientId);
        await loadClients();
      } catch (error) {
        console.error('Error eliminando cliente:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const filteredClients = clients.filter(client =>
    client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.referentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFrequencyLabel = (frequency) => {
    const frequencies = {
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'bimonthly': 'Bimestral'
    };
    return frequencies[frequency] || frequency;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona la información de tus clientes
              </p>
            </div>
            <Link
              href="/clients/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Nuevo Cliente
            </Link>
          </div>

          {/* Buscador */}
          <div className="bg-white shadow rounded-lg p-6">
            <input
              type="text"
              placeholder="Buscar por empresa, referente o dirección..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de clientes */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
                </p>
                {!searchTerm && (
                  <Link
                    href="/clients/new"
                    className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Crear primer cliente
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ref. Contrato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frecuencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {client.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.address}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.referentName}</div>
                          <div className="text-sm text-gray-500">{client.referentPosition}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.contractRef}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getFrequencyLabel(client.frequency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/clients/${client.id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Ver cliente"
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/clients/${client.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                              title="Editar cliente"
                            >
                              <Edit size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(client.id, client.companyName)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Eliminar cliente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stats */}
          {!loading && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-500">
                Total de clientes: <span className="font-medium text-gray-900">{clients.length}</span>
                {searchTerm && (
                  <span> | Mostrando: <span className="font-medium text-gray-900">{filteredClients.length}</span></span>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}