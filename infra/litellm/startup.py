"""Embedded startup command for the official LiteLLM image (no `litellm` imports).

predeploy: validate, wait for Postgres, run LiteLLM's own migration job through
           `litellm_proxy_extras` (migrations, index repair, request-log indexes).
serve:     validate, wait for Postgres, exec litellm with DISABLE_SCHEMA_UPDATE=true so the
           proxy only checks the schema the pre-deploy step already migrated.
"""

import os
import re
import signal
import subprocess
import sys
import tempfile
import time

import yaml

MIB = 2**20
# Measured on the pinned image (Railway, 2026-11-01): serve peaks ~900 MiB during boot, when
# LiteLLM runs its read-only `prisma migrate diff` check, then settles at 650-800 MiB; pre-deploy
# peaks ~340 MiB. Below MIN_MEMORY nothing works; below COMFORTABLE_MEMORY it runs but
# has little headroom under load.
MIN_MEMORY = 900 * MIB
COMFORTABLE_MEMORY = 1536 * MIB


class StartupError(Exception):
    """Safe-to-log startup failure; never include user values or driver messages."""


def validate_environment(environ):
    for name in ("LITELLM_MASTER_KEY", "LITELLM_SALT_KEY"):
        if not environ.get(name, "").strip():
            raise StartupError(f"{name} must be nonblank")
    port = environ.get("PORT", "4000")
    if not re.fullmatch(r"[0-9]{1,5}", port) or not 1 <= int(port) <= 65535:
        raise StartupError("PORT must be an integer from 1 to 65535")
    host = environ.get("HOST", "0.0.0.0")
    if host != "0.0.0.0":
        raise StartupError("HOST must be 0.0.0.0 for the template public binding")
    return host, str(int(port))


def validate_config(raw):
    if not raw or not raw.strip():
        return None
    try:
        config = yaml.safe_load(raw)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        location = f" at line {mark.line + 1}, column {mark.column + 1}" if mark else ""
        raise StartupError(f"LITELLM_CONFIG_YAML is invalid YAML{location}") from None
    if not isinstance(config, dict) or not config:
        raise StartupError("LITELLM_CONFIG_YAML root must be a nonempty mapping")
    for key in ("general_settings", "litellm_settings", "router_settings"):
        if key in config and not isinstance(config[key], dict):
            raise StartupError(f"LITELLM_CONFIG_YAML {key} must be a mapping")
    if "model_list" in config and not isinstance(config["model_list"], list):
        raise StartupError("LITELLM_CONFIG_YAML model_list must be a list")
    return config


def resolve_database_url(config, environ):
    """Match LiteLLM's YAML-over-environment database selection before probing."""
    configured = (config or {}).get("general_settings", {}).get("database_url")
    value = configured if configured is not None else environ.get("DATABASE_URL")
    if isinstance(value, str) and value.startswith("os.environ/"):
        value = environ.get(value.removeprefix("os.environ/"))
    if not isinstance(value, str) or not value.strip():
        raise StartupError("Database URL must be nonblank; check DATABASE_URL and general_settings.database_url")
    return value


def memory_limit(path="/sys/fs/cgroup/memory.max"):
    """Container memory limit in bytes, or None when unlimited/unknown."""
    try:
        with open(path) as f:
            value = f.read().strip()
    except OSError:
        return None
    return int(value) if value.isdigit() else None


def check_memory(limit):
    if limit is None:
        return
    if limit < MIN_MEMORY:
        raise StartupError(
            f"this container allows {limit // MIB} MiB of memory; LiteLLM needs at least 1 GB to start "
            "(Railway Trial) and 2 GB or more for real use (Hobby plan or higher). Upgrade the plan or "
            "raise the service memory limit, then redeploy"
        )
    if limit < COMFORTABLE_MEMORY:
        print(
            f"LiteLLM startup: {limit // MIB} MiB memory limit is enough to start but leaves little headroom; "
            "expect restarts under load. 2 GB or more is recommended",
            file=sys.stderr, flush=True,
        )


def prisma_cli():
    cli = os.environ.get("PRISMA_CLI_PATH")
    if not cli:
        raise StartupError("The pinned image must provide PRISMA_CLI_PATH")
    return cli


def database_probe(dsn, timeout):
    """Use the image's offline Prisma toolchain, not an extra Python DB driver."""
    command = [prisma_cli(), "db", "execute", "--url", dsn, "--stdin"]
    with subprocess.Popen(
        command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, start_new_session=True,
    ) as process:
        try:
            _, error = process.communicate("SELECT 1;", timeout=timeout)
        except subprocess.TimeoutExpired:
            # Retire the native schema-engine child as well as the CLI parent.
            os.killpg(process.pid, signal.SIGKILL)
            process.communicate()
            return False
        if process.returncode == 0:
            return True
    # Driver output can contain credentials and SQL. Classify it, never print it.
    code = re.search(r"\\bP[0-9]{4}\\b", error)
    if code and code.group() in {"P1001", "P1002", "P1008", "P1017", "P2024", "P2037"}:
        return False
    if "database system is starting up" in error.lower():
        return False
    raise StartupError("Database connection rejected; check DATABASE_URL and credentials")


def wait_for_database(dsn):
    deadline = time.monotonic() + 90
    waiting = False
    while (remaining := deadline - time.monotonic()) > 0:
        if database_probe(dsn, min(5, remaining)):
            return
        if not waiting:
            print("LiteLLM startup: waiting up to 90 seconds for database readiness", file=sys.stderr, flush=True)
            waiting = True
        remaining = deadline - time.monotonic()
        if remaining > 0:
            time.sleep(min(2, remaining))
    raise StartupError("Database readiness timed out after 90 seconds")


def migrate(dsn):
    """LiteLLM's own migration job (migrations, index repair, request-log indexes), without `litellm`.

    `litellm_proxy_extras` imports `litellm` only to read `json_logs` for its log format and, on
    errors, for secret-shape redaction; both fall back cleanly on ImportError. Blocking the import
    keeps the job at Prisma's footprint instead of adding ~300 MiB of Python.
    """
    os.environ["DATABASE_URL"] = dsn
    sys.modules["litellm"] = None
    try:
        from litellm_proxy_extras.utils import ProxyExtrasDBManager
    except ImportError:
        raise StartupError("The pinned image must provide litellm_proxy_extras") from None
    try:
        migrated = ProxyExtrasDBManager.run_migration_job(use_migrate=True, use_v2_resolver=True)
    except RuntimeError:
        migrated = False
    if not migrated:
        raise StartupError("database migration failed; see the LiteLLM output above")


def fail(message):
    """Print the reason, then linger briefly: Railway drops the logs of containers that exit within ~1 s."""
    print(message, file=sys.stderr, flush=True)
    time.sleep(3)
    return 1


def main():
    path = None
    try:
        if len(sys.argv) != 2 or sys.argv[1] not in ("predeploy", "serve"):
            raise StartupError("Expected mode: predeploy or serve")
        host, port = validate_environment(os.environ)
        raw = os.environ.get("LITELLM_CONFIG_YAML")
        parsed = validate_config(raw)
        check_memory(memory_limit())
        dsn = resolve_database_url(parsed, os.environ)
        wait_for_database(dsn)
        if sys.argv[1] == "predeploy":
            migrate(dsn)
            return 0
        command = [os.path.join(os.path.dirname(sys.executable), "litellm"), "--host", host, "--port", port]
        if parsed is not None:
            # NamedTemporaryFile creates mode 0600. Preserve the original YAML,
            # including environment references, rather than merging or dumping it.
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".yaml", delete=False) as config:
                path = config.name
                config.write(raw)
            command.extend(["--config", path])
        os.execve(command[0], command, os.environ | {"DISABLE_SCHEMA_UPDATE": "true"})
    except StartupError as exc:
        return fail(f"LiteLLM startup: {exc}")
    except OSError:
        return fail("LiteLLM startup: unable to write config or execute litellm")
    finally:
        # Successful exec leaves the private file available for LiteLLM to read.
        if path is not None:
            os.unlink(path)


if __name__ == "__main__":
    sys.exit(main())
