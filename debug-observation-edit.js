// Debug script to test observation edit functionality
const observationId = "1b8a1b2d-2237-47db-83f7-9b8c966253bf";

console.log("Testing observation edit functionality...");

async function testObservationAPI() {
  try {
    // Test GET request first
    console.log("1. Testing GET /api/observations/" + observationId);
    const getResponse = await fetch(`/api/observations/${observationId}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log("GET Response status:", getResponse.status);
    console.log("GET Response headers:", Object.fromEntries(getResponse.headers.entries()));
    
    if (getResponse.status === 200) {
      const data = await getResponse.json();
      console.log("Observation data loaded successfully");
      console.log("Data keys:", Object.keys(data));
      
      // Test PUT request with minimal data
      console.log("\n2. Testing PUT /api/observations/" + observationId);
      const testPayload = {
        sessionInfo: {
          title: "Test Update " + new Date().toISOString(),
          generalNotes: "Updated at " + new Date().toISOString(),
          grade: 5,
          subject: "Mathematics"
        }
      };
      
      const putResponse = await fetch(`/api/observations/${observationId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log("PUT Response status:", putResponse.status);
      const putResult = await putResponse.text();
      console.log("PUT Response:", putResult);
      
    } else {
      const errorText = await getResponse.text();
      console.log("GET Error:", errorText);
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Check authentication
async function checkAuth() {
  try {
    const authResponse = await fetch('/api/auth/session', {
      credentials: 'include'
    });
    console.log("Auth status:", authResponse.status);
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log("Auth data:", authData);
    } else {
      console.log("Not authenticated");
    }
  } catch (error) {
    console.error("Auth check failed:", error);
  }
}

// Run tests
checkAuth().then(() => {
  testObservationAPI();
});