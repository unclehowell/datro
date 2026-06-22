// GraphQL Integration Script for DATRO
// Fetches current date/time from a GraphQL endpoint and displays it on the page

async function fetchDateTimeFromGraphQL() {
  const graphqlEndpoint = 'https://your-cloudflare-graphql-endpoint.com/graphql';
  const query = `
    query {
      currentDateTime
    }
  `;

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return null;
    }

    return result.data.currentDateTime;
  } catch (error) {
    console.error('Error fetching date/time from GraphQL:', error);
    return null;
  }
}

function displayDateTime(dateTimeString) {
  const dateTimeElement = document.getElementById('datetime-display');
  
  if (dateTimeElement) {
    dateTimeElement.textContent = dateTimeString;
    dateTimeElement.style.color = 'white';
    dateTimeElement.style.fontSize = '1.5rem';
    dateTimeElement.style.margin = '10px';
  } else {
    console.warn('Element with ID "datetime-display" not found. Creating one.');
    const newElement = document.createElement('div');
    newElement.id = 'datetime-display';
    newElement.textContent = dateTimeString;
    newElement.style.color = 'white';
    newElement.style.fontSize = '1.5rem';
    newElement.style.margin = '10px';
    newElement.style.position = 'absolute';
    newElement.style.top = '10px';
    newElement.style.right = '10px';
    newElement.style.zIndex = '1000';
    document.body.appendChild(newElement);
  }
}

// Initialize the GraphQL integration
async function initGraphQLIntegration() {
  const dateTime = await fetchDateTimeFromGraphQL();
  
  if (dateTime) {
    displayDateTime(dateTime);
    console.log('GraphQL integration successful. Date/time displayed:', dateTime);
  } else {
    console.log('GraphQL integration failed. Using client-side date/time as fallback.');
    const fallbackDateTime = new Date().toISOString();
    displayDateTime(fallbackDateTime);
  }
}

// Run the integration when the page loads
document.addEventListener('DOMContentLoaded', initGraphQLIntegration);
