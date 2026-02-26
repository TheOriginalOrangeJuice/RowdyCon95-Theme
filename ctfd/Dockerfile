FROM ctfd/ctfd:latest

COPY --chown=ctfd:ctfd theme/win95 /opt/CTFd/CTFd/themes/win95
COPY ctfd/entrypoint-win95.sh /opt/CTFd/entrypoint-win95.sh

ENTRYPOINT ["/opt/CTFd/entrypoint-win95.sh"]
