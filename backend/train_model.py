"""
train_model.py
----------------
Generates (if missing) a realistic synthetic student placement dataset,
trains four classification models (Logistic Regression, Decision Tree,
Random Forest, XGBoost), evaluates them, picks the best performer, and
saves the final model + preprocessing pipeline to placement_model.pkl.

Run:
    python train_model.py
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("[WARN] xgboost not installed - it will be skipped. Run: pip install xgboost")

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "placement_model.pkl")
METRICS_PATH = os.path.join(BASE_DIR, "model_metrics.json")

DEPARTMENTS = [
    "Information Technology",
    "Computer Science",
    "Electronics and Communication",
    "Electrical and Electronics",
    "Mechanical",
    "Civil",
]
GENDERS = ["Male", "Female"]
TECH_SKILLS_POOL = [
    "Python", "Java", "React", "Node.js", "SQL", "C++",
    "Machine Learning", "AWS", "Django", "Angular",
]

NUM_STUDENTS = 600


def _pick_skills():
    n = np.random.randint(1, 5)
    return ", ".join(np.random.choice(TECH_SKILLS_POOL, size=n, replace=False))


def generate_dataset(n=NUM_STUDENTS) -> pd.DataFrame:
    """Create a synthetic but logically-consistent placement dataset."""
    rows = []
    for i in range(1, n + 1):
        dept = np.random.choice(DEPARTMENTS)
        gender = np.random.choice(GENDERS)

        tenth = np.clip(np.random.normal(78, 9), 45, 99)
        twelfth = np.clip(np.random.normal(75, 10), 40, 99)
        cgpa = np.clip(np.random.normal(7.2, 1.1), 4.5, 10.0)
        backlogs = np.random.choice(
            [0, 0, 0, 1, 1, 2, 3], p=[0.45, 0.2, 0.1, 0.1, 0.07, 0.05, 0.03]
        )
        attendance = np.clip(np.random.normal(82, 9), 55, 100)
        aptitude = np.clip(np.random.normal(60, 18), 10, 100)
        coding = np.clip(np.random.normal(58, 20), 5, 100)
        communication = np.clip(np.random.normal(65, 15), 10, 100)
        certifications = np.random.choice(
            [0, 1, 2, 3, 4], p=[0.3, 0.3, 0.2, 0.13, 0.07]
        )
        internships = np.random.choice([0, 1, 2], p=[0.45, 0.4, 0.15])
        projects = np.random.choice([0, 1, 2, 3, 4], p=[0.1, 0.25, 0.3, 0.2, 0.15])
        extracurricular = np.random.choice([0, 1], p=[0.55, 0.45])
        tech_skills = _pick_skills()

        # ---- Weighted "placement score" so labels are logically related
        # to the features, not random.
        score = (
            (cgpa - 4.5) / 5.5 * 22
            + coding / 100 * 20
            + aptitude / 100 * 12
            + communication / 100 * 10
            + attendance / 100 * 8
            + internships * 7
            + projects * 3
            + certifications * 2.5
            - backlogs * 6
            + extracurricular * 2
        )
        score += np.random.normal(0, 6)  # noise
        probability = 1 / (1 + np.exp(-(score - 45) / 9))
        placement_status = "Placed" if probability > 0.5 else "Not Placed"

        rows.append(
            {
                "student_id": f"S{i:04d}",
                "name": f"Student_{i}",
                "department": dept,
                "gender": gender,
                "tenth_percentage": round(tenth, 2),
                "twelfth_percentage": round(twelfth, 2),
                "cgpa": round(cgpa, 2),
                "backlogs": int(backlogs),
                "attendance": round(attendance, 2),
                "aptitude_score": round(aptitude, 2),
                "coding_score": round(coding, 2),
                "communication_score": round(communication, 2),
                "technical_skills": tech_skills,
                "certifications": int(certifications),
                "internships": int(internships),
                "projects": int(projects),
                "extracurricular_activities": int(extracurricular),
                "placement_status": placement_status,
            }
        )
    return pd.DataFrame(rows)


def ensure_dataset() -> pd.DataFrame:
    if os.path.exists(DATASET_PATH):
        print(f"[INFO] Found existing dataset at {DATASET_PATH}")
        return pd.read_csv(DATASET_PATH)
    print("[INFO] dataset.csv not found - generating a new synthetic dataset...")
    df = generate_dataset()
    df.to_csv(DATASET_PATH, index=False)
    print(f"[INFO] Saved dataset with {len(df)} rows to {DATASET_PATH}")
    return df


FEATURE_COLUMNS = [
    "department",
    "gender",
    "tenth_percentage",
    "twelfth_percentage",
    "cgpa",
    "backlogs",
    "attendance",
    "aptitude_score",
    "coding_score",
    "communication_score",
    "certifications",
    "internships",
    "projects",
    "extracurricular_activities",
]
CATEGORICAL_COLUMNS = ["department", "gender"]
NUMERIC_COLUMNS = [c for c in FEATURE_COLUMNS if c not in CATEGORICAL_COLUMNS]


def build_preprocessing(df: pd.DataFrame):
    """Fit label encoders for categoricals + a scaler for numeric columns."""
    encoders = {}
    df_enc = df.copy()
    for col in CATEGORICAL_COLUMNS:
        le = LabelEncoder()
        df_enc[col] = le.fit_transform(df_enc[col])
        encoders[col] = le

    scaler = StandardScaler()
    df_enc[NUMERIC_COLUMNS] = scaler.fit_transform(df_enc[NUMERIC_COLUMNS])

    target_le = LabelEncoder()
    y = target_le.fit_transform(df["placement_status"])  # Placed=1, Not Placed=0 (alphabetical -> check)

    return df_enc, encoders, scaler, target_le, y


def train_and_select_best():
    df = ensure_dataset()
    df_enc, encoders, scaler, target_le, y = build_preprocessing(df)
    X = df_enc[FEATURE_COLUMNS].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_SEED),
        "Decision Tree": DecisionTreeClassifier(max_depth=8, random_state=RANDOM_SEED),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=10, random_state=RANDOM_SEED
        ),
    }
    if XGBOOST_AVAILABLE:
        models["XGBoost"] = XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.08,
            eval_metric="logloss",
            random_state=RANDOM_SEED,
        )

    results = {}
    trained_models = {}

    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, zero_division=0)
        rec = recall_score(y_test, preds, zero_division=0)
        f1 = f1_score(y_test, preds, zero_division=0)
        cm = confusion_matrix(y_test, preds).tolist()

        results[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": cm,
        }
        trained_models[name] = model
        print(f"[RESULT] {name}: acc={acc:.4f} prec={prec:.4f} rec={rec:.4f} f1={f1:.4f}")

    best_name = max(results, key=lambda k: results[k]["f1_score"])
    best_model = trained_models[best_name]
    print(f"[INFO] Best model selected: {best_name}")

    # Feature importance (if supported), else fall back to coefficients
    feature_importance = {}
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
        feature_importance = {
            FEATURE_COLUMNS[i]: round(float(importances[i]), 4)
            for i in range(len(FEATURE_COLUMNS))
        }
    elif hasattr(best_model, "coef_"):
        coefs = np.abs(best_model.coef_[0])
        feature_importance = {
            FEATURE_COLUMNS[i]: round(float(coefs[i]), 4)
            for i in range(len(FEATURE_COLUMNS))
        }

    bundle = {
        "model": best_model,
        "best_model_name": best_name,
        "encoders": encoders,
        "scaler": scaler,
        "target_encoder": target_le,
        "feature_columns": FEATURE_COLUMNS,
        "categorical_columns": CATEGORICAL_COLUMNS,
        "numeric_columns": NUMERIC_COLUMNS,
        "feature_importance": feature_importance,
        "all_results": results,
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"[INFO] Saved trained model bundle to {MODEL_PATH}")

    with open(METRICS_PATH, "w") as f:
        json.dump(
            {
                "best_model": best_name,
                "results": results,
                "feature_importance": feature_importance,
            },
            f,
            indent=2,
        )
    print(f"[INFO] Saved metrics to {METRICS_PATH}")

    return bundle


if __name__ == "__main__":
    train_and_select_best()
