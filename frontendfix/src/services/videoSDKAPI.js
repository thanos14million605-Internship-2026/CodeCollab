export const authToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiJiMWFkMmUwMy00OWExLTQ4MTgtOGFkMC00YjE3OTUwZWQyZWMiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc3NDIzMTgzNSwiZXhwIjoxNzc0ODM2NjM1fQ.Qh8MLzpWlKQXFKIufqNWy4NeXReTHGmYYJjFdN3WL_Y";

export const createMeeting = async ({ token }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const { roomId } = await res.json();
  return roomId;
};

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

export const isAuthTokenConfigured = () => {
  return authToken && authToken !== null;
};
