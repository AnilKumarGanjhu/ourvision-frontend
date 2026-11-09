
import React, { useCallback, useEffect, useState } from "react";
import { useToast } from "../page/ToastContext";

import {
  getElections,
  deleteElection,
  removeElectionCandidate,
  createElection,
  addElectionCandidate,
  getElectionCandidates,
  startElection,
  closeElection,
  publishElectionResults,
  getElectionResults,
  getRecordedElectionVotes,
  getElectionAuditLogs,
  getUsers,
} from "../api";

import {
  CalendarDays,
  Plus,
  RefreshCw,
  Play,
  Lock,
  Award,
  Users,
  ClipboardList,
  History,
  Eye,
  X,
  UserRound,
  Trash2,
} from "lucide-react";

import ConfirmModal from "../components/ConfirmModal";
import "./AdminElectionManagement.css";

/* ==================================================
   API RESPONSE HELPERS
================================================== */

function unwrapResponse(response) {
  let data =
    response?.data !== undefined
      ? response.data
      : response;

  for (let i = 0; i < 3; i += 1) {
    if (
      data &&
      !Array.isArray(data) &&
      typeof data === "object" &&
      data.data !== undefined
    ) {
      data = data.data;
    } else {
      break;
    }
  }

  return data;
}

function unwrapList(response) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) return data;

  if (!data || typeof data !== "object") return [];

  const possibleLists = [
    data.content,
    data.items,
    data.candidates,
    data.results,
    data.votes,
    data.auditLogs,
    data.users,
    data.elections,
  ];

  return possibleLists.find(Array.isArray) || [];
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getStatus(election) {
  return String(election?.status || "DRAFT").toUpperCase();
}

function isPublished(election) {
  return (
    election?.resultsPublished === true ||
    election?.resultsPublished === "true"
  );
}

function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  return (
    responseData?.message ||
    responseData?.error ||
    error?.message ||
    fallback
  );
}

/* ==================================================
   CANDIDATE HELPERS
================================================== */

function getMemberId(candidate) {
  return (
    candidate?.candidateUserId ??
    candidate?.userId ??
    candidate?.user?.id ??
    candidate?.candidateUser?.id ??
    candidate?.candidate?.userId ??
    candidate?.candidate?.user?.id ??
    null
  );
}

function getCandidateName(candidate, members = []) {
  const userId = getMemberId(candidate);

  const matchingMember = members.find((member) => {
    const memberId = member?.id ?? member?.userId;

    return (
      userId != null &&
      memberId != null &&
      String(memberId) === String(userId)
    );
  });

  return (
    candidate?.fullName ||
    candidate?.name ||
    candidate?.user?.fullName ||
    candidate?.user?.name ||
    candidate?.candidateUser?.fullName ||
    candidate?.candidateUser?.name ||
    candidate?.candidate?.fullName ||
    candidate?.candidate?.name ||
    matchingMember?.fullName ||
    matchingMember?.name ||
    candidate?.email ||
    candidate?.user?.email ||
    candidate?.candidateUser?.email ||
    matchingMember?.email ||
    `Candidate #${userId ?? candidate?.id ?? "Unknown"}`
  );
}

function getMemberName(member) {
  return (
    member?.fullName ||
    member?.name ||
    member?.email ||
    `Member ${member?.id ?? member?.userId ?? ""}`
  );
}

/* ==================================================
   MAIN COMPONENT
================================================== */

export default function AdminElectionManagement() {
  const [elections, setElections] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const { showToast } = useToast();

  // Every notice is shown as a toast instead of an inline banner.
  useEffect(() => {
    if (notice?.text) showToast(notice.text, notice.type || "success");
  }, [notice, showToast]);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedElection, setSelectedElection] = useState(null);
  const [detailsType, setDetailsType] = useState("");
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Custom confirmation popup state
  const [pendingAction, setPendingAction] = useState(null);

  const [electionForm, setElectionForm] = useState({
    title: "",
    description: "",
    positionName: "",
    startAt: "",
    endAt: "",
  });

  const [candidateForm, setCandidateForm] = useState({
    candidateUserId: "",
    manifesto: "",
  });

  /* ==================================================
     LOAD ELECTIONS AND MEMBERS
  ================================================== */

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [electionResponse, memberResponse] = await Promise.all([
        getElections(),
        getUsers(),
      ]);

      const electionList = unwrapList(electionResponse);
      const memberList = unwrapList(memberResponse);

      setElections(electionList);
      setMembers(memberList);
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(
          error,
          "Could not load elections and members."
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ==================================================
     FORM HANDLERS
  ================================================== */

  function handleElectionFormChange(event) {
    const { name, value } = event.target;

    setElectionForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCandidateFormChange(event) {
    const { name, value } = event.target;

    setCandidateForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* ==================================================
     CREATE ELECTION
  ================================================== */

  async function handleCreateElection(event) {
    event.preventDefault();

    if (
      !electionForm.title.trim() ||
      !electionForm.positionName.trim() ||
      !electionForm.startAt ||
      !electionForm.endAt
    ) {
      setNotice({
        type: "error",
        text:
          "Please enter the election title, position, start time and end time.",
      });
      return;
    }

    const start = new Date(electionForm.startAt);
    const end = new Date(electionForm.endAt);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setNotice({
        type: "error",
        text: "Election end time must be later than start time.",
      });
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      await createElection({
        title: electionForm.title.trim(),
        description: electionForm.description.trim(),
        positionName: electionForm.positionName.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      setElectionForm({
        title: "",
        description: "",
        positionName: "",
        startAt: "",
        endAt: "",
      });

      setShowCreateForm(false);

      setNotice({
        type: "success",
        text: "Election created successfully.",
      });

      await loadData();
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error, "Failed to create election."),
      });
    } finally {
      setBusy(false);
    }
  }

  /* ==================================================
     LOAD ELECTION DETAILS
  ================================================== */

  async function loadDetails(election, type) {
    setSelectedElection(election);
    setDetailsType(type);
    setDetailsData(null);
    setDetailsLoading(true);
    setNotice(null);

    try {
      let response;

      switch (type) {
        case "candidates":
          response = await getElectionCandidates(election.id);
          break;

        case "results":
          if (!isPublished(election)) {
            throw new Error(
              "Results are not published yet. Close the election and publish results first."
            );
          }

          response = await getElectionResults(election.id);
          break;

        case "votes":
          if (getStatus(election) !== "CLOSED") {
            throw new Error(
              "Recorded votes are available after the election is closed."
            );
          }

          response = await getRecordedElectionVotes(election.id);
          break;

        case "audit":
          response = await getElectionAuditLogs(election.id);
          break;

        default:
          throw new Error("Unsupported election details.");
      }

      const data =
        type === "results"
          ? unwrapResponse(response)
          : unwrapList(response);

      if (type === "candidates") {
        console.log("Candidate API response:", data);
      }

      setDetailsData(data);
    } catch (error) {
      setDetailsData(type === "results" ? null : []);

      setNotice({
        type: "error",
        text: getErrorMessage(error, `Could not load ${type}.`),
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  /* ==================================================
     ADD CANDIDATE
  ================================================== */

  async function handleAddCandidate(event) {
    event.preventDefault();

    if (!selectedElection || !candidateForm.candidateUserId) {
      setNotice({
        type: "error",
        text: "Please select a member to add as a candidate.",
      });
      return;
    }

    const selectedUserId = String(candidateForm.candidateUserId);

    const alreadyAdded =
      Array.isArray(detailsData) &&
      detailsData.some(
        (candidate) => String(getMemberId(candidate)) === selectedUserId
      );

    if (alreadyAdded) {
      setNotice({
        type: "error",
        text: "This member is already a candidate in this election.",
      });
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      await addElectionCandidate(
        selectedElection.id,
        candidateForm.candidateUserId,
        candidateForm.manifesto.trim()
      );

      setCandidateForm({
        candidateUserId: "",
        manifesto: "",
      });

      setNotice({
        type: "success",
        text: "Candidate added successfully.",
      });

      await loadDetails(selectedElection, "candidates");
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error, "Failed to add candidate."),
      });
    } finally {
      setBusy(false);
    }
  }

  /* ==================================================
     DELETE ELECTION
  ================================================== */

  function handleDeleteElection(id) {
    if (busy) return;

    const election = elections.find((item) => item.id === id);

    setPendingAction({
      action: "deleteElection",
      electionId: id,
      election,
      title: "Delete Election?",
      message: "Are you sure you want to permanently delete this election? This action cannot be undone.",
      confirmText: "Delete Election",
    });
  }

  /* ==================================================
     DELETE CANDIDATE
  ================================================== */

  function handleDeleteCandidate(electionId, candidateId) {
    if (busy) return;

    setPendingAction({
      action: "deleteCandidate",
      electionId,
      candidateId,
      title: "Remove Candidate?",
      message: "Are you sure you want to remove this candidate from the election?",
      confirmText: "Remove Candidate",
    });
  }

  /* ==================================================
     CUSTOM CONFIRMATION POPUP
  ================================================== */

  function requestElectionAction(action, election, successMessage) {
    const actionConfig = {
      startElection: {
        title: "Start Election?",
        message: `Are you sure you want to start "${election.title}"? Once started, the election will become LIVE.`,
        confirmText: "Start Election",
      },

      closeElection: {
        title: "Close Election?",
        message: `Are you sure you want to close "${election.title}"? Voting will no longer be available after it is closed.`,
        confirmText: "Close Election",
      },

      publishElectionResults: {
        title: "Publish Election Results?",
        message: `Are you sure you want to publish the results of "${election.title}"? Published results will be visible to users.`,
        confirmText: "Publish Results",
      },
    };

    const config = actionConfig[action];

    if (!config || busy) return;

    setPendingAction({
      action,
      election,
      successMessage,
      ...config,
    });
  }

  /* ==================================================
     EXECUTE ELECTION ACTION
  ================================================== */

  async function performAction(action, election, successMessage) {
    setBusy(true);
    setNotice(null);

    try {
      if (action === "startElection") {
        await startElection(election.id);
      } else if (action === "closeElection") {
        await closeElection(election.id);
      } else if (action === "publishElectionResults") {
        await publishElectionResults(election.id);
      }

      const refreshedElection = {
        ...election,

        status:
          action === "startElection"
            ? "LIVE"
            : action === "closeElection"
              ? "CLOSED"
              : election.status,

        resultsPublished:
          action === "publishElectionResults"
            ? true
            : election.resultsPublished,
      };

      setSelectedElection((current) =>
        current?.id === election.id ? refreshedElection : current
      );

      setNotice({
        type: "success",
        text: successMessage,
      });

      await loadData();

      if (
        selectedElection?.id === election.id &&
        detailsType &&
        detailsType !== "results" &&
        detailsType !== "votes"
      ) {
        await loadDetails(refreshedElection, detailsType);
      }
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error, "The operation failed."),
      });
    } finally {
      setBusy(false);
    }
  }

  /* ==================================================
     CONFIRM POPUP ACTION
  ================================================== */

  async function confirmElectionAction() {
    if (!pendingAction || busy) return;

    const actionDetails = pendingAction;
    const {
      action,
      election,
      electionId,
      candidateId,
      successMessage,
    } = actionDetails;

    setPendingAction(null);

    if (action === "deleteElection") {
      setBusy(true);
      setNotice(null);

      try {
        await deleteElection(electionId);

        if (selectedElection?.id === electionId) {
          closeDetails();
        }

        setNotice({
          type: "success",
          text: "Election deleted successfully.",
        });

        await loadData();
      } catch (error) {
        setNotice({
          type: "error",
          text: getErrorMessage(error, "Failed to delete election."),
        });
      } finally {
        setBusy(false);
      }

      return;
    }

    if (action === "deleteCandidate") {
      setBusy(true);
      setNotice(null);

      try {
        await removeElectionCandidate(electionId, candidateId);

        setNotice({
          type: "success",
          text: "Candidate removed successfully.",
        });

        if (selectedElection?.id === electionId) {
          await loadDetails(selectedElection, "candidates");
        }
      } catch (error) {
        setNotice({
          type: "error",
          text: getErrorMessage(error, "Failed to remove candidate."),
        });
      } finally {
        setBusy(false);
      }

      return;
    }

    await performAction(action, election, successMessage);
  }

  /* ==================================================
     CLOSE DETAILS MODAL
  ================================================== */

  function closeDetails() {
    setSelectedElection(null);
    setDetailsType("");
    setDetailsData(null);
    setDetailsLoading(false);

    setCandidateForm({
      candidateUserId: "",
      manifesto: "",
    });
  }

  /* ==================================================
     SUMMARY COUNTS
  ================================================== */

  const liveCount = elections.filter(
    (election) => getStatus(election) === "LIVE"
  ).length;

  const closedCount = elections.filter(
    (election) => getStatus(election) === "CLOSED"
  ).length;

  /* ==================================================
     RENDER
  ================================================== */

  return (
    <div className="election-admin-page">

      {/* HEADER */}

      <div className="election-admin-header">
        <div>
          <p className="election-eyebrow">
            OUR VISION · ADMIN PANEL
          </p>

          <h1>Election Management</h1>

          <p className="election-subtitle">
            Create elections, manage candidates and publish results.
          </p>
        </div>

        <div className="election-header-actions">
          <button
            type="button"
            className="election-btn election-btn-secondary"
            onClick={loadData}
            disabled={loading || busy}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="election-btn election-btn-primary"
            onClick={() => {
              setNotice(null);
              setShowCreateForm((current) => !current);
            }}
            disabled={busy}
          >
            <Plus size={17} />
            Create Election
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="election-stat-grid">
        <div className="election-stat-card">
          <div className="election-stat-icon blue">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Total Elections</span>
            <strong>{elections.length}</strong>
          </div>
        </div>

        <div className="election-stat-card">
          <div className="election-stat-icon green">
            <Play size={21} />
          </div>

          <div>
            <span>Live Elections</span>
            <strong>{liveCount}</strong>
          </div>
        </div>

        <div className="election-stat-card">
          <div className="election-stat-icon orange">
            <Lock size={21} />
          </div>

          <div>
            <span>Closed Elections</span>
            <strong>{closedCount}</strong>
          </div>
        </div>
      </div>

      {/* CREATE ELECTION FORM */}

      {showCreateForm && (
        <section className="election-panel">
          <div className="election-panel-heading">
            <div>
              <h2>Create New Election</h2>
              <p>Enter election details and schedule.</p>
            </div>

            <button
              type="button"
              className="election-icon-btn"
              onClick={() => setShowCreateForm(false)}
              aria-label="Close create election form"
            >
              <X size={19} />
            </button>
          </div>

          <form
            className="election-form-grid"
            onSubmit={handleCreateElection}
          >
            <label>
              Election Title *
              <input
                name="title"
                value={electionForm.title}
                onChange={handleElectionFormChange}
                placeholder="e.g. Annual Organization Election"
                maxLength={200}
                required
              />
            </label>

            <label>
              Position *
              <input
                name="positionName"
                value={electionForm.positionName}
                onChange={handleElectionFormChange}
                placeholder="e.g. President"
                maxLength={100}
                required
              />
            </label>

            <label className="election-form-full">
              Description
              <textarea
                name="description"
                value={electionForm.description}
                onChange={handleElectionFormChange}
                placeholder="Describe the election..."
                rows={3}
              />
            </label>

            <label>
              Start Date &amp; Time *
              <input
                type="datetime-local"
                name="startAt"
                value={electionForm.startAt}
                onChange={handleElectionFormChange}
                required
              />
            </label>

            <label>
              End Date &amp; Time *
              <input
                type="datetime-local"
                name="endAt"
                value={electionForm.endAt}
                onChange={handleElectionFormChange}
                min={electionForm.startAt || undefined}
                required
              />
            </label>

            <div className="election-form-actions election-form-full">
              <button
                type="button"
                className="election-btn election-btn-secondary"
                onClick={() => setShowCreateForm(false)}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="election-btn election-btn-primary"
                disabled={busy}
              >
                <Plus size={16} />
                {busy ? "Creating..." : "Create Election"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ALL ELECTIONS TABLE */}

      <section className="election-panel">
        <div className="election-panel-heading">
          <div>
            <h2>All Elections</h2>
            <p>Manage election lifecycle and review records.</p>
          </div>

          <span className="election-count-pill">
            {elections.length} total
          </span>
        </div>

        {loading ? (
          <div className="election-empty-state">
            <RefreshCw className="election-spin" size={25} />
            <p>Loading elections...</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="election-empty-state">
            <CalendarDays size={34} />
            <h3>No elections found</h3>
            <p>Create your first election to get started.</p>

            <button
              type="button"
              className="election-btn election-btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} />
              Create Election
            </button>
          </div>
        ) : (
          <div className="election-table-wrap">
            <table className="election-table">
              <thead>
                <tr>
                  <th>Election</th>
                  <th>Position</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Results</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {elections.map((election) => {
                  const status = getStatus(election);
                  const published = isPublished(election);

                  return (
                    <tr key={election.id}>
                      <td>
                        <div className="election-name-cell">
                          <strong>{election.title}</strong>
                          <span>ID: {election.id}</span>

                          {election.description && (
                            <small>{election.description}</small>
                          )}
                        </div>
                      </td>

                      <td>{election.positionName || "—"}</td>

                      <td>
                        <div className="election-schedule-cell">
                          <span>
                            <strong>Start:</strong>{" "}
                            {formatDate(election.startAt)}
                          </span>

                          <span>
                            <strong>End:</strong>{" "}
                            {formatDate(election.endAt)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`election-status ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`election-publish-status ${
                            published ? "published" : "unpublished"
                          }`}
                        >
                          {published ? "Published" : "Not published"}
                        </span>
                      </td>

                      <td>
                        <div className="election-row-actions">

                          <button
                            type="button"
                            className="election-action-btn"
                            onClick={() =>
                              loadDetails(election, "candidates")
                            }
                          >
                            <Users size={15} />
                            Candidates
                          </button>

                          {(status === "DRAFT" ||
                            status === "SCHEDULED") && (
                            <button
                              type="button"
                              className="election-action-btn success"
                              disabled={busy}
                              onClick={() =>
                                requestElectionAction(
                                  "startElection",
                                  election,
                                  "Election started successfully."
                                )
                              }
                            >
                              <Play size={15} />
                              Start Election
                            </button>
                          )}

                          {status === "LIVE" && (
                            <button
                              type="button"
                              className="election-action-btn danger"
                              disabled={busy}
                              onClick={() =>
                                requestElectionAction(
                                  "closeElection",
                                  election,
                                  "Election closed successfully."
                                )
                              }
                            >
                              <Lock size={15} />
                              Close
                            </button>
                          )}

                          {status === "CLOSED" && !published && (
                            <button
                              type="button"
                              className="election-action-btn primary"
                              disabled={busy}
                              onClick={() =>
                                requestElectionAction(
                                  "publishElectionResults",
                                  election,
                                  "Election results published successfully."
                                )
                              }
                            >
                              <Award size={15} />
                              Publish
                            </button>
                          )}

                          {published && (
                            <button
                              type="button"
                              className="election-action-btn primary"
                              onClick={() =>
                                loadDetails(election, "results")
                              }
                            >
                              <Eye size={15} />
                              Results
                            </button>
                          )}

                          {status === "CLOSED" && (
                            <button
                              type="button"
                              className="election-action-btn"
                              onClick={() =>
                                loadDetails(election, "votes")
                              }
                            >
                              <ClipboardList size={15} />
                              Votes
                            </button>
                          )}

                          <button
                            type="button"
                            className="election-action-btn"
                            onClick={() =>
                              loadDetails(election, "audit")
                            }
                          >
                            <History size={15} />
                            Audit
                          </button>

                          {(status === "CLOSED" || published) && (
                            <button
                              type="button"
                              className="election-action-btn danger"
                              onClick={() => handleDeleteElection(election.id)}
                              disabled={busy}
                              title="Permanently delete election"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ELECTION DETAILS MODAL */}

      {selectedElection && (
        <div
          className="election-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <section
            className="election-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="election-modal-title"
          >
            <div className="election-modal-header">
              <div>
                <span className="election-eyebrow">
                  {selectedElection.title}
                </span>

                <h2 id="election-modal-title">
                  {detailsType === "candidates" && "Candidates"}
                  {detailsType === "results" && "Published Results"}
                  {detailsType === "votes" && "Recorded Votes"}
                  {detailsType === "audit" && "Audit Logs"}
                </h2>
              </div>

              <button
                type="button"
                className="election-icon-btn"
                onClick={closeDetails}
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="election-empty-state">
                <RefreshCw className="election-spin" size={24} />
                <p>Loading details...</p>
              </div>
            ) : (
              <>
                {/* CANDIDATES */}

                {detailsType === "candidates" && (
                  <>
                    <div className="election-candidate-toolbar">
                      <div>
                        <span className="election-status">
                          {getStatus(selectedElection)}
                        </span>

                        <p className="election-muted">
                          Add candidates and manage this election.
                        </p>
                      </div>

                      {(getStatus(selectedElection) === "DRAFT" ||
                        getStatus(selectedElection) === "SCHEDULED") && (
                        <button
                          type="button"
                          className="election-btn election-btn-primary"
                          disabled={busy}
                          onClick={() =>
                            requestElectionAction(
                              "startElection",
                              selectedElection,
                              "Election started successfully."
                            )
                          }
                        >
                          <Play size={16} />
                          {busy ? "Please wait..." : "Start Election"}
                        </button>
                      )}

                      {getStatus(selectedElection) === "LIVE" && (
                        <button
                          type="button"
                          className="election-btn election-btn-secondary"
                          disabled={busy}
                          onClick={() =>
                            requestElectionAction(
                              "closeElection",
                              selectedElection,
                              "Election closed successfully."
                            )
                          }
                        >
                          <Lock size={16} />
                          Close Election
                        </button>
                      )}
                    </div>

                    {(getStatus(selectedElection) === "DRAFT" ||
                      getStatus(selectedElection) === "SCHEDULED") && (
                      <form
                        className="election-candidate-form"
                        onSubmit={handleAddCandidate}
                      >
                        <h3>Add Candidate</h3>

                        <label>
                          Select Member *
                          <select
                            name="candidateUserId"
                            value={candidateForm.candidateUserId}
                            onChange={handleCandidateFormChange}
                            required
                          >
                            <option value="">Choose a member</option>

                            {members.map((member) => {
                              const memberId =
                                member.id ?? member.userId;

                              const existingCandidate =
                                Array.isArray(detailsData) &&
                                detailsData.some(
                                  (candidate) =>
                                    String(getMemberId(candidate)) ===
                                    String(memberId)
                                );

                              return (
                                <option
                                  key={memberId}
                                  value={memberId}
                                  disabled={existingCandidate}
                                >
                                  {getMemberName(member)} — ID {memberId}
                                  {existingCandidate
                                    ? " (Already added)"
                                    : ""}
                                </option>
                              );
                            })}
                          </select>
                        </label>

                        <label>
                          Manifesto
                          <textarea
                            name="manifesto"
                            value={candidateForm.manifesto}
                            onChange={handleCandidateFormChange}
                            rows={3}
                            placeholder="Candidate's vision and goals..."
                          />
                        </label>

                        <button
                          type="submit"
                          className="election-btn election-btn-primary"
                          disabled={busy}
                        >
                          <Plus size={16} />
                          {busy ? "Adding..." : "Add Candidate"}
                        </button>
                      </form>
                    )}

                    <h3 className="election-details-subheading">
                      Candidate Records (
                      {Array.isArray(detailsData) ? detailsData.length : 0})
                    </h3>

                    {Array.isArray(detailsData) &&
                    detailsData.length > 0 ? (
                      <div className="election-record-list">
                        {detailsData.map((candidate, index) => {
                          const candidateUserId = getMemberId(candidate);

                          const candidateName = getCandidateName(
                            candidate,
                            members
                          );

                          return (
                            <article
                              className="election-record"
                              key={
                                candidate.id ??
                                `${candidateUserId}-${index}`
                              }
                            >
                              <div className="election-candidate-record">
                                <div className="election-candidate-avatar">
                                  <UserRound size={22} />
                                </div>

                                <div>
                                  <strong>{candidateName}</strong>

                                  <p>
                                    Member ID:{" "}
                                    {candidateUserId ?? "Not available"}
                                  </p>

                                  {candidate.email && (
                                    <p>Email: {candidate.email}</p>
                                  )}

                                  {candidate.manifesto && (
                                    <p className="election-manifesto">
                                      <strong>Manifesto:</strong>{" "}
                                      {candidate.manifesto}
                                    </p>
                                  )}

                                  {candidate.createdAt && (
                                    <p className="election-muted">
                                      Added: {formatDate(candidate.createdAt)}
                                    </p>
                                  )}
                                </div>

                                {getStatus(selectedElection) === "DRAFT" && (
                                  <button
                                    type="button"
                                    className="election-icon-btn"
                                    onClick={() =>
                                      handleDeleteCandidate(
                                        selectedElection.id,
                                        candidate.id
                                      )
                                    }
                                    disabled={busy}
                                    title="Remove Candidate"
                                    aria-label={`Remove ${candidateName}`}
                                    style={{
                                      color: "#c24f55",
                                      marginLeft: "auto",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="election-muted">
                        No candidates have been added to this election yet.
                      </p>
                    )}
                  </>
                )}

                {/* RESULTS */}

                {detailsType === "results" && (
                  detailsData ? (
                    <pre className="election-json">
                      {JSON.stringify(detailsData, null, 2)}
                    </pre>
                  ) : (
                    <p className="election-muted">
                      No results data available.
                    </p>
                  )
                )}

                {/* RECORDED VOTES */}

                {detailsType === "votes" && (
                  <div className="election-record-list">
                    {Array.isArray(detailsData) &&
                    detailsData.length > 0 ? (
                      detailsData.map((vote, index) => (
                        <article
                          className="election-record"
                          key={vote.id ?? index}
                        >
                          <div>
                            <strong>
                              Vote ID: {vote.id ?? "—"}
                            </strong>

                            <p>
                              Voter ID:{" "}
                              {vote.voterId ?? vote.voter?.id ?? "—"}
                            </p>

                            <p>
                              Candidate ID:{" "}
                              {vote.candidateId ??
                                vote.candidate?.id ??
                                "—"}
                            </p>

                            <p>
                              Voted at: {formatDate(vote.votedAt)}
                            </p>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="election-muted">
                        No recorded votes found.
                      </p>
                    )}
                  </div>
                )}

                {/* AUDIT LOGS */}

                {detailsType === "audit" && (
                  <div className="election-record-list">
                    {Array.isArray(detailsData) &&
                    detailsData.length > 0 ? (
                      detailsData.map((log, index) => (
                        <article
                          className="election-record"
                          key={log.id ?? index}
                        >
                          <div>
                            <strong>
                              {log.action || "Audit event"}
                            </strong>

                            <p>
                              Actor ID:{" "}
                              {log.actorUserId ??
                                log.actor?.id ??
                                "—"}
                            </p>

                            <p>
                              Time: {formatDate(log.createdAt)}
                            </p>

                            {log.details != null && (
                              <pre className="election-json">
                                {typeof log.details === "string"
                                  ? log.details
                                  : JSON.stringify(
                                      log.details,
                                      null,
                                      2
                                    )}
                              </pre>
                            )}
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="election-muted">
                        No audit logs found.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* ==================================================
          CUSTOM 3D CONFIRMATION POPUP
      ================================================== */}

      <ConfirmModal
        open={Boolean(pendingAction)}
        type="warning"
        title={pendingAction?.title}
        message={pendingAction?.message}
        confirmText={pendingAction?.confirmText}
        cancelText="Cancel"
        loading={busy}
        onCancel={() => {
          if (!busy) {
            setPendingAction(null);
          }
        }}
        onConfirm={confirmElectionAction}
      />

    </div>
  );
}