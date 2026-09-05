import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus, Eye, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import StudentForm, { DEPARTMENTS } from "../components/StudentForm.jsx";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../services/api.js";

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20,
      }}
    >
      <div className="card" style={{ width: 720, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>{title}</div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("desc");

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view'
  const [activeStudent, setActiveStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (status) params.placement_status = status;
      if (sortBy) { params.sort_by = sortBy; params.order = order; }
      const res = await listStudents(params);
      setStudents(res.data.students);
      setTotal(res.data.total);
      setBackendDown(false);
    } catch (err) {
      setBackendDown(true);
    } finally {
      setLoading(false);
    }
  }, [search, department, status, sortBy, order]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const openAdd = () => { setActiveStudent(null); setModalMode("add"); setActionError(""); };
  const openEdit = (s) => { setActiveStudent(s); setModalMode("edit"); setActionError(""); };
  const openView = (s) => { setActiveStudent(s); setModalMode("view"); setActionError(""); };
  const closeModal = () => { setModalMode(null); setActiveStudent(null); };

  const handleCreate = async (formData) => {
    setSaving(true);
    setActionError("");
    try {
      await createStudent(formData);
      closeModal();
      fetchStudents();
    } catch (err) {
      setActionError(err?.response?.data?.detail || "Failed to create student");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (formData) => {
    setSaving(true);
    setActionError("");
    try {
      await updateStudent(activeStudent.student_id, formData);
      closeModal();
      fetchStudents();
    } catch (err) {
      setActionError(err?.response?.data?.detail || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student record? This cannot be undone.")) return;
    try {
      await deleteStudent(id);
      fetchStudents();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete student");
    }
  };

  return (
    <div>
      <div className="section-heading">
        <div>
          <h1>Students</h1>
          <p>{total} student{total === 1 ? "" : "s"} on record</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="grid grid-4">
          <div className="form-group">
            <label>Search</label>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 10, top: 12, color: "var(--color-text-muted)" }} />
              <input
                style={{ paddingLeft: 32 }}
                placeholder="Name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Placement Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="Placed">Placed</option>
              <option value="Not Placed">Not Placed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sort By</label>
            <select
              value={`${sortBy}:${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split(":");
                setSortBy(sb); setOrder(ord);
              }}
            >
              <option value=":desc">Default</option>
              <option value="cgpa:desc">CGPA (High to Low)</option>
              <option value="cgpa:asc">CGPA (Low to High)</option>
              <option value="placement_probability:desc">Probability (High to Low)</option>
              <option value="placement_probability:asc">Probability (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {backendDown && (
        <div className="card empty-state" style={{ marginBottom: 18 }}>
          <AlertTriangle size={28} color="var(--color-danger)" style={{ marginBottom: 8 }} />
          <p>Could not reach the backend. Make sure FastAPI is running on http://127.0.0.1:8000</p>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">No students match these filters.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>CGPA</th>
                  <th>Coding</th>
                  <th>Status</th>
                  <th>Probability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id}>
                    <td>{s.student_id}</td>
                    <td>{s.name}</td>
                    <td>{s.department}</td>
                    <td>{s.cgpa}</td>
                    <td>{s.coding_score}</td>
                    <td>
                      <span className={`badge ${s.placement_status === "Placed" ? "badge-success" : "badge-danger"}`}>
                        {s.placement_status}
                      </span>
                    </td>
                    <td>{s.placement_probability}%</td>
                    <td>
                      <button className="icon-btn" onClick={() => openView(s)}><Eye size={16} /></button>
                      <button className="icon-btn" onClick={() => openEdit(s)}><Pencil size={16} /></button>
                      <button className="icon-btn" onClick={() => handleDelete(s.student_id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode === "add" && (
        <Modal title="Add Student" onClose={closeModal}>
          {actionError && <p className="error-text">{actionError}</p>}
          <StudentForm onSubmit={handleCreate} submitLabel="Create Student" loading={saving} />
        </Modal>
      )}

      {modalMode === "edit" && activeStudent && (
        <Modal title={`Edit ${activeStudent.name}`} onClose={closeModal}>
          {actionError && <p className="error-text">{actionError}</p>}
          <StudentForm initialValue={activeStudent} onSubmit={handleUpdate} submitLabel="Save Changes" loading={saving} />
        </Modal>
      )}

      {modalMode === "view" && activeStudent && (
        <Modal title={activeStudent.name} onClose={closeModal}>
          <div className="grid grid-2">
            {Object.entries(activeStudent).map(([k, v]) => (
              <div key={k}>
                <div className="stat-label">{k.replace(/_/g, " ")}</div>
                <div style={{ fontWeight: 600 }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
