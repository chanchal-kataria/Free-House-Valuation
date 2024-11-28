// Prevent form submission
document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
  });
  
  // Initialize variables
  let map, marker;
  
  // Initialize Google Map
  function initMap(lat, lng) {
    const mapDiv = document.getElementById('map');
    mapDiv.style.display = 'block'; // Show the map div
  
    const location = { lat, lng };
  
    map = new google.maps.Map(mapDiv, {
      center: location,
      zoom: 14,
    });
  
    marker = new google.maps.Marker({
      position: location,
      map: map,
      draggable: true, // Enable dragging
    });
  
    // Update address on marker drag
    google.maps.event.addListener(marker, 'dragend', () => {
      const position = marker.getPosition();
      console.log('New Marker Position:', position.lat(), position.lng());
      // Optional: Update localStorage or UI with the new position
    });
  }
  
  // Handle address selection
  function handleAddressSelection(place) {
    const address = place.formatted_address;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
  
    // Update input value
    document.querySelector('input[name="address"]').value = address;
  
    // Save details to local storage
    localStorage.setItem('Selected_Address', JSON.stringify({ address, lat, lng }));
  
    // Initialize map with the selected location
    initMap(lat, lng);
  }
  
  // Fetch Place Details from Google
  function fetchPlaceDetails(placeId) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    service.getDetails({ placeId }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const addressComponents = place.address_components;
  
        // Initialize required fields
        let address = '';
        let city = '';
        let state = '';
        let zip = '';
  
        // Extract address components
        addressComponents.forEach((component) => {
          const types = component.types;
  
          if (types.includes('street_number')) {
            address = component.long_name + ' ';
          }
          if (types.includes('route')) {
            address += component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name; // Use short name for state code
          }
          if (types.includes('postal_code')) {
            zip = component.long_name;
          }
        });
  
        // Check if all components are present
        if (!address || !city || !state || !zip) {
          alert('Incomplete address information. Please select a valid address.');
          return;
        }
  
        // Update the input box and map
        const fullAddress = `${address}, ${city}, ${state} ${zip}`;
        document.querySelector('input[name="address"]').value = fullAddress;
  
        // Save to local storage
        localStorage.setItem('Selected_Address', JSON.stringify({ address, city, state, zip }));
  
        // Initialize map
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        initMap(lat, lng);
      } else {
        alert('Failed to fetch place details. Please try again.');
      }
    });
  }
  
  
  // Fetch suggestions from Google
  function fetchSuggestions(query) {
    const service = new google.maps.places.AutocompleteService();
    const options = {
        input: query,
        componentRestrictions: { country: 'us' } // Restrict to USA
      };
    service.getPlacePredictions({ input: query }, (predictions, status) => {
      const suggestionsDiv = document.getElementById('suggestions');
      if (!suggestionsDiv) return;
  
      suggestionsDiv.innerHTML = ''; // Clear previous suggestions
      suggestionsDiv.style.display = 'block'; // Show suggestions
  
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        predictions.forEach((prediction) => {
          const suggestion = document.createElement('div');
          suggestion.textContent = prediction.description;
          suggestion.className = 'suggestion-item';
  
          suggestion.addEventListener('click', () => {
            fetchPlaceDetails(prediction.place_id);
            suggestionsDiv.innerHTML = ''; // Clear suggestions
            suggestionsDiv.style.display = 'none'; // Hide suggestions container
          });
  
          suggestionsDiv.appendChild(suggestion);
        });
      }
    });
  }
  
  
  // Attach input event to fetch suggestions
  document.querySelector('input[name="address"]').addEventListener('input', (event) => {
    const query = event.target.value;
    if (query.length > 2) {
      fetchSuggestions(query);
    }
  });
  
  
  
  // Submit button to save data
// Submit button to save data
document.getElementById('confirm-btn').addEventListener('click', () => {
  const selectedAddress = JSON.parse(localStorage.getItem('Selected_Address'));

  if (selectedAddress) {
    const { address, city, state, zip } = selectedAddress;

    // Prepare data to send
    const dataToSave = [
      { column: 'Property_Address', value: address },
      { column: 'City', value: city },
      { column: 'State', value: state },
      { column: 'Zip', value: zip }
    ];

    // Step 1: Call the getZestimateValue API
    fetch('http://localhost:3005/v1/getZestimateValue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: dataToSave }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch Zestimate value');
        }
        return response.json();
      })
      .then((zestimateResponse) => {
        // Save Zestimate in local storage
        const { zestimate } = zestimateResponse;
        localStorage.setItem('Zestimate', zestimate);

        // Step 2: Call the main save data API
        return fetch('http://localhost:3005/v1/dataZestimate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: dataToSave }),
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to save data');
        }
        return response.json();
      })
      .then((saveDataResponse) => {
        console.log('Data saved successfully:', saveDataResponse);
        window.location.href = 'house_valuation.html';
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Failed to save data. Please try again.');
      });
  } else {
    alert('Please select an address before submitting!');
  }
});


  