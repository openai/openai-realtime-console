import os
import subprocess
import time

import httpx
import pytest

PORT = 13999
SERVER_ROOT = "/Users/minjaekwon1/Projects/Active/openai-realtime-console"


@pytest.fixture(scope="session")
def server():
    env = {**os.environ, "TEST_MODE": "1", "PORT": str(PORT)}
    proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=SERVER_ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    base = f"http://localhost:{PORT}"
    for _ in range(30):
        try:
            httpx.get(f"{base}/config", timeout=1)
            break
        except Exception:
            time.sleep(0.5)
    else:
        proc.kill()
        raise RuntimeError("Server did not start in 15s")
    yield base
    proc.kill()
    proc.wait()
