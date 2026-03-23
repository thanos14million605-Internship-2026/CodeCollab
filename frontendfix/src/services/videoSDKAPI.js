// VideoSDK API Service
// IMPORTANT: Replace this with your actual VideoSDK auth token from https://dashboard.videosdk.live/
// Get your free auth token by signing up at VideoSDK.live
export const authToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiJiMWFkMmUwMy00OWExLTQ4MTgtOGFkMC00YjE3OTUwZWQyZWMiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc3NDIzMTgzNSwiZXhwIjoxNzc0ODM2NjM1fQ.Qh8MLzpWlKQXFKIufqNWy4NeXReTHGmYYJjFdN3WL_Y";

// API call to create a meeting
export const createMeeting = async ({ token }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  // Destructuring roomId from response
  const { roomId } = await res.json();
  return roomId;
};

// API call to validate meeting
export const validateMeeting = async ({ roomId, token }) => {
  const res = await fetch(
    `https://api.videosdk.live/v2/rooms/validate/${roomId}`,
    {
      method: "GET",
      headers: {
        authorization: `${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();
  return data;
};

// Helper function to check if auth token is configured
export const isAuthTokenConfigured = () => {
  return authToken && authToken !== "YOUR_VIDEOSDK_AUTH_TOKEN_HERE";
};
