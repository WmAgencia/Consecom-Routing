FROM ghcr.io/berriai/litellm:v1.109.1@sha256:11175975a3093e05e92faee2fe2fe3412a3ae2fcaa849eb0fe25d5f0d8bcb2e9
WORKDIR /app
COPY startup.py /app/consecom_startup.py
CMD ["python", "/app/consecom_startup.py", "serve"]

