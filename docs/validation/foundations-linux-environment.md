# Foundations Linux L1 Environment

**Status: environment prepared; no laboratory case executed. All 85 cases of the [validation matrix](foundations-validation-matrix.md) remain `PLANNED`.** This page records the Linux environment class L1 of the [validation plan](foundations-lab-validation-plan.md). It is infrastructure documentation, not laboratory evidence. Raw evidence is stored outside this repository (decision OD-6) and is separate from the formal C07 process.

## Why this image exists

The Phase 2.1 infrastructure smoke test found that `ubuntu:24.04` does not include Git, so the 37 Git cases could not run. Every other tool the modules use is already in the base image. The derived image adds Git and nothing else of its own.

## Base image

| Item | Value |
| --- | --- |
| Reference | `ubuntu@sha256:fe81560990fae86dc4743202b2cb4d3df98d0bcf949173cecef15ce1127ef852` (OCI index digest) |
| Platform used | linux/arm64 (manifest `sha256:19cad59657037cffa0ac9a48107019b768900ff1071140965827513ac866bd5e`) |
| Source | Docker Official Image `library/ubuntu`, defined upstream by Canonical's `ubuntu-base` OCI repository |
| Release | Ubuntu 24.04.5 LTS, image created 2026-10-25 |
| Checked | The registry serves this exact digest, and the local image ID equals the arm64 manifest's config digest (2026-11-16) |
| Not checked | No cryptographic signature verification. The tag `24.04` has since moved to a newer digest; this older one is kept on purpose and receives no newer base fixes. The upstream build commit of this specific build was not located |

## Derived image

Build definition: [`environment/linux-l1.Dockerfile`](environment/linux-l1.Dockerfile). It installs `git` and `git-man` at package version `1:2.43.0-1ubuntu7.4` with `--no-install-recommends` (23 added packages in total, mostly libraries and `perl`; one upgraded dependency, `perl-base`; none removed) and runs as the existing non-root user `ubuntu` (uid 1000).

| Item | Value (build of 2026-11-16, 18:32 UTC) |
| --- | --- |
| Tag | `foundations-lab-l1:ubuntu24.04-git2.43` |
| Image ID | `sha256:922a342b0606fe9a4036e7062ee97e39c79597814a0f91addab3abd9e02e1d38` |
| Git | 2.43.0, which satisfies the curriculum minimum of 2.32.0 |
| Userland | GNU coreutils 9.4, GNU diffutils 3.10, GNU grep 3.11, GNU findutils 4.9.0, `/bin/sh` is dash |

Build rules: network only for retrieving packages from the signed Ubuntu archive during the build; an empty build context containing only the Dockerfile; no mounts, no secrets, no privileged build; nothing installed on the host.

Reproducibility limits: only Git is version-pinned, so its dependencies resolve at build time; the noble-updates and noble-security suites move, so a later rebuild fails when the pinned Git is superseded instead of substituting another version; builds are not bit-for-bit reproducible, and no exact-binary reproducibility is claimed. The image ID identifies one build; the Dockerfile identifies only the recipe.

## Run baseline for lab containers

Every lab container uses this baseline (the illustrative controls of the plan, now fixed for Phase 2). A fresh container is used for each run, then removed by name.

| Control | Setting |
| --- | --- |
| Network | `--network none` |
| User | `1000:1000`, never root (the root probe `LAS-P01` is deferred to a disposable VM, decision OD-4) |
| Capabilities | `--cap-drop ALL` |
| Privilege escalation | `--security-opt no-new-privileges` |
| Syscall filtering | Docker's default seccomp profile (not disabled) |
| Root filesystem | `--read-only` |
| Writable data | one tmpfs at `/home/ubuntu`: `rw,nosuid,nodev,noexec,size=64m,mode=0700,uid=1000,gid=1000` |
| Mounts | none from the host; no Docker socket; no devices |
| Limits | 256 MiB memory with no swap, 1 CPU, 64 processes |
| Environment | `LC_ALL=C`, `TZ=UTC`, `HOME=/home/ubuntu`; nothing passed through from the host |
| Image start | `--pull=never`, referencing the image ID recorded above |

The daemon itself places `/etc/hostname`, `/etc/hosts` and `/etc/resolv.conf` into every container; they come from the Docker VM, not from the host user's files, and are not listed as mounts. `noexec` stays on the writable tmpfs because no module step executes a file from the home; the first lab case in Phase 2.2 confirms it. Default `umask` is `0022`; the modules set `umask 077` themselves.

## Infrastructure smoke test (2026-11-16)

One container from this image, with the baseline above, passed these infrastructure checks, and was then removed: Git 2.43.0 present and at least 2.32.0; every core utility of the modules present; effective ID not zero; only loopback and kernel tunnel devices, no route; no Docker socket; no host mounts; capabilities all zero with no-new-privileges and a seccomp filter active; writable paths limited to `/home/ubuntu`. These are properties of the environment. **They are not results of any laboratory case.**

## Still outstanding for lab execution

- A real pseudo-terminal driven one block at a time (D17) has not been exercised.
- Environment classes L2 (BusyBox), L3 (Git older than 2.32.0), the Linux VM for `LAS-P01`, and every macOS environment are not prepared.
- The image is arm64 only, built on an Apple silicon host through Docker Desktop's Linux VM; an amd64 variant was not built.
