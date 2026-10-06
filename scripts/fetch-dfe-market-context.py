#!/usr/bin/env python3
"""Build non-personal market context from the official DfE vacancy dataset."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen


DATASET_ID = "e70db0c4-e346-413b-a238-05a81a6087a9"
LANDING_PAGE = f"https://explore-education-statistics.service.gov.uk/data-catalogue/data-set/{DATASET_ID}"
CSV_URL = f"{LANDING_PAGE}/csv"


def number(value: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def summarise(rows: list[dict[str, str]]) -> dict[str, object]:
    school_rows = [row for row in rows if row.get("geographic_level") == "School"]
    latest = max(row["time_period"] for row in school_rows)
    current = [row for row in school_rows if row["time_period"] == latest]

    scopes = {
        "liverpool": lambda row: row.get("la_name") == "Liverpool",
        "north_west": lambda row: row.get("region_name") == "North West",
        "england": lambda row: row.get("country_name") == "England",
    }
    result: dict[str, object] = {}
    for name, predicate in scopes.items():
        selected = [row for row in current if predicate(row)]
        urns = {row["school_urn"] for row in selected if row.get("school_urn")}
        schools_with_vacancies = {
            row["school_urn"] for row in selected if row.get("school_urn") and number(row.get("vacancy", "0")) > 0
        }
        by_type: dict[str, dict[str, float]] = defaultdict(lambda: {"schools": 0, "vacancies": 0, "temporary_filled_posts": 0})
        for row in selected:
            group = by_type[row.get("establishment_type_group") or "Unknown"]
            group["schools"] += 1
            group["vacancies"] += number(row.get("vacancy", "0"))
            group["temporary_filled_posts"] += number(row.get("tempfilled", "0"))
        result[name] = {
            "schools_reporting": len(urns),
            "schools_with_recorded_vacancies": len(schools_with_vacancies),
            "share_with_recorded_vacancies": round(len(schools_with_vacancies) / len(urns), 4) if urns else None,
            "teacher_vacancies": round(sum(number(row.get("vacancy", "0")) for row in selected), 2),
            "temporary_filled_posts": round(sum(number(row.get("tempfilled", "0")) for row in selected), 2),
            "by_establishment_type": dict(sorted(by_type.items())),
        }
    return {"academic_year_code": latest, "scopes": result}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="Use an already-downloaded CSV")
    parser.add_argument("--output", type=Path, default=Path("data/market-context/dfe-teacher-vacancies.json"))
    args = parser.parse_args()

    raw = args.input.read_bytes() if args.input else urlopen(CSV_URL, timeout=90).read()
    rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
    summary = summarise(rows)
    output = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {
            "title": "Teacher vacancies - school level",
            "publisher": "Department for Education",
            "landing_page": LANDING_PAGE,
            "download_url": CSV_URL,
            "sha256": hashlib.sha256(raw).hexdigest(),
            "licence": "Open Government Licence v3.0",
        },
        **summary,
        "use_boundary": "Regional market context only. These aggregates are not features in teacher eligibility or ranking.",
        "limitations": [
            "A recorded vacancy is not the same as a daily supply-cover request.",
            "The dataset is an annual school-workforce snapshot and does not measure live demand.",
            "School-level identities are deliberately excluded from the committed aggregate.",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output} for academic year {summary['academic_year_code']}")


if __name__ == "__main__":
    main()
