from pathlib import Path
import sys

# Ensure backend/ is importable during pytest collection.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
