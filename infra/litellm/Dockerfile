FROM ghcr.io/berriai/litellm:v1.106.6@sha256:37e2dafb088a7723beb998590682957386dfc83ffea1848486f8e0e5cfac0b06
WORKDIR /app
COPY startup.py /app/consecom_startup.py
CMD ["python", "/app/consecom_startup.py", "serve"]

