import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { cartService } from '../services/cartService'
import { eventsService } from '../services/eventsService'
import { settingsService } from '../services/settingsService'
import { useAuth } from './AuthProvider'
import { logger } from '../utils/logger'

const CartContext = createContext({})

const STORAGE_KEY = 'digiticket_cart'
const IMAGE_CACHE_KEY = 'digiticket_image_cache'

const USE_BACKEND = true

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [cartId, setCartId] = useState(null) // ID del carrito actual
  const [holdId, setHoldId] = useState(null) // ID del hold activo
  const [holdExpiresAt, setHoldExpiresAt] = useState(null) // Timestamp de expiración del hold
  const [loading, setLoading] = useState(false)
  const [appliedPoints, setAppliedPoints] = useState(0)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [shouldCreateHold, setShouldCreateHold] = useState(false) // Bandera para controlar cuándo crear hold
  const [maxTicketsPerPurchase, setMaxTicketsPerPurchase] = useState(null) // null hasta que cargue desde backend
  const [clearingCart, setClearingCart] = useState(false) // Prevenir múltiples llamadas simultáneas a clearCart
  
  // Usar ref para holdExpiresAt en createOrUpdateHold para evitar dependencias innecesarias
  const holdExpiresAtRef = useRef(holdExpiresAt);
  const clearingCartRef = useRef(false); // Ref para evitar race conditions
  
  useEffect(() => {
    holdExpiresAtRef.current = holdExpiresAt;
  }, [holdExpiresAt]);
  
  useEffect(() => {
    clearingCartRef.current = clearingCart;
  }, [clearingCart]);
  
  const [imageCache, setImageCache] = useState(() => {
    try {
      const cached = sessionStorage.getItem(IMAGE_CACHE_KEY)
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  })

  // Cargar configuración de sistema al iniciar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsService.get();
        logger.log('📊 Settings API response:', response);
        const maxTickets = response?.data?.maxTicketsPerPurchase || response?.maxTicketsPerPurchase;
        if (maxTickets && maxTickets > 0) {
          setMaxTicketsPerPurchase(maxTickets);
          logger.log('✅ maxTicketsPerPurchase cargado desde backend:', maxTickets);
        } else {
          logger.warn('⚠️ maxTicketsPerPurchase no encontrado en respuesta, usando default 20');
          setMaxTicketsPerPurchase(20);
        }
      } catch (error) {
        logger.error('❌ Error cargando settings del backend:', error);
        logger.error('   Detalles:', error.message);
        logger.warn('⚠️ Usando default maxTicketsPerPurchase = 20');
        setMaxTicketsPerPurchase(20);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!USE_BACKEND) {
      try {
        const itemsToStore = items.map(item => ({
          ...item,
          eventImage: undefined,
        }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToStore))
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          localStorage.removeItem(STORAGE_KEY)
          try {
            const itemsWithoutImages = items.map(item => ({
              id: item.id,
              eventId: item.eventId,
              eventTitle: item.eventTitle,
              zoneId: item.zoneId,
              zoneName: item.zoneName,
              quantity: item.quantity,
              price: item.price,
              eventDate: item.eventDate,
              eventLocation: item.eventLocation,
            }))
            localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsWithoutImages))
          } catch (e) {
            // Silently fail
          }
        }
      }
    }
  }, [items])

  const loadCart = useCallback(async () => {
    // ⚠️ No cargar si estamos en proceso de limpieza
    if (clearingCartRef.current) {
      logger.log('⏭️ Saltando loadCart - carrito en proceso de limpieza');
      return;
    }
    
    try {
      setLoading(true)
      if (USE_BACKEND) {
        localStorage.removeItem(STORAGE_KEY)
        
        const response = await cartService.getCart()
        const data = response?.data ?? response
        const backendItems = data?.items ?? []
        
        logger.log('📦 Datos del carrito desde backend:', data);
        
        // 🚨 CRÍTICO: Si backend devuelve carrito vacío, limpiar TODO el estado local
        if (backendItems.length === 0) {
          logger.log('🗑️ Backend devolvió carrito vacío - limpiando estado local');
          setItems([]);
          setAppliedPoints(0);
          setCartId(null);
          setHoldId(null);
          setHoldExpiresAt(null);
          setShouldCreateHold(false);
          sessionStorage.removeItem('digiticket_applied_points');
          sessionStorage.removeItem('digiticket_last_hold_expires');
          setLoading(false);
          return; // ⚠️ No continuar - el carrito está vacío
        }
        
        // Guardar el cartId para usarlo en el hold
        if (data?.id) {
          setCartId(data.id)
        }
        
        // 🔒 Verificar si el backend devuelve un hold activo
        // Backend devuelve holdExpiresAt directamente en CartDTO
        const backendHoldExpiresAt = data?.holdExpiresAt;
        
        if (backendHoldExpiresAt) {
          // ✅ Backend devolvió holdExpiresAt (puede ser LocalDateTime o ISO string)
          const expiresAtTime = new Date(backendHoldExpiresAt).getTime();
          const now = new Date().getTime();
          
          if (isNaN(expiresAtTime)) {
            logger.error('❌ holdExpiresAt inválido:', backendHoldExpiresAt);
            if (backendItems.length > 0) {
              logger.log('   Creando hold nuevo por formato inválido...');
              setShouldCreateHold(true);
            }
          } else if (expiresAtTime > now) {
            // Hold todavía válido - RESTAURAR sin crear uno nuevo
            logger.log('✅ Hold activo restaurado desde backend:', { 
              expiresAt: backendHoldExpiresAt,
              tiempoRestante: Math.round((expiresAtTime - now) / 1000) + 's',
              expiraEn: new Date(expiresAtTime).toLocaleTimeString()
            });
            setHoldExpiresAt(backendHoldExpiresAt);
            // Guardar timestamp en sessionStorage para detectar expiraciones posteriores
            sessionStorage.setItem('digiticket_last_hold_expires', backendHoldExpiresAt);
            // ⚠️ CRÍTICO: NO activar shouldCreateHold si ya hay un hold válido
            setShouldCreateHold(false);
          } else if (!clearingCartRef.current) {
            // 🗑️ Hold expiró mientras el usuario estaba ausente - Limpiar carrito (estándar industria)
            logger.warn('⏰ Hold expirado detectado al cargar página.');
            logger.warn('   Expiró hace:', Math.round((now - expiresAtTime) / 1000), 'segundos');
            logger.warn('   Limpiando carrito automáticamente...');
            
            // Prevenir múltiples llamadas simultáneas
            setClearingCart(true);
            try {
              await cartService.clearCart();
              setItems([]);
              setAppliedPoints(0);
              setCartId(null);
              setHoldId(null);
              setHoldExpiresAt(null);
              sessionStorage.removeItem('digiticket_applied_points');
              logger.log('✅ Carrito limpiado por hold expirado (estándar industria)');
            } catch (error) {
              logger.error('❌ Error limpiando carrito expirado:', error);
            } finally {
              setClearingCart(false);
            }
          }
        } else if (backendItems.length > 0) {
          // 🔍 No hay holdExpiresAt pero hay items en el carrito
          // Esto puede significar:
          // 1. Es la primera carga y nunca se creó un hold
          // 2. El hold expiró mientras el usuario estaba ausente
          
          // Verificar si había un timestamp guardado previamente
          const lastHoldTimestamp = sessionStorage.getItem('digiticket_last_hold_expires');
          if (lastHoldTimestamp) {
            const lastExpiry = new Date(lastHoldTimestamp).getTime();
            const now = new Date().getTime();
            
            // Si el timestamp guardado ya expiró, significa que el hold expiró
            if (lastExpiry < now && !clearingCartRef.current) {
              logger.warn('⏰ Hold expiró mientras el usuario estaba ausente.');
              logger.warn('   Expiró hace:', Math.round((now - lastExpiry) / 1000), 'segundos');
              logger.warn('   Limpiando carrito automáticamente...');
              
              setClearingCart(true);
              try {
                await cartService.clearCart();
                setItems([]);
                setAppliedPoints(0);
                setCartId(null);
                setHoldId(null);
                setHoldExpiresAt(null);
                sessionStorage.removeItem('digiticket_applied_points');
                sessionStorage.removeItem('digiticket_last_hold_expires');
                logger.log('✅ Carrito limpiado por hold expirado (estándar industria)');
                return; // No continuar cargando items
              } catch (error) {
                logger.error('❌ Error limpiando carrito expirado:', error);
              } finally {
                setClearingCart(false);
              }
            } else {
              // El timestamp guardado todavía es válido pero backend no lo devolvió
              // Esto es raro, crear hold nuevo
              logger.warn('⚠️ Timestamp local válido pero backend no devolvió hold. Recreando...');
              sessionStorage.removeItem('digiticket_last_hold_expires');
              setShouldCreateHold(true);
            }
          } else {
            // ✅ Primera carga - crear hold inicial
            logger.log('⚠️ No hay hold activo pero hay items en el carrito. Creando hold inicial...');
            setShouldCreateHold(true);
          }
        }
        
        // 🚀 Optimización: Cargar eventos únicos solo una vez (no repetir requests)
        const uniqueEventIds = [...new Set(backendItems.map(item => item.eventId))];
        const eventCache = {};
        
        // Cargar todos los eventos únicos en paralelo
        await Promise.all(
          uniqueEventIds.map(async (eventId) => {
            try {
              const eventResponse = await eventsService.getById(eventId);
              eventCache[eventId] = eventResponse?.data ?? eventResponse;
            } catch (error) {
              logger.warn(`⚠️ Error cargando evento ${eventId}:`, error);
              eventCache[eventId] = null;
            }
          })
        );
        
        // Enriquecer items usando el cache de eventos
        const enrichedItems = backendItems.map((item) => {
          const eventData = eventCache[item.eventId];
          
          if (eventData) {
            const zone = eventData?.eventZones?.find(z => z.id === item.eventZoneId);
            
            return {
              id: item.id,
              eventId: item.eventId,
              eventTitle: eventData?.title || eventData?.name || 'Evento sin nombre',
              eventImage: eventData?.imageBase64 || eventData?.image || '',
              eventDate: eventData?.dateTime || eventData?.date || '',
              eventLocation: eventData?.local?.name || eventData?.location || '',
              zoneId: item.eventZoneId || item.ticketTypeId,
              zoneName: zone?.name || 'Zona sin nombre',
              quantity: item.qty || item.quantity || 1,
              price: item.unitPrice || item.price || zone?.price || 0,
            };
          } else {
            // Fallback si no se pudo cargar el evento
            return {
              id: item.id,
              eventId: item.eventId,
              eventTitle: item.eventTitle || item.eventName || 'Evento sin nombre',
              zoneId: item.eventZoneId || item.ticketTypeId,
              zoneName: item.zoneName || item.ticketTypeName || 'Zona sin nombre',
              quantity: item.qty || item.quantity || 1,
              price: item.unitPrice || item.price || 0,
              eventImage: '',
              eventDate: '',
              eventLocation: '',
            };
          }
        })
        
        setItems(enrichedItems)
        
        // Restaurar puntos aplicados desde sessionStorage si existen
        const savedPoints = sessionStorage.getItem('digiticket_applied_points')
        if (savedPoints) {
          setAppliedPoints(parseInt(savedPoints, 10))
        } else {
          setAppliedPoints(data?.appliedPoints ?? 0)
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setItems(Array.isArray(parsed) ? parsed : [])
        }
      }
    } catch (error) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user, cartId])

  // Cargar el carrito cuando el usuario inicia sesión
  useEffect(() => {
    if (!user) {
      setItems([])
      setAppliedPoints(0)
      return
    }
    
    const init = async () => {
      try {
        await loadCart()
      } catch (error) {
        logger.error('Error cargando carrito:', error)
      }
    }
    init()
  }, [user, loadCart])
  
  // Función para crear o actualizar el hold cuando cambia el carrito
  const createOrUpdateHold = useCallback(async () => {
    logger.log('🔍 createOrUpdateHold llamado - user:', !!user, 'cartId:', cartId, 'items:', items.length);
    
    if (!user || !cartId) {
      logger.log('⚠️ No se puede crear hold: falta user o cartId');
      return;
    }
    
    // Verificar si ya existe un hold activo
    const currentHoldExpiresAt = holdExpiresAtRef.current;
    if (currentHoldExpiresAt) {
      const now = new Date().getTime();
      const expiresAtTime = new Date(currentHoldExpiresAt).getTime();
      
      if (expiresAtTime > now) {
        logger.log('✅ Hold activo preservado. Timer NO se resetea (estándar industria).');
        logger.log('   Tiempo restante:', Math.round((expiresAtTime - now) / 1000), 'segundos');
        return; // ⚠️ NO recrear - mantener el timer original
      } else {
        logger.log('⏰ Hold expirado. Creando uno nuevo...');
      }
    }
    
    try {
      const userId = user.id || user.userId;
      const holdItems = items.map(item => ({
        eventId: item.eventId,
        ticketTypeId: item.zoneId,
        qty: item.quantity
      }));
      
      if (holdItems.length === 0) {
        logger.log('⚠️ No hay items para crear hold');
        return;
      }
      
      logger.log('🔒 Creando/actualizando hold automático...');
      logger.log('📋 Datos del hold:', { userId, cartId, items: holdItems });
      
      const holdResult = await cartService.placeHold(userId, cartId, holdItems);
      
      logger.log('📦 Respuesta del backend:', holdResult);
      logger.log('📦 Respuesta completa (stringify):', JSON.stringify(holdResult, null, 2));
      
      if (holdResult?.holdId) {
        // Intentar diferentes nombres de campos para expiresAt
        const expiresAt = holdResult.expiresAt || 
                         holdResult.expiredAt || 
                         holdResult.expirationTime || 
                         holdResult.expiry ||
                         holdResult.expiryTime ||
                         holdResult.expiresOn;
        
        // Si backend no devuelve expiresAt, calcular 10 minutos desde ahora
        const finalExpiresAt = expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString();
        
        setHoldId(holdResult.holdId);
        setHoldExpiresAt(finalExpiresAt);
        // Guardar timestamp en sessionStorage para detectar expiraciones posteriores
        sessionStorage.setItem('digiticket_last_hold_expires', finalExpiresAt);
        logger.log('✅ Hold actualizado exitosamente!');
        logger.log('   holdId:', holdResult.holdId);
        logger.log('   expiresAt:', finalExpiresAt);
        
        if (!expiresAt) {
          logger.warn('⚠️ Backend no devolvió expiresAt. Usando 10 minutos por defecto.');
          logger.warn('   Fecha calculada:', finalExpiresAt);
        }
      } else {
        logger.warn('⚠️ Backend no devolvió holdId');
      }
    } catch (error) {
      logger.error('❌ Error al crear/actualizar hold:', error);
      logger.error('   Detalles:', error.response?.data || error.message);
      // No mostramos alerta aquí para no interrumpir el flujo
    }
  }, [user, cartId, items]);

  // 🔒 Crear hold SOLO si no existe uno activo (estándar de la industria)
  // Al agregar/quitar items, el backend actualiza los holds pero el timer NO se resetea
  useEffect(() => {
    // NO crear hold si estamos limpiando el carrito
    if (shouldCreateHold && items.length > 0 && user && cartId && !clearingCartRef.current) {
      logger.log('🔄 Verificando necesidad de hold...');
      // Pequeño delay para asegurar que el estado está actualizado
      const timer = setTimeout(() => {
        createOrUpdateHold(); // NO forzar - respeta hold existente
        setShouldCreateHold(false);
      }, 100);
      return () => clearTimeout(timer);
    } else if (shouldCreateHold && items.length === 0) {
      // Resetear flag si no hay items
      setShouldCreateHold(false);
    }
  }, [shouldCreateHold, items.length, user, cartId, createOrUpdateHold]);

  // ⏰ Monitorear expiración del hold en tiempo real
  useEffect(() => {
    if (!holdExpiresAt || items.length === 0) return;

    const expiresAtTime = new Date(holdExpiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAtTime - now;

    // Si ya expiró, limpiar inmediatamente
    if (timeUntilExpiry <= 0) {
      logger.warn('⏰ Hold ya expirado, limpiando carrito...');
      if (!clearingCartRef.current) {
        // ⚠️ CRÍTICO: Limpiar sessionStorage ANTES para evitar race conditions
        sessionStorage.removeItem('digiticket_applied_points');
        sessionStorage.removeItem('digiticket_last_hold_expires');
        
        setClearingCart(true);
        cartService.clearCart()
          .then(() => {
            setItems([]);
            setAppliedPoints(0);
            setCartId(null);
            setHoldId(null);
            setHoldExpiresAt(null);
            setShouldCreateHold(false); // Evitar crear hold después de limpiar
            logger.log('✅ Carrito limpiado por expiración');
          })
          .catch(err => logger.error('Error limpiando carrito:', err))
          .finally(() => setClearingCart(false));
      }
      return;
    }

    // Configurar timer para limpiar cuando expire
    logger.log(`⏱️ Timer de expiración: ${Math.round(timeUntilExpiry / 1000)}s`);
    const timer = setTimeout(() => {
      logger.warn('⏰ Hold expirado, limpiando carrito automáticamente...');
      if (!clearingCartRef.current) {
        // ⚠️ CRÍTICO: Limpiar sessionStorage ANTES para evitar race conditions
        sessionStorage.removeItem('digiticket_applied_points');
        sessionStorage.removeItem('digiticket_last_hold_expires');
        
        setClearingCart(true);
        cartService.clearCart()
          .then(() => {
            setItems([]);
            setAppliedPoints(0);
            setCartId(null);
            setHoldId(null);
            setHoldExpiresAt(null);
            setShouldCreateHold(false); // Evitar crear hold después de limpiar
            logger.log('✅ Carrito limpiado por expiración en tiempo real');
          })
          .catch(err => logger.error('Error limpiando carrito:', err))
          .finally(() => setClearingCart(false));
      }
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [holdExpiresAt, items.length]);

  const addItem = useCallback(async (newItem) => {
    try {
      setLoading(true)

      const ticketsForEvent = items
        .filter(item => item.eventId === newItem.eventId)
        .reduce((sum, item) => sum + item.quantity, 0)

      const totalAfterAdding = ticketsForEvent + (newItem.quantity || 1)

      if (totalAfterAdding > maxTicketsPerPurchase) {
        const remaining = maxTicketsPerPurchase - ticketsForEvent
        const message = ticketsForEvent === 0
          ? `No puedes agregar más de ${maxTicketsPerPurchase} tickets para el mismo evento`
          : `Solo puedes como máximo agregar en total ${remaining} ticket${remaining !== 1 ? 's' : ''} más de este evento (ya tienes ${ticketsForEvent})`
        return { ok: false, error: message, code: 'MAX_TICKETS_PER_EVENT' }
      }

      if (USE_BACKEND) {
        try {
          // Llamar API para agregar - Backend devuelve CartDTO con holdExpiresAt
          const response = await cartService.addItem(newItem)
          const cartData = response?.data ?? response
          
          logger.log('✅ Item agregado al carrito')
          logger.log('📦 Respuesta del backend:', cartData);
          
          // 🆔 Actualizar cartId si el backend lo devuelve
          if (cartData?.id && cartData.id !== cartId) {
            logger.log('🆔 Actualizando cartId:', cartData.id);
            setCartId(cartData.id);
          }
          
          // 🔒 Capturar holdExpiresAt del backend si existe
          const backendHoldExpiresAt = cartData?.holdExpiresAt;
          if (backendHoldExpiresAt) {
            const expiresAtTime = new Date(backendHoldExpiresAt).getTime();
            const now = Date.now();
            
            if (!isNaN(expiresAtTime) && expiresAtTime > now) {
              logger.log('✅ Backend creó hold automáticamente:', backendHoldExpiresAt);
              setHoldId(cartData?.holdId);
              setHoldExpiresAt(backendHoldExpiresAt);
              sessionStorage.setItem('digiticket_last_hold_expires', backendHoldExpiresAt);
              // Ya tenemos hold - NO necesitamos crear uno nuevo
              setShouldCreateHold(false);
            } else {
              logger.warn('⚠️ holdExpiresAt inválido o expirado');
              setShouldCreateHold(true);
            }
          } else {
            // Backend no devolvió hold - necesitamos crear uno
            logger.log('⚠️ Backend no devolvió holdExpiresAt - creando hold...');
            setShouldCreateHold(true);
          }
          
          // 🚀 OPTIMIZACIÓN: Actualizar estado local inmediatamente sin esperar loadCart
          // Esto hace que la UI responda instantáneamente
          setItems((current) => {
            const existingIndex = current.findIndex(
              (item) => item.eventId === newItem.eventId && item.zoneId === newItem.zoneId
            )
            if (existingIndex >= 0) {
              // Actualizar cantidad del item existente
              const updated = [...current]
              updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: updated[existingIndex].quantity + (newItem.quantity || 1),
              }
              return updated
            } else {
              // Agregar nuevo item con todos los datos del frontend
              return [...current, {
                id: Date.now() + Math.random(), // ID temporal
                eventId: newItem.eventId,
                eventTitle: newItem.eventTitle,
                eventImage: newItem.eventImage,
                eventDate: newItem.eventDate,
                eventLocation: newItem.eventLocation,
                zoneId: newItem.zoneId,
                zoneName: newItem.zoneName,
                price: newItem.price,
                quantity: newItem.quantity || 1,
              }]
            }
          })
          
          return { ok: true }
        } catch (error) {
          // Extraer mensaje del backend si existe
          const backendMsg = error?.payload?.message || error?.message || error?.errorMessage
          return {
            ok: false,
            error: backendMsg || `Ya posees tickets para este evento. No se pueden agregar más de ${maxTicketsPerPurchase} tickets en total para el mismo evento`,
            code: error?.payload?.errorCode || 'VALIDATION_ERROR',
            details: error?.payload?.details
          }
        }
      } else {
        setItems((current) => {
          const existingIndex = current.findIndex(
            (item) => item.eventId === newItem.eventId && item.zoneId === newItem.zoneId
          )
          if (existingIndex >= 0) {
            const updated = [...current]
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + (newItem.quantity || 1),
            }
            return updated
          } else {
            return [
              ...current,
              {
                id: Date.now() + Math.random(),
                eventId: newItem.eventId,
                eventTitle: newItem.eventTitle,
                zoneId: newItem.zoneId,
                zoneName: newItem.zoneName,
                quantity: newItem.quantity || 1,
                price: newItem.price,
                eventDate: newItem.eventDate,
                eventLocation: newItem.eventLocation,
                eventImage: newItem.eventImage,
              },
            ]
          }
        })
        return { ok: true }
      }
    } finally {
      setLoading(false)
    }
  }, [items, loadCart])

  const removeItem = useCallback(async (itemId) => {
    try {
      setLoading(true)
      if (USE_BACKEND) {
        await cartService.removeItem(itemId)
        await loadCart()
        // 🎫 Solo crear hold si NO existe uno activo (estándar industria)
        if (!holdId || !holdExpiresAt || new Date(holdExpiresAt).getTime() < Date.now()) {
          setShouldCreateHold(true)
        } else {
          console.log('⏱️ Hold activo existente - NO se resetea el timer');
        }
      } else {
        setItems((current) => current.filter((item) => item.id !== itemId))
      }
      return { ok: true }
    } catch (error) {
      return { ok: false, error }
    } finally {
      setLoading(false)
    }
  }, [loadCart])

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) {
      return removeItem(itemId)
    }

    try {
      setLoading(true)
      
      if (!USE_BACKEND) {
        const item = items.find(i => i.id === itemId)
        if (item) {
          const otherTicketsForEvent = items
            .filter(i => i.eventId === item.eventId && i.id !== itemId)
            .reduce((sum, i) => sum + i.quantity, 0)
          
          const totalAfterUpdate = otherTicketsForEvent + quantity
          
          if (totalAfterUpdate > maxTicketsPerPurchase) {
            const remaining = maxTicketsPerPurchase - otherTicketsForEvent
            const message = `Solo puedes tener máximo ${maxTicketsPerPurchase} tickets para este evento. Puedes establecer máximo ${remaining} para este item.`
            alert(message)
            return { ok: false, error: message, code: 'MAX_TICKETS_PER_EVENT' }
          }
        }
      }
      
      if (USE_BACKEND) {
        await cartService.updateQuantity(itemId, quantity)
        await loadCart()
        // 🎫 Solo crear hold si NO existe uno activo (estándar industria)
        if (!holdId || !holdExpiresAt || new Date(holdExpiresAt).getTime() < Date.now()) {
          setShouldCreateHold(true)
        } else {
          console.log('⏱️ Hold activo existente - NO se resetea el timer');
        }
      } else {
        setItems((current) =>
          current.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          )
        )
      }
      return { ok: true }
    } catch (error) {
      if (error.status === 422) {
        const message = error.message || `No se pueden tener más de ${maxTicketsPerPurchase} tickets para el mismo evento`
        alert(message)
        return { ok: false, error: message, code: 'VALIDATION_ERROR' }
      }
      
      return { ok: false, error }
    } finally {
      setLoading(false)
    }
  }, [items, loadCart, removeItem])

  const clearCart = useCallback(async () => {
    try {
      if (USE_BACKEND) {
        await cartService.clearCart()
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      setItems([])
      setAppliedPoints(0)
      setHoldId(null) // Limpiar hold ID
      setHoldExpiresAt(null) // Limpiar hold timestamp
      setShowClearConfirmation(false)
      
      // Limpiar puntos aplicados de sessionStorage
      sessionStorage.removeItem('digiticket_applied_points')
      sessionStorage.removeItem('digiticket_last_hold_expires')
      
      setImageCache({})
      sessionStorage.removeItem(IMAGE_CACHE_KEY)
      
      return { ok: true }
    } catch (error) {
      return { ok: false, error }
    }
  }, [])
  
  const requestClearCart = useCallback(() => {
    setShowClearConfirmation(true)
  }, [])
  
  const cancelClearCart = useCallback(() => {
    setShowClearConfirmation(false)
  }, [])

  const applyPoints = useCallback(async (points) => {
    try {
      if (USE_BACKEND) {
        // Por ahora, el backend no tiene endpoint dedicado para aplicar puntos
        // Los puntos se aplican durante el checkout vía pointsUsed
        // Así que solo actualizamos el estado local
        setAppliedPoints(points)
        
        // Guardar en sessionStorage para persistir entre recargas
        sessionStorage.setItem('digiticket_applied_points', points.toString())
      } else {
        setAppliedPoints(points)
      }
      return { ok: true }
    } catch (error) {
      return { ok: false, error }
    }
  }, [])

  const checkout = useCallback(async (paymentData) => {
    try {
      setLoading(true)
      
      if (USE_BACKEND) {
        // ⚠️ Verificar que hay items en el carrito antes de hacer checkout
        console.log('📋 Items en frontend antes de checkout:', items)
        
        if (!items || items.length === 0) {
          console.error('❌ El carrito está vacío en el frontend')
          return { 
            ok: false, 
            error: 'El carrito está vacío. Por favor agrega items antes de procesar el pago.' 
          }
        }
        
        // Construir payload según la especificación del backend
        const userId = user?.id || user?.userId || null

        let paymentMethod = 'CARD'
        if (paymentData.method === 'yape') paymentMethod = 'WALLET'
        if (paymentData.method === 'points') paymentMethod = 'POINTS'

        const checkoutPayload = {
          userId: userId,
          cardToken: paymentData.method === 'yape'
            ? `tok_wallet_${(paymentData.phone || '999999999')}`
            : `tok_card_${paymentData.cardNumber?.replace(/\s/g, '') || '4111111111111111'}`,
          pointsUsed: appliedPoints || 0,
          paymentMethod: paymentMethod
        }

        // Generar idempotency key (opcional) para evitar duplicados
        const idempotencyKey = `checkout-${Date.now()}-${Math.random().toString(36).slice(2,9)}`

        logger.log('💳 Iniciando checkout con payload:', checkoutPayload, 'Idempotency-Key:', idempotencyKey)
        const response = await cartService.checkout(checkoutPayload, idempotencyKey)
        logger.log('✅ Checkout exitoso:', response)
        await clearCart()
        return { ok: true, data: response?.data ?? response }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await clearCart()
        return { ok: true, data: { orderId: Date.now() } }
      }
    } catch (error) {
      logger.error('❌ Error en checkout:', error)
      // Extraer mensaje del backend si está disponible
      const backendMessage = error?.payload?.message || error?.message
      return { 
        ok: false, 
        error: backendMessage || 'Error inesperado al procesar el pago. Verifica que el carrito tenga items.'
      }
    } finally {
      setLoading(false)
    }
  }, [clearCart, appliedPoints, items])

  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
  const pointsDiscount = appliedPoints * 0.5
  const total = Math.max(0, subtotal - pointsDiscount)
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0)

  const value = {
    items,
    cartId, // ID del carrito para el hold
    holdExpiresAt, // Timestamp de expiración del hold para el temporizador
    loading,
    appliedPoints,
    subtotal,
    pointsDiscount,
    total,
    itemCount,
    showClearConfirmation,
    maxTicketsPerPurchase, // Límite configurable de tickets por evento
    
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    requestClearCart,
    cancelClearCart,
    applyPoints,
    checkout,
    loadCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}
