import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Lock, Calendar, ImageIcon } from 'lucide-react';
import { getInventory, updateInventory, submitOrder } from '../pages/api/sheets';

const ADMIN_PASSWORD = 'sourdough123'; // In a real app, this would be securely stored

const ALL_BREAD_OPTIONS = [
  { id: 1, name: 'Regular Loaf', price: 15 },
  { id: 2, name: 'Cheddar Jalapeño', price: 17 },
  { id: 3, name: 'Double Chocolate Chip', price: 17 },
  { id: 4, name: 'Cheddar and Chives', price: 17 },
  { id: 5, name: 'Everything Seasoning and White Cheddar', price: 17 },
  { id: 6, name: 'Cinnamon Raisin', price: 17 },
  { id: 7, name: 'Garlic Rosemary', price: 17 }
];

// Alert component (since we don't have access to shadcn/ui in this setup)
const Alert = ({ children, variant = 'default' }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-50' : 'bg-blue-50';
  const textColor = variant === 'destructive' ? 'text-red-700' : 'text-blue-700';
  
  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg flex items-start gap-2`}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children }) => (
  <div className="text-sm">{children}</div>
);

const LoginForm = ({ onLogin, error }) => (
  <div className="max-w-md mx-auto p-6">
    <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
    <form onSubmit={onLogin} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          name="password"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Login
      </button>
    </form>
  </div>
);

const AdminInterface = ({ inventory, setInventory, setIsAdmin, pickupDate, setPickupDate }) => {
  const handleInventoryChange = async (breadId, field, value) => {
    // Find existing inventory item or create a new one
    let existingItemIndex = inventory.findIndex(item => item.breadId === breadId);
    
    if (existingItemIndex === -1 && field === 'available' && value === true) {
      // Create new inventory item when checking the box
      const newItem = {
        breadId: breadId,
        available: true,
        quantity: 0,
        imageUrl: ''
      };
      const newInventory = [...inventory, newItem];
      setInventory(newInventory);
      
      try {
        await updateInventory(newInventory);
      } catch (error) {
        console.error('Error updating inventory:', error);
      }
    } else if (existingItemIndex >= 0) {
      // Update existing inventory item
      const newInventory = inventory.map(item => {
        if (item.breadId === breadId) {
          return {
            ...item,
            [field]: field === 'available' ? value :
                    field === 'quantity' ? Math.max(0, parseInt(value) || 0) :
                    value
          };
        }
        return item;
      });
      
      // If making unavailable, you might want to retain the item but mark it unavailable
      // rather than removing it completely
      setInventory(newInventory);
      
      try {
        await updateInventory(newInventory);
      } catch (error) {
        console.error('Error updating inventory:', error);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={() => setIsAdmin(false)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Switch to Order Form
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Pickup Date</label>
        <input
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="space-y-4">
        {ALL_BREAD_OPTIONS.map(bread => {
          const inventoryItem = inventory.find(i => i.breadId === bread.id);
          return (
            <div key={bread.id} className="p-4 border rounded">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                  {inventoryItem?.imageUrl ? (
                    <img
                      src="/api/placeholder/96/96"
                      alt={bread.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium">
                      <input
                        type="checkbox"
                        checked={inventoryItem?.available || false}
                        onChange={(e) => handleInventoryChange(bread.id, 'available', e.target.checked)}
                        className="mr-2"
                      />
                      {bread.name}
                    </label>
                    <span className="text-sm text-gray-500">${bread.price}</span>
                  </div>
                  {(inventoryItem?.available || false) && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600">Available Quantity:</label>
                        <input
                          type="number"
                          min="0"
                          value={inventoryItem?.quantity || 0}
                          onChange={(e) => handleInventoryChange(bread.id, 'quantity', e.target.value)}
                          className="w-24 p-1 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">Image URL:</label>
                        <input
                          type="text"
                          value={inventoryItem?.imageUrl || ''}
                          onChange={(e) => handleInventoryChange(bread.id, 'imageUrl', e.target.value)}
                          className="w-full p-1 border rounded mt-1"
                          placeholder="Enter image URL"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const OrderForm = ({ inventory, setIsAdmin, pickupDate }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    orders: inventory.map(item => ({ breadId: item.breadId, quantity: 0 }))
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const availableBreads = ALL_BREAD_OPTIONS.filter(bread => 
    inventory.find(i => i.breadId === bread.id)?.available
  );

  const handleQuantityChange = (breadId, newQuantity) => {
    const availableQuantity = inventory.find(i => i.breadId === breadId)?.quantity || 0;
    const quantity = Math.min(Math.max(0, parseInt(newQuantity) || 0), availableQuantity);

    setFormData(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.breadId === breadId ? { ...order, quantity } : order
      )
    }));
  };

  const calculateTotal = () => {
    return formData.orders.reduce((total, order) => {
      const bread = ALL_BREAD_OPTIONS.find(b => b.id === order.breadId);
      return total + (bread.price * order.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!formData.orders.some(order => order.quantity > 0)) {
      setError('Please select at least one bread option');
      return;
    }

    try {
      const orderData = {
        name: formData.name,
        phone: formData.phone,
        orders: formData.orders.filter(order => order.quantity > 0),
        pickupDate,
        total: calculateTotal(),
        timestamp: new Date().toISOString()
      };

      await submitOrder(orderData);
      setSubmitted(true);
      setError('');
    } catch (error) {
      console.error('Error submitting order:', error);
      setError('There was an error submitting your order. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            Thank you for your order! We will contact you at {formData.phone} to confirm your order.
            <div className="mt-2">
              Pickup Date: {new Date(pickupDate).toLocaleDateString()}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sourdough Bread Order Form</h1>
        <button 
          onClick={() => setIsAdmin(true)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Lock className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-6">
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Pickup Date: {new Date(pickupDate).toLocaleDateString()}
          </AlertDescription>
        </Alert>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Available Breads</h2>
          <div className="space-y-4">
            {availableBreads.map(bread => {
              const inventoryItem = inventory.find(i => i.breadId === bread.id);
              const remainingQuantity = inventoryItem.quantity - 
                (formData.orders.find(o => o.breadId === bread.id)?.quantity || 0);
              
              return (
                <div key={bread.id} className="flex items-start gap-4 p-3 border rounded">
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                    {inventoryItem?.imageUrl ? (
                      <img
                        src="/api/placeholder/96/96"
                        alt={bread.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{bread.name}</span>
                        <span className="block text-sm text-gray-500">
                          ${bread.price} - {remainingQuantity} available
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={inventoryItem.quantity}
                        value={formData.orders.find(o => o.breadId === bread.id).quantity}
                        onChange={(e) => handleQuantityChange(bread.id, e.target.value)}
                        className="w-16 p-1 border rounded text-center"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-xl font-bold">
            Total: ${calculateTotal()}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Place Order
        </button>
      </form>
    </div>
  );
};

const SourdoughShop = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickupDate, setPickupDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const response = await getInventory();
        if (response.status === 'success') {
          setInventory(response.inventory);
        } else {
          setError('Failed to load inventory');
        }
      } catch (error) {
        console.error('Error loading inventory:', error);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isAdmin && !isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  if (isAdmin && isAuthenticated) {
    return (
      <AdminInterface
        inventory={inventory}
        setInventory={setInventory}
        setIsAdmin={setIsAdmin}
        pickupDate={pickupDate}
        setPickupDate={setPickupDate}
      />
    );
  }

  return (
    <OrderForm
      inventory={inventory}
      setIsAdmin={setIsAdmin}
      pickupDate={pickupDate}
    />
  );
};

export default SourdoughShop;