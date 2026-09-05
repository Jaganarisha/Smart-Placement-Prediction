"""
model.py
--------
Loads the trained model bundle and exposes:
  - predict_student(data: dict) -> dict   (full prediction response)
  - get_model_metrics() -> dict
  - MODEL_READY: bool
"""

import os
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "placement_model.pkl")

_bundle = None
MODEL_READY = False
MODEL_LOAD_ERROR = None


def load_bundle():
    global _bundle, MODEL_READY, MODEL_LOAD_ERROR
    if not os.path.exists(MODEL_PATH):
        MODEL_READY = False
        MODEL_LOAD_ERROR = (
            "placement_model.pkl not found. Please train the model first by running: "
            "python train_model.py"
        )
        return None
    try:
        _bundle = joblib.load(MODEL_PATH)
        MODEL_READY = True
        MODEL_LOAD_ERROR = None
        return _bundle
    except Exception as exc:  # noqa: BLE001
        MODEL_READY = False
        MODEL_LOAD_ERROR = f"Failed to load model: {exc}"
        return None


load_bundle()


def get_model_metrics() -> dict:
    if _bundle is None:
        return {"ready": False, "error": MODEL_LOAD_ERROR}
    return {
        "ready": True,
        "best_model": _bundle["best_model_name"],
        "results": _bundle["all_results"],
        "feature_importance": _bundle["feature_importance"],
    }


def _vectorize(data: dict) -> np.ndarray:
    encoders = _bundle["encoders"]
    scaler = _bundle["scaler"]
    feature_columns = _bundle["feature_columns"]
    categorical_columns = _bundle["categorical_columns"]
    numeric_columns = _bundle["numeric_columns"]

    row = {}
    for col in categorical_columns:
        le = encoders[col]
        val = data.get(col)
        if val not in le.classes_:
            # unseen category -> map to most frequent seen class (index 0 fallback)
            val = le.classes_[0]
        row[col] = le.transform([val])[0]

    numeric_vals = [[data.get(col, 0) for col in numeric_columns]]
    scaled = scaler.transform(numeric_vals)[0]
    for i, col in enumerate(numeric_columns):
        row[col] = scaled[i]

    vector = [row[col] for col in feature_columns]
    return np.array(vector).reshape(1, -1)


def _strengths_weaknesses(data: dict):
    strengths, weaknesses = [], []

    def check(cond, good_msg, bad_msg):
        (strengths if cond else weaknesses).append(good_msg if cond else bad_msg)

    check(data["cgpa"] >= 7.5, "Strong CGPA", "CGPA needs improvement")
    check(data["coding_score"] >= 65, "Strong coding score", "Coding score is below average")
    check(data["aptitude_score"] >= 60, "Good aptitude test performance", "Aptitude score needs work")
    check(
        data["communication_score"] >= 60,
        "Good communication skills",
        "Communication skills need improvement",
    )
    check(data["attendance"] >= 80, "Good attendance record", "Attendance is below the recommended level")
    check(data["internships"] >= 1, "Has relevant internship experience", "No internship experience yet")
    check(data["projects"] >= 2, "Has built multiple projects", "Needs more hands-on projects")
    check(
        data["certifications"] >= 1,
        "Holds relevant certifications",
        "Low number of certifications",
    )
    check(data["backlogs"] == 0, "No active backlogs", "Has pending academic backlogs")

    return strengths, weaknesses


def _recommendations(data: dict):
    recs = []
    if data["cgpa"] < 6.0:
        recs.append("Focus on improving academic performance and raising overall CGPA")
    if data["coding_score"] < 50:
        recs.append("Practice coding problems daily on platforms like LeetCode or HackerRank")
    if data["aptitude_score"] < 50:
        recs.append("Take up structured aptitude preparation (quant, logical reasoning, verbal)")
    if data["communication_score"] < 50:
        recs.append("Join communication and mock-interview practice sessions")
    if data["attendance"] < 75:
        recs.append("Improve class attendance to meet placement eligibility criteria")
    if data["internships"] == 0:
        recs.append("Complete at least one internship to gain industry exposure")
    if data["projects"] < 2:
        recs.append("Build 2-3 practical projects to strengthen your portfolio")
    if data["certifications"] == 0:
        recs.append("Pursue an industry-recognized certification in your domain")
    if data["backlogs"] > 0:
        recs.append("Prioritize clearing pending academic backlogs")
    if not recs:
        recs.append("Keep up the excellent, well-rounded profile and continue practicing mock interviews")
    return recs


def _explain(feature_importance: dict, data: dict, positive: bool):
    """Return top contributing factors, split by whether they help or hurt."""
    factor_checks = {
        "cgpa": data["cgpa"] >= 7.0,
        "coding_score": data["coding_score"] >= 60,
        "aptitude_score": data["aptitude_score"] >= 55,
        "communication_score": data["communication_score"] >= 55,
        "attendance": data["attendance"] >= 80,
        "internships": data["internships"] >= 1,
        "projects": data["projects"] >= 2,
        "certifications": data["certifications"] >= 1,
        "backlogs": data["backlogs"] == 0,
    }
    labels = {
        "cgpa": "CGPA",
        "coding_score": "Coding score",
        "aptitude_score": "Aptitude score",
        "communication_score": "Communication score",
        "attendance": "Attendance",
        "internships": "Internship experience",
        "projects": "Project work",
        "certifications": "Certifications",
        "backlogs": "Backlog status",
    }
    ranked = sorted(
        factor_checks.keys(),
        key=lambda k: feature_importance.get(k, 0),
        reverse=True,
    )
    positive_factors, negative_factors = [], []
    for k in ranked:
        (positive_factors if factor_checks[k] else negative_factors).append(labels[k])
    return positive_factors[:5], negative_factors[:5]


def predict_student(data: dict) -> dict:
    if _bundle is None:
        raise RuntimeError(MODEL_LOAD_ERROR or "Model not loaded")

    vector = _vectorize(data)
    model = _bundle["model"]
    target_le = _bundle["target_encoder"]

    proba = model.predict_proba(vector)[0]
    pred_idx = int(np.argmax(proba))
    status = target_le.inverse_transform([pred_idx])[0]

    placed_idx = list(target_le.classes_).index("Placed") if "Placed" in target_le.classes_ else pred_idx
    placement_probability = round(float(proba[placed_idx]) * 100, 2)

    if placement_probability >= 75:
        readiness = "High"
    elif placement_probability >= 50:
        readiness = "Medium"
    else:
        readiness = "Low"

    if status == "Placed":
        message = "The student has a strong probability of placement." if placement_probability >= 75 else \
            "The student has a reasonable chance of placement with some improvement."
    else:
        message = "The student's current profile indicates placement readiness needs improvement."

    strengths, weaknesses = _strengths_weaknesses(data)
    recommendations = _recommendations(data)
    positive_factors, negative_factors = _explain(
        _bundle["feature_importance"], data, status == "Placed"
    )

    return {
        "placement_status": status,
        "placement_probability": placement_probability,
        "readiness_level": readiness,
        "prediction_message": message,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "positive_factors": positive_factors,
        "negative_factors": negative_factors,
        "model_used": _bundle["best_model_name"],
    }
