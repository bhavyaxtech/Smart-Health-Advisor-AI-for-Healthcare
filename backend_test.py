"""
Legacy compatibility stub.

The previous repository included an ad hoc remote API smoke test in this file.
That workflow is no longer the supported validation path for this project.

Use:
    pytest -q

See README.md for the current local setup and validation instructions.
"""


if __name__ == "__main__":
    raise SystemExit(
        "backend_test.py is deprecated. Run `pytest -q` from the repository root instead."
    )
