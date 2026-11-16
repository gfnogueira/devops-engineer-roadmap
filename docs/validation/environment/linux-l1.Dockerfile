# Foundations laboratory validation, environment class L1 (Linux container).
# Environment preparation only. This image runs no laboratory command.
#
# Base: Docker Official Image library/ubuntu (24.04, linux/arm64 manifest 19cad596...),
# pinned by the multi-platform index digest. Review record: foundations-linux-environment.md.
FROM ubuntu@sha256:fe81560990fae86dc4743202b2cb4d3df98d0bcf949173cecef15ce1127ef852

# Git is the only addition: every other tool the three modules use already ships in the base image.
# The version is pinned to the noble-updates/noble-security package. If the archive no longer
# serves it, the build fails instead of silently choosing another version.
ARG GIT_VERSION=1:2.43.0-1ubuntu7.4
RUN apt-get update \
 && apt-get install --yes --no-install-recommends "git=${GIT_VERSION}" "git-man=${GIT_VERSION}" \
 && rm -rf /var/lib/apt/lists/*

# The base image already provides this non-root account (uid 1000, home /home/ubuntu).
USER ubuntu
WORKDIR /home/ubuntu
