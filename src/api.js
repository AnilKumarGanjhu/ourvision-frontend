// API base URL: backend URL without /api
// Example .env: VITE_API_BASE_URL=http://localhost:8080
// Accept either http://localhost:8080 or http://localhost:8080/api in .env.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

// ================= TOKEN MANAGEMENT =================

export function setToken(token) {
  if (token) {
    localStorage.setItem("ourvision_token", token);
  } else {
    localStorage.removeItem("ourvision_token");
  }
}

export function getToken() {
  return localStorage.getItem("ourvision_token");
}

// ================= COMMON API FUNCTION =================

export async function api(path, options = {}) {
  const token = getToken();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = `${API_BASE}/api${normalizedPath}`;

  const headers = {
    Accept: "application/json",

    ...(options.body != null && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),

    ...(token ? { Authorization: `Bearer ${token}` } : {}),

    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error("Session expired or unauthorized. Please log in again.");
  }

  if (response.status === 403) {
    throw new Error("You do not have permission to perform this operation.");
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const errorText = await response.text();

      if (errorText) {
        try {
          const errorBody = JSON.parse(errorText);
          message = errorBody.message || errorBody.error || errorText;
        } catch {
          message = errorText;
        }
      }
    } catch {
      // Keep default HTTP error message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ================= AUTHENTICATION =================

export async function login(email, password) {
  const result = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token = result?.accessToken || result?.token;

  if (token) {
    setToken(token);
  }

  return result;
}

export function logout() {
  setToken(null);
}

// ================= USER APIs =================

export function getUsers(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return api(`/users${suffix}`);
}

export function getUsersPage(page = 0, size = 25, sort) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (sort) {
    params.set("sort", sort);
  }

  return api(`/users/page?${params.toString()}`);
}

export function getUserById(id) {
  return api(`/users/${encodeURIComponent(id)}`);
}

export function createUser(userData) {
  return api("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function updateUser(id, userData) {
  return api(`/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export function updateUserStatus(id, status) {
  const query = new URLSearchParams({ status });

  return api(`/users/${encodeURIComponent(id)}/status?${query.toString()}`, {
    method: "PATCH",
  });
}

export function deleteUser(id) {
  return api(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function getUserImage(id) {
  return api(`/users/${encodeURIComponent(id)}/image`);
}

// ================= MEMBER INFORMATION PHOTO API =================

// Fetch the dedicated Member Information photo as a browser object URL.
export async function getMemberInformationPhoto(id) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE}/api/users/${encodeURIComponent(id)}/information/photo`,
    {
      method: "GET",
      headers: {
        Accept: "image/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (response.status === 204) return null;

  if (response.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }

  if (response.status === 403) {
    throw new Error("You do not have permission to view this photo.");
  }

  if (!response.ok) {
    throw new Error(`Could not load member photo (${response.status}).`);
  }

  return URL.createObjectURL(await response.blob());
}

// ================= ELECTION APIs =================

// Get all elections
export function getElections() {
  return api("/elections");
}

// Get a single election by ID
export function getElectionById(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}`);
}

// Create election (ADMIN)
export function createElection(electionData) {
  return api("/elections", {
    method: "POST",
    body: JSON.stringify({
      title: electionData.title,
      description: electionData.description || "",
      positionName: electionData.positionName,
      startAt: electionData.startAt,
      endAt: electionData.endAt,
    }),
  });
}

// Add candidate to an election (ADMIN)
export function addElectionCandidate(
  electionId,
  candidateUserId,
  manifesto = "",
) {
  return api(`/elections/${encodeURIComponent(electionId)}/candidates`, {
    method: "POST",
    body: JSON.stringify({
      candidateUserId: Number(candidateUserId),
      manifesto,
    }),
  });
}

// Get election candidates
// Requires GET /api/elections/{electionId}/candidates
// endpoint in the backend controller.
export function getElectionCandidates(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}/candidates`);
}

// Start election (ADMIN)
export function startElection(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}/start`, {
    method: "POST",
  });
}

// Cast vote (logged-in member)
// The backend must derive voter ID from JWT authentication.
export function castElectionVote(electionId, candidateId) {
  return api(`/elections/${encodeURIComponent(electionId)}/vote`, {
    method: "POST",
    body: JSON.stringify({
      candidateId: Number(candidateId),
    }),
  });
}

// Close election (ADMIN)
export function closeElection(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}/close`, {
    method: "POST",
  });
}

// Publish results (ADMIN)
export function publishElectionResults(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}/publish-results`, {
    method: "POST",
  });
}

// Get election results
// Backend should return results only after election closure
// and admin publication.
export function getElectionResults(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}/results`);
}

// Get recorded votes (ADMIN, after election closure)
export function getRecordedElectionVotes(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}/recorded-votes`);
}

// Get election audit logs (ADMIN)
export function getElectionAuditLogs(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}/audit-logs`);
}

// Delete an entire election
export function deleteElection(electionId) {
  return api(`/elections/${encodeURIComponent(electionId)}`, {
    method: "DELETE",
  });
}

// Update candidate (DRAFT state only)
export function updateElectionCandidate(
  electionId,
  candidateId,
  candidateUserId,
  manifesto
) {
  return api(
    `/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        candidateUserId: Number(candidateUserId),
        manifesto,
      }),
    }
  );
}

// Remove a single candidate from an election
export function removeElectionCandidate(electionId, candidateId) {
  return api(
    `/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`,
    {
      method: "DELETE",
    }
  );
}