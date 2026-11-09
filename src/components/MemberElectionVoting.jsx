import React, { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  Check,
  X,
  Info,
  Vote,
  RefreshCw,
  CalendarDays,
  Users,
  Trophy,
  Clock,
  ChevronLeft,
  Medal,
  Award,
  Trash2, // ✅ Naya Icon add kiya
} from "lucide-react";

import {
  getElections,
  getElectionCandidates,
  castElectionVote,
  getElectionResults,
  deleteElection, // ✅ Naya API import kiya
} from "../api";

import "./MemberElectionVoting.css";

// ---------- RESULT PARSING HELPERS ----------
const normalizeResultsPayload = (payload) => {
  if (payload == null) {
    return {
      winner: null,
      results: [],
      totalVotes: 0,
      isTie: false,
      published: false,
      votingEnded: false,
    };
  }

  const root = payload?.data ?? payload;

  let list = [];
  if (Array.isArray(root)) list = root;
  else if (Array.isArray(root?.results)) list = root.results;
  else if (Array.isArray(root?.candidates)) list = root.candidates;
  else if (Array.isArray(root?.data)) list = root.data;

  const normalized = list.map((row, idx) => {
    const candidateName =
      row?.name ||
      row?.candidateName ||
      row?.fullName ||
      row?.candidate?.candidateName ||
      row?.candidate?.user?.fullName ||
      row?.candidate?.fullName ||
      "Candidate";

    const voteCount = Number(
      row?.voteCount ?? row?.votes ?? row?.count ?? 0
    );

    const candidateId =
      row?.candidateId ?? row?.candidate?.id ?? row?.id ?? idx;

    const position =
      row?.designation ||
      row?.position ||
      row?.candidate?.position ||
      row?.candidate?.designation ||
      row?.candidate?.role ||
      "Election Candidate";

    const image =
      row?.photo ||
      row?.imageUrl ||
      row?.profileImageUrl ||
      row?.photoUrl ||
      row?.candidate?.profileImageUrl ||
      row?.candidate?.photoUrl ||
      row?.candidate?.imageUrl ||
      null;

    const resultStatus = row?.resultStatus || null;
    const rank = row?.rank ?? row?.rankPosition ?? null;
    const isWinnerFlag = Boolean(row?.winner);

    return {
      candidateId,
      candidateName,
      position,
      image,
      voteCount,
      votePercentage:
        row?.votePercentage != null ? Number(row.votePercentage) : null,
      resultStatus,
      rank,
      isWinnerFlag,
      raw: row,
    };
  });

  normalized.sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return (a.candidateId ?? 0) - (b.candidateId ?? 0);
  });

  const totalVotes =
    Number(root?.totalVotes) ||
    normalized.reduce((sum, r) => sum + r.voteCount, 0);

  let isTie = Boolean(root?.tie);
  if (!isTie && normalized.length >= 2 && normalized[0].voteCount > 0) {
    if (normalized[0].voteCount === normalized[1].voteCount) isTie = true;
  }

  let winner = null;
  if (root?.winner) {
    const w = root.winner;
    winner = {
      candidateId: w?.candidateId ?? w?.id ?? null,
      candidateName:
        w?.name ||
        w?.candidateName ||
        w?.fullName ||
        "Winner",
      position: w?.designation || w?.position || "Election Candidate",
      image:
        w?.photo ||
        w?.imageUrl ||
        w?.profileImageUrl ||
        w?.photoUrl ||
        null,
      voteCount: Number(w?.voteCount ?? w?.votes ?? w?.totalVotes ?? 0),
      votePercentage:
        w?.votePercentage != null ? Number(w.votePercentage) : null,
    };
  } else if (!isTie && normalized.length > 0 && normalized[0].voteCount > 0) {
    winner = normalized[0];
  }

  const published = Boolean(root?.published) || normalized.length > 0;
  const votingEnded = Boolean(root?.votingEnded);

  return {
    winner,
    results: normalized,
    totalVotes,
    isTie,
    published,
    votingEnded,
  };
};

const getRankLabel = (row, index, isTie) => {
  const status = row?.resultStatus;
  if (status === "WINNER") return "Winner";
  if (status === "RUNNER_UP") return "Runner-up";
  if (status === "THIRD") return "3rd";
  if (status === "TIE") return "Tie";
  if (status === "CANDIDATE") return index === 3 ? "4th" : `${index + 1}th`;

  if (isTie && index === 0) return "Tie";
  if (index === 0) return "Winner";
  if (index === 1) return "Runner-up";
  if (index === 2) return "3rd";
  return `${index + 1}th`;
};

const getRankBadgeClass = (row, index, isTie) => {
  const status = row?.resultStatus;
  if (status === "WINNER") return "winner";
  if (status === "RUNNER_UP") return "runner-up";
  if (status === "TIE") return "tie";

  if (isTie && index === 0) return "tie";
  if (index === 0) return "winner";
  if (index === 1) return "runner-up";
  return "other";
};

const MemberElectionVoting = () => {
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [results, setResults] = useState({});
  const [selectedElection, setSelectedElection] = useState(null);

  const [loading, setLoading] = useState(true);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votingCandidateId, setVotingCandidateId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [popup, setPopup] = useState(null);

  const resultsPollRef = useRef(null);

  // ✅ Admin Check
  const currentUser = JSON.parse(localStorage.getItem("ourvision_user") || "{}");
  const isAdmin = ["ROLE_ADMIN", "ROLE_PRESIDENT", "ROLE_SECRETARY", "ROLE_TREASURER"].includes(
    String(currentUser.role).toUpperCase()
  );

  // ------------------------------------
  // POPUP
  // ------------------------------------
  const showAlert = (type, title, description, options = {}) => {
    setPopup({
      type,
      title,
      description,
      confirmText: options.confirmText || "OK",
      cancelText: options.cancelText || "Cancel",
      onConfirm: options.onConfirm || null,
      showCancel: options.showCancel || false,
    });
  };

  const closePopup = () => {
    if (submitting) return;
    setPopup(null);
  };

  const handlePopupConfirm = () => {
    if (submitting) return;
    const action = popup?.onConfirm;
    setPopup(null);
    if (action) action();
  };

  // ------------------------------------
  // HELPERS
  // ------------------------------------
  const normalizeList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  };

  const getElectionStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "active" || normalized === "live" || normalized === "open") {
      return "active";
    }
    if (
      normalized === "closed" ||
      normalized === "completed" ||
      normalized === "results_published" ||
      normalized === "ended"
    ) {
      return "completed";
    }
    return "upcoming";
  };

  const isElectionCompleted = (election) =>
    getElectionStatus(election?.status) === "completed";

  const isElectionPastDeadline = (election) => {
    const end = election?.endAt || election?.endDate;
    if (!end) return false;
    const t = new Date(end).getTime();
    if (Number.isNaN(t)) return false;
    return Date.now() > t;
  };

  const isEffectivelyCompleted = (election) =>
    isElectionCompleted(election) || isElectionPastDeadline(election);

  const formatDate = (value) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStartDate = (election) => election?.startAt || election?.startDate;
  const getEndDate = (election) => election?.endAt || election?.endDate;

  const getCandidateName = (candidate) =>
    candidate?.name ||
    candidate?.candidateName ||
    candidate?.user?.fullName ||
    candidate?.fullName ||
    (candidate?.id ? `Candidate ${candidate.id}` : "Candidate");

  const getCandidatePosition = (candidate) =>
    candidate?.designation ||
    candidate?.position ||
    candidate?.role ||
    "Election Candidate";

  const getCandidateManifesto = (candidate) =>
    candidate?.manifesto || candidate?.description || "No manifesto provided.";

  const getCandidateImage = (candidate) =>
    candidate?.photo ||
    candidate?.profileImageUrl ||
    candidate?.photoUrl ||
    candidate?.imageUrl ||
    null;

  // ------------------------------------
  // RESULTS FETCH
  // ------------------------------------
  const fetchResults = async (electionId, { silent = false } = {}) => {
    try {
      if (!silent) setCandidateLoading(true);
      const resultResponse = await getElectionResults(electionId);
      const normalizedPayload = normalizeResultsPayload(
        resultResponse?.data ?? resultResponse
      );
      setResults((prev) => ({ ...prev, [electionId]: normalizedPayload }));
      return normalizedPayload;
    } catch (err) {
      console.error("Error fetching results:", err);
      if (!silent) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load election results.";
        setError(errorMessage);
      }
      return null;
    } finally {
      if (!silent) setCandidateLoading(false);
    }
  };

  // ------------------------------------
  // LOAD ELECTIONS
  // ------------------------------------
  const loadElections = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getElections();
      setElections(normalizeList(response));
    } catch (err) {
      console.error("Error loading elections:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load elections. Please try again.";
      setError(errorMessage);
      showAlert("error", "Unable to Load Elections", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (resultsPollRef.current) {
        clearInterval(resultsPollRef.current);
        resultsPollRef.current = null;
      }
    };
  }, []);

  // ------------------------------------
  // AUTO-POLLING RESULTS
  // ------------------------------------
  useEffect(() => {
    if (resultsPollRef.current) {
      clearInterval(resultsPollRef.current);
      resultsPollRef.current = null;
    }

    if (!selectedElection) return;
    if (!isEffectivelyCompleted(selectedElection)) return;

    const eid = selectedElection.id;
    const current = results[eid];

    if (current?.published) return;

    if (!current) {
      fetchResults(eid, { silent: true });
    }

    resultsPollRef.current = setInterval(() => {
      setResults((prev) => {
        if (prev[eid]?.published) {
          if (resultsPollRef.current) {
            clearInterval(resultsPollRef.current);
            resultsPollRef.current = null;
          }
          return prev;
        }
        fetchResults(eid, { silent: true });
        return prev;
      });
    }, 10000);

    return () => {
      if (resultsPollRef.current) {
        clearInterval(resultsPollRef.current);
        resultsPollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElection, results[selectedElection?.id]?.published]);

  // ------------------------------------
  // OPEN ELECTION
  // ------------------------------------
  const openElection = async (election) => {
    setSelectedElection(election);
    setMessage("");
    setError("");

    const completed = isEffectivelyCompleted(election);

    if (completed) {
      const existing = results[election.id];
      if (existing?.published) return;
      await fetchResults(election.id);
      return;
    }

    const hasCandidates = Array.isArray(candidates[election.id]);
    if (hasCandidates) return;

    setCandidateLoading(true);
    try {
      const response = await getElectionCandidates(election.id);
      setCandidates((prev) => ({
        ...prev,
        [election.id]: normalizeList(response),
      }));
    } catch (err) {
      console.error("Error opening election:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load election information.";
      setError(errorMessage);
      showAlert("error", "Election Loading Failed", errorMessage);
    } finally {
      setCandidateLoading(false);
    }
  };

  // ------------------------------------
  // DELETE ELECTION (Only Admin)
  // ------------------------------------
  const requestDeleteElection = (electionId) => {
    showAlert(
      "warning",
      "Delete Election?",
      "Are you sure you want to permanently delete this election? All votes and results associated with it will also be deleted. This action cannot be undone.",
      {
        confirmText: "Yes, Delete",
        cancelText: "Cancel",
        showCancel: true,
        onConfirm: () => submitDeleteElection(electionId),
      }
    );
  };

  const submitDeleteElection = async (electionId) => {
    try {
      setSubmitting(true);
      setError("");
      await deleteElection(electionId);
      setMessage("Election deleted successfully.");
      
      // Delete hone ke baad list refresh karo aur detail view se bahar aao
      setSelectedElection(null);
      await loadElections();
    } catch (err) {
      console.error("Delete failed:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete election."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------
  // VOTE CONFIRMATION
  // ------------------------------------
  const requestVote = (candidateId, candidateName) => {
    if (!selectedElection) return;
    showAlert(
      "warning",
      "Confirm Your Vote",
      `Are you sure you want to vote for ${candidateName}? Once submitted, your vote cannot be changed.`,
      {
        confirmText: "Confirm Vote",
        cancelText: "Cancel",
        showCancel: true,
        onConfirm: () => submitVote(candidateId),
      }
    );
  };

  // ------------------------------------
  // SUBMIT VOTE
  // ------------------------------------
  const submitVote = async (candidateId) => {
    if (submitting || !selectedElection) return;
    const electionId = selectedElection.id;

    try {
      setSubmitting(true);
      setVotingCandidateId(candidateId);
      setError("");
      setMessage("");

      await castElectionVote(electionId, candidateId);

      setMessage("Your vote has been submitted successfully.");
      showAlert(
        "success",
        "Vote Submitted Successfully!",
        "Thank you for participating in the election. Your vote has been recorded successfully."
      );

      await loadElections();

      if (!isEffectivelyCompleted(selectedElection)) {
        try {
          const response = await getElectionCandidates(electionId);
          setCandidates((prev) => ({
            ...prev,
            [electionId]: normalizeList(response),
          }));
        } catch {
          /* non-critical */
        }
      }
    } catch (err) {
      console.error("Vote submission failed:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Your vote could not be submitted. Please try again.";
      setError(errorMessage);
      showAlert("error", "Vote Submission Failed", errorMessage);
    } finally {
      setSubmitting(false);
      setVotingCandidateId(null);
    }
  };

  const goBack = () => {
    setSelectedElection(null);
    setError("");
    setMessage("");
    if (resultsPollRef.current) {
      clearInterval(resultsPollRef.current);
      resultsPollRef.current = null;
    }
  };

  // ------------------------------------
  // LOADING
  // ------------------------------------
  if (loading) {
    return (
      <div className="member-election-loading">
        <div className="member-election-spinner">
          <RefreshCw size={28} />
        </div>
        <h3>Loading elections...</h3>
        <p>Please wait while we fetch election information.</p>
      </div>
    );
  }

  // ------------------------------------
  // MAIN UI
  // ------------------------------------
  return (
    <div className="member-election-page">
      <div className="member-election-header">
        <div>
          <span className="member-election-eyebrow">
            OUR VISION · DEMOCRACY
          </span>
          <h1>Election &amp; Voting</h1>
          <p>Participate in elections and make your voice count.</p>
        </div>

        <button
          type="button"
          className="member-election-refresh"
          onClick={loadElections}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="member-election-inline-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {message && (
        <div className="member-election-inline-success">
          <Check size={18} />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {selectedElection ? (
        <div className="member-election-details">
          
          {/* Back Button aur Delete Button ek sath */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <button type="button" className="member-election-back" onClick={goBack} style={{ margin: 0 }}>
              <ChevronLeft size={18} />
              Back to Elections
            </button>

            {/* ✅ ADMIN DELETE BUTTON: Sirf Admin ko dikhega aur sirf completed election par */}
            {isAdmin && isEffectivelyCompleted(selectedElection) && (
              <button
                type="button"
                onClick={() => requestDeleteElection(selectedElection.id)}
                disabled={submitting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: submitting ? 0.6 : 1
                }}
              >
                <Trash2 size={16} />
                Delete Election
              </button>
            )}
          </div>

          <div className="member-election-detail-card">
            <div className="member-election-detail-top">
              <div>
                <span className="member-election-eyebrow">ELECTION DETAILS</span>
                <h2>{selectedElection.title || "Untitled Election"}</h2>
                <p>
                  {selectedElection.description ||
                    "Participate in this election and help shape our future."}
                </p>
                {selectedElection.positionName && (
                  <p className="member-election-position">
                    <strong>Position:</strong> {selectedElection.positionName}
                  </p>
                )}
              </div>
              <span
                className={`member-election-status ${getElectionStatus(
                  isEffectivelyCompleted(selectedElection) ? "completed" : selectedElection.status
                )}`}
              >
                {isEffectivelyCompleted(selectedElection)
                  ? "Completed"
                  : selectedElection.status || "Upcoming"}
              </span>
            </div>

            <div className="member-election-meta">
              <div>
                <CalendarDays size={17} />
                <span>Start: {formatDate(getStartDate(selectedElection))}</span>
              </div>
              <div>
                <Clock size={17} />
                <span>End: {formatDate(getEndDate(selectedElection))}</span>
              </div>
            </div>
          </div>

          {candidateLoading ? (
            <div className="member-election-loading small">
              <div className="member-election-spinner">
                <RefreshCw size={24} />
              </div>
              <p>Loading election results...</p>
            </div>
          ) : isEffectivelyCompleted(selectedElection) ? (
            <ElectionResultsView
              resultData={results[selectedElection.id]}
              onRetry={() => fetchResults(selectedElection.id)}
            />
          ) : (
            <section className="member-election-section">
              <div className="member-election-section-heading">
                <div>
                  <span className="member-election-eyebrow">YOUR CHOICE MATTERS</span>
                  <h2>Choose Your Candidate</h2>
                </div>
                <Users size={25} />
              </div>

              {(candidates[selectedElection.id] || []).length > 0 ? (
                <div className="member-election-candidates">
                  {candidates[selectedElection.id].map((candidate) => {
                    const candidateName = getCandidateName(candidate);
                    const candidatePosition = getCandidatePosition(candidate);
                    const candidateImage = getCandidateImage(candidate);
                    const manifesto = getCandidateManifesto(candidate);

                    return (
                      <div className="member-election-candidate-card" key={candidate.id}>
                        <div className="member-election-candidate-image">
                          {candidateImage ? (
                            <img src={candidateImage} alt={candidateName} />
                          ) : (
                            <div className="member-election-avatar">
                              {candidateName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="member-election-candidate-info">
                          <h3>{candidateName}</h3>
                          <span>{candidatePosition}</span>
                          <p>{manifesto}</p>
                        </div>

                        <button
                          type="button"
                          className="member-election-vote-btn"
                          disabled={submitting}
                          onClick={() => requestVote(candidate.id, candidateName)}
                        >
                          {votingCandidateId === candidate.id ? (
                            <>
                              <RefreshCw size={16} />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Vote size={17} />
                              Vote Now
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="member-election-empty">
                  <Users size={32} />
                  <h3>No candidates available</h3>
                  <p>There are currently no candidates for this election.</p>
                </div>
              )}
            </section>
          )}
        </div>
      ) : (
        <section className="member-election-section">
          <div className="member-election-section-heading">
            <div>
              <span className="member-election-eyebrow">
                PARTICIPATE &amp; MAKE A DIFFERENCE
              </span>
              <h2>Available Elections</h2>
            </div>
            <Vote size={25} />
          </div>

          {elections.length > 0 ? (
            <div className="member-election-grid">
              {elections.map((election) => {
                const status = getElectionStatus(
                  isEffectivelyCompleted(election) ? "completed" : election.status
                );
                return (
                  <div className="member-election-card" key={election.id}>
                    <div className="member-election-card-top">
                      <div className="member-election-card-icon">
                        <Vote size={23} />
                      </div>
                      <span className={`member-election-status ${status}`}>
                        {isEffectivelyCompleted(election)
                          ? "Completed"
                          : election.status || "Upcoming"}
                      </span>
                    </div>

                    <h3>{election.title || "Untitled Election"}</h3>
                    <p>
                      {election.description ||
                        "Participate in this election and make your voice count."}
                    </p>

                    <div className="member-election-card-meta">
                      <div>
                        <CalendarDays size={15} />
                        <span>{formatDate(getStartDate(election))}</span>
                      </div>
                      <div>
                        <Clock size={15} />
                        <span>{formatDate(getEndDate(election))}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="member-election-open-btn"
                      onClick={() => openElection(election)}
                    >
                      {status === "completed" ? "View Results" : "View Election"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="member-election-empty">
              <Vote size={36} />
              <h3>No elections available</h3>
              <p>
                There are no elections available at the moment. Please check
                again later.
              </p>
            </div>
          )}
        </section>
      )}

      {/* CUSTOM 3D GLASS ALERT MODAL */}
      {popup && (
        <div
          className="member-alert-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) closePopup();
          }}
        >
          <div
            className={`member-alert-modal ${popup.type}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="member-alert-title"
            aria-describedby="member-alert-description"
          >
            <button
              type="button"
              className="member-alert-close"
              onClick={closePopup}
              disabled={submitting}
              aria-label="Close popup"
            >
              <X size={19} />
            </button>

            <div className={`member-alert-icon ${popup.type}`}>
              {popup.type === "success" && <Check size={34} />}
              {popup.type === "error" && <X size={34} />}
              {popup.type === "warning" && <AlertTriangle size={34} />}
              {popup.type === "info" && <Info size={34} />}
            </div>

            <h2 id="member-alert-title">{popup.title}</h2>
            <p id="member-alert-description">{popup.description}</p>

            <div className="member-alert-actions">
              {popup.showCancel && (
                <button
                  type="button"
                  className="member-alert-btn cancel"
                  onClick={closePopup}
                  disabled={submitting}
                >
                  {popup.cancelText}
                </button>
              )}

              <button
                type="button"
                className={`member-alert-btn confirm ${popup.type}`}
                onClick={handlePopupConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} />
                    Processing...
                  </>
                ) : (
                  popup.confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// ELECTION RESULTS VIEW (Winner Hero + Table + Tie)
// =========================================================
const ElectionResultsView = ({ resultData, onRetry }) => {
  const data = resultData || {
    winner: null,
    results: [],
    totalVotes: 0,
    isTie: false,
    published: false,
    votingEnded: false,
  };

  if (!data.published) {
    return (
      <section className="member-election-section">
        <div className="member-election-section-heading">
          <div>
            <span className="member-election-eyebrow">ELECTION SUMMARY</span>
            <h2>Election Results</h2>
          </div>
          <Trophy size={25} />
        </div>

        <div className="member-election-empty member-election-pending">
          <div className="member-election-spinner small">
            <RefreshCw size={24} />
          </div>
          <h3>Results are being finalized...</h3>
          <p>
            Voting has closed. Final results will be published automatically
            shortly. This page will refresh automatically.
          </p>
          {onRetry && (
            <button
              type="button"
              className="member-election-refresh inline"
              onClick={onRetry}
            >
              <RefreshCw size={15} />
              Check Again
            </button>
          )}
        </div>
      </section>
    );
  }

  const { winner, results, totalVotes, isTie } = data;

  const percent = (row) => {
    if (row?.votePercentage != null) return row.votePercentage.toFixed(1);
    return totalVotes > 0 ? ((row.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
  };

  return (
    <section className="member-election-section">
      <div className="member-election-section-heading">
        <div>
          <span className="member-election-eyebrow">ELECTION SUMMARY</span>
          <h2>Election Results</h2>
        </div>
        <Trophy size={25} />
      </div>

      {isTie ? (
        <div className="member-election-winner-hero tie">
          <div className="member-election-winner-badge tie">
            <AlertTriangle size={18} />
            It's a Tie
          </div>
          <div className="member-election-winner-avatar tie">
            <Award size={44} />
          </div>
          <div className="member-election-winner-info">
            <span className="member-election-eyebrow">ELECTION COMPLETED</span>
            <h2>No Single Winner</h2>
            <p>
              Top candidates received equal votes (
              {results[0]?.voteCount ?? 0}). Result requires a tie-break
              decision.
            </p>
          </div>
        </div>
      ) : winner ? (
        <div className="member-election-winner-hero">
          <div className="member-election-winner-badge">
            <Trophy size={18} />
            Winner
          </div>

          <div className="member-election-winner-avatar">
            {winner.image ? (
              <img src={winner.image} alt={winner.candidateName} />
            ) : (
              <span>{winner.candidateName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="member-election-winner-info">
            <span className="member-election-eyebrow">ELECTION COMPLETED</span>
            <h2>{winner.candidateName}</h2>
            <p className="member-election-winner-position">{winner.position}</p>
            <div className="member-election-winner-votes">
              <Medal size={18} />
              <strong>{winner.voteCount}</strong>
              <span>Votes</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="member-election-results-table-wrap">
        <table className="member-election-results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Candidate</th>
              <th>Votes</th>
              <th>%</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => {
              const rankLabel = getRankLabel(row, index, isTie);
              const rankClass = getRankBadgeClass(row, index, isTie);
              return (
                <tr key={row.candidateId ?? index}>
                  <td data-label="#">{index + 1}</td>
                  <td data-label="Candidate">
                    <div className="member-election-table-candidate">
                      <div className="member-election-table-avatar">
                        {row.image ? (
                          <img src={row.image} alt={row.candidateName} />
                        ) : (
                          <span>{row.candidateName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <strong>{row.candidateName}</strong>
                        <span>{row.position}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Votes">{row.voteCount}</td>
                  <td data-label="%">{percent(row)}%</td>
                  <td data-label="Result">
                    <span className={`member-election-rank-badge ${rankClass}`}>
                      {rankLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="member-election-results-footer">
        Total votes counted: <strong>{totalVotes}</strong>
      </p>
    </section>
  );
};

export default MemberElectionVoting;