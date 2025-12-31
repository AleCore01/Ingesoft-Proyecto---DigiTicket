"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenuClient from "../../components/Layout/SideBarMenuClient";
import TopBar from "../../components/Layout/TopBar";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthProvider";
import { cartService } from "../../services/cartService";
import CartItem from "../../components/Cart/CartItem";
import OrderSummary from "../../components/Cart/OrderSummary";
import StepIndicator from "../../components/Cart/StepIndicator";
import HoldTimer from "../../components/Cart/HoldTimer";
import ModalCheck from "../../components/Modal/ModalCheck";
import ModalWarning from "../../components/Modal/ModalWarning";
import ModalInfo from "../../components/Modal/ModalInfo";
import PaymentMethodSelector from "../../components/Payment/PaymentMethodSelector";
import CardPaymentForm from "../../components/Payment/CardPaymentForm";
import YapePaymentForm from "../../components/Payment/YapePaymentForm";
import { ShoppingCart, CreditCard, CheckCircle, ArrowLeft } from "lucide-react";
import { logger } from "../../utils/logger";

const CartClient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    cartId, // ID del carrito para el hold
    holdExpiresAt, // Timestamp de expiración para el temporizador
    loading,
    subtotal,
    pointsDiscount,
    appliedPoints,
    total,
    itemCount,
    showClearConfirmation,
    updateQuantity,
    removeItem,
    clearCart,
    requestClearCart,
    cancelClearCart,
    applyPoints,
    checkout,
  } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  
  // Guardar datos de la compra ANTES de limpiar el carrito
  const [purchaseData, setPurchaseData] = useState({
    itemCount: 0,
    total: 0,
    appliedPoints: 0,
  });

  // Log para debug del holdExpiresAt
  React.useEffect(() => {
    logger.log('🕐 CartClient - holdExpiresAt cambió:', holdExpiresAt);
  }, [holdExpiresAt]);

  // Método de pago seleccionado
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' o 'yape'

  // Datos de pago con tarjeta
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  // Datos de pago con Yape
  const [yapeData, setYapeData] = useState({
    phoneNumber: "",
    token: "", // Token de 6 dígitos que el usuario ve en su app
  });

  // Estado de términos y condiciones
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Puntos del usuario - cargados desde backend
  const [userPoints, setUserPoints] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(true);

  // Cargar puntos reales del usuario
  useEffect(() => {
    const loadUserPoints = async () => {
      if (!user?.id) {
        setUserPoints(0);
        setLoadingPoints(false);
        return;
      }

      try {
        setLoadingPoints(true);
        const response = await fetch(`/api/loyalty/points/balance?clientId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.totalPoints || 0);
        } else {
          logger.warn('No se pudieron cargar los puntos del usuario');
          setUserPoints(0);
        }
      } catch (error) {
        logger.error('Error cargando puntos:', error);
        setUserPoints(0);
      } finally {
        setLoadingPoints(false);
      }
    };

    loadUserPoints();
  }, [user?.id]);

    const handleContinueToPayment = () => {
    if (!user?.id) {
      alert('Debes iniciar sesión para continuar.');
      return;
    }

    // El hold ya fue creado automáticamente al añadir items al carrito (ver CartContext)
    // Solo avanzamos al siguiente paso
    setCurrentStep(2);
  };  const handleBackToCart = () => {
    setCurrentStep(1);
  };

  /**
   * Valida si la fecha de expiración es válida (mayor o igual a la fecha actual)
   */
  const isExpiryDateValid = () => {
    if (!paymentData.expiryDate || paymentData.expiryDate.length !== 5) {
      return false;
    }
    
    const [month, year] = paymentData.expiryDate.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Validar mes (01-12)
    if (monthNum < 1 || monthNum > 12) {
      return false;
    }
    
    // Obtener fecha actual
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Últimos 2 dígitos
    const currentMonth = now.getMonth() + 1; // 0-indexed, así que sumamos 1
    
    // Comparar año y mes
    if (yearNum < currentYear) {
      return false;
    } else if (yearNum === currentYear && monthNum < currentMonth) {
      return false;
    }
    
    return true;
  };

  /**
   * Valida si todos los campos de la tarjeta están completos
   */
  const isCardDataComplete = () => {
    return (
      paymentData.cardNumber.length === 16 &&
      paymentData.cardName.trim() !== "" &&
      paymentData.expiryDate.length === 5 &&
      paymentData.cvv.length === 3
    );
  };

  /**
   * Valida si se puede procesar el pago con tarjeta
   */
  const canPayWithCard = () => {
    return termsAccepted && isCardDataComplete() && isExpiryDateValid();
  };

  /**
   * Valida si se puede procesar el pago con Yape
   */
  const canPayWithYape = () => {
    return (
      termsAccepted &&
      yapeData.phoneNumber.length === 9 &&
      yapeData.token.length === 6
    );
  };

  const handleProcessPayment = async () => {
    // Verificar que hay items en el carrito
    if (!items || items.length === 0) {
      alert("Tu carrito está vacío. Agrega items antes de procesar el pago.");
      return;
    }

    setProcessing(true);
    
    // 💾 Guardar datos ANTES de hacer checkout (que limpia el carrito)
    setPurchaseData({
      itemCount,
      total,
      appliedPoints,
    });
    
    logger.log('🛒 Items en el carrito antes de checkout:', items);
    logger.log('💰 Total a pagar:', total);
    
    try {
      const paymentInfo = paymentMethod === 'yape' 
        ? { 
            method: 'yape', 
            phone: yapeData.phoneNumber
          }
        : { 
            method: 'card', 
            cardNumber: paymentData.cardNumber,
            cardName: paymentData.cardName,
            expiryDate: paymentData.expiryDate,
            cvv: paymentData.cvv
          };
        
      logger.log('💳 Procesando pago con:', paymentInfo);
      const result = await checkout(paymentInfo);
      if (result.ok) {
        setOrderNumber(result.data?.orderId || Date.now());
        setCurrentStep(3);
        setShowSuccess(true);
      } else {
        logger.error("❌ Error en checkout:", result);
        const errorMsg = result.error || "Error procesando el pago. Intenta nuevamente.";
        
        // Mensajes más específicos según el tipo de error
        let userMessage = errorMsg;
        if (errorMsg.includes('hold')) {
          userMessage = "La reserva de tickets expiró. Por favor, vuelve a intentarlo.";
        } else if (errorMsg.includes('stock') || errorMsg.includes('disponib')) {
          userMessage = "Los tickets ya no están disponibles. Por favor, verifica tu carrito.";
        } else if (errorMsg.includes('pago') || errorMsg.includes('declined')) {
          userMessage = "El pago fue rechazado. Verifica los datos de tu tarjeta.";
        }
        
        alert(userMessage);
      }
    } catch (error) {
      logger.error("❌ Excepción en checkout:", error);
      alert(error.message || "Error inesperado al procesar el pago. Intenta nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFinish = () => {
    navigate("/homeClient");
  };

  // Renderizar contenido según el paso
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Si el carrito está vacío, mostrar vista centrada
        if (items.length === 0) {
          return (
            <div className="flex items-center justify-center min-h-[calc(100vh-250px)]">
              <div className="bg-white rounded-2xl p-12 text-center max-w-md shadow-lg">
                <ShoppingCart size={80} className="mx-auto text-gray-300 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-500 mb-8">
                  Explora nuestros eventos y agrega entradas a tu carrito
                </p>
                <button
                  onClick={() => navigate("/homeClient")}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition"
                >
                  Ver eventos
                </button>
              </div>
            </div>
          );
        }

        // Vista normal con items
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Tu carrito ({itemCount} {itemCount === 1 ? "entrada" : "entradas"})
                </h2>
                <button
                  onClick={requestClearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Temporizador del hold */}
              {holdExpiresAt && (
                <HoldTimer 
                  expiresAt={holdExpiresAt} 
                  onExpire={async () => {
                    logger.warn('⏰ Hold timer expiró. Limpiando carrito (estándar industria)...');
                    await clearCart();
                    setShowExpiredModal(true);
                  }}
                />
              )}

              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  allItems={items}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Resumen de orden */}
            <div>
              <OrderSummary
                subtotal={subtotal}
                pointsDiscount={pointsDiscount}
                appliedPoints={appliedPoints}
                total={total}
                itemCount={itemCount}
                onApplyPoints={applyPoints}
                userPoints={userPoints}
                showPointsSection={true}
              />
              <button
                onClick={handleContinueToPayment}
                disabled={loading}
                className="w-full mt-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4 rounded-2xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CONTINUAR
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario de pago */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={28} className="text-fuchsia-600" />
                  Información de pago
                </h2>

                {/* Selector de método de pago */}
                <PaymentMethodSelector
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                />

                {/* Formulario según método seleccionado */}
                {paymentMethod === 'card' ? (
                  <CardPaymentForm
                    paymentData={paymentData}
                    setPaymentData={setPaymentData}
                  />
                ) : (
                  <YapePaymentForm
                    yapeData={yapeData}
                    setYapeData={setYapeData}
                    total={total}
                  />
                )}
              </div>
            </div>

            {/* Resumen */}
            <div>
              <OrderSummary
                subtotal={subtotal}
                pointsDiscount={pointsDiscount}
                appliedPoints={appliedPoints}
                total={total}
                itemCount={itemCount}
                userPoints={userPoints}
                showPointsSection={false}
              />
              
              {/* Términos y condiciones */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-2">
                  Términos y condiciones
                </h3>
                <div className="flex items-start gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-700">
                    He revisado la orden de compra, leído y acepto la política de manejo de datos y los{' '}
                    <a href="#" className="text-fuchsia-600 hover:underline font-semibold">
                      Términos y Condiciones
                    </a>
                    .
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  El cobro de la transacción se realizará en SOLES. Si la cuenta asociada a tu tarjeta es en DÓLARES, el tipo de cambio utilizado será el de tu banco.
                </p>
              </div>
              
              {/* Botones debajo del resumen */}
              <div className="mt-6">
                <div className="flex gap-4">
                  <button
                    onClick={handleBackToCart}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-2xl transition"
                  >
                    <ArrowLeft className="inline mr-2" size={20} />
                    Volver
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={
                      processing || 
                      (paymentMethod === 'card' ? !canPayWithCard() : !canPayWithYape())
                    }
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Procesando..." : `PAGAR S/. ${total.toFixed(2)}`}
                  </button>
                </div>
                
                {/* Mensajes de validación */}
                {!termsAccepted && (
                  <p className="mt-3 text-xs text-amber-600 text-center">
                    ⚠️ Debes aceptar los términos y condiciones para continuar
                  </p>
                )}
                {paymentMethod === 'card' && termsAccepted && !isCardDataComplete() && (
                  <p className="mt-3 text-xs text-amber-600 text-center">
                    ⚠️ Completa todos los campos de la tarjeta
                  </p>
                )}
                {paymentMethod === 'card' && termsAccepted && isCardDataComplete() && !isExpiryDateValid() && (
                  <p className="mt-3 text-xs text-red-600 text-center">
                    ❌ La fecha de expiración debe ser mayor o igual a la fecha actual
                  </p>
                )}
                {paymentMethod === 'yape' && termsAccepted && (yapeData.phoneNumber.length !== 9 || yapeData.token.length !== 6) && (
                  <p className="mt-3 text-xs text-amber-600 text-center">
                    ⚠️ Completa el número de celular y el código de aprobación
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <CheckCircle size={80} className="mx-auto text-green-500 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                ¡Compra exitosa!
              </h2>
              <p className="text-gray-600 mb-2">
                Tu orden ha sido procesada correctamente
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Número de orden: <span className="font-bold">#{orderNumber}</span>
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">Resumen de compra</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entradas:</span>
                    <span className="font-semibold">{purchaseData.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total pagado:</span>
                    <span className="font-bold text-fuchsia-600">
                      s/. {purchaseData.total.toFixed(2)}
                    </span>
                  </div>
                  {purchaseData.appliedPoints > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Puntos canjeados:</span>
                      <span>{purchaseData.appliedPoints}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-8">
                Recibirás un correo electrónico con tus entradas digitales
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/ticketClient")}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-8 py-3 rounded-lg transition"
                >
                  Ver mis entradas
                </button>
                <button
                  onClick={handleFinish}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-8 py-3 rounded-lg transition"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      {/* Sidebar */}
      <div className="flex h-screen">
        <SideBarMenuClient />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {/* Indicador de pasos */}
          <StepIndicator currentStep={currentStep} />

          {/* Contenido del paso actual */}
          {renderStepContent()}
        </div>
      </div>

      {/* Modal de éxito */}
      <ModalCheck
        isOpen={showSuccess}
        message="¡Compra realizada con éxito!"
        onClose={() => setShowSuccess(false)}
        autoCloseMs={null}
        closeOnOverlayClick={true}
      />

      {/* Modal de confirmación para vaciar carrito */}
      <ModalWarning
        isOpen={showClearConfirmation}
        onClose={cancelClearCart}
        onConfirm={clearCart}
        title="¿Vaciar carrito?"
        message="Esta acción eliminará todos los tickets de tu carrito"
      />

      {/* Modal de reserva expirada */}
      <ModalInfo
        isOpen={showExpiredModal}
        onClose={() => {
          setShowExpiredModal(false);
          navigate('/homeClient');
        }}
        title="Tu reserva ha expirado"
      >
        <p className="text-center mb-3">
          ⏰ Los tickets han sido liberados y tu carrito se ha vaciado.
        </p>
        <p className="text-center text-gray-600">
          Por favor, busca los eventos nuevamente si deseas comprar.
        </p>
      </ModalInfo>
    </div>
  );
};

export default CartClient;
