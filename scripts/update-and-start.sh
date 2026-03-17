#!/bin/bash

echo "scripts/update-and-start.sh is deprecated for this repository."
echo "Use the documented local commands instead:"
echo "  Backend: uvicorn backend.server:app --reload --host 0.0.0.0 --port 8001"
echo "  Frontend: cd frontend && npm start"
echo "  Validation: pytest -q && cd frontend && npm run build"
exit 1
