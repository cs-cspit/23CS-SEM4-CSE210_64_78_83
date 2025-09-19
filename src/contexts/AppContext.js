"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useAppContext = exports.AppProvider = void 0;
var _react = _interopRequireWildcard(require("react"));
var _inventoryUtils = require("../utils/inventoryUtils");
var _mockData = require("../data/mockData");
var _api = require("../services/api");

function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }

const AppContext = /*#__PURE__*/(0, _react.createContext)(undefined);

const initialState = {
  products: [],
  notifications: [],
  donations: _mockData.mockDonations || [],
  sellTransactions: [],
  darkMode: false,
  loading: false,
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload || [] };
    case 'SET_SELL_TRANSACTIONS':
      return { ...state, sellTransactions: action.payload || [] };
    case 'ADD_PRODUCT':
      return { 
        ...state, 
        products: [...(state.products || []), action.payload]
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: (state.products || []).map(product =>
          product._id === action.payload._id ? action.payload : product
        )
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: (state.products || []).filter(product => product._id !== action.payload)
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_DONATION':
      return { ...state, donations: [...(state.donations || []), action.payload] };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload || [] };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...(state.notifications || [])] };
    case 'MARK_NOTIFICATION_AS_READ':
      return {
        ...state,
        notifications: (state.notifications || []).map(notification =>
          notification._id === action.payload ? { ...notification, isRead: true } : notification
        )
      };
    case 'CLEAR_ALL_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'ADD_SELL_TRANSACTION':
      return { 
        ...state, 
        sellTransactions: [action.payload, ...(state.sellTransactions || [])],
        products: state.products.map(product =>
          product._id === action.payload.inventoryItemId
            ? { 
                ...product, 
                quantity: product.quantity - action.payload.quantity,
                isWasted: product.quantity - action.payload.quantity <= 0 ? true : product.isWasted,
                discount: product.quantity - action.payload.quantity <= 0 ? 100 : product.discount
              }
            : product
        )
      };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    default:
      return state;
  }
}

const AppProvider = ({ children }) => {
  const [state, dispatch] = (0, _react.useReducer)(appReducer, initialState);

  // Fetch products, sold items and notifications on component mount
  (0, _react.useEffect)(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const [products, soldItems, notifications] = await Promise.all([
          _api.inventoryApi.getAllItems(),
          _api.soldItemsApi.getAllItems(),
          _api.notificationsApi.getAllNotifications()
        ]);
        dispatch({ type: 'SET_PRODUCTS', payload: products });
        dispatch({ type: 'SET_SELL_TRANSACTIONS', payload: soldItems });
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchData();
  }, []);

  // Update product discounts based on expiration dates
  (0, _react.useEffect)(() => {
    // Skip if no products or empty array
    if (!state.products || state.products.length === 0) return;
    
    // Calculate updated products
    const updatedProducts = (0, _inventoryUtils.updateProductDiscounts)(state.products);
    
    // Check for products that are close to expiring and create notifications
    checkExpiringProducts(updatedProducts);
    
    // Only dispatch if there are actual changes to prevent infinite loops
    const hasChanges = JSON.stringify(updatedProducts) !== JSON.stringify(state.products);
    
    if (hasChanges) {
      dispatch({ type: 'SET_PRODUCTS', payload: updatedProducts });
    }
  }, [state.products]);

  // Check for expiring products and create notifications
  const checkExpiringProducts = async (products) => {
    try {
      // Find products that will expire within 3 days
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);
      
      const expiringProducts = products.filter(product => {
        const expirationDate = new Date(product.expirationDate);
        return expirationDate > now && expirationDate <= threeDaysFromNow && !product.isWasted && !product.isDonated;
      });
      
      // Create notifications for expiring products that don't already have notifications
      for (const product of expiringProducts) {
        // Check if we already have a notification for this product
        const existingNotification = state.notifications.find(
          n => n.productId === product._id && n.type === 'warning' && !n.isRead
        );
        
        if (!existingNotification) {
          const daysUntilExpiration = Math.ceil((new Date(product.expirationDate) - now) / (1000 * 60 * 60 * 24));
          const notificationData = {
            message: `${product.name} is expiring in ${daysUntilExpiration} day${daysUntilExpiration > 1 ? 's' : ''}.`,
            type: 'warning',
            productId: product._id
          };
          
          await addNotification(notificationData);
        }
      }
      
      // Check for products with discount changes
      const productsWithDiscountChange = products.filter(product => {
        const existingProduct = state.products.find(p => p._id === product._id);
        return existingProduct && existingProduct.discount !== product.discount && product.discount > 0;
      });
      
      // Create notifications for discount changes
      for (const product of productsWithDiscountChange) {
        // Check if we already have a notification for this discount change
        const existingNotification = state.notifications.find(
          n => n.productId === product._id && n.type === 'info' && n.message.includes(`${product.discount}% discount`)
        );
        
        if (!existingNotification) {
          const notificationData = {
            message: `${product.name} is now at ${product.discount}% discount!`,
            type: 'info',
            productId: product._id
          };
          
          await addNotification(notificationData);
        }
      }
    } catch (error) {
      console.error('Error checking expiring products:', error);
    }
  };

  const addProduct = async (productData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newProduct = await _api.inventoryApi.addItem(productData);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      return newProduct;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedProduct = await _api.inventoryApi.updateItem(id, updates);
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      return updatedProduct;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteProduct = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await _api.inventoryApi.deleteItem(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addDonation = async (donation) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'ADD_DONATION', payload: donation });
      
      // Create a notification for the donation
      const product = state.products.find(p => p._id === donation.productId);
      if (product) {
        const notificationData = {
          message: `${product.name} has been marked for donation!`,
          type: 'success',
          productId: product._id
        };
        
        await addNotification(notificationData);
      }
      
      return donation;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addNotification = async (notification) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newNotification = await _api.notificationsApi.addNotification(notification);
      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
      return newNotification;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedNotification = await _api.notificationsApi.markAsRead(id);
      dispatch({ type: 'MARK_NOTIFICATION_AS_READ', payload: id });
      return updatedNotification;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearAllNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await _api.notificationsApi.clearAllNotifications();
      dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addSellTransaction = async (transaction) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Validate required fields before sending to API
      const requiredFields = ['inventoryItemId', 'quantity', 'totalPrice', 'sellDate'];
      const missingFields = requiredFields.filter(field => !transaction[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Validate that quantity is positive
      if (transaction.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      // Find the product to validate quantity
      const product = state.products.find(p => p._id === transaction.inventoryItemId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (transaction.quantity > product.quantity) {
        throw new Error(`Cannot sell more than available quantity (${product.quantity})`);
      }
      
      // Process the transaction
      const newTransaction = await _api.soldItemsApi.addItem(transaction);
      
      // Update local state
      dispatch({ 
        type: 'ADD_SELL_TRANSACTION', 
        payload: newTransaction 
      });
      
      // Create a notification for the sale
      const notificationData = {
        message: `${product.name} sold successfully for ₹${transaction.totalPrice.toFixed(2)}`,
        type: 'success',
        productId: product._id
      };
      
      await addNotification(notificationData);
      
      return newTransaction;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const value = {
    ...state,
    addProduct,
    updateProduct,
    deleteProduct,
    addDonation,
    addNotification,
    markNotificationAsRead,
    clearAllNotifications,
    addSellTransaction,
    toggleDarkMode
  };

  return /*#__PURE__*/_react.default.createElement(AppContext.Provider, {
    value: value
  }, children);
};

exports.AppProvider = AppProvider;

const useAppContext = () => {
  const context = (0, _react.useContext)(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

exports.useAppContext = useAppContext;