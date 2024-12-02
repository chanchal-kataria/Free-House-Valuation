// Prevent form submission
document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
  });
  
  // Initialize variables
  let map, marker;
  
  // Initialize Google Map
  function initMap(lat, lng, zoom = 14) {
    //const defaultLocation = { lat: 37.0902, lng: -95.7129 }; // Geographic center of the US
    const mapDiv = document.getElementById('map');
    mapDiv.style.display = 'block'; // Show the map div
  
    const location = { lat, lng };
  
    map = new google.maps.Map(mapDiv, {
      center: location,
      zoom: zoom,
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
  
  
// display default map on page load
  initMap(37.0902, -95.7129, 4);
  // Fetch suggestions from Google
function fetchSuggestions(query) {
  // debugger;
  const service = new google.maps.places.AutocompleteService();
  const options = {
    input: query,
    componentRestrictions: { country: 'us' }, // Restrict to USA
  };

  service.getPlacePredictions(options, (predictions, status) => {
    const suggestionsDiv = document.getElementById('suggestions');
    if (!suggestionsDiv) return;

    

    // Clear previous suggestions and display the suggestions container
    suggestionsDiv.innerHTML = '';
    suggestionsDiv.style.display = 'block';

    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
      predictions.forEach((prediction) => {
        // Create a suggestion item
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';

        // Add text content
        suggestion.textContent = prediction.description;

        // Add click event to fetch place details
        suggestion.addEventListener('click', () => {
          fetchPlaceDetails(prediction.place_id);
          suggestionsDiv.innerHTML = ''; // Clear suggestions
          suggestionsDiv.style.display = 'none'; // Hide suggestions container
        });

        suggestionsDiv.appendChild(suggestion);
      });

      // Add an image at the bottom of the suggestions list
      const bottomImage = document.createElement('img');
      bottomImage.src = 'assets/google2.jpeg'; // Replace with the desired image URL
      bottomImage.alt = 'Bottom Image';
      bottomImage.className = 'suggestion-bottom-img';

      suggestionsDiv.appendChild(bottomImage);
    } else {
      // Hide suggestions container if no predictions are available
      suggestionsDiv.style.display = 'none';
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

  // Show spinner
  const spinner = document.getElementById('spinner');
  const buttonContainer = document.querySelector('.button-container');
  const loadingText = document.getElementById('loading-text');
  spinner.style.display = 'block';
  buttonContainer.style.top = '20px';
  spinner.style.marginBottom = '20px';
  loadingText.style.display = 'block';
  

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
    //localhost http://localhost:3005/v1/getZestimateValue
    //server https://prudenthomebuyers.com/api/v1/getZestimateValue
    fetch('https://prudenthomebuyers.com/api/v1/getZestimateValue', {
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
        //localhost http://localhost:3005/v1/dataZestimate
        //server https://prudenthomebuyers.com/api/v1/dataZestimate
        return fetch('https://prudenthomebuyers.com/api/v1/dataZestimate', {
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
        localStorage.setItem('userId', saveDataResponse.userId);
        window.location.href = 'house_valuation.html';
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Failed to save data. Please try again.');
      })
      .finally(() => {
        // Hide spinner
        setTimeout(() => {
          // Hide spinner and reset button-container position after the process
          spinner.style.display = 'none';
          loadingText.style.display = 'none';
          buttonContainer.style.top = '0';
        }, 3000); // Simulated delay of 3 seconds


    });
  } else {
    alert('Please select an address before submitting!');
    
  }
});


  