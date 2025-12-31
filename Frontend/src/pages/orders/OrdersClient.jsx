import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { orderService } from '../../services/orderService';
import SideBarMenuClient from '../../components/Layout/SideBarMenuClient';
import TopBar from '../../components/Layout/TopBar';
import OrderCard from '../../components/Orders/OrderCard';
import OrderDetailModal from '../../components/Orders/OrderDetailModal';
import { Filter, Package, Loader } from 'lucide-react';

const OrdersClient = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const statuses = {
    all: { label: 'Todas', color: 'gray' },
    completed: { label: 'Completadas', color: 'green' },
    pending: { label: 'Pendientes', color: 'amber' },
    cancelled: { label: 'Canceladas', color: 'red' }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.listByUser(user?.id || 1);
      if (response.ok) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const getFilterButtonStyle = (status) => {
    const baseStyle = "px-4 py-2 rounded-2xl font-medium text-sm transition";
    if (statusFilter === status) {
      return `${baseStyle} bg-fuchsia-600 text-white shadow-md`;
    }
    return `${baseStyle} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
  };

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <div className="flex h-screen">
        <SideBarMenuClient />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Órdenes</h1>
              <p className="text-gray-600">
                Revisa el historial de tus compras y el estado de tus órdenes
              </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter size={18} />
                <span className="font-medium">Filtrar por estado:</span>
              </div>
              {Object.entries(statuses).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={getFilterButtonStyle(key)}
                >
                  {value.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin text-fuchsia-600" size={48} />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <Package size={80} className="mx-auto text-gray-300 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No hay órdenes
                </h3>
                <p className="text-gray-500">
                  {statusFilter === 'all'
                    ? 'Aún no has realizado ninguna compra'
                    : `No tienes órdenes ${statuses[statusFilter].label.toLowerCase()}`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => handleOrderClick(order)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <OrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default OrdersClient;
