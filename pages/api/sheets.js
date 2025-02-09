const GOOGLE_APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

// Add this line to test
console.log('First 10 characters of URL:', GOOGLE_APPS_SCRIPT_URL?.substring(0, 10));

export async function getInventory() {
  try {
    console.log('Fetching inventory from:', GOOGLE_APPS_SCRIPT_URL);
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'getInventory'
      })
    });
    const data = await response.json();
    console.log('Received inventory data:', data);
    return data;
  } catch (error) {
    console.error('Error getting inventory:', error);
    throw error;
  }
}

export async function updateInventory(inventory) {
  try {
    console.log('Updating inventory with:', inventory);
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'updateInventory',
        inventory
      })
    });
    const data = await response.json();
    console.log('Update response:', data);
    return data;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
}

export async function submitOrder(orderData) {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'order',
        ...orderData
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
}