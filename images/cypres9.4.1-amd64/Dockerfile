FROM node:16.13.0-bullseye as builder

ARG VERSION=9.4.1
ENV CY_VERSION=$VERSION

# Install build dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libgbm-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    # clean up 
    && rm -rf /var/lib/apt/lists/* \ 
    && apt-get clean

# build cypress binary
RUN git clone https://github.com/cypress-io/cypress.git --depth 1 --branch v${CY_VERSION} \
  && cd /cypress \
  && yarn --loglevel verbose \ 
  && yarn binary-build --version ${CY_VERSION} myvalue=3

FROM cypress/browsers:node16.14.2-slim-chrome100-ff99-edge

ARG VERSION=9.4.1

ENV TERM=xterm \
    NPM_CONFIG_LOGLEVEL=warn \
    QT_X11_NO_MITSHM=1 \
    _X11_NO_MITSHM=1 \
    _MITSHM=0 \ 
    CYPRESS_INSTALL_BINARY=0 \
    CYPRESS_CACHE_FOLDER=/root/.cache/Cypress \
    CY_VERSION=$VERSION

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libgbm-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    # clean up
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    # https://github.com/cypress-io/cypress/issues/4351#issuecomment-559489091
    echo 'pcm.!default {\n type hw\n card 0\n}\n\nctl.!default {\n type hw\n card 0\n}' > /root/.asoundrc

# Copy cypress binary from intermediate container
COPY --from=builder /tmp/cypress-build/linux/build/linux-unpacked /root/.cache/Cypress/${CY_VERSION}/Cypress

RUN npm install -g cypress@${CY_VERSION} && \ 
    cypress verify

# install required packages and utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    apt-utils \
    locales \
    curl \
    unzip

# install chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium

ENTRYPOINT ["cypress", "run"]

