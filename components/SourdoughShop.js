// ... previous imports and constants remain the same ...

const AdminInterface = ({ 
  inventory, 
  setInventory, 
  setIsAdmin, 
  pickupDate, 
  setPickupDate,
  refreshInventory  // Added refreshInventory prop
}) => {
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
        // Refresh inventory after update
        await refreshInventory();
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
        // Refresh inventory after update
        await refreshInventory();
      } catch (error) {
        console.error('Error updating inventory:', error);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={refreshInventory}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Refresh
          </button>
          <button 
            onClick={() => setIsAdmin(false)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Switch to Order Form
          </button>
        </div>
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

  // Rest of AdminInterface remains the same...
};

const OrderForm = ({ inventory, setIsAdmin, pickupDate, refreshInventory }) => {
  // ... existing OrderForm code ...

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
      // Add refresh after successful order
      refreshInventory();
      setSubmitted(true);
      setError('');
    } catch (error) {
      console.error('Error submitting order:', error);
      setError('There was an error submitting your order. Please try again.');
    }
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