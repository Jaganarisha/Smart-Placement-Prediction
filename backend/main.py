import os
import sqlite3
import subprocess
import sys
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import model as model_module


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# SQLite database
DB_PATH = os.path.join(BASE_DIR, "placement.db")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Smart Placement Prediction System API",
    description="ML-powered placement prediction & student management backend",
    version="1.0.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS students (
            student_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            gender TEXT NOT NULL,
            tenth_percentage REAL,
            twelfth_percentage REAL,
            cgpa REAL,
            backlogs INTEGER,
            attendance REAL,
            aptitude_score REAL,
            coding_score REAL,
            communication_score REAL,
            technical_skills TEXT,
            certifications INTEGER,
            internships INTEGER,
            projects INTEGER,
            extracurricular_activities INTEGER,
            placement_status TEXT,
            placement_probability REAL
        )
        """
    )

    conn.commit()

    # Seed database from dataset.csv
    cur = conn.execute("SELECT COUNT(*) AS c FROM students")
    count = cur.fetchone()["c"]

    dataset_path = os.path.join(BASE_DIR, "dataset.csv")

    if count == 0 and os.path.exists(dataset_path):
        import csv

        with open(
            dataset_path,
            newline="",
            encoding="utf-8"
        ) as f:

            reader = csv.DictReader(f)
            rows = list(reader)[:500]

            for r in rows:
                try:
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO students
                        (
                            student_id,
                            name,
                            department,
                            gender,
                            tenth_percentage,
                            twelfth_percentage,
                            cgpa,
                            backlogs,
                            attendance,
                            aptitude_score,
                            coding_score,
                            communication_score,
                            technical_skills,
                            certifications,
                            internships,
                            projects,
                            extracurricular_activities,
                            placement_status,
                            placement_probability
                        )
                        VALUES
                        (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                        """,
                        (
                            r["student_id"],
                            r["name"],
                            r["department"],
                            r["gender"],
                            float(r["tenth_percentage"]),
                            float(r["twelfth_percentage"]),
                            float(r["cgpa"]),
                            int(r["backlogs"]),
                            float(r["attendance"]),
                            float(r["aptitude_score"]),
                            float(r["coding_score"]),
                            float(r["communication_score"]),
                            r["technical_skills"],
                            int(r["certifications"]),
                            int(r["internships"]),
                            int(r["projects"]),
                            int(r["extracurricular_activities"]),
                            r["placement_status"],
                            (
                                85.0
                                if r["placement_status"] == "Placed"
                                else 30.0
                            ),
                        ),
                    )

                except Exception:
                    continue

        conn.commit()

    conn.close()


# Initialize database
init_db()


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class StudentIn(BaseModel):
    student_id: Optional[str] = None
    name: str
    department: str
    gender: str

    tenth_percentage: float = Field(
        ...,
        ge=0,
        le=100
    )

    twelfth_percentage: float = Field(
        ...,
        ge=0,
        le=100
    )

    cgpa: float = Field(
        ...,
        ge=0,
        le=10
    )

    backlogs: int = Field(
        ...,
        ge=0
    )

    attendance: float = Field(
        ...,
        ge=0,
        le=100
    )

    aptitude_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    coding_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    communication_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    technical_skills: str = ""

    certifications: int = Field(
        ...,
        ge=0
    )

    internships: int = Field(
        ...,
        ge=0
    )

    projects: int = Field(
        ...,
        ge=0
    )

    extracurricular_activities: int = Field(
        ...,
        ge=0,
        le=1
    )


class PredictionRequest(BaseModel):
    name: Optional[str] = "Student"
    department: str
    gender: str

    tenth_percentage: float = Field(
        ...,
        ge=0,
        le=100
    )

    twelfth_percentage: float = Field(
        ...,
        ge=0,
        le=100
    )

    cgpa: float = Field(
        ...,
        ge=0,
        le=10
    )

    backlogs: int = Field(
        ...,
        ge=0
    )

    attendance: float = Field(
        ...,
        ge=0,
        le=100
    )

    aptitude_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    coding_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    communication_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    technical_skills: str = ""

    certifications: int = Field(
        ...,
        ge=0
    )

    internships: int = Field(
        ...,
        ge=0
    )

    projects: int = Field(
        ...,
        ge=0
    )

    extracurricular_activities: int = Field(
        ...,
        ge=0,
        le=1
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Smart Placement Prediction System API",
        "docs": "/docs",
        "model_ready": model_module.MODEL_READY,
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_ready": model_module.MODEL_READY,
        "model_error": model_module.MODEL_LOAD_ERROR,
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
def predict(payload: PredictionRequest):

    if not model_module.MODEL_READY:
        raise HTTPException(
            status_code=503,
            detail=(
                model_module.MODEL_LOAD_ERROR
                or "Model not trained yet. "
                "Run: python train_model.py"
            ),
        )

    try:
        result = model_module.predict_student(
            payload.model_dump()
        )

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )


# ============================================================
# STUDENT CRUD
# ============================================================

def _row_to_dict(row) -> dict:
    return dict(row)


@app.get("/students")
def list_students(
    department: Optional[str] = None,
    placement_status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    order: Optional[str] = "desc",
    limit: int = 1000,
    offset: int = 0,
):

    conn = get_conn()

    query = "SELECT * FROM students WHERE 1=1"
    params: List = []

    if department:
        query += " AND department = ?"
        params.append(department)

    if placement_status:
        query += " AND placement_status = ?"
        params.append(placement_status)

    if search:
        query += (
            " AND (name LIKE ? OR student_id LIKE ?)"
        )

        params.extend(
            [
                f"%{search}%",
                f"%{search}%"
            ]
        )

    allowed_sort = {
        "cgpa",
        "placement_probability",
        "coding_score",
        "name"
    }

    if sort_by in allowed_sort:

        direction = (
            "ASC"
            if str(order).lower() == "asc"
            else "DESC"
        )

        query += (
            f" ORDER BY {sort_by} {direction}"
        )

    query += " LIMIT ? OFFSET ?"

    params.extend(
        [
            limit,
            offset
        ]
    )

    rows = conn.execute(
        query,
        params
    ).fetchall()

    total = conn.execute(
        "SELECT COUNT(*) AS c FROM students"
    ).fetchone()["c"]

    conn.close()

    return {
        "total": total,
        "count": len(rows),
        "students": [
            _row_to_dict(r)
            for r in rows
        ],
    }


@app.get("/students/{student_id}")
def get_student(student_id: str):

    conn = get_conn()

    row = conn.execute(
        """
        SELECT *
        FROM students
        WHERE student_id = ?
        """,
        (student_id,)
    ).fetchone()

    conn.close()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return _row_to_dict(row)


@app.post("/students", status_code=201)
def create_student(student: StudentIn):

    conn = get_conn()

    sid = (
        student.student_id
        or f"S{int.from_bytes(os.urandom(2), 'big') % 9000 + 1000}"
    )

    existing = conn.execute(
        """
        SELECT 1
        FROM students
        WHERE student_id = ?
        """,
        (sid,)
    ).fetchone()

    if existing:
        conn.close()

        raise HTTPException(
            status_code=400,
            detail="student_id already exists"
        )

    placement_status = "Not Placed"
    placement_probability = 0.0

    if model_module.MODEL_READY:
        try:
            pred = model_module.predict_student(
                student.model_dump()
            )

            placement_status = pred[
                "placement_status"
            ]

            placement_probability = pred[
                "placement_probability"
            ]

        except Exception:
            pass

    conn.execute(
        """
        INSERT INTO students
        (
            student_id,
            name,
            department,
            gender,
            tenth_percentage,
            twelfth_percentage,
            cgpa,
            backlogs,
            attendance,
            aptitude_score,
            coding_score,
            communication_score,
            technical_skills,
            certifications,
            internships,
            projects,
            extracurricular_activities,
            placement_status,
            placement_probability
        )
        VALUES
        (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            sid,
            student.name,
            student.department,
            student.gender,
            student.tenth_percentage,
            student.twelfth_percentage,
            student.cgpa,
            student.backlogs,
            student.attendance,
            student.aptitude_score,
            student.coding_score,
            student.communication_score,
            student.technical_skills,
            student.certifications,
            student.internships,
            student.projects,
            student.extracurricular_activities,
            placement_status,
            placement_probability,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "message": "Student created",
        "student_id": sid
    }


@app.put("/students/{student_id}")
def update_student(
    student_id: str,
    student: StudentIn
):

    conn = get_conn()

    existing = conn.execute(
        """
        SELECT 1
        FROM students
        WHERE student_id = ?
        """,
        (student_id,)
    ).fetchone()

    if not existing:
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    placement_status = None
    placement_probability = None

    if model_module.MODEL_READY:
        try:
            pred = model_module.predict_student(
                student.model_dump()
            )

            placement_status = pred[
                "placement_status"
            ]

            placement_probability = pred[
                "placement_probability"
            ]

        except Exception:
            pass

    conn.execute(
        """
        UPDATE students SET
            name=?,
            department=?,
            gender=?,
            tenth_percentage=?,
            twelfth_percentage=?,
            cgpa=?,
            backlogs=?,
            attendance=?,
            aptitude_score=?,
            coding_score=?,
            communication_score=?,
            technical_skills=?,
            certifications=?,
            internships=?,
            projects=?,
            extracurricular_activities=?,
            placement_status=COALESCE(
                ?,
                placement_status
            ),
            placement_probability=COALESCE(
                ?,
                placement_probability
            )
        WHERE student_id=?
        """,
        (
            student.name,
            student.department,
            student.gender,
            student.tenth_percentage,
            student.twelfth_percentage,
            student.cgpa,
            student.backlogs,
            student.attendance,
            student.aptitude_score,
            student.coding_score,
            student.communication_score,
            student.technical_skills,
            student.certifications,
            student.internships,
            student.projects,
            student.extracurricular_activities,
            placement_status,
            placement_probability,
            student_id,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "message": "Student updated"
    }


@app.delete("/students/{student_id}")
def delete_student(student_id: str):

    conn = get_conn()

    existing = conn.execute(
        """
        SELECT 1
        FROM students
        WHERE student_id = ?
        """,
        (student_id,)
    ).fetchone()

    if not existing:
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    conn.execute(
        """
        DELETE FROM students
        WHERE student_id = ?
        """,
        (student_id,)
    )

    conn.commit()
    conn.close()

    return {
        "message": "Student deleted"
    }


# ============================================================
# ANALYTICS
# ============================================================

@app.get("/analytics")
def analytics():

    conn = get_conn()

    rows = [
        dict(r)
        for r in conn.execute(
            "SELECT * FROM students"
        ).fetchall()
    ]

    conn.close()

    total = len(rows)

    if total == 0:
        return {
            "total_students": 0
        }

    placed = [
        r
        for r in rows
        if r["placement_status"] == "Placed"
    ]

    placement_pct = round(
        len(placed) / total * 100,
        2
    )

    avg_cgpa = round(
        sum(r["cgpa"] for r in rows) / total,
        2
    )

    avg_coding = round(
        sum(r["coding_score"] for r in rows) / total,
        2
    )

    avg_aptitude = round(
        sum(r["aptitude_score"] for r in rows) / total,
        2
    )

    avg_comm = round(
        sum(r["communication_score"] for r in rows) / total,
        2
    )

    avg_prob = round(
        sum(r["placement_probability"] for r in rows) / total,
        2
    )

    at_risk = len(
        [
            r
            for r in rows
            if r["placement_probability"] < 50
        ]
    )

    dept_stats = {}

    for r in rows:

        d = r["department"]

        dept_stats.setdefault(
            d,
            {
                "total": 0,
                "placed": 0
            }
        )

        dept_stats[d]["total"] += 1

        if r["placement_status"] == "Placed":
            dept_stats[d]["placed"] += 1

    department_comparison = [
        {
            "department": d,
            "total": v["total"],
            "placed": v["placed"],
            "placement_rate": (
                round(
                    v["placed"] /
                    v["total"] *
                    100,
                    2
                )
                if v["total"]
                else 0
            ),
        }
        for d, v in dept_stats.items()
    ]

    def impact(field, threshold=0):

        with_it = [
            r
            for r in rows
            if r[field] > threshold
        ]

        without_it = [
            r
            for r in rows
            if r[field] <= threshold
        ]

        rate_with = (
            round(
                len(
                    [
                        r
                        for r in with_it
                        if r["placement_status"] == "Placed"
                    ]
                )
                /
                len(with_it)
                *
                100,
                2
            )
            if with_it
            else 0
        )

        rate_without = (
            round(
                len(
                    [
                        r
                        for r in without_it
                        if r["placement_status"] == "Placed"
                    ]
                )
                /
                len(without_it)
                *
                100,
                2
            )
            if without_it
            else 0
        )

        return {
            "with": rate_with,
            "without": rate_without
        }

    return {
        "total_students": total,

        "placed_students": len(placed),

        "placement_percentage": placement_pct,

        "average_cgpa": avg_cgpa,

        "average_coding_score": avg_coding,

        "average_aptitude_score": avg_aptitude,

        "average_communication_score": avg_comm,

        "average_placement_probability": avg_prob,

        "at_risk_students": at_risk,

        "department_comparison":
            department_comparison,

        "internship_impact":
            impact("internships"),

        "certification_impact":
            impact("certifications"),

        "project_impact":
            impact(
                "projects",
                threshold=1
            ),

        "placement_distribution": [
            {
                "name": "Placed",
                "value": len(placed)
            },
            {
                "name": "Not Placed",
                "value": total - len(placed)
            }
        ],
    }


# ============================================================
# MODEL PERFORMANCE
# ============================================================

@app.get("/model-performance")
def model_performance():
    return model_module.get_model_metrics()


# ============================================================
# TRAIN MODEL
# ============================================================

@app.post("/train-model")
def train_model():

    train_script = os.path.join(
        BASE_DIR,
        "train_model.py"
    )

    try:

        result = subprocess.run(
            [
                sys.executable,
                train_script
            ],
            capture_output=True,
            text=True,
            cwd=BASE_DIR,
            timeout=600,
        )

        if result.returncode != 0:

            raise HTTPException(
                status_code=500,
                detail=(
                    "Training failed: "
                    f"{result.stderr[-2000:]}"
                ),
            )

        model_module.load_bundle()

        return {
            "message": "Model trained successfully",
            "log": result.stdout[-2000:]
        }

    except subprocess.TimeoutExpired:

        raise HTTPException(
            status_code=500,
            detail="Training timed out"
        )
