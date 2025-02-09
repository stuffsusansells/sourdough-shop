// ... previous imports and constants remain the same ...

const AdminInterface = ({ 
  inventory, 
  setInventory, 
  setIsAdmin, 
  pickupDate, 
  setPickupDate,
  refreshInventory 
}) => {
  const handleInventoryChange = async (breadId, field, value) => {
    let existingItemIndex = inventory.findIndex(item => item.breadId === breadId);
    
    if (existingItemIndex === -1 && field === 'available' && value === true) {
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
        await refreshInventory();
      } catch (error) {
        console.error('Error updating inventory:', error);
      }
    } else if (existingItemIndex >= 0) {
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
      
      setInventory(newInventory);
      
      try {
        await updateInventory(newInventory);
        await refreshInventory();
      } catch (error) {
        console.error('Error updating inventory:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={refreshInventory}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Refresh Inventory
                </button>
                <button 
                  onClick={() => setIsAdmin(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Order Form
                </button>
              </div>
            </div>
          </div>

          {/* Pickup Date Section */}
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date</label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Inventory Management */}
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {ALL_BREAD_OPTIONS.map(bread => {
                const inventoryItem = inventory.find(i => i.breadId === bread.id);
                return (
                  <div key={bread.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {/* Image Section */}
                        <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          {inventoryItem?.imageUrl ? (
                            <img
                              src="/api/placeholder/96/96"
                              alt={bread.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={inventoryItem?.available || false}
                                onChange={(e) => handleInventoryChange(bread.id, 'available', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium text-gray-900">{bread.name}</span>
                            </label>
                            <span className="text-sm text-gray-500">${bread.price}</span>
                          </div>

                          {(inventoryItem?.available || false) && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Available Quantity
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={inventoryItem?.quantity || 0}
                                    onChange={(e) => handleInventoryChange(bread.id, 'quantity', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Image URL
                                  </label>
                                  <input
                                    type="text"
                                    value={inventoryItem?.imageUrl || ''}
                                    onChange={(e) => handleInventoryChange(bread.id, 'imageUrl', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter image URL"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
  // Rest of AdminInterface remains the same...
};

const OrderForm = ({ inventory, setIsAdmin, pickupDate, refreshInventory }) => {
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
      refreshInventory();
      setSubmitted(true);
      setError('');
    } catch (error) {
      console.error('Error submitting order:', error);
      setError('There was an error submitting your order. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <Alert>
            <Check className="h-4 w-4 mt-1" />
            <AlertDescription>
              <h2 className="text-lg font-semibold mb-2">Order Confirmed!</h2>
              <p>Thank you for your order! We will contact you at {formData.phone} to confirm your order.</p>
              <div className="mt-4 text-sm">
                Pickup Date: {new Date(pickupDate).toLocaleDateString()}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sourdough Bread Order</h1>
              <button 
                onClick={() => setIsAdmin(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Lock className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pickup Date Alert */}
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <Alert>
              <Calendar className="h-4 w-4 mt-0.5" />
              <AlertDescription>
                <span className="font-medium">Pickup Date:</span>{' '}
                {new Date(pickupDate).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          </div>

          {/* Order Form */}
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Contact Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bread Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Your Breads</h2>
                <div className="grid grid-cols-1 gap-4">
                  {availableBreads.map(bread => {
                    const inventoryItem = inventory.find(i => i.breadId === bread.id);
                    const remainingQuantity = inventoryItem.quantity - 
                      (formData.orders.find(o => o.breadId === bread.id)?.quantity || 0);
                    
                    return (
                      <div 
                        key={bread.id} 
                        className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {inventoryItem?.imageUrl ? (
                            <img
                              src="/api/placeholder/96/96"
                              alt={bread.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="font-medium text-gray-900">{bread.name}</h3>
                          <p className="text-sm text-gray-500">
                            ${bread.price} - {remainingQuantity} available
                          </p>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            max={inventoryItem.quantity}
                            value={formData.orders.find(o => o.breadId === bread.id).quantity}
                            onChange={(e) => handleQuantityChange(bread.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-center shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total and Submit */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">${calculateTotal()}</span>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

  // Rest of OrderForm remains the same...
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

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await getInventory();
      if (response.status === 'success') {
        console.log('Updating inventory:', response.inventory);
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

  // Initial load
  useEffect(() => {
    loadInventory();
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!loading) {
        loadInventory();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [loading]);

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
        refreshInventory={loadInventory}  // Add refreshInventory prop
      />
    );
  }

  return (
    <OrderForm
      inventory={inventory}
      setIsAdmin={setIsAdmin}
      pickupDate={pickupDate}
      refreshInventory={loadInventory}  // Add refreshInventory prop
    />
  );
};

export default SourdoughShop;