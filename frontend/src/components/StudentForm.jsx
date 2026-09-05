import React, { useState } from "react";

export const DEPARTMENTS = [
  "Information Technology",
  "Computer Science",
  "Electronics and Communication",
  "Electrical and Electronics",
  "Mechanical",
  "Civil",
];

export const DEFAULT_STUDENT = {
  name: "",
  department: DEPARTMENTS[0],
  gender: "Male",
  tenth_percentage: 80,
  twelfth_percentage: 75,
  cgpa: 7.5,
  backlogs: 0,
  attendance: 85,
  aptitude_score: 60,
  coding_score: 60,
  communication_score: 60,
  technical_skills: "",
  certifications: 1,
  internships: 0,
  projects: 1,
  extracurricular_activities: 0,
};

const NUMERIC_FIELDS = new Set([
  "tenth_percentage", "twelfth_percentage", "cgpa", "backlogs", "attendance",
  "aptitude_score", "coding_score", "communication_score", "certifications",
  "internships", "projects", "extracurricular_activities",
]);

export default function StudentForm({ initialValue, onSubmit, submitLabel = "Submit", loading = false }) {
  const [form, setForm] = useState(initialValue || DEFAULT_STUDENT);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: NUMERIC_FIELDS.has(name) ? Number(value) : value,
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name || !form.name.trim()) errs.name = "Name is required";
    if (form.cgpa < 0 || form.cgpa > 10) errs.cgpa = "CGPA must be between 0 and 10";
    if (form.tenth_percentage < 0 || form.tenth_percentage > 100) errs.tenth_percentage = "Invalid percentage";
    if (form.twelfth_percentage < 0 || form.twelfth_percentage > 100) errs.twelfth_percentage = "Invalid percentage";
    if (form.attendance < 0 || form.attendance > 100) errs.attendance = "Invalid attendance";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>Student Name</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Priya Sharma" />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Department</label>
          <select name="department" value={form.department} onChange={handleChange}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="form-group">
          <label>10th Percentage</label>
          <input type="number" step="0.1" name="tenth_percentage" value={form.tenth_percentage} onChange={handleChange} />
          {errors.tenth_percentage && <span className="error-text">{errors.tenth_percentage}</span>}
        </div>

        <div className="form-group">
          <label>12th Percentage</label>
          <input type="number" step="0.1" name="twelfth_percentage" value={form.twelfth_percentage} onChange={handleChange} />
          {errors.twelfth_percentage && <span className="error-text">{errors.twelfth_percentage}</span>}
        </div>

        <div className="form-group">
          <label>CGPA (0-10)</label>
          <input type="number" step="0.1" name="cgpa" value={form.cgpa} onChange={handleChange} />
          {errors.cgpa && <span className="error-text">{errors.cgpa}</span>}
        </div>

        <div className="form-group">
          <label>Backlogs</label>
          <input type="number" name="backlogs" value={form.backlogs} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Attendance (%)</label>
          <input type="number" step="0.1" name="attendance" value={form.attendance} onChange={handleChange} />
          {errors.attendance && <span className="error-text">{errors.attendance}</span>}
        </div>

        <div className="form-group">
          <label>Aptitude Score</label>
          <input type="number" step="0.1" name="aptitude_score" value={form.aptitude_score} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Coding Score</label>
          <input type="number" step="0.1" name="coding_score" value={form.coding_score} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Communication Score</label>
          <input type="number" step="0.1" name="communication_score" value={form.communication_score} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Technical Skills</label>
          <input name="technical_skills" value={form.technical_skills} onChange={handleChange} placeholder="e.g. Python, React, SQL" />
        </div>

        <div className="form-group">
          <label>Certifications</label>
          <input type="number" name="certifications" value={form.certifications} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Internships</label>
          <input type="number" name="internships" value={form.internships} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Projects</label>
          <input type="number" name="projects" value={form.projects} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Extracurricular Activities</label>
          <select name="extracurricular_activities" value={form.extracurricular_activities} onChange={handleChange}>
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Please wait..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
