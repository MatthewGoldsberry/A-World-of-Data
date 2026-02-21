"""Basic JSON request script for load external json files."""

from pathlib import Path

import requests

if __name__ == "__main__":
    """Take the provided url and download it into the provided destination."""
    url = input("Data URL: ").strip()

    response = requests.get(url, timeout=30)

    SUCCESS_CODE = 200
    if response.status_code != SUCCESS_CODE:
        print("Request failed")

    dest = Path(input("Desired destination path: ").strip())
    with dest.open("w") as f:
        f.write(response.text)
